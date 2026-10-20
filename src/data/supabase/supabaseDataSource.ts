import type { DataSource } from '../repositories/types';

/**
 * Adaptateur Supabase — **squelette volontairement non fonctionnel**.
 *
 * Il matérialise le point d'extension : quand le backend sera disponible,
 * chaque méthode ci-dessous sera remplacée par une requête Supabase
 * (`.from('videos').select(...)`, `.rpc('toggle_like', ...)`, …) en conservant
 * exactement les mêmes signatures que `localDataSource`.
 *
 * Tant que rien n'est configuré, toute opération échoue avec un message
 * explicite : l'application ne fait jamais semblant d'être connectée.
 */

export class BackendNotConfiguredError extends Error {
  constructor(feature: string) {
    super(
      `Le backend Supabase n'est pas encore branché (${feature}). ` +
        "L'application fonctionne en mode local : voir docs/BACKEND.md."
    );
    this.name = 'BackendNotConfiguredError';
  }
}

/** Fabrique une méthode async qui signale l'absence de backend. */
function notImplemented(feature: string): (...args: unknown[]) => Promise<never> {
  return async () => {
    throw new BackendNotConfiguredError(feature);
  };
}

export const supabaseDataSource: DataSource = {
  name: 'supabase',
  session: {
    getCurrentProfileId: notImplemented('session'),
  },
  profiles: {
    getById: notImplemented('profiles.getById'),
    getByUsername: notImplemented('profiles.getByUsername'),
    list: notImplemented('profiles.list'),
    update: notImplemented('profiles.update'),
    search: notImplemented('profiles.search'),
  },
  videos: {
    listFeed: notImplemented('videos.listFeed'),
    getById: notImplemented('videos.getById'),
    listByAuthor: notImplemented('videos.listByAuthor'),
    listByIds: notImplemented('videos.listByIds'),
    search: notImplemented('videos.search'),
    create: notImplemented('videos.create'),
  },
  comments: {
    listByVideo: notImplemented('comments.listByVideo'),
    add: notImplemented('comments.add'),
    remove: notImplemented('comments.remove'),
    toggleLike: notImplemented('comments.toggleLike'),
  },
  interactions: {
    get: notImplemented('interactions.get'),
    toggleLike: notImplemented('interactions.toggleLike'),
    toggleSave: notImplemented('interactions.toggleSave'),
    toggleFollow: notImplemented('interactions.toggleFollow'),
    registerShare: notImplemented('interactions.registerShare'),
    registerView: notImplemented('interactions.registerView'),
  },
  notifications: {
    list: notImplemented('notifications.list'),
    markAllRead: notImplemented('notifications.markAllRead'),
  },
};
