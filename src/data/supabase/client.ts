/**
 * Configuration Supabase (préparation, PAS de connexion active).
 *
 * ⚠️ Aucun appel réseau n'est effectué dans cette version. Le SDK
 * `@supabase/supabase-js` n'est volontairement pas installé tant que le
 * backend n'existe pas : une dépendance inutilisée alourdirait le bundle.
 *
 * Quand le projet Supabase sera créé :
 *   1. `npx expo install @supabase/supabase-js @react-native-async-storage/async-storage`
 *   2. renseigner `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY`
 *      dans un fichier `.env` local (jamais commité) ;
 *   3. implémenter `src/data/supabase/supabaseDataSource.ts` ;
 *   4. lancer l'app avec `EXPO_PUBLIC_DATA_SOURCE=supabase`.
 *
 * La clé `anon` est publique par nature (elle est embarquée dans l'app) :
 * la sécurité repose sur les politiques RLS définies dans `supabase/schema.sql`.
 * Ne JAMAIS utiliser la clé `service_role` côté application.
 */

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}
