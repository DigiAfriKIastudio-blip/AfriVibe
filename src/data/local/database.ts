import AsyncStorage from '@react-native-async-storage/async-storage';

import { STARTUP_TIMEOUTS } from '@/constants/startup';
import { isTimeoutError, withTimeout } from '@/utils/async';

import { createSeedDatabase, SEED_VERSION } from './seed';
import type { LocalDatabase } from './types';

/**
 * Persistance du « backend local » dans AsyncStorage.
 *
 * - Au premier lancement (ou si le schéma change), la base est initialisée
 *   avec les données de démonstration.
 * - Chaque mutation est réécrite de façon groupée pour éviter les écritures
 *   en rafale (ex. double-tap sur « j'aime »).
 *
 * Robustesse au démarrage :
 * - la lecture est bornée dans le temps (`STARTUP_TIMEOUTS.databaseRead`) :
 *   un stockage natif muet ne bloque plus l'application ;
 * - le chargement est « single-flight » : les cinq sections chargées en
 *   parallèle au démarrage ne déclenchent qu'une seule lecture ;
 * - si la lecture échoue, on bascule sur les données de démo **en mémoire**
 *   sans jamais réécrire le stockage : les données locales existantes
 *   (commentaires, favoris, abonnements, publications) sont préservées.
 */

export const STORAGE_KEY = 'afrivibe:db:v1';

const WRITE_DEBOUNCE_MS = 200;

let cache: LocalDatabase | null = null;
let writeTimer: ReturnType<typeof setTimeout> | null = null;
let pendingWrite: Promise<void> = Promise.resolve();
let pendingLoad: Promise<LocalDatabase> | null = null;

/**
 * `true` quand le stockage n'a pas pu être lu dans le délai imparti. Dans ce
 * mode, les écritures sont désactivées pour ne pas écraser des données
 * locales qui sont peut-être intactes mais simplement lentes à lire.
 */
let storageDegraded = false;

/** Indique si la session courante tourne sur un stockage non fiable. */
export function isLocalStorageDegraded(): boolean {
  return storageDegraded;
}

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

/**
 * Charge la base (mémoire → AsyncStorage → données de démo).
 *
 * Ne rejette jamais : en cas d'échec du stockage, une base de démonstration en
 * mémoire est renvoyée afin que l'application puisse démarrer.
 */
export function loadDatabase(): Promise<LocalDatabase> {
  if (cache) {
    return Promise.resolve(cache);
  }
  if (!pendingLoad) {
    pendingLoad = loadDatabaseOnce().finally(() => {
      pendingLoad = null;
    });
  }
  return pendingLoad;
}

async function loadDatabaseOnce(): Promise<LocalDatabase> {
  let raw: string | null = null;
  let readFailed = false;

  try {
    raw = await withTimeout(
      AsyncStorage.getItem(STORAGE_KEY),
      STARTUP_TIMEOUTS.databaseRead,
      'Lecture de la base locale'
    );
  } catch (error) {
    readFailed = true;
    storageDegraded = true;
    console.warn(
      `[AfriVibe] Lecture de la base locale impossible (${isTimeoutError(error) ? 'délai dépassé' : 'erreur'}) :`,
      error
    );
  }

  if (typeof raw === 'string' && raw.length > 0) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isLocalDatabase(parsed)) {
        cache = parsed;
        return cache;
      }
      console.warn('[AfriVibe] Base locale incompatible : réinitialisation.');
    } catch (error) {
      console.warn('[AfriVibe] Base locale illisible : réinitialisation.', error);
    }
  }

  const seed = createSeedDatabase();
  cache = seed;

  if (!readFailed) {
    // Premier lancement (ou base incompatible) : on initialise le stockage.
    await writeNow(seed);
  } else {
    console.warn(
      '[AfriVibe] Stockage indisponible : démarrage sur les données de démo, écritures suspendues ' +
        'pour préserver les données locales.'
    );
  }

  return seed;
}

/** Accès synchrone à la base déjà chargée (usage interne). */
export function getDatabase(): LocalDatabase {
  if (!cache) {
    throw new Error("La base locale n'est pas encore chargée (appelez loadDatabase()).");
  }
  return cache;
}

async function writeNow(db: LocalDatabase): Promise<void> {
  if (storageDegraded) {
    return;
  }

  let serialized: string;
  try {
    serialized = JSON.stringify(db);
  } catch (error) {
    console.warn('[AfriVibe] Sérialisation de la base locale impossible :', error);
    return;
  }

  pendingWrite = pendingWrite
    .then(() =>
      withTimeout(
        AsyncStorage.setItem(STORAGE_KEY, serialized),
        STARTUP_TIMEOUTS.databaseWrite,
        'Écriture de la base locale'
      )
    )
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
  // Action explicite de l'utilisateur : on retente l'écriture même si la
  // session était en mode dégradé.
  storageDegraded = false;
  await writeNow(cache);
  return cache;
}

/** Réservé aux tests : vide le cache mémoire et annule les écritures. */
export function __resetDatabaseForTests(): void {
  cache = null;
  pendingLoad = null;
  storageDegraded = false;
  if (writeTimer) {
    clearTimeout(writeTimer);
    writeTimer = null;
  }
}
