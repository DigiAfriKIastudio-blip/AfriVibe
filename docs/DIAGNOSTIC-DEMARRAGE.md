# Diagnostic — blocage au démarrage (logo figé)

> Branche : `arena/bf374311-afrivibe`, à partir de `19fb44360ac530d8628b325fc2cdd06eeb4c19cf`.
> Cible : application React Native + Expo SDK 58 (`expo ~58.0.16`, `react-native 0.88.0`,
> Expo Router `~58.0.24`).
> Supabase reste **non connecté** et aucun APK n'a été produit.

## 1. Symptôme rapporté

L'application fonctionnait (commentaires, abonnements, partages). Après une **tentative de
publication d'une vidéo de démonstration**, elle a commencé à « charger très longtemps »,
puis reste bloquée sur le **logo de démarrage**.

## 2. Constat de départ (avant modification)

État du dépôt au commit de base, après `npm ci` :

| Vérification | Résultat |
| --- | --- |
| `npx tsc --noEmit` | ✅ aucune erreur |
| `npx eslint .` | ✅ aucune erreur, aucun avertissement |
| `npx jest` | ✅ 5 suites / 48 tests |
| `npx expo export --platform web` | ✅ export statique réussi |

Le code **compile et passe ses tests** : le blocage est donc un défaut **d'exécution au
démarrage**, pas une erreur de compilation. Les tests existants ne couvraient aucun des cas
« opération asynchrone qui ne répond jamais ».

## 3. Analyse de la chaîne de démarrage

### 3.1 Splash natif jamais piloté

`app/_layout.tsx` n'importait pas `expo-splash-screen` :

- aucun `preventAutoHideAsync()` en portée module ;
- aucun `hideAsync()` en cas de succès, d'erreur **ou** de blocage.

Expo Router masque le splash dans `Content` (`node_modules/expo-router/build/ExpoRoot.js`)
**après le montage du layout racine**. Tant que ce layout ne rend pas son arbre, le splash
reste affiché. Toute exception de rendu, ou tout état `loading` sans fin, donne donc
exactement le symptôme observé : **logo figé, aucune action possible**.

### 3.2 Hydratation sans aucun délai maximal

`src/store/appStore.ts` (`hydrate`) faisait :

```ts
const [...] = await Promise.all([
  dataSource.session.getCurrentProfileId(),
  dataSource.profiles.list(),
  dataSource.videos.listFeed(),
  dataSource.interactions.get(),
  dataSource.notifications.list(),
]);
```

Problèmes :

1. **Aucune borne de temps.** Si `AsyncStorage` (natif) ne résout pas — stockage lent au
   premier accès, écriture précédente bloquée, disque plein, fichier SQLite verrouillé —
   `Promise.all` ne se résout jamais, `status` reste `loading` pour toujours.
2. **Aucun partage de chargement.** Un second appel (StrictMode, navigation, écran Profil
   « Recharger ») relançait une hydratation complète en parallèle.
3. **Tout ou rien.** Une seule section en échec faisait basculer sur l'écran d'erreur, alors
   que les autres données étaient disponibles.

### 3.3 `src/data/local/database.ts` : lecture/écriture non bornées

- `await AsyncStorage.getItem(...)` sans délai maximal.
- Cinq appels `loadDatabase()` concurrents (les 5 sections) déclenchaient **cinq lectures
  complètes**, et, au premier lancement, **cinq écritures simultanées** du jeu de démo.
- `await writeNow(cache)` dans `loadDatabase()` : une écriture qui ne se termine pas
  bloquait aussi le démarrage.
- La chaîne `pendingWrite` n'avait pas de borne : un `setItem` muet la laissait en suspens
  pour toute la session, et `flushDatabase()` attendait indéfiniment.

### 3.4 Aucun ErrorBoundary

Aucun garde-fou de rendu dans le projet. Une exception dans un écran (par exemple une
publication locale dont l'URI n'est plus lisible) démonte tout l'arbre React : écran vide
ou splash qui ne disparaît jamais, sans bouton de reprise.

### 3.5 Données de démo partagées entre sessions

`createSeedDatabase()` renvoyait **directement** les tableaux du module
(`profiles`, `videos`, `comments`, `notifications`). Comme `videos.push(created)` mute ce
tableau, une publication modifiait la « graine » en mémoire : après un « Réinitialiser la
démo », la publication restait présente. Ce n'est pas la cause du blocage, mais c'est un
défaut de préservation des données, corrigé ici.

### 3.6 Publication vidéo : opérations non bornées

`src/features/publish/useVideoPublisher.ts` :

- `FileSystem.copyAsync` (copie d'un fichier vidéo, potentiellement volumineux) sans délai
  maximal : l'écran peut rester sur « Publication… » indéfiniment ;
- `Asset.downloadAsync()` (vidéo de démonstration) sans délai maximal ;
- aucun verrou synchrone contre un double appui sur « Publier » (deux publications).

C'est précisément l'opération qui a précédé l'incident.

### 3.7 `app.json` : clé rejetée par le SDK 58

`android.edgeToEdgeEnabled: true` n'existe plus dans le schéma Expo SDK 54+ (le
edge-to-edge est le comportement par défaut) et fait échouer la vérification de schéma
d'`expo-doctor`.

## 4. Correctifs appliqués

| Fichier | Correctif |
| --- | --- |
| `src/constants/startup.ts` *(nouveau)* | Toutes les bornes de temps : lecture 5 s, écriture 8 s, section 6 s, hydratation 9 s, splash 4 s, chien de garde 12 s, copie vidéo 20 s |
| `src/utils/async.ts` *(nouveau)* | `withTimeout` (rejette `TimeoutError`), `isTimeoutError`, `settleWithTimeout` (jamais d'exception) ; pas de rejet non géré si l'opération répond après le délai |
| `src/data/local/database.ts` | Lecture et écriture bornées ; chargement **single-flight** ; repli sur les données de démo **en mémoire** sans réécrire le stockage (mode dégradé) ; sérialisation protégée ; `isLocalStorageDegraded()` |
| `src/data/local/seed.ts` | `createSeedDatabase()` clone ses tableaux (plus de graine polluée) |
| `src/features/startup/loadSnapshot.ts` *(nouveau)* | Chargement des 5 sections en parallèle, **chacune avec son délai**, résultat partiel exploitable (`failedSections`, `usable`) |
| `src/store/appStore.ts` | `hydrate` borné globalement, single-flight, démarrage partiel possible avec message, message d'erreur explicite, jamais de rejet |
| `src/components/system/ErrorBoundary.tsx` *(nouveau)* | `ErrorBoundary` + `ErrorFallback` : écran de reprise, remontage du sous-arbre, journalisation |
| `src/features/startup/useSplashGate.ts` *(nouveau)* | `preventSplashAutoHide`, `hideSplashScreen` (try/catch, rejets avalés), `useSplashGate` (masquage au montage + masquage de secours) |
| `app/_layout.tsx` | Splash piloté, `ErrorBoundary` racine **et** autour de la navigation, écran d'attente avec chien de garde et bouton « Réessayer », écran d'erreur rappelant que les données sont conservées |
| `src/features/publish/useVideoPublisher.ts` | Copie et préparation de démo bornées ; verrou contre le double envoi |
| `app.json` | Suppression de `android.edgeToEdgeEnabled` |

## 5. Garanties après correctif

1. **Le splash ne peut plus rester figé** : masquage au montage de l'écran JS, puis
   masquage de secours à 4 s, quel que soit l'état.
2. **Le démarrage se termine toujours** : hydratation ≤ 9 s (chaque section ≤ 6 s,
   lecture ≤ 5 s), sinon écran d'erreur avec « Réessayer ».
3. **Aucune donnée locale n'est écrasée** en cas de panne de stockage : repli en mémoire,
   écritures suspendues pour la session, stockage intact au prochain démarrage.
4. **Une erreur de rendu affiche un écran de reprise** au lieu d'un écran vide.
5. **Un démarrage partiel reste utilisable** (fil + profils) avec un message discret.
6. **Les fonctionnalités existantes sont inchangées** : commentaires, abonnements,
   favoris, partages, fil vidéo et publications passent toujours par le même
   `DataSource` ; seules les bornes de temps et les garde-fous ont été ajoutés.

## 6. Vérifications (après correctif)

```bash
npx tsc --noEmit      # aucune erreur
npx eslint .          # aucune erreur, aucun avertissement
npx jest              # 13 suites / 85 tests
npx expo export --platform android --output-dir /tmp/afrivibe-android   # bundle Hermes OK
npx expo export --platform web --output-dir /tmp/web-export             # export statique OK
```

Tests ajoutés :

| Fichier | Couverture |
| --- | --- |
| `src/utils/__tests__/async.test.ts` | résolution, délai dépassé, propagation d'erreur, nettoyage du minuteur, repli |
| `src/data/local/__tests__/databaseResilience.test.ts` | lecture muette, préservation du stockage, single-flight, écriture muette, persistance publications/commentaires/favoris/abonnements/partages |
| `src/features/startup/__tests__/loadSnapshot.test.ts` | chargement complet, section figée, source entièrement défaillante, isolation des objets |
| `src/store/__tests__/startupResilience.test.ts` | démarrage en erreur borné, démarrage partiel, hydratation unique, reprise après échec |
| `src/components/system/__tests__/ErrorBoundary.test.tsx` | écran de reprise, remontage après reprise |
| `src/features/startup/__tests__/rootLayout.test.tsx` | splash masqué, écran de chargement, écran d'erreur, chien de garde, navigation prête |
| `src/features/publish/__tests__/useVideoPublisher.test.tsx` | démo bornée, copie bornée, double appui |
| `src/features/startup/__tests__/appConfig.test.ts` | absence de `edgeToEdgeEnabled`, configuration Android/splash conservée |

## 7. Limites assumées

- Le blocage n'a **pas pu être reproduit sur un appareil Android** dans cet environnement :
  les correctifs traitent la classe de défauts identifiée (attentes non bornées, splash non
  piloté, absence de garde-fou) et sont couverts par des tests qui simulent un stockage et
  des E/S muets.
- L'**origine exacte** de la lenteur (stockage natif lent, fichier de publication
  illisible, ou exception de rendu) ne peut pas être déterminée sans journal `adb logcat`
  de l'appareil. Le correctif rend chaque cause possible non bloquante et explicite.
- `expo-doctor` n'a pas pu valider le schéma Expo (l'API Expo est inaccessible depuis cet
  environnement). La clé supprimée est vérifiée par un test et par
  `npx expo export`, qui construit le bundle avec la configuration actuelle.
- Supabase n'est pas connecté, aucun APK n'a été généré.
