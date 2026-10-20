import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { colors } from '@/constants/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

/** Enveloppe typée autour d'Ionicons (noms d'icônes vérifiés à la compilation). */
export function Icon({ name, size = 24, color = colors.text }: IconProps) {
  return <Ionicons name={name} size={size} color={color} />;
}
