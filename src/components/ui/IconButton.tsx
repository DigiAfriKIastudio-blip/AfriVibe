import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { colors, spacing } from '@/constants/theme';
import { formatCount } from '@/utils/format';

interface IconButtonProps {
  name: IconName;
  onPress: () => void;
  label?: string;
  count?: number;
  color?: string;
  size?: number;
  active?: boolean;
  accessibilityLabel: string;
  haptic?: boolean;
  style?: ViewStyle;
}

/** Bouton d'action circulaire avec compteur (like, commentaire, favori…). */
export function IconButton({
  name,
  onPress,
  label,
  count,
  color = colors.text,
  size = 30,
  active = false,
  accessibilityLabel,
  haptic = true,
  style,
}: IconButtonProps) {
  const handlePress = () => {
    if (haptic) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      hitSlop={8}
      style={({ pressed }) => [styles.container, style, pressed ? styles.pressed : null]}
    >
      <View style={styles.iconWrapper}>
        <Icon name={name} size={size} color={active ? colors.like : color} />
      </View>
      {typeof count === 'number' ? (
        <AppText variant="caption" weight="600" color={colors.text} style={styles.count}>
          {formatCount(count)}
        </AppText>
      ) : null}
      {label ? (
        <AppText variant="caption" weight="600" color={colors.text}>
          {label}
        </AppText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: spacing.xs,
  },
  pressed: {
    opacity: 0.6,
    transform: [{ scale: 0.94 }],
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowRadius: 4,
  },
});
