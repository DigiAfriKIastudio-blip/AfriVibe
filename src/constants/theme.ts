// Couleurs, espacements et typographie de l'application.
// Source unique de vérité pour le thème : éviter les valeurs codées en dur.

export const colors = {
  // Fonds
  background: '#0B0B0F',
  surface: '#15151C',
  surfaceMuted: '#1E1E28',
  overlay: 'rgba(11, 11, 15, 0.72)',

  // Marque
  primary: '#FF6B35',
  accent: '#C13BFF',
  gradient: ['#FF6B35', '#FF3D77', '#C13BFF'] as const,

  // Texte
  text: '#FFFFFF',
  textMuted: '#A0A0B0',
  textFaint: '#6C6C7E',

  // États
  like: '#FF3D77',
  success: '#2ECC71',
  danger: '#FF4D4F',
  border: 'rgba(255, 255, 255, 0.10)',
  borderStrong: 'rgba(255, 255, 255, 0.20)',
  transparent: 'transparent',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 28,
  pill: 999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  display: 34,
} as const;

/** Palette déterministe utilisée pour les avatars (pas de photo disponible). */
export const avatarPalette = [
  '#FF6B35',
  '#FF3D77',
  '#C13BFF',
  '#4D6BFF',
  '#00C2A8',
  '#F5A623',
] as const;

export function avatarColorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  }
  return avatarPalette[hash % avatarPalette.length] ?? avatarPalette[0];
}
