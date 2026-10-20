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

/**
 * Contrats d'accès aux données.
 *
 * L'application ne dépend QUE de ces interfaces. La source locale
 * (`src/data/local`) les implémente aujourd'hui ; un adaptateur Supabase
 * (`src/data/supabase`) pourra les implémenter sans toucher à l'UI.
 */

export interface SessionRepository {
  /** Identifiant du profil actuellement connecté (session locale). */
  getCurrentProfileId(): Promise<string>;
}

export interface ProfilesRepository {
  getById(id: string): Promise<Profile | null>;
  getByUsername(username: string): Promise<Profile | null>;
  list(): Promise<Profile[]>;
  update(id: string, input: UpdateProfileInput): Promise<Profile>;
  search(query: string): Promise<Profile[]>;
}

export interface VideosRepository {
  listFeed(options?: { cursor?: string | null; limit?: number }): Promise<FeedPage>;
  getById(id: string): Promise<Video | null>;
  listByAuthor(authorId: string): Promise<Video[]>;
  listByIds(ids: string[]): Promise<Video[]>;
  search(query: string): Promise<SearchResults>;
  create(authorId: string, input: CreateVideoInput): Promise<Video>;
}

export interface CommentsRepository {
  listByVideo(videoId: string): Promise<Comment[]>;
  add(videoId: string, authorId: string, text: string): Promise<Comment>;
  remove(commentId: string): Promise<void>;
  toggleLike(commentId: string): Promise<{ comment: Comment; liked: boolean }>;
}

export interface InteractionsRepository {
  /** État complet des interactions de l'utilisateur courant. */
  get(): Promise<UserInteractions>;
  toggleLike(videoId: string): Promise<{ video: Video; liked: boolean }>;
  toggleSave(videoId: string): Promise<{ video: Video; saved: boolean }>;
  toggleFollow(profileId: string): Promise<{ profile: Profile; following: boolean }>;
  registerShare(videoId: string): Promise<Video>;
  registerView(videoId: string): Promise<Video>;
}

export interface NotificationsRepository {
  list(): Promise<AppNotification[]>;
  markAllRead(): Promise<AppNotification[]>;
}

/** Point d'entrée unique de la couche de données. */
export interface DataSource {
  readonly name: 'local' | 'supabase';
  session: SessionRepository;
  profiles: ProfilesRepository;
  videos: VideosRepository;
  comments: CommentsRepository;
  interactions: InteractionsRepository;
  notifications: NotificationsRepository;
}

/** Charge utile renvoyée au démarrage de l'application. */
export interface BootstrapPayload {
  currentProfileId: string;
  currentProfile: Profile;
  feed: Video[];
  profiles: Profile[];
  interactions: UserInteractions;
  notifications: AppNotification[];
}
