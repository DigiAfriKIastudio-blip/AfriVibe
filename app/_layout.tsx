import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/system/ErrorBoundary';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { STARTUP_TIMEOUTS } from '@/constants/startup';
import { colors, spacing } from '@/constants/theme';
import {
  hideSplashScreen,
  preventSplashAutoHide,
  useSplashGate,
} from '@/features/startup/useSplashGate';
import { useAppStore } from '@/store/appStore';

/**
 * Point d'entrée de l'application.
 *
 * Le splash natif est retenu (appel en portée module, avant le premier rendu)
 * puis masqué dès que l'écran de démarrage JS est monté : l'utilisateur voit
 * toujours l'état réel de l'application, jamais un logo figé.
 *
 * Toutes les étapes de démarrage sont bornées dans le temps (voir
 * `src/constants/startup.ts`) et le rendu est protégé par un `ErrorBoundary` :
 * en cas de problème, un écran explicite propose de réessayer, sans jamais
 * toucher aux données locales.
 */

// Doit être appelé en portée module : trop tard dans un effet, le splash
// serait déjà masqué par la plateforme.
preventSplashAutoHide();

export default function RootLayout() {
  const status = useAppStore((state) => state.status);
  const error = useAppStore((state) => state.error);
  const hydrate = useAppStore((state) => state.hydrate);
  const failStartupIfLoading = useAppStore((state) => state.failStartupIfLoading);

  useSplashGate();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const handleRetry = useCallback(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <ErrorBoundary
        title="AfriVibe n’a pas pu démarrer"
        description="Vos données locales (commentaires, favoris, abonnements, publications) ont été conservées. Appuyez sur « Réessayer » : rien n’est supprimé."
        onError={hideSplashScreen}
      >
        {status === 'loading' ? (
          <StartupLoading onRetry={handleRetry} />
        ) : status === 'error' ? (
          <View style={styles.centered} testID="startup-error">
            <AppText variant="title" align="center">
              Démarrage impossible
            </AppText>
            <AppText variant="body" color={colors.textMuted} align="center">
              {error ?? 'Erreur inconnue.'}
            </AppText>
            <AppText variant="caption" color={colors.textFaint} align="center">
              Vos commentaires, favoris, abonnements et publications n’ont pas été supprimés.
            </AppText>
            <Button label="Réessayer" onPress={handleRetry} />
          </View>
        ) : (
          <ErrorBoundary
            title="Cet écran a rencontré un problème"
            description="Vos données ont été conservées. Réessayez pour réafficher l’application."
            onError={hideSplashScreen}
            testID="route-error-fallback"
          >
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
              }}
            >
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="video/[videoId]" options={{ animation: 'fade' }} />
              <Stack.Screen name="user/[username]" />
              <Stack.Screen
                name="comments/[videoId]"
                options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="edit-profile"
                options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
              />
              <Stack.Screen name="+not-found" />
            </Stack>
            <Toast />
          </ErrorBoundary>
        )}
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

/**
 * Écran d'attente du démarrage.
 *
 * Le minuteur vit avec le composant : il est réarmé à chaque nouvelle phase de
 * chargement (montage), et jamais pendant le rendu. Au-delà du délai de
 * sécurité, une explication et un bouton « Réessayer » apparaissent — il ne
 * peut donc pas rester un spinner éternel.
 */
function StartupLoading({ onRetry }: { onRetry: () => void }) {
  const [isSlowStartup, setIsSlowStartup] = useState(false);

  const failStartupIfLoading = useAppStore((state) => state.failStartupIfLoading);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSlowStartup(true);
      failStartupIfLoading();
    }, STARTUP_TIMEOUTS.startupWatchdog);
    return () => clearTimeout(timer);
  }, [failStartupIfLoading]);

  return (
    <View style={styles.centered} testID="startup-loading">
      <ActivityIndicator color={colors.primary} size="large" />
      <AppText variant="label" color={colors.textMuted}>
        Chargement d’AfriVibe…
      </AppText>
      {isSlowStartup ? (
        <>
          <AppText variant="body" color={colors.textMuted} align="center">
            Le démarrage prend plus de temps que prévu. Vos données locales sont intactes.
          </AppText>
          <Button label="Réessayer" onPress={onRetry} />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
});
