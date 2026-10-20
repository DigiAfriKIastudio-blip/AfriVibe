import { create } from 'zustand';

import { getDataSource } from '@/data';
import type {
  AppNotification,
  Comment,
  CreateVideoInput,
  Profile,
  UpdateProfileInput,
  UserInteractions,
  Video,
} from '@/types/entities';

/**
 * État applicatif global.
 *
 * Les écrans lisent cet état et déclenchent des actions : chaque action passe
 * par le `DataSource` (aujourd'hui local, demain Supabase) puis met à jour
 * l'état. L'UI reste donc totalement découplée du stockage.
 */

export type AppStatus = 'loading' | 'ready' | 'error';

const EMPTY_INTERACTIONS: UserInteractions = {
  likedVideoIds: [],
  savedVideoIds: [],
  followingIds: [],
  likedCommentIds: [],
};

export interface AppState {
  status: AppStatus;
  error: string | null;
  toast: string | null;

  currentProfileId: string;
  profiles: Record<string, Profile>;
  videos: Record<string, Video>;
  feedOrder: string[];
  feedCursor: string | null;
  comments: Record<string, Comment[]>;
  interactions: UserInteractions;
  notifications: AppNotification[];

  hydrate: () => Promise<void>;
  loadMoreFeed: () => Promise<void>;
  refreshFeed: () => Promise<void>;

  toggleLike: (videoId: string) => Promise<void>;
  toggleSave: (videoId: string) => Promise<void>;
  toggleFollow: (profileId: string) => Promise<void>;
  registerShare: (videoId: string) => Promise<void>;
  registerView: (videoId: string) => Promise<void>;

  loadComments: (videoId: string) => Promise<void>;
  addComment: (videoId: string, text: string) => Promise<void>;
  deleteComment: (videoId: string, commentId: string) => Promise<void>;
  toggleCommentLike: (videoId: string, commentId: string) => Promise<void>;

  publish: (input: CreateVideoInput) => Promise<Video | null>;
  updateProfile: (input: UpdateProfileInput) => Promise<void>;
  markNotificationsRead: () => Promise<void>;

  showToast: (message: string) => void;
  hideToast: () => void;
  dismissError: () => void;
}

function toRecord<T extends { id: string }>(items: T[]): Record<string, T> {
  return items.reduce<Record<string, T>>((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Une erreur inattendue est survenue.';
}

export const useAppStore = create<AppState>()((set, get) => ({
  status: 'loading',
  error: null,
  toast: null,

  currentProfileId: '',
  profiles: {},
  videos: {},
  feedOrder: [],
  feedCursor: null,
  comments: {},
  interactions: EMPTY_INTERACTIONS,
  notifications: [],

  hydrate: async () => {
    const dataSource = getDataSource();
    set({ status: 'loading', error: null });

    try {
      const [currentProfileId, profiles, feedPage, interactions, notifications] = await Promise.all([
        dataSource.session.getCurrentProfileId(),
        dataSource.profiles.list(),
        dataSource.videos.listFeed(),
        dataSource.interactions.get(),
        dataSource.notifications.list(),
      ]);

      set({
        status: 'ready',
        currentProfileId,
        profiles: toRecord(profiles),
        videos: toRecord(feedPage.items),
        feedOrder: feedPage.items.map((video) => video.id),
        feedCursor: feedPage.nextCursor,
        interactions,
        notifications,
      });
    } catch (error) {
      console.warn('[AfriVibe] Hydratation impossible :', error);
      set({ status: 'error', error: errorMessage(error) });
    }
  },

  refreshFeed: async () => {
    try {
      const page = await getDataSource().videos.listFeed();
      set((state) => ({
        videos: { ...state.videos, ...toRecord(page.items) },
        feedOrder: page.items.map((video) => video.id),
        feedCursor: page.nextCursor,
      }));
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },

  loadMoreFeed: async () => {
    const { feedCursor, feedOrder } = get();
    if (!feedCursor) {
      return;
    }
    try {
      const page = await getDataSource().videos.listFeed({ cursor: feedCursor });
      set((state) => ({
        videos: { ...state.videos, ...toRecord(page.items) },
        feedOrder: [...feedOrder, ...page.items.map((video) => video.id)],
        feedCursor: page.nextCursor,
      }));
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },

  toggleLike: async (videoId) => {
    try {
      const { video, liked } = await getDataSource().interactions.toggleLike(videoId);
      set((state) => {
        const wasLiked = state.interactions.likedVideoIds.includes(videoId);
        return {
          videos: { ...state.videos, [video.id]: video },
          interactions: {
            ...state.interactions,
            likedVideoIds: wasLiked
              ? state.interactions.likedVideoIds.filter((id) => id !== videoId)
              : [...state.interactions.likedVideoIds, videoId],
          },
          toast: liked ? 'Ajouté à vos vidéos aimées' : null,
        };
      });
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },

  toggleSave: async (videoId) => {
    try {
      const { video, saved } = await getDataSource().interactions.toggleSave(videoId);
      set((state) => {
        const wasSaved = state.interactions.savedVideoIds.includes(videoId);
        return {
          videos: { ...state.videos, [video.id]: video },
          interactions: {
            ...state.interactions,
            savedVideoIds: wasSaved
              ? state.interactions.savedVideoIds.filter((id) => id !== videoId)
              : [...state.interactions.savedVideoIds, videoId],
          },
          toast: saved ? 'Enregistré dans vos favoris' : 'Retiré de vos favoris',
        };
      });
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },

  toggleFollow: async (profileId) => {
    try {
      const { profile, following } = await getDataSource().interactions.toggleFollow(profileId);
      set((state) => {
        const wasFollowing = state.interactions.followingIds.includes(profileId);
        const me = state.profiles[state.currentProfileId];
        const meFollowingDelta = following ? 1 : -1;
        return {
          profiles: {
            ...state.profiles,
            [profile.id]: profile,
            ...(me
              ? {
                  [me.id]: {
                    ...me,
                    stats: {
                      ...me.stats,
                      following: Math.max(0, me.stats.following + meFollowingDelta),
                    },
                  },
                }
              : {}),
          },
          interactions: {
            ...state.interactions,
            followingIds: wasFollowing
              ? state.interactions.followingIds.filter((id) => id !== profileId)
              : [...state.interactions.followingIds, profileId],
          },
          toast: following ? `Abonné à @${profile.username}` : `Désabonné de @${profile.username}`,
        };
      });
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },

  registerShare: async (videoId) => {
    try {
      const video = await getDataSource().interactions.registerShare(videoId);
      set((state) => ({ videos: { ...state.videos, [video.id]: video } }));
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },

  registerView: async (videoId) => {
    const existing = get().videos[videoId];
    if (!existing) {
      return;
    }
    try {
      const video = await getDataSource().interactions.registerView(videoId);
      set((state) => ({ videos: { ...state.videos, [video.id]: video } }));
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },

  loadComments: async (videoId) => {
    try {
      const items = await getDataSource().comments.listByVideo(videoId);
      set((state) => ({ comments: { ...state.comments, [videoId]: items } }));
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },

  addComment: async (videoId, text) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    try {
      const { currentProfileId } = get();
      const comment = await getDataSource().comments.add(videoId, currentProfileId, trimmed);
      set((state) => {
        const current = state.comments[videoId] ?? [];
        const video = state.videos[videoId];
        return {
          comments: { ...state.comments, [videoId]: [comment, ...current] },
          videos: video
            ? {
                ...state.videos,
                [videoId]: {
                  ...video,
                  stats: { ...video.stats, comments: video.stats.comments + 1 },
                },
              }
            : state.videos,
        };
      });
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },

  deleteComment: async (videoId, commentId) => {
    try {
      await getDataSource().comments.remove(commentId);
      set((state) => {
        const current = state.comments[videoId] ?? [];
        const video = state.videos[videoId];
        return {
          comments: { ...state.comments, [videoId]: current.filter((item) => item.id !== commentId) },
          videos: video
            ? {
                ...state.videos,
                [videoId]: {
                  ...video,
                  stats: { ...video.stats, comments: Math.max(0, video.stats.comments - 1) },
                },
              }
            : state.videos,
        };
      });
      get().showToast('Commentaire supprimé');
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },

  toggleCommentLike: async (videoId, commentId) => {
    try {
      const { comment, liked } = await getDataSource().comments.toggleLike(commentId);
      set((state) => {
        const current = state.comments[videoId] ?? [];
        const wasLiked = state.interactions.likedCommentIds.includes(commentId);
        return {
          comments: {
            ...state.comments,
            [videoId]: current.map((item) => (item.id === commentId ? comment : item)),
          },
          interactions: {
            ...state.interactions,
            likedCommentIds: wasLiked
              ? state.interactions.likedCommentIds.filter((id) => id !== commentId)
              : [...state.interactions.likedCommentIds, commentId],
          },
          toast: liked ? null : null,
        };
      });
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },

  publish: async (input) => {
    try {
      const { currentProfileId } = get();
      const video = await getDataSource().videos.create(currentProfileId, input);
      set((state) => ({
        videos: { ...state.videos, [video.id]: video },
        feedOrder: [video.id, ...state.feedOrder],
        toast: 'Publication créée sur cet appareil',
      }));
      return video;
    } catch (error) {
      set({ error: errorMessage(error) });
      return null;
    }
  },

  updateProfile: async (input) => {
    try {
      const { currentProfileId } = get();
      const profile = await getDataSource().profiles.update(currentProfileId, input);
      set((state) => ({
        profiles: { ...state.profiles, [profile.id]: profile },
        toast: 'Profil mis à jour',
      }));
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },

  markNotificationsRead: async () => {
    try {
      const notifications = await getDataSource().notifications.markAllRead();
      set({ notifications });
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },

  showToast: (message) => set({ toast: message }),
  hideToast: () => set({ toast: null }),
  dismissError: () => set({ error: null }),
}));

/* ------------------------------------------------------------------ */
/* Sélecteurs dérivés (fonctions pures)                                */
/* ------------------------------------------------------------------ */

export function selectAuthor(state: AppState, video: Video): Profile | undefined {
  return state.profiles[video.authorId];
}

export function selectProfileById(state: AppState, profileId: string): Profile | undefined {
  return state.profiles[profileId];
}

export function selectVideosByAuthor(state: AppState, authorId: string): Video[] {
  return Object.values(state.videos)
    .filter((video) => video.authorId === authorId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function selectSavedVideos(state: AppState): Video[] {
  return state.interactions.savedVideoIds
    .map((id) => state.videos[id])
    .filter((video): video is Video => Boolean(video));
}

export function selectLikedVideos(state: AppState): Video[] {
  return state.interactions.likedVideoIds
    .map((id) => state.videos[id])
    .filter((video): video is Video => Boolean(video));
}

export function selectIsLiked(state: AppState, videoId: string): boolean {
  return state.interactions.likedVideoIds.includes(videoId);
}

export function selectIsSaved(state: AppState, videoId: string): boolean {
  return state.interactions.savedVideoIds.includes(videoId);
}

export function selectIsFollowing(state: AppState, profileId: string): boolean {
  return state.interactions.followingIds.includes(profileId);
}

export function selectUnreadNotificationCount(state: AppState): number {
  return state.notifications.filter((notification) => !notification.read).length;
}
