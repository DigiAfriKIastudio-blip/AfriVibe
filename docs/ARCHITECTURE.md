# Architecture d'AfriVibe

## Vue d'ensemble

AfriVibe est une application **React Native + Expo (SDK 58) + TypeScript** organisée en
couches. L'objectif de cette organisation : pouvoir brancher un backend Supabase sans
modifier les écrans.

```text
app/                  Écrans (Expo Router, routage par fichiers)
src/
  components/         Composants d'interface réutilisables
  constants/          Thème, médias embarqués
  data/               Couche de données (source locale ou Supabase)
    repositories/     Contrats (interfaces) — le seul point de contact avec l'UI
    local/            Implémentation locale persistée (AsyncStorage)
    supabase/         Adaptateur Supabase (squelette, non actif)
  features/           Logique métier par domaine (recherche, publication)
  hooks/              Hooks partagés
  store/              État global (Zustand) + sélecteurs
  types/              Entités du domaine
  utils/              Formatage, identifiants
assets/               Icônes, vidéos de démonstration
supabase/             Schéma SQL prévu (documentation)
scripts/              Outils de développement (aperçu web)
```

## Flux de données

```text
Écran  →  action du store (Zustand)  →  DataSource  →  AsyncStorage (aujourd'hui)
                                                    ↘  Supabase (demain)
```

1. Un écran ne lit que le **store** (`useAppStore`) : les compteurs se mettent à jour
   partout en même temps (fil, profil, commentaires).
2. Une action du store appelle **le `DataSource`** puis applique le résultat à l'état.
3. Le `DataSource` est choisi au démarrage dans `src/data/index.ts` selon
   `EXPO_PUBLIC_DATA_SOURCE` (`local` par défaut).

Conséquence : remplacer le stockage local par Supabase consiste à écrire une classe qui
implémente `DataSource` et à basculer une variable d'environnement.

## Entités (`src/types/entities.ts`)

| Entité | Rôle |
| --- | --- |
| `Profile` | Compte : pseudo, nom, bio, compteurs, avatar (couleur + initiales) |
| `Video` | Publication : média, légende, hashtags, statistiques, auteur |
| `Comment` | Commentaire rattaché à une vidéo |
| `AppNotification` | Activité (j'aime, commentaire, abonnement, mention) |
| `UserInteractions` | J'aime, favoris, abonnements, commentaires aimés de l'utilisateur |

Les médias sont décrits par une `MediaRef` sérialisable :

```ts
type MediaRef =
  | { kind: 'bundled'; key: string }  // vidéo embarquée dans l'app (démo)
  | { kind: 'file'; uri: string }     // fichier local (publication)
  | null;
```

Ce choix évite de persister un identifiant d'asset Metro (non stable d'un build à
l'autre) tout en restant compatible JSON.

## Contrats de données

`src/data/repositories/types.ts` définit `SessionRepository`, `ProfilesRepository`,
`VideosRepository`, `CommentsRepository`, `InteractionsRepository`,
`NotificationsRepository` et les regroupe dans `DataSource`.

Règles respectées par les implémentations :

- les erreurs métier lèvent des `Error` explicites en français
  (« Vous ne pouvez supprimer que vos propres commentaires. ») ;
- les compteurs ne descendent jamais sous zéro ;
- les listes sont renvoyées triées par date décroissante.

## État global (`src/store/appStore.ts`)

- `status` : `loading` / `ready` / `error`
- collections indexées par identifiant (`profiles`, `videos`, `comments`) pour des mises
  à jour en O(1)
- `feedOrder` : ordre d'affichage du fil (pagination par curseur)
- sélecteurs dérivés : `selectVideosByAuthor`, `selectSavedVideos`, `selectLikedVideos`,
  `selectIsLiked`, `selectIsSaved`, `selectIsFollowing`, `selectUnreadNotificationCount`

## Démarrage et résilience

Le démarrage est conçu pour **toujours se terminer** (voir
`docs/DIAGNOSTIC-DEMARRAGE.md`) :

```text
splash natif            preventAutoHideAsync (portée module) → hideAsync au montage
                        + masquage de secours (4 s)
        ↓
loadStartupSnapshot()   5 sections en parallèle, 6 s maximum chacune
        ↓
hydrate (store)         plafond global 9 s, single-flight, résultat partiel accepté
        ↓
status                  ready → navigation
                        error → écran « Démarrage impossible » + « Réessayer »
```

- Bornes de temps centralisées dans `src/constants/startup.ts`.
- `src/utils/async.ts` fournit `withTimeout` / `settleWithTimeout` (aucune promesse non
  bornée, aucun rejet non géré).
- `src/data/local/database.ts` est **single-flight** et bascule en mode dégradé (données de
  démo en mémoire, écritures suspendues) si `AsyncStorage` ne répond pas : les données
  déjà stockées ne sont jamais écrasées.
- `src/components/system/ErrorBoundary.tsx` capture les erreurs de rendu et propose une
  reprise, au lieu de laisser un écran vide ou un logo figé.

## Navigation (Expo Router)

```text
app/
  _layout.tsx              ErrorBoundary + splash + hydratation bornée + Stack + Toast
  (tabs)/
    _layout.tsx            Onglets : Accueil, Découvrir, Créer, Activité, Profil
    index.tsx              Fil vertical (Pour toi / Abonnements)
    discover.tsx           Recherche, tendances, suggestions
    create.tsx             Création d'une publication
    activity.tsx           Notifications
    profile.tsx            Profil personnel (Publications / Favoris / Aimées)
  video/[videoId].tsx      Lecture plein écran
  user/[username].tsx      Profil public
  comments/[videoId].tsx   Modale de commentaires
  edit-profile.tsx         Modale d'édition du profil
```

## Lecture vidéo

`expo-video` avec un lecteur par page du fil :

- seule la page visible joue (`onViewableItemsChanged`), les autres sont en pause ;
- `windowSize={3}` limite le nombre de lecteurs montés ;
- une affiche (`poster`) est affichée à la place de la vidéo pour les pages inactives ;
- l'interface est superposée (like, commentaire, favori, partage, son, progression).

Aucune vidéo distante n'est chargée : les six clips de démonstration sont embarqués dans
l'application, le fil fonctionne donc hors ligne.

## Tests

- `jest-expo` + `@testing-library/react-native`
- tests unitaires des fonctions pures (formatage, recherche)
- tests d'intégration de la couche locale (pagination, likes, favoris, abonnements,
  commentaires, publication, persistance après rechargement)
- tests du store et de composants (rendu, interactions, états vides)
- tests de résilience du démarrage (stockage muet, E/S figées, `ErrorBoundary`,
  splash, reprise après échec) — voir `docs/DIAGNOSTIC-DEMARRAGE.md`

Lancer : `npm test`.

## Décisions techniques

| Décision | Raison |
| --- | --- |
| Zustand plutôt que Redux | Peu de code, sélecteurs simples, pas de boilerplate |
| Pas de `react-native-reanimated` | Le fil n'utilise que `FlatList` + `pagingEnabled` : moins de surface native à compiler |
| `AsyncStorage` pour la persistance | Suffisant pour une démo, remplaçable par Supabase |
| Vidéos embarquées générées localement | Démo fonctionnelle hors ligne, sans héberger de médias |
| Aucun SDK Supabase installé | Éviter une dépendance morte tant que le backend n'existe pas |
