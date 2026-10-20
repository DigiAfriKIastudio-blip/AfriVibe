import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppStore } from '@/store/appStore';

const DISPLAY_MS = 2200;

/** Petit bandeau de confirmation (favoris, abonnement, publication…). */
export function Toast() {
  const toast = useAppStore((state) => state.toast);
  const hideToast = useAppStore((state) => state.hideToast);
  const insets = useSafeAreaInsets();
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(12));

  useEffect(() => {
    if (!toast) {
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 160, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 12, duration: 180, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) {
          hideToast();
        }
      });
    }, DISPLAY_MS);

    return () => clearTimeout(timer);
  }, [toast, opacity, translateY, hideToast]);

  if (!toast) {
    return null;
  }

  return (
    <View pointerEvents="none" style={[styles.container, { bottom: insets.bottom + 96 }]}>
      <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }] }]}>
        <AppText variant="label" weight="600" align="center">
          {toast}
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  toast: {
    backgroundColor: 'rgba(30, 30, 40, 0.96)',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    maxWidth: 360,
  },
});
