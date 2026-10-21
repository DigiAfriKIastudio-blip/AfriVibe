import AsyncStorage from '@react-native-async-storage/async-storage';

import { STARTUP_TIMEOUTS } from '@/constants/startup';
import { setDataSource } from '@/data';
import { __resetDatabaseForTests } from '@/data/local/database';
import { localDataSource } from '@/data/local/localDataSource';
import type { DataSource } from '@/data/repositories/types';

import { useAppStore } from '../appStore';

/**
 * Le démarrage doit toujours se terminer : soit l'application est utilisable,
 * soit un écran d'erreur explicite s'affiche. Il ne doit jamais rester bloqué
 * sur « loading ».
 */

const hanging = () => new Promise<never>(() => undefined);

function resetStore(): void {
  useAppStore.setState({
    status: 'loading',
    error: null,
    toast: null,
    currentProfileId: '',
    profiles: {},
    videos: {},
    feedOrder: [],
    feedCursor: null,
    comments: {},
    notifications: [],
    interactions: {
      likedVideoIds: [],
      savedVideoIds: [],
      followingIds: [],
      likedCommentIds: [],
    },
  });
}

describe('appStore — robustesse du démarrage', () => {
  beforeEach(async () => {
    jest.useRealTimers();
    __resetDatabaseForTests();
    await AsyncStorage.clear();
    setDataSource(localDataSource);
    resetStore();
  });

  afterEach(() => {
    setDataSource(localDataSource);
    jest.useRealTimers();
  });

  it('termine sur un état d’erreur quand la source ne répond jamais', async () => {
    jest.useFakeTimers();
    const dataSource: DataSource = {
      ...localDataSource,
      session: { getCurrentProfileId: hanging },
      profiles: { ...localDataSource.profiles, list: hanging },
      videos: { ...localDataSource.videos, listFeed: hanging },
      interactions: { ...localDataSource.interactions, get: hanging },
      notifications: { ...localDataSource.notifications, list: hanging },
    };
    setDataSource(dataSource);

    const pending = useAppStore.getState().hydrate();
    await jest.advanceTimersByTimeAsync(STARTUP_TIMEOUTS.section);
    await pending;

    const state = useAppStore.getState();
    expect(state.status).toBe('error');
    expect(state.error).toBeTruthy();
  });

  it('démarre en mode partiel et prévient l’utilisateur quand une section est figée', async () => {
    jest.useFakeTimers();
    setDataSource({
      ...localDataSource,
      session: { getCurrentProfileId: hanging },
    });

    const pending = useAppStore.getState().hydrate();
    await jest.advanceTimersByTimeAsync(STARTUP_TIMEOUTS.section);
    await pending;

    const state = useAppStore.getState();
    expect(state.status).toBe('ready');
    expect(state.feedOrder.length).toBeGreaterThan(0);
    expect(state.videos[state.feedOrder[0] ?? '']).toBeDefined();
    expect(state.toast).toContain('Certaines données');
  });

  it('reste utilisable quand les interactions seules sont indisponibles', async () => {
    const failing = async () => {
      throw new Error('interactions indisponibles');
    };
    setDataSource({
      ...localDataSource,
      interactions: { ...localDataSource.interactions, get: failing },
    });

    await useAppStore.getState().hydrate();

    const state = useAppStore.getState();
    expect(state.status).toBe('ready');
    expect(state.interactions.followingIds).toEqual([]);
    expect(state.toast).toContain('Certaines données');
  });

  it('ne lance qu’une seule hydratation pour des appels concurrents', async () => {
    const list = jest.fn(() => localDataSource.profiles.list());
    setDataSource({ ...localDataSource, profiles: { ...localDataSource.profiles, list } });

    await Promise.all([useAppStore.getState().hydrate(), useAppStore.getState().hydrate()]);

    expect(list).toHaveBeenCalledTimes(1);
    expect(useAppStore.getState().status).toBe('ready');
  });

  it('permet de réessayer après un échec de démarrage', async () => {
    const failing = async () => {
      throw new Error('stockage muet');
    };
    setDataSource({
      ...localDataSource,
      session: { getCurrentProfileId: failing },
      profiles: { ...localDataSource.profiles, list: failing },
      videos: { ...localDataSource.videos, listFeed: failing },
      interactions: { ...localDataSource.interactions, get: failing },
      notifications: { ...localDataSource.notifications, list: failing },
    });

    await useAppStore.getState().hydrate();
    expect(useAppStore.getState().status).toBe('error');

    // Bouton « Réessayer » : la source redevient disponible.
    setDataSource(localDataSource);
    await useAppStore.getState().hydrate();

    const state = useAppStore.getState();
    expect(state.status).toBe('ready');
    expect(state.error).toBeNull();
    expect(state.feedOrder.length).toBeGreaterThan(0);
  });
});
