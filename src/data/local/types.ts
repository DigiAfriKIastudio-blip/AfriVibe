import type {
  AppNotification,
  Comment,
  Profile,
  UserInteractions,
  Video,
} from '@/types/entities';

/** Schéma du « backend local » persisté dans AsyncStorage. */
export interface LocalDatabase {
  /** Version du schéma, pour migrer/réinitialiser proprement. */
  version: number;
  currentProfileId: string;
  profiles: Profile[];
  videos: Video[];
  comments: Comment[];
  interactions: UserInteractions;
  notifications: AppNotification[];
}
