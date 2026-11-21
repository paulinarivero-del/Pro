import { useCallback, useEffect, useState } from 'react';
import { BookOpen, ChefHat, CheckCircle2, Plus } from 'lucide-react';
import { Header } from './components/Header';
import { IngredientsChecklist } from './components/IngredientsChecklist';
import { PreparationSteps } from './components/PreparationSteps';
import { RecipeEditorForm } from './components/RecipeEditorForm';
import { RecipeHero } from './components/RecipeHero';
import { RecipeLibrary } from './components/RecipeLibrary';
import { ShareLinkModal } from './components/ShareLinkModal';
import { useWakeLock } from './hooks/useWakeLock';
import {
  IngredientItem,
  IngredientStatus,
  Recipe,
  RecipeStep,
  ThermomixModel,
} from './types/recipe';

function parseRouteId(pathname: string): string | null {
  const match = pathname.match(/^\/receta\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function App() {
  const [routeRecipeId, setRouteRecipeId] = useState<string | null>(() =>
    typeof window !== 'undefined' ? parseRouteId(window.location.pathname) : null
  );

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [sharedLinks, setSharedLinks] = useState<Recipe[]>([]);
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<'recipe' | 'library' | 'editor'>('recipe');
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isEditorRole, setIsEditorRole] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const wakeLock = useWakeLock();
  const isClientRoute = Boolean(routeRecipeId);
  const effectiveEditorMode = !isClientRoute && isEditorRole;

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2800);
  }, []);

  const fetchData = useCallback(async (targetId: string | null) => {
    setLoading(true);
    setLoadError(null);
    try {
      if (targetId) {
        const res = await fetch(`/api/recipes/${encodeURIComponent(targetId)}`);
        if (!res.ok) {
          throw new Error('No pudimos encontrar esta receta o enlace compartido.');
        }
        const data = (await res.json()) as { recipe: Recipe };
        setActiveRecipe(data.recipe);
      } else {
        const res = await fetch('/api/recipes');
        if (!res.ok) {
          throw new Error('No se pudieron cargar las recetas.');
        }
        const data = (await res.json()) as { recipes: Recipe[]; sharedLinks: Recipe[] };
        setRecipes(data.recipes);
        setSharedLinks(data.sharedLinks || []);
        setActiveRecipe((prev) => {
          if (prev && data.recipes.some((r) => r.id === prev.id)) {
            return data.recipes.find((r) => r.id === prev.id) || data.recipes[0] || null;
          }
          return data.recipes[0] || null;
        });
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Error al cargar el recetario.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData(routeRecipeId);
  }, [routeRecipeId, fetchData]);

  useEffect(() => {
    const handlePopState = () => {
      const nextId = parseRouteId(window.location.pathname);
      setRouteRecipeId(nextId);
      setActiveView('recipe');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    const nextId = parseRouteId(path);
    setRouteRecipeId(nextId);
    setActiveView('recipe');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateIngredientStatus = async (
    ingredientId: string,
    nextStatus: IngredientStatus
  ) => {
    if (!activeRecipe) return;

    const optimistic: Recipe = {
      ...activeRecipe,
      ingredients: activeRecipe.ingredients.map((ing) =>
        ing.id === ingredientId ? { ...ing, status: nextStatus } : ing
      ),
    };
    setActiveRecipe(optimistic);
    setRecipes((prev) => prev.map((r) => (r.id === optimistic.id ? optimistic : r)));

    try {
      const res = await fetch(`/api/recipes/${encodeURIComponent(activeRecipe.id)}/pantry`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredientId, status: nextStatus }),
      });
      if (res.ok) {
        const data = (await res.json()) as { recipe: Recipe };
        setActiveRecipe(data.recipe);
        setRecipes((prev) => prev.map((r) => (r.id === data.recipe.id ? data.recipe : r)));
      }
    } catch {
      // Optimistic state stays responsive in UI
    }
  };

  const handleResetAllChecks = async () => {
    if (!activeRecipe) return;

    const optimistic: Recipe = {
      ...activeRecipe,
      ingredients: activeRecipe.ingredients.map((ing) => ({ ...ing, status: 'pending' })),
    };
    setActiveRecipe(optimistic);

    try {
      const res = await fetch(`/api/recipes/${encodeURIComponent(activeRecipe.id)}/pantry`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetAll: true }),
      });
      if (res.ok) {
        const data = (await res.json()) as { recipe: Recipe };
        setActiveRecipe(data.recipe);
        setRecipes((prev) => prev.map((r) => (r.id === data.recipe.id ? data.recipe : r)));
        showToast('Marcas de despensa reiniciadas.');
      }
    } catch {
      showToast('No se pudieron sincronizar las marcas.');
    }
  };

  const handleSaveIngredients = async (nextIngredients: IngredientItem[]) => {
    if (!activeRecipe) return;
    const res = await fetch(`/api/recipes/${encodeURIComponent(activeRecipe.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients: nextIngredients }),
    });
    if (res.ok) {
      const data = (await res.json()) as { recipe: Recipe };
      setActiveRecipe(data.recipe);
      setRecipes((prev) => prev.map((r) => (r.id === data.recipe.id ? data.recipe : r)));
    }
  };

  const handleSaveSteps = async (nextSteps: RecipeStep[]) => {
    if (!activeRecipe) return;
    const res = await fetch(`/api/recipes/${encodeURIComponent(activeRecipe.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ steps: nextSteps }),
    });
    if (res.ok) {
      const data = (await res.json()) as { recipe: Recipe };
      setActiveRecipe(data.recipe);
      setRecipes((prev) => prev.map((r) => (r.id === data.recipe.id ? data.recipe : r)));
    }
  };

  const handleSaveRecipeForm = async (payload: {
    id?: string;
    title: string;
    description: string;
    model: ThermomixModel;
    imageUrl: string;
    prepTime: string;
    servings: string;
    cookidooUrl?: string;
    ingredients: IngredientItem[];
    steps: RecipeStep[];
  }) => {
    const isUpdate = Boolean(payload.id);
    const endpoint = isUpdate
      ? `/api/recipes/${encodeURIComponent(payload.id!)}`
      : '/api/recipes';
    const method = isUpdate ? 'PUT' : 'POST';

    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error || 'No se pudo guardar la receta.');
    }

    const data = (await res.json()) as { recipe: Recipe };
    setActiveRecipe(data.recipe);
    setRecipes((prev) => {
      if (isUpdate) {
        return prev.map((r) => (r.id === data.recipe.id ? data.recipe : r));
      }
      return [data.recipe, ...prev];
    });
    setEditingRecipe(null);
    setActiveView('recipe');
    showToast(isUpdate ? 'Receta actualizada.' : '¡Nueva receta creada y lista para compartir!');
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    const res = await fetch(`/api/recipes/${encodeURIComponent(recipeId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      showToast(err.error || 'No se pudo eliminar la receta.');
      return;
    }
    const remaining = recipes.filter((r) => r.id !== recipeId);
    setRecipes(remaining);
    if (activeRecipe?.id === recipeId) {
      setActiveRecipe(remaining[0] || null);
    }
    showToast('Receta eliminada de tu biblioteca.');
  };

  const handleGenerateClientLink = async (clientName: string): Promise<Recipe> => {
    if (!activeRecipe) throw new Error('Sin receta activa.');
    const res = await fetch(`/api/recipes/${encodeURIComponent(activeRecipe.id)}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientName, resetChecks: true }),
    });
    if (!res.ok) {
      throw new Error('No se pudo crear el enlace único.');
    }
    const data = (await res.json()) as { recipe: Recipe };
    setSharedLinks((prev) => [data.recipe, ...prev]);
    showToast(
      clientName
        ? `Enlace único creado para ${clientName}.`
        : 'Enlace único independiente creado.'
    );
    return data.recipe;
  };

  const openNewRecipeEditor = () => {
    setEditingRecipe(null);
    setActiveView('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFBF8] text-[#1A241E]">
      <Header
        isClientRoute={isClientRoute}
        onNavigateHome={() => navigateTo('/')}
        onNewRecipe={openNewRecipeEditor}
        onOpenShareModal={() => setShowShareModal(true)}
        onOpenLibrary={() => {
          setActiveView('library');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        activeView={activeView}
      />

      {/* Compact Studio Toolbar on "/" for Mobile & Desktop */}
      {!isClientRoute && (
        <div className="border-b border-[#E4E1D8] bg-[#F3F1EB]/70">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveView('recipe')}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  activeView === 'recipe'
                    ? 'bg-white text-[#1A241E] shadow-xs border border-[#E4E1D8]'
                    : 'text-[#5A665E] hover:text-[#1A241E]'
                }`}
              >
                <ChefHat className="w-4 h-4 text-[#2D6A4F]" aria-hidden="true" />
                <span>Receta activa</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('library')}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  activeView === 'library'
                    ? 'bg-white text-[#1A241E] shadow-xs border border-[#E4E1D8]'
                    : 'text-[#5A665E] hover:text-[#1A241E]'
                }`}
              >
                <BookOpen className="w-4 h-4 text-[#2D6A4F]" aria-hidden="true" />
                <span>Mis recetas ({recipes.length})</span>
              </button>

              <button
                type="button"
                onClick={openNewRecipeEditor}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  activeView === 'editor' && !editingRecipe
                    ? 'bg-white text-[#1A241E] shadow-xs border border-[#E4E1D8]'
                    : 'text-[#5A665E] hover:text-[#1A241E]'
                }`}
              >
                <Plus className="w-4 h-4 text-[#2D6A4F]" aria-hidden="true" />
                <span>Cargar Cookidoo / Manual</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {loading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-72 rounded-3xl bg-[#F3F1EB]" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 h-96 rounded-3xl bg-[#F3F1EB]" />
              <div className="lg:col-span-7 h-96 rounded-3xl bg-[#F3F1EB]" />
            </div>
          </div>
        ) : loadError ? (
          <div className="max-w-lg mx-auto my-12 p-6 sm:p-8 rounded-3xl bg-white border border-[#E4E1D8] text-center space-y-4">
            <ChefHat className="w-10 h-10 text-[#2D6A4F] mx-auto" aria-hidden="true" />
            <h1 className="font-display text-2xl font-semibold text-[#1A241E]">
              Receta no disponible
            </h1>
            <p className="text-sm text-[#5A665E]">{loadError}</p>
            <button
              type="button"
              onClick={() => navigateTo('/')}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#2D6A4F] text-white text-sm font-medium cursor-pointer"
            >
              Ir al Recetario de Paulina Rivero
            </button>
          </div>
        ) : activeView === 'editor' && !isClientRoute ? (
          <RecipeEditorForm
            initialRecipe={editingRecipe}
            onSave={handleSaveRecipeForm}
            onCancel={() => {
              setEditingRecipe(null);
              setActiveView('recipe');
            }}
          />
        ) : activeView === 'library' && !isClientRoute ? (
          <RecipeLibrary
            recipes={recipes}
            activeRecipeId={activeRecipe?.id || ''}
            onSelectRecipe={(id) => {
              const found = recipes.find((r) => r.id === id);
              if (found) setActiveRecipe(found);
              setActiveView('recipe');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onEditRecipe={(recipeToEdit) => {
              setEditingRecipe(recipeToEdit);
              setActiveView('editor');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onDeleteRecipe={handleDeleteRecipe}
            onCreateNew={openNewRecipeEditor}
          />
        ) : activeRecipe ? (
          <div className="space-y-6 sm:space-y-8">
            {/* Section 1: Recipe Header */}
            <RecipeHero
              recipe={activeRecipe}
              isEditorMode={effectiveEditorMode}
              isClientRoute={isClientRoute}
              onEditRecipe={() => {
                setEditingRecipe(activeRecipe);
                setActiveView('editor');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenShareModal={() => setShowShareModal(true)}
              onTogglePreviewRole={() => setIsEditorRole((prev) => !prev)}
              onCopySuccess={showToast}
            />

            {/* Sections 2 & 3: Pantry Checklist + Step-by-Step Preparation */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5">
                <IngredientsChecklist
                  ingredients={activeRecipe.ingredients}
                  isEditorMode={effectiveEditorMode}
                  wakeLock={wakeLock}
                  onUpdateStatus={(id, status) => void handleUpdateIngredientStatus(id, status)}
                  onResetAllChecks={() => void handleResetAllChecks()}
                  onSaveIngredients={handleSaveIngredients}
                />
              </div>

              <div className="lg:col-span-7">
                <PreparationSteps
                  steps={activeRecipe.steps}
                  model={activeRecipe.model}
                  isEditorMode={effectiveEditorMode}
                  wakeLock={wakeLock}
                  onSaveSteps={handleSaveSteps}
                />
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* Clean Editorial Footer */}
      <footer className="border-t border-[#E4E1D8] bg-white mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#5A665E]">
          <p className="font-medium text-[#1A241E]">
            Recetario Interactivo · Paulina Rivero, Presentadora de Thermomix
          </p>
          {isClientRoute ? (
            <button
              type="button"
              onClick={() => navigateTo('/')}
              className="text-[#2D6A4F] hover:underline cursor-pointer"
            >
              ¿Eres Paulina? Ir al estudio de edición
            </button>
          ) : (
            <p className="text-[#d5ded5]">Compatible con Thermomix TM6 y TM7 · Sin descargas ni contraseñas</p>
          )}
        </div>
      </footer>

      {/* Share & Unique Link Modal */}
      {showShareModal && activeRecipe && (
        <ShareLinkModal
          recipe={activeRecipe}
          existingClientLinks={sharedLinks}
          isClientRoute={isClientRoute}
          onGenerateClientLink={handleGenerateClientLink}
          onOpenLink={(id) => navigateTo(`/receta/${id}`)}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 z-50 max-w-sm bg-[#1A241E] text-white px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2.5 text-sm"
        >
          <CheckCircle2 className="w-4 h-4 text-[#4ADE80] shrink-0" aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
