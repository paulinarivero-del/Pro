import { useState } from 'react';
import { CheckCircle2, Pencil, Plus, Trash2 } from 'lucide-react';
import { UseWakeLockResult } from '../hooks/useWakeLock';
import { RecipeStep, ThermomixModel } from '../types/recipe';
import { createId } from '../utils/recipeParser';
import { WakeLockBanner } from './WakeLockBanner';

interface PreparationStepsProps {
  steps: RecipeStep[];
  model: ThermomixModel;
  isEditorMode: boolean;
  wakeLock: UseWakeLockResult;
  onSaveSteps: (nextSteps: RecipeStep[]) => Promise<void>;
}

export function PreparationSteps({
  steps,
  model,
  isEditorMode,
  wakeLock,
  onSaveSteps,
}: PreparationStepsProps) {
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [completedStepIds, setCompletedStepIds] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editParams, setEditParams] = useState('');
  const [newStepText, setNewStepText] = useState('');
  const [newStepParams, setNewStepParams] = useState('');

  const toggleStepHighlight = (id: string) => {
    setActiveStepId((prev) => (prev === id ? null : id));
  };

  const toggleStepDone = (id: string) => {
    setCompletedStepIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const startEdit = (step: RecipeStep) => {
    setEditingId(step.id);
    setEditText(step.text);
    setEditParams(step.thermomixParams || '');
  };

  const saveEdit = async (id: string) => {
    const cleaned = editText.trim();
    if (!cleaned) return;
    const next = steps.map((st) =>
      st.id === id
        ? {
            ...st,
            text: cleaned,
            thermomixParams: editParams.trim() || undefined,
          }
        : st
    );
    setEditingId(null);
    await onSaveSteps(next);
  };

  const deleteStep = async (id: string) => {
    const next = steps
      .filter((st) => st.id !== id)
      .map((st, idx) => ({ ...st, order: idx + 1 }));
    await onSaveSteps(next);
  };

  const addStep = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newStepText.trim();
    if (!cleaned) return;
    const next: RecipeStep[] = [
      ...steps,
      {
        id: createId('step'),
        order: steps.length + 1,
        text: cleaned,
        thermomixParams: newStepParams.trim() || undefined,
      },
    ];
    setNewStepText('');
    setNewStepParams('');
    await onSaveSteps(next);
  };

  return (
    <section
      id="preparacion"
      aria-labelledby="preparation-heading"
      className="bg-white border border-[#E4E1D8] rounded-2xl sm:rounded-3xl p-5 sm:p-7 space-y-5 shadow-[0_1px_3px_rgba(26,36,30,0.04)]"
    >
      {/* Header + Modo Cocina */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              id="preparation-heading"
              className="font-display text-2xl font-semibold text-[#1A241E]"
            >
              Preparación Paso a Paso
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#5A665E]">
              Indicaciones adaptadas para Thermomix {model} · Toca un paso para resaltarlo mientras cocinas
            </p>
          </div>
        </div>

        <WakeLockBanner wakeLock={wakeLock} compact />
      </div>

      {/* Steps List */}
      {steps.length === 0 ? (
        <div className="py-10 px-4 text-center rounded-2xl bg-[#FCFBF8] border border-dashed border-[#D6D2C6]">
          <p className="text-sm font-medium text-[#1A241E]">
            Aún no hay pasos cargados en esta receta.
          </p>
          <p className="text-xs text-[#5A665E] mt-1">
            {isEditorMode
              ? 'Agrega los pasos manualmente aquí abajo o usa el editor completo.'
              : 'Paulina pronto añadirá los pasos detallados.'}
          </p>
        </div>
      ) : (
        <ol className="space-y-3">
          {steps.map((step, index) => {
            const isHighlighted = activeStepId === step.id;
            const isDone = Boolean(completedStepIds[step.id]);
            const isEditing = editingId === step.id;
            const stepNum = String(index + 1).padStart(2, '0');

            return (
              <li
                key={step.id}
                className={`rounded-2xl border transition-colors p-4 sm:p-5 ${
                  isHighlighted
                    ? 'bg-[#E9F3EC] border-[#2D6A4F]/40'
                    : isDone
                      ? 'bg-[#FCFBF8] border-[#E4E1D8] opacity-75'
                      : 'bg-[#FCFBF8] border-[#E4E1D8]'
                }`}
              >
                {isEditing ? (
                  <div className="space-y-2.5">
                    <textarea
                      rows={3}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full p-3 rounded-xl bg-white border border-[#D6D2C6] text-sm text-[#1A241E] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                    />
                    <input
                      type="text"
                      value={editParams}
                      onChange={(e) => setEditParams(e.target.value)}
                      placeholder="Ajuste Thermomix opcional (ej. 5 min · 100°C · Vel 1)"
                      className="w-full min-h-[40px] px-3 py-1.5 rounded-lg bg-white border border-[#D6D2C6] text-xs text-[#5A665E] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void saveEdit(step.id)}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-[#2D6A4F] text-white text-xs font-medium cursor-pointer"
                      >
                        Guardar paso
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
                  <div className="flex items-start gap-3.5">
                    <button
                      type="button"
                      onClick={() => toggleStepHighlight(step.id)}
                      aria-label={`Resaltar paso ${index + 1}`}
                      className={`min-w-[40px] min-h-[40px] rounded-xl font-semibold text-sm tabular-nums flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                        isHighlighted
                          ? 'bg-[#2D6A4F] text-white'
                          : 'bg-white border border-[#E4E1D8] text-[#1A241E] hover:border-[#2D6A4F]/40'
                      }`}
                    >
                      {stepNum}
                    </button>

                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => toggleStepHighlight(step.id)}
                    >
                      <p
                        className={`text-[15px] sm:text-base leading-relaxed ${
                          isDone ? 'line-through text-[#5A665E]' : 'text-[#1A241E]'
                        }`}
                      >
                        {step.text}
                      </p>

                      {step.thermomixParams && (
                        <p className="mt-2 text-xs sm:text-sm font-semibold text-[#2D6A4F] tabular-nums">
                          {model}: {step.thermomixParams}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleStepDone(step.id)}
                        aria-pressed={isDone}
                        aria-label={`Marcar paso ${index + 1} como completado`}
                        title={isDone ? 'Paso completado' : 'Marcar paso hecho'}
                        className={`min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                          isDone
                            ? 'text-[#009A44] bg-[#E9F3EC]'
                            : 'text-[#5A665E] hover:text-[#1A241E] hover:bg-white'
                        }`}
                      >
                        <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                      </button>

                      {isEditorMode && (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(step)}
                            aria-label={`Editar paso ${index + 1}`}
                            className="min-h-[44px] min-w-[40px] rounded-xl flex items-center justify-center text-[#5A665E] hover:text-[#1A241E] hover:bg-white cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteStep(step.id)}
                            aria-label={`Eliminar paso ${index + 1}`}
                            className="min-h-[44px] min-w-[40px] rounded-xl flex items-center justify-center text-[#5A665E] hover:text-[#B91C1C] hover:bg-[#FEE2E2]/60 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {/* Editor Mode Quick Add Step */}
      {isEditorMode && (
        <form
          onSubmit={(e) => void addStep(e)}
          className="pt-4 border-t border-[#E4E1D8] space-y-2.5"
        >
          <p className="text-xs font-semibold text-[#5A665E]">
            Agregar un nuevo paso para Thermomix {model}
          </p>
          <textarea
            rows={2}
            value={newStepText}
            onChange={(e) => setNewStepText(e.target.value)}
            placeholder="Describe el paso de preparación..."
            className="w-full p-3 rounded-xl bg-[#FCFBF8] border border-[#D6D2C6] text-sm text-[#1A241E] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newStepParams}
              onChange={(e) => setNewStepParams(e.target.value)}
              placeholder="Tiempo / Temperatura / Velocidad (ej. 5 min · 100°C · Vel 1)"
              className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FCFBF8] border border-[#D6D2C6] text-sm text-[#1A241E] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
            />
            <button
              type="submit"
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#23543E] text-white text-sm font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Agregar paso</span>
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
