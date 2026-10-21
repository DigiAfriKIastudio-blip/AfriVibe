import { STARTUP_TIMEOUTS } from '@/constants/startup';
import type { DataSource } from '@/data/repositories/types';
import type {
  AppNotification,
  FeedPage,
  Profile,
  UserInteractions,
  Video,
} from '@/types/entities';
import { settleWithTimeout } from '@/utils/async';

/**
 * Chargement des données de démarrage, **résilient**.
 *
 * Les cinq sections sont chargées en parallèle, chacune avec son propre délai
 * maximal. Une section qui échoue (ou qui ne répond pas) ne bloque plus les
 * autres : l'application démarre avec les données disponibles et signale les
 * sections manquantes. Les données de démonstration / locales, elles, ne sont
 * jamais modifiées par ce module.
 */

export type StartupSection = 'session' | 'profiles' | 'feed' | 'interactions' | 'notifications';

export interface StartupSnapshot {
  currentProfileId: string;
  profiles: Profile[];
  videos: Video[];
  nextCursor: string | null;
  interactions: UserInteractions;
  notifications: AppNotification[];
}

export interface StartupSnapshotResult {
  snapshot: StartupSnapshot;
  /** Sections qui ont échoué ou dépassé leur délai maximal. */
  failedSections: StartupSection[];
  /** `true` si toutes les sections ont été chargées. */
  complete: boolean;
  /**
   * `true` si les données reçues permettent d'afficher l'application
   * (au moins le fil ou les profils). Sinon, l'écran d'erreur de démarrage
   * est plus utile qu'une application vide.
   */
  usable: boolean;
}

function emptyInteractions(): UserInteractions {
  return { likedVideoIds: [], savedVideoIds: [], followingIds: [], likedCommentIds: [] };
}

export interface LoadStartupSnapshotOptions {
  /** Délai maximal par section (ms). */
  timeoutMs?: number;
}

export async function loadStartupSnapshot(
  dataSource: DataSource,
  options: LoadStartupSnapshotOptions = {}
): Promise<StartupSnapshotResult> {
  const timeoutMs = options.timeoutMs ?? STARTUP_TIMEOUTS.section;

  const [session, profiles, feed, interactions, notifications] = await Promise.all([
    settleWithTimeout(
      () => dataSource.session.getCurrentProfileId(),
      timeoutMs,
      '',
      'Session locale'
    ),
    settleWithTimeout(() => dataSource.profiles.list(), timeoutMs, [] as Profile[], 'Profils'),
    settleWithTimeout(
      () => dataSource.videos.listFeed(),
      timeoutMs,
      null as FeedPage | null,
      'Fil vidéo'
    ),
    settleWithTimeout(
      () => dataSource.interactions.get(),
      timeoutMs,
      emptyInteractions(),
      'Interactions'
    ),
    settleWithTimeout(
      () => dataSource.notifications.list(),
      timeoutMs,
      [] as AppNotification[],
      'Notifications'
    ),
  ]);

  const failedSections: StartupSection[] = [];
  if (!session.ok) {
    failedSections.push('session');
  }
  if (!profiles.ok) {
    failedSections.push('profiles');
  }
  if (!feed.ok) {
    failedSections.push('feed');
  }
  if (!interactions.ok) {
    failedSections.push('interactions');
  }
  if (!notifications.ok) {
    failedSections.push('notifications');
  }

  const feedPage = feed.value;

  const snapshot: StartupSnapshot = {
    currentProfileId: session.value,
    profiles: profiles.value,
    videos: feedPage?.items ?? [],
    nextCursor: feedPage?.nextCursor ?? null,
    interactions: interactions.value,
    notifications: notifications.value,
  };

  if (failedSections.length > 0) {
    console.warn(
      `[AfriVibe] Démarrage partiel : sections indisponibles → ${failedSections.join(', ')}`
    );
  }

  return {
    snapshot,
    failedSections,
    complete: failedSections.length === 0,
    usable: snapshot.profiles.length > 0 || snapshot.videos.length > 0,
  };
}
