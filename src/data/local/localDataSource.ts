import { avatarColorFor } from '@/constants/theme';
import type {
  AppNotification,
  Comment,
  CreateVideoInput,
  FeedPage,
  Profile,
  SearchResults,
  UpdateProfileInput,
  UserInteractions,
  Video,
} from '@/types/entities';
import { createId } from '@/utils/id';
import type {
  CommentsRepository,
  DataSource,
  InteractionsRepository,
  NotificationsRepository,
  ProfilesRepository,
  SessionRepository,
  VideosRepository,
} from '../repositories/types';
import { getDatabase, loadDatabase, persistDatabase } from './database';

/**
 * Implémentation locale du `DataSource`.
 *
 * Sert de « backend embarqué » : toutes les écritures sont réellement
 * persistées (AsyncStorage) et relues au démarrage suivant.
 */

const DEFAULT_PAGE_SIZE = 10;

function sortByRecency<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function requireVideo(videoId: string): Video {
  const video = getDatabase().videos.find((item) => item.id === videoId);
  if (!video) {
    throw new Error(`Vidéo introuvable : ${videoId}`);
  }
  return video;
}

function requireProfile(profileId: string): Profile {
  const profile = getDatabase().profiles.find((item) => item.id === profileId);
  if (!profile) {
    throw new Error(`Profil introuvable : ${profileId}`);
  }
  return profile;
}

const session: SessionRepository = {
  async getCurrentProfileId() {
    await loadDatabase();
    return getDatabase().currentProfileId;
  },
};

const profiles: ProfilesRepository = {
  async getById(id) {
    await loadDatabase();
    const profile = getDatabase().profiles.find((item) => item.id === id);
    return profile ? clone(profile) : null;
  },

  async getByUsername(username) {
    await loadDatabase();
    const normalized = username.trim().toLowerCase().replace(/^@/, '');
    const profile = getDatabase().profiles.find((item) => item.username.toLowerCase() === normalized);
    return profile ? clone(profile) : null;
  },

  async list() {
    await loadDatabase();
    return clone(getDatabase().profiles);
  },

  async update(id, input: UpdateProfileInput) {
    await loadDatabase();
    const db = getDatabase();
    const profile = requireProfile(id);

    if (typeof input.displayName === 'string' && input.displayName.trim().length > 0) {
      profile.displayName = input.displayName.trim().slice(0, 40);
    }
    if (typeof input.bio === 'string') {
      profile.bio = input.bio.trim().slice(0, 160);
    }
    if (typeof input.avatarUri === 'string' || input.avatarUri === null) {
      profile.avatarUri = input.avatarUri;
    }

    persistDatabase(db);
    return clone(profile);
  },

  async search(query) {
    await loadDatabase();
    const term = query.trim().toLowerCase();
    if (!term) {
      return [];
    }
    return clone(
      getDatabase().profiles.filter(
        (profile) =>
          profile.username.toLowerCase().includes(term) ||
          profile.displayName.toLowerCase().includes(term)
      )
    );
  },
};

const videos: VideosRepository = {
  async listFeed(options) {
    await loadDatabase();
    const limit = options?.limit ?? DEFAULT_PAGE_SIZE;
    const offset = Number.parseInt(options?.cursor ?? '0', 10) || 0;
    const all = sortByRecency(getDatabase().videos);
    const items = all.slice(offset, offset + limit);
    const nextOffset = offset + items.length;

    return {
      items: clone(items),
      nextCursor: nextOffset < all.length ? String(nextOffset) : null,
    } satisfies FeedPage;
  },

  async getById(id) {
    await loadDatabase();
    const video = getDatabase().videos.find((item) => item.id === id);
    return video ? clone(video) : null;
  },

  async listByAuthor(authorId) {
    await loadDatabase();
    return clone(sortByRecency(getDatabase().videos.filter((item) => item.authorId === authorId)));
  },

  async listByIds(ids) {
    await loadDatabase();
    const byId = new Map(getDatabase().videos.map((item) => [item.id, item]));
    const found = ids
      .map((id) => byId.get(id))
      .filter((item): item is Video => Boolean(item));
    return clone(found);
  },

  async search(query): Promise<SearchResults> {
    await loadDatabase();
    const db = getDatabase();
    const term = query.trim().toLowerCase();
    const tagCounts = new Map<string, number>();
    for (const video of db.videos) {
      for (const tag of video.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }
    const tags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));

    if (!term) {
      return { videos: clone(sortByRecency(db.videos)), profiles: [], tags };
    }

    const authorMatches = new Set(
      db.profiles
        .filter(
          (profile) =>
            profile.username.toLowerCase().includes(term) ||
            profile.displayName.toLowerCase().includes(term)
        )
        .map((profile) => profile.id)
    );

    const matchedVideos = sortByRecency(
      db.videos.filter(
        (video) =>
          video.description.toLowerCase().includes(term) ||
          video.soundName.toLowerCase().includes(term) ||
          video.tags.some((tag) => tag.includes(term)) ||
          authorMatches.has(video.authorId)
      )
    );

    return {
      videos: clone(matchedVideos),
      profiles: clone(db.profiles.filter((profile) => authorMatches.has(profile.id))),
      tags: tags.filter((entry) => entry.tag.includes(term)),
    };
  },

  async create(authorId, input: CreateVideoInput) {
    await loadDatabase();
    const db = getDatabase();
    requireProfile(authorId);

    const created: Video = {
      id: createId('v'),
      authorId,
      description: input.description.trim(),
      video: { kind: 'file', uri: input.videoUri },
      poster: input.posterUri ? { kind: 'file', uri: input.posterUri } : null,
      durationSec: input.durationSec ?? 0,
      soundName: input.soundName?.trim() || 'Son original',
      tags: Array.from(new Set(input.tags.map((tag) => tag.toLowerCase()))).slice(0, 10),
      stats: { likes: 0, comments: 0, shares: 0, saves: 0, views: 0 },
      createdAt: new Date().toISOString(),
      isLocalUpload: true,
    };

    db.videos.push(created);
    persistDatabase(db);
    return clone(created);
  },
};

const comments: CommentsRepository = {
  async listByVideo(videoId) {
    await loadDatabase();
    return clone(
      sortByRecency(getDatabase().comments.filter((comment) => comment.videoId === videoId))
    );
  },

  async add(videoId, authorId, text) {
    await loadDatabase();
    const db = getDatabase();
    const video = requireVideo(videoId);
    requireProfile(authorId);

    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error('Le commentaire est vide.');
    }

    const comment: Comment = {
      id: createId('c'),
      videoId,
      authorId,
      text: trimmed.slice(0, 500),
      likes: 0,
      createdAt: new Date().toISOString(),
    };

    db.comments.push(comment);
    video.stats = { ...video.stats, comments: video.stats.comments + 1 };
    persistDatabase(db);
    return clone(comment);
  },

  async remove(commentId) {
    await loadDatabase();
    const db = getDatabase();
    const index = db.comments.findIndex((comment) => comment.id === commentId);
    if (index === -1) {
      return;
    }
    const [removed] = db.comments.splice(index, 1);
    if (!removed) {
      return;
    }
    if (removed.authorId !== db.currentProfileId) {
      db.comments.splice(index, 0, removed);
      throw new Error('Vous ne pouvez supprimer que vos propres commentaires.');
    }
    const video = db.videos.find((item) => item.id === removed.videoId);
    if (video) {
      video.stats = { ...video.stats, comments: Math.max(0, video.stats.comments - 1) };
    }
    db.interactions.likedCommentIds = db.interactions.likedCommentIds.filter((id) => id !== commentId);
    persistDatabase(db);
  },

  async toggleLike(commentId) {
    await loadDatabase();
    const db = getDatabase();
    const comment = db.comments.find((item) => item.id === commentId);
    if (!comment) {
      throw new Error(`Commentaire introuvable : ${commentId}`);
    }
    const liked = db.interactions.likedCommentIds.includes(commentId);
    db.interactions.likedCommentIds = liked
      ? db.interactions.likedCommentIds.filter((id) => id !== commentId)
      : [...db.interactions.likedCommentIds, commentId];
    comment.likes = Math.max(0, comment.likes + (liked ? -1 : 1));
    persistDatabase(db);
    return { comment: clone(comment), liked: !liked };
  },
};

const interactions: InteractionsRepository = {
  async get(): Promise<UserInteractions> {
    await loadDatabase();
    return clone(getDatabase().interactions);
  },

  async toggleLike(videoId) {
    await loadDatabase();
    const db = getDatabase();
    const video = requireVideo(videoId);
    const liked = db.interactions.likedVideoIds.includes(videoId);

    db.interactions.likedVideoIds = liked
      ? db.interactions.likedVideoIds.filter((id) => id !== videoId)
      : [...db.interactions.likedVideoIds, videoId];
    video.stats = { ...video.stats, likes: Math.max(0, video.stats.likes + (liked ? -1 : 1)) };

    persistDatabase(db);
    return { video: clone(video), liked: !liked };
  },

  async toggleSave(videoId) {
    await loadDatabase();
    const db = getDatabase();
    const video = requireVideo(videoId);
    const saved = db.interactions.savedVideoIds.includes(videoId);

    db.interactions.savedVideoIds = saved
      ? db.interactions.savedVideoIds.filter((id) => id !== videoId)
      : [...db.interactions.savedVideoIds, videoId];
    video.stats = { ...video.stats, saves: Math.max(0, video.stats.saves + (saved ? -1 : 1)) };

    persistDatabase(db);
    return { video: clone(video), saved: !saved };
  },

  async toggleFollow(profileId) {
    await loadDatabase();
    const db = getDatabase();
    if (profileId === db.currentProfileId) {
      throw new Error('Vous ne pouvez pas vous abonner à votre propre profil.');
    }
    const profile = requireProfile(profileId);
    const me = requireProfile(db.currentProfileId);
    const following = db.interactions.followingIds.includes(profileId);

    db.interactions.followingIds = following
      ? db.interactions.followingIds.filter((id) => id !== profileId)
      : [...db.interactions.followingIds, profileId];

    profile.stats = {
      ...profile.stats,
      followers: Math.max(0, profile.stats.followers + (following ? -1 : 1)),
    };
    me.stats = {
      ...me.stats,
      following: Math.max(0, me.stats.following + (following ? -1 : 1)),
    };

    persistDatabase(db);
    return { profile: clone(profile), following: !following };
  },

  async registerShare(videoId) {
    await loadDatabase();
    const db = getDatabase();
    const video = requireVideo(videoId);
    video.stats = { ...video.stats, shares: video.stats.shares + 1 };
    persistDatabase(db);
    return clone(video);
  },

  async registerView(videoId) {
    await loadDatabase();
    const db = getDatabase();
    const video = db.videos.find((item) => item.id === videoId);
    if (!video) {
      return clone(requireVideo(videoId));
    }
    video.stats = { ...video.stats, views: video.stats.views + 1 };
    persistDatabase(db);
    return clone(video);
  },
};

const notifications: NotificationsRepository = {
  async list(): Promise<AppNotification[]> {
    await loadDatabase();
    return clone(sortByRecency(getDatabase().notifications));
  },

  async markAllRead() {
    await loadDatabase();
    const db = getDatabase();
    db.notifications = db.notifications.map((notification) => ({ ...notification, read: true }));
    persistDatabase(db);
    return clone(sortByRecency(db.notifications));
  },
};

export const localDataSource: DataSource = {
  name: 'local',
  session,
  profiles,
  videos,
  comments,
  interactions,
  notifications,
};

/** Utilitaire interne : couleur d'avatar pour les profils créés plus tard. */
export const avatarColor = avatarColorFor;
