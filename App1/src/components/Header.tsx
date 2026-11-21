import { Plus, Share2 } from 'lucide-react';

interface HeaderProps {
  isClientRoute: boolean;
  onNavigateHome: () => void;
  onNewRecipe: () => void;
  onOpenShareModal: () => void;
  onOpenLibrary: () => void;
  activeView: 'recipe' | 'library' | 'editor';
}

export function Header({
  isClientRoute,
  onNavigateHome,
  onNewRecipe,
  onOpenShareModal,
  onOpenLibrary,
  activeView,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#FCFBF8]/92 backdrop-blur-md border-b border-[#E4E1D8]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onNavigateHome();
          }}
          className="font-display text-base sm:text-lg font-semibold tracking-tight text-[#1A241E] whitespace-nowrap shrink-0 truncate max-w-[230px] sm:max-w-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] rounded"
        >
          Paulina Rivero
          <span className="font-sans text-xs font-medium text-[#2D6A4F] ml-2 hidden sm:inline">
            · Presentadora de Thermomix
          </span>
        </a>

        {/* Zone 2: Clean Single-Line Nav Links */}
        <nav
          aria-label="Navegación principal"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-[#5A665E]"
        >
          {isClientRoute ? (
            <>
              <a
                href="#despensa"
                className="hover:text-[#1A241E] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
              >
                Despensa
              </a>
              <a
                href="#preparacion"
                className="hover:text-[#1A241E] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
              >
                Preparación
              </a>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onNavigateHome}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeView === 'recipe'
                    ? 'text-[#1A241E] underline underline-offset-4'
                    : 'hover:text-[#1A241E]'
                }`}
              >
                Receta activa
              </button>
              <a
                href="#despensa"
                onClick={() => {
                  if (activeView !== 'recipe') onNavigateHome();
                }}
                className="hover:text-[#1A241E] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
              >
                Ingredientes
              </a>
              <a
                href="#preparacion"
                onClick={() => {
                  if (activeView !== 'recipe') onNavigateHome();
                }}
                className="hover:text-[#1A241E] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
              >
                Paso a paso
              </a>
              <button
                type="button"
                onClick={onOpenLibrary}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeView === 'library'
                    ? 'text-[#1A241E] underline underline-offset-4'
                    : 'hover:text-[#1A241E]'
                }`}
              >
                Mis recetas
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center shrink-0">
          {isClientRoute ? (
            <button
              type="button"
              onClick={onOpenShareModal}
              className="min-h-[40px] px-3.5 sm:px-4 py-2 rounded-lg bg-[#2D6A4F] hover:bg-[#23543E] text-white text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2"
            >
              <Share2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Compartir</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onNewRecipe}
              className="min-h-[40px] px-3.5 sm:px-4 py-2 rounded-lg bg-[#2D6A4F] hover:bg-[#23543E] text-white text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2"
            >
              <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Nueva receta</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
