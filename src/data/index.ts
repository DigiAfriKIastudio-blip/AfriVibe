import { localDataSource } from './local/localDataSource';
import type { DataSource } from './repositories/types';
import { isSupabaseConfigured } from './supabase/client';
import { supabaseDataSource } from './supabase/supabaseDataSource';

export type { DataSource } from './repositories/types';
export { BackendNotConfiguredError } from './supabase/supabaseDataSource';
export { isSupabaseConfigured };

/**
 * Sélection de la source de données.
 *
 * - `local` (défaut) : backend embarqué, persisté dans AsyncStorage.
 * - `supabase` : nécessite `EXPO_PUBLIC_DATA_SOURCE=supabase` **et** les
 *   variables `EXPO_PUBLIC_SUPABASE_*`. Sinon la source locale est conservée.
 */
export function resolveDataSource(): DataSource {
  const requested = process.env.EXPO_PUBLIC_DATA_SOURCE;
  if (requested === 'supabase') {
    if (!isSupabaseConfigured()) {
      console.warn(
        "[AfriVibe] EXPO_PUBLIC_DATA_SOURCE=supabase mais la configuration Supabase est absente. " +
          'Utilisation de la source locale.'
      );
      return localDataSource;
    }
    return supabaseDataSource;
  }
  return localDataSource;
}

let current: DataSource = resolveDataSource();

export function getDataSource(): DataSource {
  return current;
}

/** Remplace la source de données (tests / futurs environnements). */
export function setDataSource(next: DataSource): void {
  current = next;
}
