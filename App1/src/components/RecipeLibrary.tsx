import { ChefHat, Edit3, Plus, Trash2 } from 'lucide-react';
import { Recipe } from '../types/recipe';

interface RecipeLibraryProps {
  recipes: Recipe[];
  activeRecipeId: string;
  onSelectRecipe: (recipeId: string) => void;
  onEditRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (recipeId: string) => Promise<void>;
  onCreateNew: () => void;
}

export function RecipeLibrary({
  recipes,
  activeRecipeId,
  onSelectRecipe,
  onEditRecipe,
  onDeleteRecipe,
  onCreateNew,
}: RecipeLibraryProps) {
  return (
    <section aria-labelledby="library-heading" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#2D6A4F]">
            Biblioteca de Paulina Rivero
          </p>
          <h1
            id="library-heading"
            className="font-display text-2xl sm:text-3xl font-semibold text-[#1A241E] mt-1"
          >
            Tus recetas Thermomix listas para compartir
          </h1>
          <p className="text-sm text-[#5A665E] mt-1">
            Selecciona cualquier receta para editarla, probar su checklist o generar un enlace único para tus clientas.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateNew}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#009A44] hover:bg-[#008038] text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Crear o importar receta</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {recipes.map((item) => {
          const isActive = item.id === activeRecipeId;
          return (
            <article
              key={item.id}
              className={`bg-white rounded-2xl border overflow-hidden flex flex-col transition-shadow ${
                isActive
                  ? 'border-[#2D6A4F] shadow-sm'
                  : 'border-[#E4E1D8] hover:border-[#C7C2B4]'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectRecipe(item.id)}
                className="text-left block w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2D6A4F]"
              >
                <div className="aspect-[16/10] bg-[#F3F1EB] overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#E9F3EC]">
                      <ChefHat className="w-10 h-10 text-[#2D6A4F]/60" aria-hidden="true" />
                    </div>
                  )}
                </div>

                <div className="p-4 sm:p-5 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs text-[#5A665E] tabular-nums">
                    <span className="font-semibold text-[#1D4D37]">Thermomix {item.model}</span>
                    <span>
                      {item.prepTime} · {item.ingredients.length} ing.
                    </span>
                  </div>
                  <h2 className="font-display text-lg font-semibold text-[#1A241E] leading-snug line-clamp-2">
                    {item.title}
                  </h2>
                  {item.description && (
                    <p className="text-xs text-[#5A665E] line-clamp-2">{item.description}</p>
                  )}
                </div>
              </button>

              <div className="mt-auto px-4 sm:px-5 pb-4 pt-3 border-t border-[#EFECE4] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onSelectRecipe(item.id)}
                  className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#E9F3EC] hover:bg-[#D8EBDD] text-[#1D4D37] text-xs font-semibold cursor-pointer"
                >
                  {isActive ? 'Receta abierta' : 'Abrir receta'}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEditRecipe(item)}
                    aria-label={`Editar ${item.title}`}
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-[#5A665E] hover:text-[#1A241E] hover:bg-[#F3F1EB] cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" aria-hidden="true" />
                  </button>
                  {recipes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => void onDeleteRecipe(item.id)}
                      aria-label={`Eliminar ${item.title}`}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-[#5A665E] hover:text-[#B91C1C] hover:bg-[#FEE2E2]/60 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
