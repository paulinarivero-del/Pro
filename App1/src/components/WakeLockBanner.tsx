import { Monitor, Smartphone } from 'lucide-react';
import { UseWakeLockResult } from '../hooks/useWakeLock';

interface WakeLockBannerProps {
  wakeLock: UseWakeLockResult;
  compact?: boolean;
}

export function WakeLockBanner({ wakeLock, compact = false }: WakeLockBannerProps) {
  const { isActive, fallbackNotice, toggleWakeLock } = wakeLock;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void toggleWakeLock()}
        aria-pressed={isActive}
        className={`min-h-[44px] w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2 ${
          isActive
            ? 'bg-[#2D6A4F] text-white shadow-sm'
            : 'bg-[#F3F1EB] hover:bg-[#E8E4DA] text-[#1A241E] border border-[#E4E1D8]'
        } ${compact ? 'text-xs sm:text-sm' : ''}`}
      >
        {isActive ? (
          <Monitor className="w-4 h-4 shrink-0" aria-hidden="true" />
        ) : (
          <Smartphone className="w-4 h-4 shrink-0 text-[#2D6A4F]" aria-hidden="true" />
        )}
        <span className="whitespace-nowrap">
          {isActive ? 'Modo Cocina activo · Pantalla encendida' : 'Modo Cocina (Pantalla siempre activa)'}
        </span>
      </button>

      {isActive && (
        <div
          role="status"
          className="rounded-xl bg-[#E9F3EC] border border-[#2D6A4F]/25 px-3.5 py-2.5 text-xs sm:text-sm text-[#1D4D37]"
        >
          <p className="font-medium">
            {fallbackNotice ??
              'Pantalla siempre activa: tu celular no se bloqueará mientras revisas la despensa o cocinas.'}
          </p>
        </div>
      )}
    </div>
  );
}
