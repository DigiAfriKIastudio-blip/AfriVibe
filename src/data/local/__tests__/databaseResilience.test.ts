import AsyncStorage from '@react-native-async-storage/async-storage';

import { STARTUP_TIMEOUTS } from '@/constants/startup';

import {
  __resetDatabaseForTests,
  flushDatabase,
  isLocalStorageDegraded,
  loadDatabase,
  persistDatabase,
  resetDatabase,
  STORAGE_KEY,
} from '../database';
import { localDataSource } from '../localDataSource';

/**
 * Robustesse du stockage local au démarrage.
 *
 * Ces tests simulent un AsyncStorage muet (promesse jamais résolue), lent, ou
 * en erreur — les cas qui laissaient auparavant l'application bloquée sur le
 * splash. Le contrat vérifié : `loadDatabase()` se termine **toujours**, et
 * une panne de lecture ne doit jamais écraser les données déjà stockées.
 *
 * Note : `jest.spyOn` ne remplace pas les méthodes déjà transformées en
 * `jest.fn()` par la doublure officielle d'AsyncStorage. On sauvegarde donc
 * explicitement les implémentations d'origine pour les restaurer.
 */

interface StorageLike {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
}

const storage = AsyncStorage as unknown as StorageLike;
const realGetItem = storage.getItem;
const realSetItem = storage.setItem;

const never = <T,>() => new Promise<T>(() => undefined);

describe('database — robustesse au démarrage', () => {
  beforeEach(async () => {
    jest.useRealTimers();
    __resetDatabaseForTests();
    await AsyncStorage.clear();
  });

  afterEach(() => {
    storage.getItem = realGetItem;
    storage.setItem = realSetItem;
    jest.useRealTimers();
  });

  it('se termine sur les données de démo si la lecture ne répond jamais', async () => {
    jest.useFakeTimers();
    storage.getItem = jest.fn(() => never<string | null>());
    storage.setItem = jest.fn(() => Promise.resolve());

    const loading = loadDatabase();
    await jest.advanceTimersByTimeAsync(STARTUP_TIMEOUTS.databaseRead);
    const db = await loading;

    expect(storage.getItem).toHaveBeenCalledTimes(1);
    expect(db.profiles.length).toBeGreaterThan(0);
    expect(db.videos.length).toBeGreaterThan(0);
    expect(isLocalStorageDegraded()).toBe(true);
    // Le stockage n'est pas réécrit : les données existantes restent intactes.
    expect(storage.setItem).not.toHaveBeenCalled();

    persistDatabase(db);
    await jest.advanceTimersByTimeAsync(STARTUP_TIMEOUTS.databaseWrite + 500);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('préserve les données stockées quand une lecture ultérieure échoue', async () => {
    // 1. Une base valide est en place (favoris, abonnements, commentaires…).
    await resetDatabase();
    await flushDatabase();
    const storedBefore = await storage.getItem(STORAGE_KEY);
    expect(storedBefore).toBeTruthy();

    // 2. Le stockage devient muet au démarrage suivant.
    jest.useFakeTimers();
    __resetDatabaseForTests();
    storage.getItem = jest.fn(() => never<string | null>());
    storage.setItem = jest.fn(() => Promise.resolve());

    const loading = loadDatabase();
    await jest.advanceTimersByTimeAsync(STARTUP_TIMEOUTS.databaseRead);
    await loading;

    expect(storage.setItem).not.toHaveBeenCalled();
    // Lu avec l'implémentation d'origine : la base est toujours là.
    expect(await realGetItem(STORAGE_KEY)).toBe(storedBefore);
  });

  it('déduplique les lectures concurrentes du démarrage (single-flight)', async () => {
    storage.getItem = jest.fn(() => Promise.resolve(null));

    const [first, second] = await Promise.all([loadDatabase(), loadDatabase()]);

    expect(storage.getItem).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
  });

  it('relit une base existante sans la réinitialiser', async () => {
    await resetDatabase();
    await localDataSource.interactions.toggleSave('v_4');
    await flushDatabase();

    __resetDatabaseForTests();
    const reloaded = await loadDatabase();

    expect(reloaded.interactions.savedVideoIds).toContain('v_4');
    expect(isLocalStorageDegraded()).toBe(false);
  });

  it('ne bloque pas le démarrage si l’écriture initiale ne répond pas', async () => {
    jest.useFakeTimers();
    storage.getItem = jest.fn(() => Promise.resolve(null));
    storage.setItem = jest.fn(() => never<void>());

    const loading = loadDatabase();
    await jest.advanceTimersByTimeAsync(STARTUP_TIMEOUTS.databaseWrite);
    const db = await loading;

    expect(db.videos.length).toBeGreaterThan(0);
  });

  it('conserve publications, commentaires, favoris et abonnements après rechargement', async () => {
    await resetDatabase();
    __resetDatabaseForTests();
    await loadDatabase();

    const created = await localDataSource.videos.create('p_amina', {
      description: 'Vidéo de démonstration publiée',
      tags: ['demo'],
      videoUri: 'file:///documents/videos/demo.mp4',
      durationSec: 5,
    });
    await localDataSource.comments.add(created.id, 'p_amina', 'Mon commentaire');
    await localDataSource.interactions.toggleSave(created.id);
    await localDataSource.interactions.toggleLike('v_2');
    await localDataSource.interactions.registerShare('v_2');
    await localDataSource.interactions.toggleFollow('p_sanaa');
    await flushDatabase();

    // Redémarrage : le cache mémoire est vidé, la base est relue.
    __resetDatabaseForTests();
    const reloaded = await loadDatabase();

    expect(reloaded.videos.map((video) => video.id)).toContain(created.id);
    expect(reloaded.comments.some((comment) => comment.videoId === created.id)).toBe(true);
    expect(reloaded.interactions.savedVideoIds).toContain(created.id);
    expect(reloaded.interactions.likedVideoIds).toContain('v_2');
    expect(reloaded.interactions.followingIds).toContain('p_sanaa');
    expect(reloaded.videos.find((video) => video.id === 'v_2')?.stats.shares).toBeGreaterThan(0);
  });
});
