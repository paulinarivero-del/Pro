import { useState } from 'react';
import {
  Check,
  ChefHat,
  Copy,
  Edit3,
  ExternalLink,
  Link2,
  MessageCircle,
  UserCheck,
} from 'lucide-react';
import { Recipe } from '../types/recipe';
import { buildRecipeShareUrl, buildWhatsAppShareUrl } from '../utils/recipeParser';

interface RecipeHeroProps {
  recipe: Recipe;
  isEditorMode: boolean;
  isClientRoute: boolean;
  onEditRecipe: () => void;
  onOpenShareModal: () => void;
  onTogglePreviewRole?: () => void;
  onCopySuccess: (message: string) => void;
}

export function RecipeHero({
  recipe,
  isEditorMode,
  isClientRoute,
  onEditRecipe,
  onOpenShareModal,
  onTogglePreviewRole,
  onCopySuccess,
}: RecipeHeroProps) {
  const [imgError, setImgError] = useState(false);
  const [copiedDirect, setCopiedDirect] = useState(false);

  const shareUrl = buildRecipeShareUrl(recipe.id);
  const whatsappUrl = buildWhatsAppShareUrl(recipe, shareUrl);

  const handleCopyDirect = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedDirect(true);
      onCopySuccess('Enlace único copiado al portapapeles.');
      setTimeout(() => setCopiedDirect(false), 2200);
    } catch {
      onOpenShareModal();
    }
  };

  return (
    <section
      aria-labelledby="recipe-title"
      className="bg-white border border-[#E4E1D8] rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_1px_3px_rgba(26,36,30,0.04)]"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
        {/* Recipe Photography */}
        <div className="lg:col-span-6 relative bg-[#F3F1EB] aspect-[16/10] lg:aspect-auto lg:min-h-[360px]">
          {recipe.imageUrl && !imgError ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.title}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full min-h-[220px] flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#E9F3EC] via-[#F3F1EB] to-[#EAE6DA]">
              <ChefHat className="w-12 h-12 text-[#2D6A4F]/60 mb-3" aria-hidden="true" />
              <p className="font-display text-lg text-[#1A241E] max-w-xs">{recipe.title}</p>
              <p className="text-xs text-[#5A665E] mt-1">Thermomix {recipe.model}</p>
            </div>
          )}
        </div>

        {/* Recipe Editorial Summary & Direct Actions */}
        <div className="lg:col-span-6 p-5 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            {/* Thermomix Model Tag + Presenter Line */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#E9F3EC] border border-[#2D6A4F]/25 text-[#1D4D37] text-xs font-semibold tracking-wide">
                Thermomix {recipe.model}
              </span>

              {!isClientRoute && onTogglePreviewRole && (
                <div className="inline-flex items-center p-1 rounded-lg bg-[#F3F1EB] border border-[#E4E1D8]">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isEditorMode) onTogglePreviewRole();
                    }}
                    className={`min-h-[32px] px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      isEditorMode
                        ? 'bg-white text-[#1A241E] shadow-xs'
                        : 'text-[#5A665E] hover:text-[#1A241E]'
                    }`}
                  >
                    Modo Editora
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (isEditorMode) onTogglePreviewRole();
                    }}
                    className={`min-h-[32px] px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      !isEditorMode
                        ? 'bg-white text-[#1A241E] shadow-xs'
                        : 'text-[#5A665E] hover:text-[#1A241E]'
                    }`}
                  >
                    Vista Clienta
                  </button>
                </div>
              )}
            </div>

            {/* Client Personalized Greeting if applicable */}
            {recipe.clientName && (
              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2D6A4F]">
                <UserCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Lista personalizada para {recipe.clientName}</span>
              </p>
            )}

            {/* Title & Description */}
            <div>
              <h1
                id="recipe-title"
                className="font-display text-2xl sm:text-3xl lg:text-[2.1rem] font-semibold leading-tight text-[#1A241E] headline-balance"
              >
                {recipe.title}
              </h1>
              {recipe.description && (
                <p className="mt-2.5 text-sm sm:text-base text-[#5A665E] leading-relaxed">
                  {recipe.description}
                </p>
              )}
            </div>

            {/* Clean Unboxed Metadata */}
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#5A665E] tabular-nums">
              <span>{recipe.prepTime}</span>
              <span aria-hidden="true">·</span>
              <span>{recipe.servings}</span>
              <span aria-hidden="true">·</span>
              <span>{recipe.ingredients.length} ingredientes</span>
              <span aria-hidden="true">·</span>
              <span>{recipe.steps.length} pasos</span>
              {recipe.cookidooUrl && (
                <>
                  <span aria-hidden="true">·</span>
                  <a
                    href={recipe.cookidooUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#2D6A4F] hover:underline"
                  >
                    <span>Ver en Cookidoo</span>
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Presenter Signature + Direct Share / Edit Actions */}
          <div className="pt-4 border-t border-[#E4E1D8] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-[#1A241E]">
                  Paulina Rivero · Presentadora de Thermomix
                </p>
                <p className="text-xs text-[#5A665E]">
                  {isClientRoute
                    ? 'Tus marcas de despensa se guardan automáticamente en este enlace.'
                    : 'Comparte esta receta con tus clientas sin contraseñas ni descargas.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {!isClientRoute && isEditorMode && (
                <button
                  type="button"
                  onClick={onOpenShareModal}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#009A44] hover:bg-[#008038] text-white text-sm font-medium inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009A44] focus-visible:ring-offset-2"
                >
                  <Link2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Generar enlace para clienta</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => void handleCopyDirect()}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#F3F1EB] hover:bg-[#E8E4DA] text-[#1A241E] border border-[#E4E1D8] text-sm font-medium inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F]"
              >
                {copiedDirect ? (
                  <Check className="w-4 h-4 text-[#009A44] shrink-0" aria-hidden="true" />
                ) : (
                  <Copy className="w-4 h-4 text-[#5A665E] shrink-0" aria-hidden="true" />
                )}
                <span>{copiedDirect ? '¡Enlace copiado!' : 'Copiar enlace único'}</span>
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#E9F3EC] hover:bg-[#D8EBDD] text-[#1D4D37] border border-[#2D6A4F]/25 text-sm font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F]"
              >
                <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Enviar por WhatsApp</span>
              </a>

              {!isClientRoute && isEditorMode && (
                <button
                  type="button"
                  onClick={onEditRecipe}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white hover:bg-[#F3F1EB] text-[#1A241E] border border-[#E4E1D8] text-sm font-medium inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F]"
                >
                  <Edit3 className="w-4 h-4 text-[#5A665E] shrink-0" aria-hidden="true" />
                  <span>Editar receta</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
