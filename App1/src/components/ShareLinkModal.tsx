import { useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Link2,
  Loader2,
  MessageCircle,
  UserPlus,
  X,
} from 'lucide-react';
import { Recipe } from '../types/recipe';
import { buildRecipeShareUrl, buildWhatsAppShareUrl } from '../utils/recipeParser';

interface ShareLinkModalProps {
  recipe: Recipe;
  existingClientLinks: Recipe[];
  isClientRoute: boolean;
  onGenerateClientLink: (clientName: string) => Promise<Recipe>;
  onOpenLink: (recipeId: string) => void;
  onClose: () => void;
}

export function ShareLinkModal({
  recipe,
  existingClientLinks,
  isClientRoute,
  onGenerateClientLink,
  onOpenLink,
  onClose,
}: ShareLinkModalProps) {
  const [clientName, setClientName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [activeShareRecipe, setActiveShareRecipe] = useState<Recipe>(recipe);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const shareUrl = buildRecipeShareUrl(activeShareRecipe.id);
  const whatsappUrl = buildWhatsAppShareUrl(activeShareRecipe, shareUrl);

  const handleCopy = async (idToCopy: string) => {
    const url = buildRecipeShareUrl(idToCopy);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(idToCopy);
      setTimeout(() => setCopiedId(null), 2200);
    } catch {
      // Fallback: ignore if clipboard blocked
    }
  };

  const handleCreateUniqueLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const created = await onGenerateClientLink(clientName.trim());
      setActiveShareRecipe(created);
      setClientName('');
    } finally {
      setGenerating(false);
    }
  };

  const relatedLinks = existingClientLinks.filter(
    (item) => item.parentId === (recipe.parentId || recipe.id)
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-[2px] p-0 sm:p-4"
    >
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl border border-[#E4E1D8] shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 sm:p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                id="share-modal-title"
                className="font-display text-xl sm:text-2xl font-semibold text-[#1A241E]"
              >
                Compartir receta interactiva
              </h2>
              <p className="text-xs sm:text-sm text-[#5A665E] mt-1">
                {isClientRoute
                  ? 'Comparte este enlace directo sin contraseñas ni instalaciones.'
                  : 'Genera un enlace único por clienta para que cada una tenga su propia lista de despensa independiente.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar ventana"
              className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-[#5A665E] hover:text-[#1A241E] hover:bg-[#F3F1EB] cursor-pointer"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Generate New Unique Client Link (Editor Studio) */}
          {!isClientRoute && (
            <form
              onSubmit={(e) => void handleCreateUniqueLink(e)}
              className="p-4 rounded-2xl bg-[#F3F1EB] border border-[#E4E1D8] space-y-3"
            >
              <label
                htmlFor="client-name-input"
                className="flex items-center gap-1.5 text-xs font-semibold text-[#1A241E]"
              >
                <UserPlus className="w-4 h-4 text-[#2D6A4F]" aria-hidden="true" />
                <span>Crear enlace único para una nueva clienta</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="client-name-input"
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Nombre de la clienta (ej. Sofía)"
                  className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#D6D2C6] text-sm text-[#1A241E] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
                <button
                  type="submit"
                  disabled={generating}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#23543E] disabled:opacity-60 text-white text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  {generating ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Link2 className="w-4 h-4" aria-hidden="true" />
                  )}
                  <span>Generar enlace</span>
                </button>
              </div>
            </form>
          )}

          {/* Active Share URL Card */}
          <div className="p-4 rounded-2xl bg-[#FCFBF8] border border-[#E4E1D8] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#2D6A4F]">
                {activeShareRecipe.clientName
                  ? `Enlace único para ${activeShareRecipe.clientName}`
                  : 'Enlace directo de la receta'}
              </span>
              <button
                type="button"
                onClick={() => {
                  onOpenLink(activeShareRecipe.id);
                  onClose();
                }}
                className="text-xs font-medium text-[#2D6A4F] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Abrir vista clienta</span>
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-[#E4E1D8] text-xs text-[#5A665E] break-all select-all">
              {shareUrl}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => void handleCopy(activeShareRecipe.id)}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#F3F1EB] hover:bg-[#E8E4DA] text-[#1A241E] text-sm font-medium inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedId === activeShareRecipe.id ? (
                  <Check className="w-4 h-4 text-[#009A44]" aria-hidden="true" />
                ) : (
                  <Copy className="w-4 h-4 text-[#5A665E]" aria-hidden="true" />
                )}
                <span>
                  {copiedId === activeShareRecipe.id ? '¡Copiado!' : 'Copiar enlace único'}
                </span>
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#009A44] hover:bg-[#008038] text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                <span>Enviar por WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Previously Generated Client Links */}
          {!isClientRoute && relatedLinks.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#E4E1D8]">
              <p className="text-xs font-semibold text-[#5A665E]">
                Enlaces de clientas creados ({relatedLinks.length})
              </p>
              <ul className="space-y-2 max-h-40 overflow-y-auto">
                {relatedLinks.map((linkItem) => (
                  <li
                    key={linkItem.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#FCFBF8] border border-[#E4E1D8]"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#1A241E] truncate">
                        {linkItem.clientName || 'Clienta'}
                      </p>
                      <p className="text-[11px] text-[#5A665E] truncate">/receta/{linkItem.id}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => void handleCopy(linkItem.id)}
                        className="min-h-[36px] px-2.5 py-1 rounded-lg bg-[#F3F1EB] hover:bg-[#E8E4DA] text-xs font-medium text-[#1A241E] cursor-pointer"
                      >
                        {copiedId === linkItem.id ? '¡Copiado!' : 'Copiar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onOpenLink(linkItem.id);
                          onClose();
                        }}
                        className="min-h-[36px] px-2.5 py-1 rounded-lg bg-[#E9F3EC] text-xs font-medium text-[#1D4D37] cursor-pointer"
                      >
                        Abrir
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
