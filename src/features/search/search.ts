import type { Profile, Video } from '@/types/entities';

/** Recherche côté client (fonctions pures, testées unitairement). */

export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/^@/, '').replace(/^#/, '');
}

export function matchesProfile(profile: Profile, term: string): boolean {
  const normalized = normalizeQuery(term);
  if (!normalized) {
    return false;
  }
  return (
    profile.username.toLowerCase().includes(normalized) ||
    profile.displayName.toLowerCase().includes(normalized)
  );
}

export function matchesVideo(video: Video, term: string, author?: Profile): boolean {
  const normalized = normalizeQuery(term);
  if (!normalized) {
    return false;
  }
  return (
    video.description.toLowerCase().includes(normalized) ||
    video.soundName.toLowerCase().includes(normalized) ||
    video.tags.some((tag) => tag.includes(normalized)) ||
    (author ? matchesProfile(author, normalized) : false)
  );
}

export interface SearchOutcome {
  videos: Video[];
  profiles: Profile[];
  tags: { tag: string; count: number }[];
}

export function searchCatalog(
  profiles: Profile[],
  videos: Video[],
  term: string
): SearchOutcome {
  const normalized = normalizeQuery(term);
  if (!normalized) {
    return { videos: [], profiles: [], tags: [] };
  }

  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));

  const matchedProfiles = profiles.filter((profile) => matchesProfile(profile, normalized));
  const matchedVideos = videos.filter((video) =>
    matchesVideo(video, normalized, profilesById.get(video.authorId))
  );
  const tags = aggregateTags(videos).filter((entry) => entry.tag.includes(normalized));

  return { videos: matchedVideos, profiles: matchedProfiles, tags };
}

export function aggregateTags(videos: Video[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const video of videos) {
    for (const tag of video.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** Suggestions d'abonnements : profils non suivis, triés par popularité. */
export function suggestProfiles(
  profiles: Profile[],
  followingIds: string[],
  currentProfileId: string,
  limit = 5
): Profile[] {
  const following = new Set(followingIds);
  return profiles
    .filter((profile) => profile.id !== currentProfileId && !following.has(profile.id))
    .sort((a, b) => b.stats.followers - a.stats.followers)
    .slice(0, limit);
}
