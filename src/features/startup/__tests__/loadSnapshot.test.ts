import AsyncStorage from '@react-native-async-storage/async-storage';

import { __resetDatabaseForTests } from '@/data/local/database';
import { localDataSource } from '@/data/local/localDataSource';
import type { DataSource } from '@/data/repositories/types';

import { loadStartupSnapshot } from '../loadSnapshot';

/**
 * Le chargement du démarrage doit être « tout ou partie » : une section qui
 * ne répond pas ne doit jamais empêcher l'application de démarrer.
 */

describe('loadStartupSnapshot', () => {
  beforeEach(async () => {
    jest.useRealTimers();
    __resetDatabaseForTests();
    await AsyncStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('charge toutes les sections quand la source répond', async () => {
    const result = await loadStartupSnapshot(localDataSource);

    expect(result.complete).toBe(true);
    expect(result.usable).toBe(true);
    expect(result.failedSections).toEqual([]);
    expect(result.snapshot.currentProfileId).toBe('p_amina');
    expect(result.snapshot.profiles.length).toBeGreaterThan(0);
    expect(result.snapshot.videos.length).toBeGreaterThan(0);
    expect(result.snapshot.notifications.length).toBeGreaterThan(0);
  });

  it('démarre malgré une session figée, en signalant la section', async () => {
    jest.useFakeTimers();
    const dataSource: DataSource = {
      ...localDataSource,
      session: { getCurrentProfileId: () => new Promise<string>(() => undefined) },
    };

    const loading = loadStartupSnapshot(dataSource, { timeoutMs: 1000 });
    await jest.advanceTimersByTimeAsync(1000);
    const result = await loading;

    expect(result.complete).toBe(false);
    expect(result.failedSections).toEqual(['session']);
    expect(result.usable).toBe(true);
    expect(result.snapshot.currentProfileId).toBe('');
    expect(result.snapshot.videos.length).toBeGreaterThan(0);
  });

  it('signale une source entièrement défaillante sans lever d’exception', async () => {
    const failing = async () => {
      throw new Error('source indisponible');
    };
    const dataSource: DataSource = {
      ...localDataSource,
      session: { getCurrentProfileId: failing },
      profiles: { ...localDataSource.profiles, list: failing },
      videos: { ...localDataSource.videos, listFeed: failing },
      interactions: { ...localDataSource.interactions, get: failing },
      notifications: { ...localDataSource.notifications, list: failing },
    };

    const result = await loadStartupSnapshot(dataSource);

    expect(result.complete).toBe(false);
    expect(result.usable).toBe(false);
    expect(result.failedSections).toHaveLength(5);
    expect(result.snapshot.videos).toEqual([]);
    expect(result.snapshot.interactions.followingIds).toEqual([]);
  });

  it('ne partage pas l’objet des interactions entre deux chargements', async () => {
    const failing = async () => {
      throw new Error('source indisponible');
    };
    const dataSource: DataSource = {
      ...localDataSource,
      interactions: { ...localDataSource.interactions, get: failing },
    };

    const first = await loadStartupSnapshot(dataSource);
    first.snapshot.interactions.followingIds.push('p_intrus');
    const second = await loadStartupSnapshot(dataSource);

    expect(second.snapshot.interactions.followingIds).toEqual([]);
  });
});
