import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { STARTUP_TIMEOUTS } from '@/constants/startup';

/**
 * Gestion **défensive** du splash natif.
 *
 * Deux règles :
 * 1. le splash ne doit jamais rester affiché indéfiniment — il est masqué dès
 *    que l'écran de démarrage JS est monté, puis une seconde fois après un
 *    délai de sécurité si le premier appel a échoué ;
 * 2. aucun appel au module natif ne doit pouvoir faire planter le démarrage :
 *    chaque appel est isolé dans un `try/catch` et les rejets sont avalés
 *    (sur le web, ou si le splash est déjà masqué, ces appels peuvent lever).
 */

function logSplashError(label: string, error: unknown): void {
  console.warn(`[AfriVibe] ${label} :`, error);
}

/** Empêche le splash natif de disparaître avant que l'écran JS soit prêt. */
export function preventSplashAutoHide(): void {
  try {
    const result = SplashScreen.preventAutoHideAsync();
    if (result && typeof result.catch === 'function') {
      result.catch((error: unknown) => logSplashError('Splash : prévention impossible', error));
    }
  } catch (error) {
    logSplashError('Splash : prévention impossible', error);
  }
}

/** Masque le splash natif. Idempotent et sans effet si l'API est absente. */
export function hideSplashScreen(): void {
  try {
    const result = SplashScreen.hideAsync();
    if (result && typeof result.catch === 'function') {
      result.catch((error: unknown) => logSplashError('Splash : masquage impossible', error));
    }
  } catch (error) {
    logSplashError('Splash : masquage impossible', error);
  }
}

/**
 * Hook monté par le layout racine : masque le splash au premier rendu, puis
 * programme un masquage de secours pour garantir qu'il ne reste jamais à
 * l'écran, même si le premier appel échoue silencieusement.
 */
export function useSplashGate(options: { safetyTimeoutMs?: number } = {}): void {
  const safetyTimeoutMs = options.safetyTimeoutMs ?? STARTUP_TIMEOUTS.splashSafety;

  useEffect(() => {
    hideSplashScreen();
    const timer = setTimeout(hideSplashScreen, safetyTimeoutMs);
    return () => clearTimeout(timer);
  }, [safetyTimeoutMs]);
}
