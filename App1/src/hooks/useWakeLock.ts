import { useCallback, useEffect, useRef, useState } from 'react';

interface WakeLockSentinelLike {
  released: boolean;
  release: () => Promise<void>;
  addEventListener?: (type: string, listener: () => void) => void;
}

interface NavigatorWithWakeLock {
  wakeLock?: {
    request: (type: 'screen') => Promise<WakeLockSentinelLike>;
  };
}

export interface UseWakeLockResult {
  isSupported: boolean;
  isActive: boolean;
  fallbackNotice: string | null;
  toggleWakeLock: () => Promise<void>;
  releaseWakeLock: () => Promise<void>;
}

export function useWakeLock(): UseWakeLockResult {
  const [isActive, setIsActive] = useState(false);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null);
  const wantActiveRef = useRef(false);

  const isSupported =
    typeof navigator !== 'undefined' &&
    'wakeLock' in navigator &&
    Boolean((navigator as unknown as NavigatorWithWakeLock).wakeLock);

  const requestLock = useCallback(async () => {
    const nav = navigator as unknown as NavigatorWithWakeLock;
    if (!nav.wakeLock) {
      setIsActive(true);
      setFallbackNotice(
        'Modo Cocina activo visualmente. Tu navegador actual no admite bloqueo automático de pantalla; recuerda mantener el brillo activo si usas vista embebida.'
      );
      return;
    }

    try {
      const sentinel = await nav.wakeLock.request('screen');
      sentinelRef.current = sentinel;
      setIsActive(true);
      setFallbackNotice(null);

      sentinel.addEventListener?.('release', () => {
        if (!wantActiveRef.current) {
          setIsActive(false);
        }
      });
    } catch {
      // Safari/Chrome inside restricted iframes or low-battery mode may deny WakeLock;
      // keep Modo Cocina active visually and inform user honestly.
      setIsActive(true);
      setFallbackNotice(
        'Modo Cocina activo. El navegador restringió el bloqueo automático de reposo (común en modo ahorro o vista previa embebida); ábrelo en pestaña directa de Safari/Chrome para bloqueo completo.'
      );
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    wantActiveRef.current = false;
    setIsActive(false);
    setFallbackNotice(null);
    if (sentinelRef.current && !sentinelRef.current.released) {
      try {
        await sentinelRef.current.release();
      } catch {
        // ignore release error
      }
    }
    sentinelRef.current = null;
  }, []);

  const toggleWakeLock = useCallback(async () => {
    if (wantActiveRef.current || isActive) {
      await releaseWakeLock();
    } else {
      wantActiveRef.current = true;
      await requestLock();
    }
  }, [isActive, releaseWakeLock, requestLock]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && wantActiveRef.current) {
        void requestLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (sentinelRef.current && !sentinelRef.current.released) {
        void sentinelRef.current.release().catch(() => undefined);
      }
    };
  }, [requestLock]);

  return {
    isSupported,
    isActive,
    fallbackNotice,
    toggleWakeLock,
    releaseWakeLock,
  };
}
