import { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardPaste,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  CookidooExtractResponse,
  IngredientItem,
  Recipe,
  RecipeStep,
  ThermomixModel,
} from '../types/recipe';
import {
  compressImageFile,
  createId,
  parseBulkIngredients,
  parseBulkSteps,
} from '../utils/recipeParser';

interface RecipeEditorFormProps {
  initialRecipe?: Recipe | null;
  onSave: (payload: {
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
  }) => Promise<void>;
  onCancel: () => void;
}

export function RecipeEditorForm({
  initialRecipe,
  onSave,
  onCancel,
}: RecipeEditorFormProps) {
  const isEditing = Boolean(initialRecipe);

  // Cookidoo Import State (Option A)
  const [cookidooUrl, setCookidooUrl] = useState(initialRecipe?.cookidooUrl || '');
  const [extracting, setExtracting] = useState(false);
  const [extractFeedback, setExtractFeedback] = useState<{
    type: 'success' | 'warning';
    message: string;
  } | null>(null);

  // Manual Smart Editor State (Option B / Plan B)
  const [title, setTitle] = useState(initialRecipe?.title || '');
  const [description, setDescription] = useState(initialRecipe?.description || '');
  const [model, setModel] = useState<ThermomixModel>(initialRecipe?.model || 'TM6');
  const [imageUrl, setImageUrl] = useState(initialRecipe?.imageUrl || '');
  const [prepTime, setPrepTime] = useState(initialRecipe?.prepTime || '30 min');
  const [servings, setServings] = useState(initialRecipe?.servings || '4 porciones');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [ingredients, setIngredients] = useState<IngredientItem[]>(
    initialRecipe?.ingredients || []
  );
  const [bulkIngredientsText, setBulkIngredientsText] = useState('');

  const [steps, setSteps] = useState<RecipeStep[]>(initialRecipe?.steps || []);
  const [bulkStepsText, setBulkStepsText] = useState('');

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleExtractCookidoo = async () => {
    const trimmed = cookidooUrl.trim();
    if (!trimmed) {
      setExtractFeedback({
        type: 'warning',
        message:
          'Pega primero el enlace público de Cookidoo, o usa directamente el Ingreso Manual Inteligente aquí abajo.',
      });
      return;
    }

    setExtracting(true);
    setExtractFeedback(null);
    setFormError(null);

    try {
      const response = await fetch('/api/cookidoo/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });

      if (!response.ok) {
        const errBody = (await response.json().catch(() => ({}))) as { error?: string };
        setExtractFeedback({
          type: 'warning',
          message:
            errBody.error ||
            'No pudimos leer el enlace automáticamente. Puedes pegar tus ingredientes y pasos justo aquí abajo.',
        });
        return;
      }

      const result = (await response.json()) as CookidooExtractResponse;

      if (result.data.title && !title.trim()) {
        setTitle(result.data.title);
      } else if (result.data.title) {
        setTitle(result.data.title);
      }
      if (result.data.description) setDescription(result.data.description);
      if (result.data.imageUrl) setImageUrl(result.data.imageUrl);
      if (result.data.prepTime) setPrepTime(result.data.prepTime);
      if (result.data.servings) setServings(result.data.servings);

      if (result.data.ingredients.length > 0) {
        const mappedIngredients: IngredientItem[] = result.data.ingredients.map((ing) => ({
          id: createId('ing'),
          text: ing.text,
          note: ing.note,
          status: 'pending',
        }));
        setIngredients(mappedIngredients);
      }

      if (result.data.steps.length > 0) {
        const mappedSteps: RecipeStep[] = result.data.steps.map((st, idx) => ({
          id: createId('step'),
          order: idx + 1,
          text: st.text,
          thermomixParams: st.thermomixParams,
        }));
        setSteps(mappedSteps);
      }

      setExtractFeedback({
        type: result.success && !result.partial ? 'success' : 'warning',
        message: result.message,
      });
    } catch {
      setExtractFeedback({
        type: 'warning',
        message:
          'No se pudo conectar con Cookidoo en este momento. Usa el Ingreso Manual Inteligente de abajo para completar la receta sin demora.',
      });
    } finally {
      setExtracting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setFormError(null);
    try {
      const compressed = await compressImageFile(file);
      setImageUrl(compressed);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo cargar la foto.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleParseBulkIngredients = (replaceExisting: boolean) => {
    const parsed = parseBulkIngredients(bulkIngredientsText);
    if (parsed.length === 0) return;
    setIngredients((prev) => (replaceExisting ? parsed : [...prev, ...parsed]));
    setBulkIngredientsText('');
  };

  const handleParseBulkSteps = (replaceExisting: boolean) => {
    const parsed = parseBulkSteps(bulkStepsText);
    if (parsed.length === 0) return;
    setSteps((prev) => {
      const combined = replaceExisting ? parsed : [...prev, ...parsed];
      return combined.map((st, idx) => ({ ...st, order: idx + 1 }));
    });
    setBulkStepsText('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Escribe un título para tu receta antes de guardarla.');
      return;
    }

    // Automatically include any un-converted text still sitting in bulk boxes
    let finalIngredients = [...ingredients];
    if (bulkIngredientsText.trim()) {
      finalIngredients = [...finalIngredients, ...parseBulkIngredients(bulkIngredientsText)];
    }

    let finalSteps = [...steps];
    if (bulkStepsText.trim()) {
      finalSteps = [...finalSteps, ...parseBulkSteps(bulkStepsText)].map((st, idx) => ({
        ...st,
        order: idx + 1,
      }));
    }

    setSaving(true);
    setFormError(null);
    try {
      await onSave({
        id: initialRecipe?.id,
        title: title.trim(),
        description: description.trim(),
        model,
        imageUrl: imageUrl.trim(),
        prepTime: prepTime.trim() || '30 min',
        servings: servings.trim() || '4 porciones',
        cookidooUrl: cookidooUrl.trim() || undefined,
        ingredients: finalIngredients,
        steps: finalSteps,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar la receta.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Return Bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[44px] px-3 py-2 -ml-2 rounded-xl text-sm font-medium text-[#5A665E] hover:text-[#1A241E] hover:bg-[#F3F1EB] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Volver a la receta</span>
        </button>

        <p className="text-xs font-medium text-[#2D6A4F] hidden sm:block">
          Modo Editora · Paulina Rivero
        </p>
      </div>

      {/* Option A: Public Cookidoo URL Importer */}
      <section className="bg-white border border-[#E4E1D8] rounded-2xl sm:rounded-3xl p-5 sm:p-7 space-y-4 shadow-[0_1px_3px_rgba(26,36,30,0.04)]">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#2D6A4F]">
            Opción A · Enlace público de Cookidoo (sin iniciar sesión)
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#1A241E]">
            {isEditing ? 'Editar receta interactiva' : 'Crear nueva receta para tus clientas'}
          </h1>
          <p className="text-sm text-[#5A665E]">
            Pega una URL pública de Cookidoo para intentar cargar título, foto e ingredientes. Si Cookidoo gratuito restringe los datos, usa el Plan B manual justo debajo sin interrupciones.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <LinkIcon
              className="w-4 h-4 text-[#5A665E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="url"
              value={cookidooUrl}
              onChange={(e) => setCookidooUrl(e.target.value)}
              placeholder="https://cookidoo.es/recipes/recipe/es-ES/..."
              className="w-full min-h-[46px] pl-10 pr-4 py-2.5 rounded-xl bg-[#FCFBF8] border border-[#D6D2C6] text-sm text-[#1A241E] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
            />
          </div>

          <button
            type="button"
            onClick={() => void handleExtractCookidoo()}
            disabled={extracting}
            className="min-h-[46px] px-5 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#23543E] disabled:opacity-60 text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            {extracting ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="w-4 h-4" aria-hidden="true" />
            )}
            <span>{extracting ? 'Extrayendo...' : 'Extraer de Cookidoo'}</span>
          </button>
        </div>

        {extractFeedback && (
          <div
            role="status"
            className={`p-4 rounded-2xl border flex items-start gap-3 text-sm ${
              extractFeedback.type === 'success'
                ? 'bg-[#E9F3EC] border-[#2D6A4F]/25 text-[#1D4D37]'
                : 'bg-[#FEF3C7]/70 border-[#D97706]/30 text-[#92400E]'
            }`}
          >
            {extractFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#009A44]" aria-hidden="true" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#B45309]" aria-hidden="true" />
            )}
            <p className="leading-relaxed">{extractFeedback.message}</p>
          </div>
        )}
      </section>

      {/* Option B: Smart Manual Editor (Plan B) */}
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="bg-white border border-[#E4E1D8] rounded-2xl sm:rounded-3xl p-5 sm:p-7 space-y-7 shadow-[0_1px_3px_rgba(26,36,30,0.04)]"
      >
        <div className="border-b border-[#E4E1D8] pb-4">
          <p className="text-xs font-semibold text-[#2D6A4F]">
            Opción B · Ingreso manual inteligente (Plan B inmediato)
          </p>
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-[#1A241E] mt-0.5">
            Detalles, foto, ingredientes y pasos
          </h2>
        </div>

        {/* Basic Info + TM6/TM7 Selector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div>
              <label htmlFor="recipe-title-input" className="block text-sm font-semibold text-[#1A241E] mb-1.5">
                Título de la receta *
              </label>
              <input
                id="recipe-title-input"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Crema de calabaza asada y jengibre"
                className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl bg-[#FCFBF8] border border-[#D6D2C6] text-sm sm:text-base text-[#1A241E] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              />
            </div>

            <div>
              <label htmlFor="recipe-desc-input" className="block text-sm font-semibold text-[#1A241E] mb-1.5">
                Descripción breve o consejo de Paulina
              </label>
              <textarea
                id="recipe-desc-input"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Una nota cálida sobre el plato o sugerencia de presentación..."
                className="w-full p-3.5 rounded-xl bg-[#FCFBF8] border border-[#D6D2C6] text-sm text-[#1A241E] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="block text-sm font-semibold text-[#1A241E] mb-1.5">
                  Modelo Thermomix
                </span>
                <div className="grid grid-cols-2 p-1 rounded-xl bg-[#F3F1EB] border border-[#E4E1D8]">
                  {(['TM6', 'TM7'] as ThermomixModel[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setModel(m)}
                      className={`min-h-[38px] rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                        model === m
                          ? 'bg-[#009A44] text-white shadow-xs'
                          : 'text-[#5A665E] hover:text-[#1A241E]'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="prep-time-input" className="block text-sm font-semibold text-[#1A241E] mb-1.5">
                  Tiempo total
                </label>
                <input
                  id="prep-time-input"
                  type="text"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  placeholder="30 min"
                  className="w-full min-h-[46px] px-3.5 py-2 rounded-xl bg-[#FCFBF8] border border-[#D6D2C6] text-sm text-[#1A241E] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
              </div>

              <div>
                <label htmlFor="servings-input" className="block text-sm font-semibold text-[#1A241E] mb-1.5">
                  Porciones
                </label>
                <input
                  id="servings-input"
                  type="text"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  placeholder="4 porciones"
                  className="w-full min-h-[46px] px-3.5 py-2 rounded-xl bg-[#FCFBF8] border border-[#D6D2C6] text-sm text-[#1A241E] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
              </div>
            </div>
          </div>

          {/* Photo Paste URL or Device Upload */}
          <div className="lg:col-span-5 space-y-3">
            <span className="block text-sm font-semibold text-[#1A241E]">
              Fotografía del plato
            </span>

            <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-[#F3F1EB] border border-[#E4E1D8] flex items-center justify-center relative">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={title || 'Vista previa de la receta'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-4 text-[#5A665E]">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-60" aria-hidden="true" />
                  <p className="text-xs">Pega un enlace de foto o sube una imagen de tu dispositivo</p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={imageUrl.startsWith('data:') ? '' : imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Pegar URL de imagen (https://...)"
                className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-[#FCFBF8] border border-[#D6D2C6] text-xs sm:text-sm text-[#1A241E] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              />
              <label className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#E9F3EC] hover:bg-[#D8EBDD] text-[#1D4D37] border border-[#2D6A4F]/25 text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap">
                {uploadingImage ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Upload className="w-4 h-4 shrink-0" aria-hidden="true" />
                )}
                <span>{uploadingImage ? 'Subiendo...' : 'Subir foto'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => void handleImageUpload(e)}
                  className="sr-only"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Smart Bulk Ingredient Paste + Editable Rows */}
        <div className="pt-6 border-t border-[#E4E1D8] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-lg font-semibold text-[#1A241E]">
                1. Lista de Ingredientes ({ingredients.length})
              </h3>
              <p className="text-xs text-[#5A665E]">
                Pega una lista completa para separarla automáticamente línea por línea, o edita cada ítem con notas (ej. &ldquo;opcional&rdquo;, &ldquo;ajustar a gusto&rdquo;).
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F3F1EB] border border-[#E4E1D8] space-y-3">
            <label htmlFor="bulk-ingredients" className="flex items-center gap-1.5 text-xs font-semibold text-[#1A241E]">
              <ClipboardPaste className="w-4 h-4 text-[#2D6A4F]" aria-hidden="true" />
              <span>Pegado rápido de ingredientes (uno por línea)</span>
            </label>
            <textarea
              id="bulk-ingredients"
              rows={4}
              value={bulkIngredientsText}
              onChange={(e) => setBulkIngredientsText(e.target.value)}
              placeholder={'Ejemplo:\n700 g de calabaza en trozos\n1 cebolla mediana\n15 g de jengibre fresco (ajustar a gusto)\n150 g de leche de coco (opcional)'}
              className="w-full p-3 rounded-xl bg-white border border-[#D6D2C6] text-sm text-[#1A241E] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleParseBulkIngredients(false)}
                disabled={!bulkIngredientsText.trim()}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#23543E] disabled:opacity-45 text-white text-xs font-medium cursor-pointer"
              >
                Separar y añadir a la lista
              </button>
              {ingredients.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleParseBulkIngredients(true)}
                  disabled={!bulkIngredientsText.trim()}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white border border-[#D6D2C6] hover:bg-[#FCFBF8] disabled:opacity-45 text-xs font-medium text-[#1A241E] cursor-pointer"
                >
                  Reemplazar lista actual
                </button>
              )}
            </div>
          </div>

          {/* Editable Ingredient Items */}
          <div className="space-y-2">
            {ingredients.map((ing, idx) => (
              <div key={ing.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  value={ing.text}
                  onChange={(e) =>
                    setIngredients((prev) =>
                      prev.map((item) =>
                        item.id === ing.id ? { ...item, text: e.target.value } : item
                      )
                    )
                  }
                  placeholder={`Ingrediente ${idx + 1}`}
                  className="sm:col-span-7 min-h-[44px] px-3 py-2 rounded-xl bg-[#FCFBF8] border border-[#D6D2C6] text-sm text-[#1A241E] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
                <input
                  type="text"
                  value={ing.note || ''}
                  onChange={(e) =>
                    setIngredients((prev) =>
                      prev.map((item) =>
                        item.id === ing.id
                          ? { ...item, note: e.target.value || undefined }
                          : item
                      )
                    )
                  }
                  placeholder="Nota (ej. opcional)"
                  className="sm:col-span-4 min-h-[44px] px-3 py-2 rounded-xl bg-[#FCFBF8] border border-[#D6D2C6] text-xs sm:text-sm text-[#5A665E] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
                <button
                  type="button"
                  onClick={() =>
                    setIngredients((prev) => prev.filter((item) => item.id !== ing.id))
                  }
                  aria-label={`Quitar ingrediente ${idx + 1}`}
                  className="sm:col-span-1 min-h-[44px] flex items-center justify-center rounded-xl text-[#5A665E] hover:text-[#B91C1C] hover:bg-[#FEE2E2]/60 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                setIngredients((prev) => [
                  ...prev,
                  { id: createId('ing'), text: '', status: 'pending' },
                ])
              }
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#FCFBF8] hover:bg-[#F3F1EB] border border-dashed border-[#C7C2B4] text-xs sm:text-sm font-medium text-[#2D6A4F] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Añadir fila de ingrediente</span>
            </button>
          </div>
        </div>

        {/* Smart Step-by-Step Paste + Editable Steps */}
        <div className="pt-6 border-t border-[#E4E1D8] space-y-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-[#1A241E]">
              2. Preparación Paso a Paso para Thermomix {model} ({steps.length})
            </h3>
            <p className="text-xs text-[#5A665E]">
              Pega los pasos completos (uno por línea) o escríbelos abajo incluyendo tiempo, temperatura y velocidad.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F3F1EB] border border-[#E4E1D8] space-y-3">
            <label htmlFor="bulk-steps" className="flex items-center gap-1.5 text-xs font-semibold text-[#1A241E]">
              <ClipboardPaste className="w-4 h-4 text-[#2D6A4F]" aria-hidden="true" />
              <span>Pegado rápido de pasos (uno por línea)</span>
            </label>
            <textarea
              id="bulk-steps"
              rows={4}
              value={bulkStepsText}
              onChange={(e) => setBulkStepsText(e.target.value)}
              placeholder={'Ejemplo:\n1. Pon en el vaso la cebolla y el jengibre y pica [4 seg · Vel 5]\n2. Añade el aceite de oliva y sofríe [5 min · 120°C · Vel 1]'}
              className="w-full p-3 rounded-xl bg-white border border-[#D6D2C6] text-sm text-[#1A241E] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleParseBulkSteps(false)}
                disabled={!bulkStepsText.trim()}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#23543E] disabled:opacity-45 text-white text-xs font-medium cursor-pointer"
              >
                Convertir en pasos numerados
              </button>
              {steps.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleParseBulkSteps(true)}
                  disabled={!bulkStepsText.trim()}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white border border-[#D6D2C6] hover:bg-[#FCFBF8] disabled:opacity-45 text-xs font-medium text-[#1A241E] cursor-pointer"
                >
                  Reemplazar pasos actuales
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {steps.map((step, idx) => (
              <div
                key={step.id}
                className="p-3.5 rounded-2xl bg-[#FCFBF8] border border-[#E4E1D8] space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#2D6A4F] tabular-nums">
                    Paso {String(idx + 1).padStart(2, '0')}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setSteps((prev) =>
                        prev
                          .filter((s) => s.id !== step.id)
                          .map((s, i) => ({ ...s, order: i + 1 }))
                      )
                    }
                    aria-label={`Quitar paso ${idx + 1}`}
                    className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-[#5A665E] hover:text-[#B91C1C] hover:bg-[#FEE2E2]/60 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>

                <textarea
                  rows={2}
                  value={step.text}
                  onChange={(e) =>
                    setSteps((prev) =>
                      prev.map((s) => (s.id === step.id ? { ...s, text: e.target.value } : s))
                    )
                  }
                  placeholder="Instrucción del paso..."
                  className="w-full p-2.5 rounded-xl bg-white border border-[#D6D2C6] text-sm text-[#1A241E] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
                <input
                  type="text"
                  value={step.thermomixParams || ''}
                  onChange={(e) =>
                    setSteps((prev) =>
                      prev.map((s) =>
                        s.id === step.id
                          ? { ...s, thermomixParams: e.target.value || undefined }
                          : s
                      )
                    )
                  }
                  placeholder={`Parámetros ${model} opcionales (ej. 5 min · 100°C · Vel 1)`}
                  className="w-full min-h-[40px] px-3 py-1.5 rounded-xl bg-white border border-[#D6D2C6] text-xs sm:text-sm text-[#5A665E] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                setSteps((prev) => [
                  ...prev,
                  { id: createId('step'), order: prev.length + 1, text: '' },
                ])
              }
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#FCFBF8] hover:bg-[#F3F1EB] border border-dashed border-[#C7C2B4] text-xs sm:text-sm font-medium text-[#2D6A4F] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Añadir paso manual</span>
            </button>
          </div>
        </div>

        {formError && (
          <div role="alert" className="p-3.5 rounded-xl bg-[#FEE2E2] text-[#991B1B] text-sm">
            {formError}
          </div>
        )}

        {/* Submit Actions */}
        <div className="pt-4 border-t border-[#E4E1D8] flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[48px] px-5 py-2.5 rounded-xl bg-[#F3F1EB] hover:bg-[#E8E4DA] text-[#1A241E] text-sm font-medium cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="min-h-[48px] px-6 py-2.5 rounded-xl bg-[#009A44] hover:bg-[#008038] disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            <span>{isEditing ? 'Guardar cambios en la receta' : 'Guardar y abrir receta'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
