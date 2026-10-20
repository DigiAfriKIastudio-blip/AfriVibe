import AsyncStorage from '@react-native-async-storage/async-storage';

import { createSeedDatabase, SEED_VERSION } from './seed';
import type { LocalDatabase } from './types';

/**
 * Persistance du « backend local » dans AsyncStorage.
 *
 * - Au premier lancement (ou si le schéma change), la base est initialisée
 *   avec les données de démonstration.
 * - Chaque mutation est réécrite de façon groupée pour éviter les écritures
 *   en rafale (ex. double-tap sur « j'aime »).
 */

export const STORAGE_KEY = 'afrivibe:db:v1';

const WRITE_DEBOUNCE_MS = 200;

let cache: LocalDatabase | null = null;
let writeTimer: ReturnType<typeof setTimeout> | null = null;
let pendingWrite: Promise<void> = Promise.resolve();

function isLocalDatabase(value: unknown): value is LocalDatabase {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<LocalDatabase>;
  return (
    candidate.version === SEED_VERSION &&
    typeof candidate.currentProfileId === 'string' &&
    Array.isArray(candidate.profiles) &&
    Array.isArray(candidate.videos) &&
    Array.isArray(candidate.comments) &&
    Array.isArray(candidate.notifications) &&
    typeof candidate.interactions === 'object' &&
    candidate.interactions !== null
  );
}

/** Charge la base (mémoire → AsyncStorage → données de démo). */
export async function loadDatabase(): Promise<LocalDatabase> {
  if (cache) {
    return cache;
  }

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isLocalDatabase(parsed)) {
        cache = parsed;
        return cache;
      }
      console.warn('[AfriVibe] Base locale incompatible : réinitialisation.');
    }
  } catch (error) {
    console.warn('[AfriVibe] Lecture de la base locale impossible :', error);
  }

  cache = createSeedDatabase();
  await writeNow(cache);
  return cache;
}

/** Accès synchrone à la base déjà chargée (usage interne). */
export function getDatabase(): LocalDatabase {
  if (!cache) {
    throw new Error("La base locale n'est pas encore chargée (appelez loadDatabase()).");
  }
  return cache;
}

async function writeNow(db: LocalDatabase): Promise<void> {
  const serialized = JSON.stringify(db);
  pendingWrite = pendingWrite
    .then(() => AsyncStorage.setItem(STORAGE_KEY, serialized))
    .catch((error: unknown) => {
      console.warn('[AfriVibe] Écriture de la base locale impossible :', error);
    });
  return pendingWrite;
}

/** Écriture différée (regroupe les mutations rapprochées). */
export function persistDatabase(db: LocalDatabase): void {
  cache = db;
  if (writeTimer) {
    clearTimeout(writeTimer);
  }
  writeTimer = setTimeout(() => {
    writeTimer = null;
    void writeNow(db);
  }, WRITE_DEBOUNCE_MS);
}

/** Force l'écriture immédiate (utilisé à la fermeture / dans les tests). */
export async function flushDatabase(): Promise<void> {
  if (writeTimer) {
    clearTimeout(writeTimer);
    writeTimer = null;
    await writeNow(getDatabase());
  }
  await pendingWrite;
}

/** Réinitialise complètement la base locale (profil de démo). */
export async function resetDatabase(): Promise<LocalDatabase> {
  cache = createSeedDatabase();
  await writeNow(cache);
  return cache;
}

/** Réservé aux tests : vide le cache mémoire et annule les écritures. */
export function __resetDatabaseForTests(): void {
  cache = null;
  if (writeTimer) {
    clearTimeout(writeTimer);
    writeTimer = null;
  }
}
