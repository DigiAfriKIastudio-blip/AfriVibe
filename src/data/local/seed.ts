import { avatarColorFor } from '@/constants/theme';
import type { AppNotification, Comment, Profile, Video } from '@/types/entities';
import type { LocalDatabase } from './types';

/**
 * Données de démonstration.
 *
 * Elles sont injectées au premier lancement, puis réellement modifiables :
 * likes, favoris, abonnements, commentaires et publications sont persistés
 * dans AsyncStorage. Aucune connexion réseau n'est nécessaire.
 */

export const SEED_VERSION = 1;

const HOUR = 60 * 60 * 1000;
const now = () => Date.now();
const hoursAgo = (hours: number) => new Date(now() - hours * HOUR).toISOString();

interface SeedProfileInput {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  followers: number;
  following: number;
  likes: number;
  isVerified?: boolean;
}

const profileSeeds: SeedProfileInput[] = [
  {
    id: 'p_amina',
    username: 'amina.dkr',
    displayName: 'Amina Diallo',
    bio: 'Dakar 🇸🇳 · danse & créa vidéo · je filme la ville au lever du soleil.',
    followers: 1240,
    following: 2,
    likes: 18600,
    isVerified: true,
  },
  {
    id: 'p_koffi',
    username: 'koffi.abidjan',
    displayName: 'Koffi Mensah',
    bio: 'Abidjan 🇨🇮 · afrobeats & montage rapide. Nouveau son chaque vendredi.',
    followers: 48200,
    following: 180,
    likes: 512000,
    isVerified: true,
  },
  {
    id: 'p_zola',
    username: 'zola.cpt',
    displayName: 'Zola Nkosi',
    bio: 'Le Cap 🇿🇦 · amapiano, skate et couchers de soleil.',
    followers: 8600,
    following: 240,
    likes: 74500,
  },
  {
    id: 'p_fatou',
    username: 'fatou.bamako',
    displayName: 'Fatou Traoré',
    bio: 'Bamako 🇲🇱 · cuisine de rue & portraits du quartier.',
    followers: 21300,
    following: 310,
    likes: 198000,
  },
  {
    id: 'p_yannick',
    username: 'yannick.lbv',
    displayName: 'Yannick Obame',
    bio: 'Libreville 🇬🇦 · beatmaker le jour, vidéaste la nuit.',
    followers: 5400,
    following: 120,
    likes: 32100,
  },
  {
    id: 'p_sanaa',
    username: 'sanaa.casa',
    displayName: 'Sanaa Bennani',
    bio: 'Casablanca 🇲🇦 · mode, tissus et couleurs.',
    followers: 33900,
    following: 90,
    likes: 287000,
    isVerified: true,
  },
  {
    id: 'p_ibrahim',
    username: 'dj.ibrahim',
    displayName: 'Ibrahim Sow',
    bio: 'DJ · Mbour 🇸🇳 · sabar + électronique. Sets tous les samedis.',
    followers: 15700,
    following: 260,
    likes: 96400,
  },
  {
    id: 'p_nia',
    username: 'nia.nbo',
    displayName: 'Nia Wanjiku',
    bio: 'Nairobi 🇰🇪 · street dance & storytelling.',
    followers: 9100,
    following: 145,
    likes: 61200,
  },
];

const profiles: Profile[] = profileSeeds.map((seed) => ({
  id: seed.id,
  username: seed.username,
  displayName: seed.displayName,
  bio: seed.bio,
  avatarColor: avatarColorFor(seed.username),
  isVerified: seed.isVerified ?? false,
  stats: {
    followers: seed.followers,
    following: seed.following,
    likes: seed.likes,
  },
  createdAt: hoursAgo(24 * 90),
}));

interface SeedVideoInput {
  id: string;
  authorId: string;
  mediaKey: string;
  description: string;
  soundName: string;
  tags: string[];
  hours: number;
  stats: { likes: number; comments: number; shares: number; saves: number; views: number };
}

const videoSeeds: SeedVideoInput[] = [
  {
    id: 'v_1',
    authorId: 'p_koffi',
    mediaKey: 'vibe-1',
    description: "Nouveau son, première écoute à Abidjan 🌊 dis-moi ce que tu ressens #afrobeats #abidjan",
    soundName: 'Son original — koffi.abidjan',
    tags: ['afrobeats', 'abidjan', 'nouveauson'],
    hours: 3,
    stats: { likes: 12840, comments: 342, shares: 890, saves: 1200, views: 184300 },
  },
  {
    id: 'v_2',
    authorId: 'p_amina',
    mediaKey: 'vibe-2',
    description: 'Lever de soleil sur la Corniche. 6 h du matin, personne, juste le bruit des vagues 🌅 #dakar #sunrise',
    soundName: 'Son original — amina.dkr',
    tags: ['dakar', 'sunrise', 'corniche'],
    hours: 7,
    stats: { likes: 4320, comments: 128, shares: 210, saves: 640, views: 52100 },
  },
  {
    id: 'v_3',
    authorId: 'p_zola',
    mediaKey: 'vibe-3',
    description: 'Session amapiano au coucher du soleil au Cap 🎧🔥 #amapiano #capetown',
    soundName: 'Amapiano Sunset — Zola',
    tags: ['amapiano', 'capetown', 'dance'],
    hours: 11,
    stats: { likes: 9310, comments: 256, shares: 540, saves: 980, views: 142800 },
  },
  {
    id: 'v_4',
    authorId: 'p_fatou',
    mediaKey: 'vibe-4',
    description: "Le quartier s'éveille à Bamako. Couleurs, bruits, marchés ☀️ #bamako #streetphotography",
    soundName: 'Son original — fatou.bamako',
    tags: ['bamako', 'street', 'couleurs'],
    hours: 20,
    stats: { likes: 21840, comments: 512, shares: 1320, saves: 2450, views: 402100 },
  },
  {
    id: 'v_5',
    authorId: 'p_ibrahim',
    mediaKey: 'vibe-5',
    description: 'Sabar + synthé, test en studio à Mbour. Ça sort bientôt 🥁 #sabar #mbalax #electronic',
    soundName: 'Sabar Machine — DJ Ibrahim',
    tags: ['sabar', 'mbalax', 'mbour', 'electronic'],
    hours: 30,
    stats: { likes: 6890, comments: 174, shares: 320, saves: 710, views: 98400 },
  },
  {
    id: 'v_6',
    authorId: 'p_nia',
    mediaKey: 'vibe-6',
    description: 'Répétition de la troupe à Nairobi. Le mouvement vient de loin 🌍 #nairobidance #streetdance',
    soundName: 'Son original — nia.nbo',
    tags: ['nairobi', 'dance', 'streetdance'],
    hours: 44,
    stats: { likes: 15120, comments: 388, shares: 760, saves: 1530, views: 233700 },
  },
];

const videos: Video[] = videoSeeds.map((seed) => ({
  id: seed.id,
  authorId: seed.authorId,
  description: seed.description,
  video: { kind: 'bundled', key: seed.mediaKey },
  poster: { kind: 'bundled', key: seed.mediaKey },
  durationSec: 5,
  soundName: seed.soundName,
  tags: seed.tags,
  stats: seed.stats,
  createdAt: hoursAgo(seed.hours),
  isLocalUpload: false,
}));

interface SeedCommentInput {
  id: string;
  videoId: string;
  authorId: string;
  text: string;
  likes: number;
  hours: number;
}

const commentSeeds: SeedCommentInput[] = [
  { id: 'c_1', videoId: 'v_1', authorId: 'p_amina', text: 'Ce son est une folie 🔥🔥', likes: 84, hours: 2 },
  { id: 'c_2', videoId: 'v_1', authorId: 'p_nia', text: "Il faut qu'on danse dessus à Nairobi !", likes: 31, hours: 2 },
  { id: 'c_3', videoId: 'v_2', authorId: 'p_fatou', text: 'Ces couleurs 😍 Dakar me manque', likes: 57, hours: 5 },
  { id: 'c_4', videoId: 'v_3', authorId: 'p_koffi', text: 'La transition à 3 s est propre 👏', likes: 22, hours: 9 },
  { id: 'c_5', videoId: 'v_4', authorId: 'p_sanaa', text: 'Le marché aux tissus, j’adore', likes: 64, hours: 16 },
  { id: 'c_6', videoId: 'v_4', authorId: 'p_amina', text: 'On veut un making-of !', likes: 18, hours: 15 },
  { id: 'c_7', videoId: 'v_5', authorId: 'p_yannick', text: 'Le sabar avec le synthé, gros délire 🥁', likes: 40, hours: 26 },
  { id: 'c_8', videoId: 'v_6', authorId: 'p_zola', text: 'Respect la troupe 🙌', likes: 12, hours: 40 },
];

const comments: Comment[] = commentSeeds.map((seed) => ({
  id: seed.id,
  videoId: seed.videoId,
  authorId: seed.authorId,
  text: seed.text,
  likes: seed.likes,
  createdAt: hoursAgo(seed.hours),
}));

const notifications: AppNotification[] = [
  {
    id: 'n_1',
    kind: 'like',
    actorId: 'p_koffi',
    videoId: 'v_2',
    message: 'a aimé votre vidéo « Lever de soleil sur la Corniche »',
    createdAt: hoursAgo(1),
    read: false,
  },
  {
    id: 'n_2',
    kind: 'comment',
    actorId: 'p_fatou',
    videoId: 'v_2',
    message: 'a commenté : « Ces couleurs 😍 Dakar me manque »',
    createdAt: hoursAgo(5),
    read: false,
  },
  {
    id: 'n_3',
    kind: 'follow',
    actorId: 'p_sanaa',
    videoId: null,
    message: "s'est abonné à votre profil",
    createdAt: hoursAgo(8),
    read: false,
  },
  {
    id: 'n_4',
    kind: 'mention',
    actorId: 'p_nia',
    videoId: 'v_6',
    message: 'vous a mentionné dans un commentaire',
    createdAt: hoursAgo(28),
    read: true,
  },
];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Construit une base locale neuve (démo).
 *
 * Les tableaux du module sont **clonés** : sans cela, une publication ou un
 * « j'aime » modifierait les données de référence en mémoire, et une
 * réinitialisation rendrait une base déjà polluée par la session courante.
 */
export function createSeedDatabase(): LocalDatabase {
  return {
    version: SEED_VERSION,
    currentProfileId: 'p_amina',
    profiles: clone(profiles),
    videos: clone(videos),
    comments: clone(comments),
    interactions: {
      likedVideoIds: ['v_3', 'v_5'],
      savedVideoIds: ['v_1'],
      followingIds: ['p_koffi', 'p_zola'],
      likedCommentIds: ['c_1'],
    },
    notifications: clone(notifications),
  };
}

export const CURRENT_PROFILE_ID = 'p_amina';
