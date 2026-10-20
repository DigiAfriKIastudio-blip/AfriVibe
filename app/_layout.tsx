import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { colors, spacing } from '@/constants/theme';
import { useAppStore } from '@/store/appStore';

/**
 * Point d'entrée de l'application.
 * Charge la source de données (locale par défaut) avant d'afficher les écrans.
 */
export default function RootLayout() {
  const status = useAppStore((state) => state.status);
  const error = useAppStore((state) => state.error);
  const hydrate = useAppStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {status === 'loading' ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
          <AppText variant="label" color={colors.textMuted}>
            Chargement d’AfriVibe…
          </AppText>
        </View>
      ) : status === 'error' ? (
        <View style={styles.centered}>
          <AppText variant="title" align="center">
            Démarrage impossible
          </AppText>
          <AppText variant="body" color={colors.textMuted} align="center">
            {error ?? 'Erreur inconnue.'}
          </AppText>
          <Button label="Réessayer" onPress={() => void hydrate()} />
        </View>
      ) : (
        <>
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
        </>
      )}
    </SafeAreaProvider>
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
