import { useState } from 'react';
import {
  Check,
  ClipboardPaste,
  Pencil,
  Plus,
  RotateCcw,
  ShoppingBasket,
  Trash2,
  X,
} from 'lucide-react';
import { UseWakeLockResult } from '../hooks/useWakeLock';
import { IngredientItem, IngredientStatus } from '../types/recipe';
import { createId, parseBulkIngredients } from '../utils/recipeParser';
import { WakeLockBanner } from './WakeLockBanner';

interface IngredientsChecklistProps {
  ingredients: IngredientItem[];
  isEditorMode: boolean;
  wakeLock: UseWakeLockResult;
  onUpdateStatus: (ingredientId: string, nextStatus: IngredientStatus) => void;
  onResetAllChecks: () => void;
  onSaveIngredients: (nextIngredients: IngredientItem[]) => Promise<void>;
}

export function IngredientsChecklist({
  ingredients,
  isEditorMode,
  wakeLock,
  onUpdateStatus,
  onResetAllChecks,
  onSaveIngredients,
}: IngredientsChecklistProps) {
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [newText, setNewText] = useState('');
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editNote, setEditNote] = useState('');
  const [showBulkPaste, setShowBulkPaste] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const haveCount = ingredients.filter((i) => i.status === 'have').length;
  const missingCount = ingredients.filter((i) => i.status === 'missing').length;
  const pendingCount = ingredients.filter((i) => i.status === 'pending').length;
  const toBuyCount = missingCount + pendingCount;

  const visibleIngredients = onlyMissing
    ? ingredients.filter((item) => item.status !== 'have')
    : ingredients;

  const handleToggleStatus = (item: IngredientItem, target: 'have' | 'missing') => {
    const nextStatus: IngredientStatus = item.status === target ? 'pending' : target;
    onUpdateStatus(item.id, nextStatus);
  };

  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newText.trim();
    if (!cleaned) return;
    const next: IngredientItem[] = [
      ...ingredients,
      {
        id: createId('ing'),
        text: cleaned,
        note: newNote.trim() || undefined,
        status: 'pending',
      },
    ];
    setNewText('');
    setNewNote('');
    await onSaveIngredients(next);
  };

  const startEditing = (item: IngredientItem) => {
    setEditingId(item.id);
    setEditText(item.text);
    setEditNote(item.note || '');
  };

  const handleSaveEdit = async (id: string) => {
    const cleaned = editText.trim();
    if (!cleaned) return;
    const next = ingredients.map((item) =>
      item.id === id
        ? { ...item, text: cleaned, note: editNote.trim() || undefined }
        : item
    );
    setEditingId(null);
    await onSaveIngredients(next);
  };

  const handleDelete = async (id: string) => {
    const next = ingredients.filter((item) => item.id !== id);
    await onSaveIngredients(next);
  };

  const handleBulkAdd = async () => {
    const parsed = parseBulkIngredients(bulkText);
    if (parsed.length === 0) return;
    await onSaveIngredients([...ingredients, ...parsed]);
    setBulkText('');
    setShowBulkPaste(false);
  };

  return (
    <section
      id="despensa"
      aria-labelledby="ingredients-heading"
      className="bg-white border border-[#E4E1D8] rounded-2xl sm:rounded-3xl p-5 sm:p-7 space-y-5 shadow-[0_1px_3px_rgba(26,36,30,0.04)]"
    >
      {/* Section Header */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2
              id="ingredients-heading"
              className="font-display text-2xl font-semibold text-[#1A241E]"
            >
              Despensa e Ingredientes
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#5A665E] tabular-nums">
              <span>{haveCount} en casa</span>
              <span className="mx-1.5" aria-hidden="true">
                ·
              </span>
              <span>{missingCount} marcados que faltan</span>
              {pendingCount > 0 && (
                <>
                  <span className="mx-1.5" aria-hidden="true">
                    ·
                  </span>
                  <span>{pendingCount} por revisar</span>
                </>
              )}
            </p>
          </div>

          {ingredients.some((i) => i.status !== 'pending') && (
            <button
              type="button"
              onClick={onResetAllChecks}
              className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-medium text-[#5A665E] hover:text-[#1A241E] hover:bg-[#F3F1EB] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Limpiar marcas</span>
            </button>
          )}
        </div>

        {/* Special Feature 2: Modo Cocina inside Ingredients view */}
        <WakeLockBanner wakeLock={wakeLock} compact />

        {/* Special Feature 1: Toggle Switch "Qué falta por comprar" */}
        <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-[#F3F1EB] border border-[#E4E1D8]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#E4E1D8] flex items-center justify-center shrink-0">
              <ShoppingBasket className="w-5 h-5 text-[#2D6A4F]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <label
                htmlFor="missing-only-switch"
                className="block text-sm font-semibold text-[#1A241E] cursor-pointer"
              >
                Qué falta por comprar
              </label>
              <p className="text-xs text-[#5A665E] tabular-nums">
                {onlyMissing
                  ? `Mostrando solo los ${toBuyCount} ingredientes pendientes o faltantes`
                  : 'Actívalo para ocultar lo que ya tienes en casa'}
              </p>
            </div>
          </div>

          <button
            id="missing-only-switch"
            type="button"
            role="switch"
            aria-checked={onlyMissing}
            onClick={() => setOnlyMissing((prev) => !prev)}
            className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2 ${
              onlyMissing
                ? 'bg-[#009A44] border-[#009A44]'
                : 'bg-[#D6D2C6] border-[#C7C2B4]'
            }`}
          >
            <span className="sr-only">Mostrar solo qué falta por comprar</span>
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform duration-150 ${
                onlyMissing ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Checklist Rows */}
      {ingredients.length === 0 ? (
        <div className="py-10 px-4 text-center rounded-2xl bg-[#FCFBF8] border border-dashed border-[#D6D2C6]">
          <p className="text-sm font-medium text-[#1A241E]">
            Aún no hay ingredientes cargados en esta receta.
          </p>
          <p className="text-xs text-[#5A665E] mt-1">
            {isEditorMode
              ? 'Agrega ingredientes uno a uno o pega tu lista completa aquí abajo.'
              : 'Paulina pronto actualizará la lista de ingredientes.'}
          </p>
        </div>
      ) : visibleIngredients.length === 0 ? (
        <div className="py-10 px-4 text-center rounded-2xl bg-[#E9F3EC] border border-[#2D6A4F]/20">
          <Check className="w-8 h-8 text-[#009A44] mx-auto mb-2" aria-hidden="true" />
          <p className="font-display text-lg font-semibold text-[#1A241E]">
            ¡Tienes todo en casa!
          </p>
          <p className="text-sm text-[#2D6A4F] mt-1">
            No te falta ningún ingrediente por comprar para preparar esta receta.
          </p>
          <button
            type="button"
            onClick={() => setOnlyMissing(false)}
            className="mt-4 min-h-[44px] px-4 py-2 rounded-xl bg-white border border-[#2D6A4F]/25 text-xs font-semibold text-[#1D4D37] hover:bg-[#FCFBF8] transition-colors cursor-pointer"
          >
            Ver lista completa ({ingredients.length})
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <ul className="divide-y divide-[#EFECE4]" aria-label="Lista de ingredientes">
            {visibleIngredients.map((item) => {
              const isHave = item.status === 'have';
              const isMissing = item.status === 'missing';
              const isEditing = editingId === item.id;

              return (
                <li
                  key={item.id}
                  className={`py-3.5 first:pt-1 last:pb-1 transition-colors ${
                    isHave ? 'bg-[#E9F3EC]/35 -mx-2 px-2 rounded-xl' : ''
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-2.5 p-3 rounded-xl bg-[#F3F1EB]">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        placeholder="Cantidad e ingrediente"
                        className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-white border border-[#D6D2C6] text-sm text-[#1A241E] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                      />
                      <input
                        type="text"
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        placeholder="Nota opcional (ej. ajustar a gusto, opcional)"
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-lg bg-white border border-[#D6D2C6] text-xs text-[#5A665E] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleSaveEdit(item.id)}
                          className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-[#2D6A4F] text-white text-xs font-medium cursor-pointer"
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-white border border-[#D6D2C6] text-xs font-medium text-[#5A665E] cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Ingredient Text & Note */}
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p
                          className={`text-[15px] sm:text-base leading-snug transition-colors ${
                            isHave
                              ? 'line-through text-[#5A665E]'
                              : isMissing
                                ? 'text-[#1A241E] font-semibold'
                                : 'text-[#1A241E] font-medium'
                          }`}
                        >
                          {item.text}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {item.note && (
                            <span className="italic text-[#5A665E]">Nota: {item.note}</span>
                          )}
                          {isHave && (
                            <span className="font-semibold text-[#009A44]">· Tengo en casa</span>
                          )}
                          {isMissing && (
                            <span className="font-semibold text-[#B45309]">
                              · Falta comprar
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Two Clear Touch Actions (>= 44px) + Separated Editor Controls */}
                      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item, 'have')}
                            aria-pressed={isHave}
                            title="Tengo en casa"
                            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 border transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009A44] ${
                              isHave
                                ? 'bg-[#009A44] border-[#009A44] text-white'
                                : 'bg-[#FCFBF8] hover:bg-[#E9F3EC] border-[#E4E1D8] text-[#1A241E]'
                            }`}
                          >
                            <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>Tengo</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item, 'missing')}
                            aria-pressed={isMissing}
                            title="No está / Falta"
                            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 border transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B45309] ${
                              isMissing
                                ? 'bg-[#FEF3C7] border-[#D97706] text-[#92400E]'
                                : 'bg-[#FCFBF8] hover:bg-[#FEF3C7]/60 border-[#E4E1D8] text-[#5A665E]'
                            }`}
                          >
                            <X className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>Falta</span>
                          </button>
                        </div>

                        {isEditorMode && (
                          <div className="flex items-center gap-1 pl-2 ml-1 border-l border-[#E4E1D8]">
                            <button
                              type="button"
                              onClick={() => startEditing(item)}
                              aria-label={`Editar ${item.text}`}
                              className="min-h-[44px] min-w-[40px] flex items-center justify-center rounded-lg text-[#5A665E] hover:text-[#1A241E] hover:bg-[#F3F1EB] cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(item.id)}
                              aria-label={`Eliminar ${item.text}`}
                              className="min-h-[44px] min-w-[40px] flex items-center justify-center rounded-lg text-[#5A665E] hover:text-[#B91C1C] hover:bg-[#FEE2E2]/60 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" aria-hidden="true" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {onlyMissing && haveCount > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-[#E9F3EC] border border-[#2D6A4F]/20 text-xs text-[#1D4D37]">
              <span className="tabular-nums">
                Hay {haveCount} {haveCount === 1 ? 'ingrediente marcado' : 'ingredientes marcados'} como <strong>Tengo en casa</strong> (ocultos por el filtro).
              </span>
              <button
                type="button"
                onClick={() => setOnlyMissing(false)}
                className="font-semibold underline underline-offset-2 hover:text-[#1A241E] cursor-pointer whitespace-nowrap"
              >
                Ver todos ({ingredients.length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Editor Mode Inline Add + Bulk Paste */}
      {isEditorMode && (
        <div className="pt-4 border-t border-[#E4E1D8] space-y-3">
          <form onSubmit={(e) => void handleAddSingle(e)} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Agregar ingrediente (ej. 200 g de crema)"
              className="sm:col-span-6 min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FCFBF8] border border-[#D6D2C6] text-sm text-[#1A241E] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
            />
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Nota (ej. opcional)"
              className="sm:col-span-3 min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FCFBF8] border border-[#D6D2C6] text-sm text-[#1A241E] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
            />
            <button
              type="submit"
              className="sm:col-span-3 min-h-[44px] px-4 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#23543E] text-white text-sm font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Añadir</span>
            </button>
          </form>

          <div>
            <button
              type="button"
              onClick={() => setShowBulkPaste((prev) => !prev)}
              className="min-h-[40px] text-xs font-semibold text-[#2D6A4F] hover:underline inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ClipboardPaste className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {showBulkPaste
                  ? 'Ocultar pegado en bloque'
                  : 'Pegar varios ingredientes de una vez'}
              </span>
            </button>

            {showBulkPaste && (
              <div className="mt-2 p-3.5 rounded-2xl bg-[#F3F1EB] border border-[#E4E1D8] space-y-2.5">
                <textarea
                  rows={4}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={'Pega tu lista aquí (uno por línea):\n500 g de calabaza\n1 cebolla (opcional)\n30 g de aceite de oliva'}
                  className="w-full p-3 rounded-xl bg-white border border-[#D6D2C6] text-sm text-[#1A241E] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBulkPaste(false)}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-white border border-[#D6D2C6] text-xs font-medium text-[#5A665E] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleBulkAdd()}
                    className="min-h-[40px] px-4 py-1.5 rounded-lg bg-[#2D6A4F] text-white text-xs font-medium cursor-pointer"
                  >
                    Separar y agregar líneas
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
