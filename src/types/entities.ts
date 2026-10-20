/**
 * Entités du domaine AfriVibe.
 *
 * Ces types sont volontairement indépendants de tout backend : la couche
 * `src/data` les produit, que la source soit locale (aujourd'hui) ou Supabase
 * (demain). Voir docs/ARCHITECTURE.md.
 */

/** Référence à un média vidéo/photo, sérialisable en JSON. */
export type MediaRef =
  | { kind: 'bundled'; key: string }
  | { kind: 'file'; uri: string }
  | null;

export interface ProfileStats {
  followers: number;
  following: number;
  likes: number;
}

export interface Profile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarColor: string;
  isVerified: boolean;
  stats: ProfileStats;
  createdAt: string;
}

export interface VideoStats {
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  views: number;
}

export interface Video {
  id: string;
  authorId: string;
  description: string;
  video: MediaRef;
  poster: MediaRef;
  durationSec: number;
  soundName: string;
  tags: string[];
  stats: VideoStats;
  createdAt: string;
  /** `true` si la vidéo a été créée depuis l'appareil (fichier local). */
  isLocalUpload: boolean;
}

export interface Comment {
  id: string;
  videoId: string;
  authorId: string;
  text: string;
  likes: number;
  createdAt: string;
}

export type NotificationKind = 'like' | 'comment' | 'follow' | 'mention';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  actorId: string;
  videoId: string | null;
  message: string;
  createdAt: string;
  read: boolean;
}

/** Interactions de l'utilisateur courant (persistées localement). */
export interface UserInteractions {
  likedVideoIds: string[];
  savedVideoIds: string[];
  followingIds: string[];
  likedCommentIds: string[];
}

export interface FeedPage {
  items: Video[];
  nextCursor: string | null;
}

export interface SearchResults {
  videos: Video[];
  profiles: Profile[];
  tags: { tag: string; count: number }[];
}

export interface CreateVideoInput {
  description: string;
  tags: string[];
  videoUri: string;
  posterUri?: string;
  durationSec?: number;
  soundName?: string;
}

export interface UpdateProfileInput {
  displayName?: string;
  bio?: string;
}
