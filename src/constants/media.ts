import type { MediaRef } from '@/types/entities';

/**
 * Vidéos de démonstration embarquées dans l'application.
 *
 * Elles sont générées localement (voir `scripts/README.md`) et versionnées
 * dans `assets/videos`. Aucun service externe n'est requis : le fil vertical
 * fonctionne donc entièrement hors ligne.
 *
 * Les références sont stockées sous forme de clé (`{ kind: 'bundled', key }`)
 * et non d'identifiant d'asset, afin de rester sérialisables en JSON.
 */
const bundledMedia: Record<string, { video: number; poster: number }> = {
  'vibe-1': {
    video: require('../../assets/videos/vibe-1.mp4'),
    poster: require('../../assets/videos/vibe-1-poster.jpg'),
  },
  'vibe-2': {
    video: require('../../assets/videos/vibe-2.mp4'),
    poster: require('../../assets/videos/vibe-2-poster.jpg'),
  },
  'vibe-3': {
    video: require('../../assets/videos/vibe-3.mp4'),
    poster: require('../../assets/videos/vibe-3-poster.jpg'),
  },
  'vibe-4': {
    video: require('../../assets/videos/vibe-4.mp4'),
    poster: require('../../assets/videos/vibe-4-poster.jpg'),
  },
  'vibe-5': {
    video: require('../../assets/videos/vibe-5.mp4'),
    poster: require('../../assets/videos/vibe-5-poster.jpg'),
  },
  'vibe-6': {
    video: require('../../assets/videos/vibe-6.mp4'),
    poster: require('../../assets/videos/vibe-6-poster.jpg'),
  },
};

export type MediaSourceValue = number | { uri: string } | null;

/** Convertit une `MediaRef` du domaine en source utilisable par `expo-video`. */
export function resolveVideoSource(ref: MediaRef): MediaSourceValue {
  if (!ref) {
    return null;
  }
  if (ref.kind === 'bundled') {
    return bundledMedia[ref.key]?.video ?? null;
  }
  return { uri: ref.uri };
}

/** Convertit une `MediaRef` du domaine en source utilisable par `expo-image`. */
export function resolvePosterSource(ref: MediaRef): MediaSourceValue {
  if (!ref) {
    return null;
  }
  if (ref.kind === 'bundled') {
    return bundledMedia[ref.key]?.poster ?? null;
  }
  return { uri: ref.uri };
}

export function bundledMediaKeys(): string[] {
  return Object.keys(bundledMedia);
}

/** Module `require()` d'une vidéo embarquée (utilisé pour créer une démo). */
export function getBundledVideoModule(key: string): number | null {
  return bundledMedia[key]?.video ?? null;
}
