import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { colors, radii, spacing } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

const textColors: Record<Variant, string> = {
  primary: colors.text,
  secondary: colors.text,
  ghost: colors.textMuted,
  danger: colors.danger,
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  compact = false,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (isDisabled) {
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const content = (
    <View style={[styles.content, compact ? styles.contentCompact : null]}>
      {loading ? (
        <ActivityIndicator size="small" color={textColors[variant]} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={compact ? 16 : 18} color={textColors[variant]} /> : null}
          <AppText
            variant={compact ? 'label' : 'body'}
            weight="700"
            color={textColors[variant]}
            style={styles.label}
          >
            {label}
          </AppText>
        </>
      )}
    </View>
  );

  if (variant === 'primary') {
    return (
      <Pressable
        onPress={handlePress}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled: isDisabled }}
        style={({ pressed }) => [pressed && !isDisabled ? styles.pressed : null, style]}
      >
        <LinearGradient
          colors={[colors.primary, colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.base, isDisabled ? styles.disabled : null]}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled }}
      style={({ pressed }) => [
        styles.base,
        variant === 'secondary' ? styles.secondary : null,
        variant === 'ghost' ? styles.ghost : null,
        variant === 'danger' ? styles.danger : null,
        isDisabled ? styles.disabled : null,
        pressed && !isDisabled ? styles.pressed : null,
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  contentCompact: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  label: {
    includeFontPadding: false,
  },
  secondary: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: colors.transparent,
  },
  danger: {
    backgroundColor: 'rgba(255, 77, 79, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 79, 0.35)',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});
