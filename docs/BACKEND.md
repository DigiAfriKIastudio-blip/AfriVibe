# Backend : état actuel et préparation

## Ce qui fonctionne sans backend

AfriVibe est **entièrement fonctionnelle en local** : les interactions sont réelles et
persistées sur l'appareil (AsyncStorage).

| Fonctionnalité | Réelle ? | Détail |
| --- | --- | --- |
| Fil vertical, lecture, pause, son | ✅ | Vidéos embarquées dans l'app |
| J'aime / retirer un j'aime | ✅ | Persisté, compteurs mis à jour partout |
| Favoris | ✅ | Onglet « Favoris » du profil |
| Commentaires (ajout, suppression, like) | ✅ | Persistés, suppression limitée à ses propres commentaires |
| Abonnements | ✅ | Fil « Abonnements » filtré, compteurs à jour |
| Recherche (comptes, hashtags, vidéos) | ✅ | Filtrage local sur les données chargées |
| Création de publication | ⚠️ partielle | La vidéo est copiée dans le stockage de l'app et visible **uniquement sur cet appareil** |
| Partage | ⚠️ partiel | Ouvre la feuille de partage Android ; le compteur s'incrémente, mais aucune URL publique n'existe |
| Notifications | ⚠️ démo | Jeu de données local (aucune notification temps réel) |
| Comptes / authentification | ❌ | Un profil de démonstration unique (`@amina.dkr`) ; pas de connexion |
| Messages privés | ❌ | Non implémenté (volontairement absent de l'interface) |
| Upload de vidéos / stockage | ❌ | Nécessite un backend |

Ces limites sont assumées et affichées dans l'interface (encart de l'écran « Créer »).

## Préparation de Supabase

Le point d'extension est prêt :

- `src/data/repositories/types.ts` : contrats à implémenter ;
- `src/data/supabase/supabaseDataSource.ts` : squelette qui échoue avec un message
  explicite (`BackendNotConfiguredError`) ;
- `src/data/index.ts` : bascule via `EXPO_PUBLIC_DATA_SOURCE=supabase` ;
- `src/data/supabase/client.ts` : lecture des variables d'environnement ;
- `supabase/schema.sql` : schéma de tables + politiques RLS proposées.

### Étapes de branchement

1. Créer le projet Supabase, exécuter `supabase/schema.sql`.
2. Copier `.env.example` en `.env` et renseigner :

   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=xxxxx
   EXPO_PUBLIC_DATA_SOURCE=supabase
   ```

3. `npx expo install @supabase/supabase-js`
4. Implémenter les méthodes de `supabaseDataSource` (les signatures ne changent pas).
5. Ajouter l'authentification (`supabase.auth`) et remplacer `session.getCurrentProfileId`.

### Sécurité

- La clé `anon` est **publique** (embarquée dans l'app) : la protection repose sur les
  politiques **RLS** du schéma SQL.
- La clé `service_role` ne doit **jamais** apparaître dans l'application ni dans un fichier
  versionné.
- `.env` est ignoré par Git ; `.env.example` ne contient aucune valeur.
- Dans les politiques RLS, toujours utiliser `auth.uid()` et vérifier la propriété des
  lignes modifiées.

### Correspondance entités ↔ tables

| Entité TypeScript | Table | Remarques |
| --- | --- | --- |
| `Profile` | `profiles` | 1-1 avec `auth.users` |
| `Video` | `videos` | `video_url` / `poster_url` remplaceront `MediaRef` |
| `Comment` | `comments` | `video_id`, `author_id` |
| `UserInteractions.likedVideoIds` | `video_likes` | Table de jointure |
| `UserInteractions.savedVideoIds` | `video_saves` | Table de jointure |
| `UserInteractions.followingIds` | `follows` | `follower_id`, `following_id` |
| `AppNotification` | `notifications` | Générées par trigger |

### Points d'attention lors du branchement

- **Upload** : `expo-image-picker` fournit un URI local ; il faudra lire le fichier et
  l'envoyer dans un bucket Storage avant d'insérer la ligne `videos`.
- **Compteurs** : préférer des colonnes dénormalisées mises à jour par trigger, ou des
  vues, pour éviter de recalculer à chaque requête.
- **Pagination** : le `cursor` actuel est un offset ; passer à un curseur
  `created_at`/`id` pour un fil stable.
- **Temps réel** : `supabase.channel(...)` pourra rafraîchir likes et commentaires.
