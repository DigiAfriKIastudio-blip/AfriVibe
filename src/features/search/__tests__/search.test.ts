import type { Profile, Video } from '@/types/entities';
import { aggregateTags, matchesProfile, searchCatalog, suggestProfiles } from '../search';

const profile = (id: string, username: string, displayName: string, followers = 0): Profile => ({
  id,
  username,
  displayName,
  bio: '',
  avatarColor: '#fff',
  isVerified: false,
  stats: { followers, following: 0, likes: 0 },
  createdAt: '2026-01-01T00:00:00.000Z',
});

const video = (id: string, authorId: string, description: string, tags: string[]): Video => ({
  id,
  authorId,
  description,
  video: null,
  poster: null,
  durationSec: 5,
  soundName: 'Son original',
  tags,
  stats: { likes: 0, comments: 0, shares: 0, saves: 0, views: 0 },
  createdAt: '2026-01-01T00:00:00.000Z',
  isLocalUpload: false,
});

const profiles = [
  profile('p1', 'amina.dkr', 'Amina Diallo', 120),
  profile('p2', 'koffi.abidjan', 'Koffi Mensah', 900),
];

const videos = [
  video('v1', 'p1', 'Lever de soleil à Dakar', ['dakar', 'sunrise']),
  video('v2', 'p2', 'Session amapiano', ['amapiano', 'dance']),
];

describe('matchesProfile', () => {
  it('ignore la casse et le @ initial', () => {
    expect(matchesProfile(profiles[0]!, '@AMINA')).toBe(true);
    expect(matchesProfile(profiles[0]!, 'diallo')).toBe(true);
    expect(matchesProfile(profiles[0]!, 'zola')).toBe(false);
  });

  it('ne matche pas une recherche vide', () => {
    expect(matchesProfile(profiles[0]!, '   ')).toBe(false);
  });
});

describe('searchCatalog', () => {
  it('trouve par hashtag', () => {
    const result = searchCatalog(profiles, videos, 'amapiano');
    expect(result.videos.map((item) => item.id)).toEqual(['v2']);
    expect(result.profiles).toEqual([]);
  });

  it('trouve les vidéos et le profil de l’auteur', () => {
    const result = searchCatalog(profiles, videos, 'koffi');
    expect(result.profiles.map((item) => item.id)).toEqual(['p2']);
    expect(result.videos.map((item) => item.id)).toEqual(['v2']);
  });

  it('retourne un résultat vide sans terme', () => {
    expect(searchCatalog(profiles, videos, '')).toEqual({ videos: [], profiles: [], tags: [] });
  });
});

describe('aggregateTags', () => {
  it('compte et trie les hashtags', () => {
    const tags = aggregateTags([
      ...videos,
      video('v3', 'p1', 'Encore Dakar', ['dakar']),
    ]);
    expect(tags[0]).toEqual({ tag: 'dakar', count: 2 });
    expect(tags.map((entry) => entry.tag)).toContain('amapiano');
  });
});

describe('suggestProfiles', () => {
  it('exclut le profil courant et les comptes déjà suivis', () => {
    const suggestions = suggestProfiles(profiles, ['p2'], 'p1');
    expect(suggestions).toEqual([]);

    const all = suggestProfiles(profiles, [], 'p1');
    expect(all.map((item) => item.id)).toEqual(['p2']);
  });

  it('trie par nombre d’abonnés décroissant', () => {
    const many = [
      profile('a', 'a', 'A', 10),
      profile('b', 'b', 'B', 300),
      profile('c', 'c', 'C', 100),
    ];
    expect(suggestProfiles(many, [], 'x').map((item) => item.id)).toEqual(['b', 'c', 'a']);
  });
});
