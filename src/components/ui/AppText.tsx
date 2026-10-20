import { StyleSheet, Text, type TextProps } from 'react-native';

import { colors, fontSize } from '@/constants/theme';

export type TextVariant = 'display' | 'title' | 'subtitle' | 'body' | 'label' | 'caption';

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
  weight?: '400' | '500' | '600' | '700' | '800';
  align?: 'left' | 'center' | 'right';
  /** Limite le nombre de lignes (raccourci pratique). */
  lines?: number;
}

const variantStyles = StyleSheet.create({
  display: { fontSize: fontSize.display, fontWeight: '800', letterSpacing: -0.8 },
  title: { fontSize: fontSize.xxl, fontWeight: '700', letterSpacing: -0.4 },
  subtitle: { fontSize: fontSize.lg, fontWeight: '700' },
  body: { fontSize: fontSize.md, fontWeight: '400' },
  label: { fontSize: fontSize.sm, fontWeight: '600' },
  caption: { fontSize: fontSize.xs, fontWeight: '500' },
});

export function AppText({
  variant = 'body',
  color = colors.text,
  weight,
  align,
  lines,
  style,
  ...rest
}: AppTextProps) {
  return (
    <Text
      numberOfLines={lines}
      style={[
        variantStyles[variant],
        { color },
        weight ? { fontWeight: weight } : null,
        align ? { textAlign: align } : null,
        style,
      ]}
      {...rest}
    />
  );
}
