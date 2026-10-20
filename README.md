# AfriVibe

Application mobile Android de **vidéos courtes**, développée avec **React Native**,
**Expo (SDK 58)** et **TypeScript**.

> **Statut :** première version fonctionnelle. Le fil vertical, la lecture vidéo, les
> likes, les commentaires, les favoris, les abonnements, la recherche et la création de
> publications sont opérationnels. Les données sont stockées **localement** sur
> l'appareil ; le backend Supabase est préparé mais pas encore branché
> (voir [docs/BACKEND.md](docs/BACKEND.md)).

---

## Aperçu

| Écran | Contenu |
| --- | --- |
| **Accueil** | Fil vertical plein écran, deux onglets (« Pour toi » / « Abonnements »), lecture automatique, pause au toucher, son, barre de progression |
| **Découvrir** | Recherche par compte, hashtag ou légende, tendances, créateurs à suivre, grille des vidéos récentes |
| **Créer** | Sélection d'une vidéo dans la galerie ou d'un clip de démo, légende, hashtags, aperçu, publication |
| **Activité** | J'aime, commentaires, abonnements et mentions, avec suivi « lu / non lu » |
| **Profil** | Statistiques, bio éditable, onglets Publications / Favoris / Aimées |
| **Profil public** | Vidéos d'un créateur, s'abonner / se désabonner |
| **Commentaires** | Modale, ajout, suppression de ses commentaires, j'aime sur les commentaires |

---

## Stack technique

| Domaine | Outil |
| --- | --- |
| Framework mobile | React Native 0.88 |
| Plateforme | Expo SDK 58 (New Architecture) |
| Langage | TypeScript (strict) |
| Navigation | Expo Router (routage par fichiers) |
| Lecture vidéo | `expo-video` |
| État global | Zustand |
| Persistance | AsyncStorage |
| Tests | Jest + jest-expo + Testing Library |
| Build Android | EAS Build / GitHub Actions |

---

## Prérequis

- **Node.js 22** ou supérieur, **npm 10** ou supérieur
- **Git**
- Pour tester : un téléphone Android avec **Expo Go**, ou **Android Studio** (API 34+)

```bash
node --version
npm --version
```

---

## Installation

```bash
git clone https://github.com/DigiAfriKIastudio-blip/AfriVibe.git
cd AfriVibe
npm install
```

---

## Lancer l'application

```bash
npm start          # serveur de développement Expo
npm run android    # ouvre l'émulateur Android
npm run web        # aperçu navigateur (pratique pour tester sans téléphone)
```

Puis scanner le QR code avec **Expo Go** (Android).

> Astuce : `npx expo export --platform web --output-dir dist && node scripts/serve-web.mjs`
> sert un aperçu web statique (voir [scripts/README.md](scripts/README.md)).

---

## Vérifications

```bash
npm run typecheck   # TypeScript strict
npm run lint        # ESLint (config Expo)
npm test            # tests Jest
npm run test:coverage
```

État actuel : **typecheck ✅**, **lint ✅ (0 erreur)**, **48 tests ✅**.

---

## Ce qui fonctionne réellement

- ✅ **Fil vertical** paginé, lecture automatique de la page visible, pause au toucher,
  coupure du son, barre de progression.
- ✅ **J'aime** : compteur et état persistés, mis à jour dans le fil, le profil et la
  grille ; onglet « Aimées ».
- ✅ **Favoris** : enregistrés, visibles dans l'onglet « Favoris » du profil.
- ✅ **Commentaires** : ajout, suppression (uniquement les siens), j'aime sur commentaire,
  compteurs synchronisés.
- ✅ **Abonnements** : abonner / désabonner, compteurs des deux profils, fil
  « Abonnements » filtré.
- ✅ **Recherche** : comptes, hashtags, légendes, sons ; tendances calculées sur les
  données réelles.
- ✅ **Création** : choix d'une vidéo (galerie ou démo), copie dans le stockage de
  l'application, légende + hashtags, publication en tête du fil et du profil.
- ✅ **Édition du profil** : nom affiché et bio persistés.
- ✅ **Données de démo réinitialisables** depuis le profil.

## Limites (assumées et visibles dans l'interface)

- ❌ **Pas d'authentification** : un profil de démonstration unique (`@amina.dkr`).
- ❌ **Pas d'upload serveur** : une vidéo publiée reste sur l'appareil (elle n'est pas
  visible par d'autres utilisateurs). Un encart l'indique sur l'écran « Créer ».
- ⚠️ **Partage** : ouvre la feuille de partage Android et incrémente le compteur, mais
  aucune URL publique n'existe encore.
- ⚠️ **Notifications** : jeu de démonstration local, pas de temps réel.
- ❌ **Messages privés** : non implémentés (aucun bouton décoratif n'est affiché).

Détail complet et plan de branchement : [docs/BACKEND.md](docs/BACKEND.md).

---

## Structure du dépôt

```text
AfriVibe/
├── app/                    Écrans (Expo Router)
│   ├── (tabs)/             Accueil, Découvrir, Créer, Activité, Profil
│   ├── video/[videoId].tsx Lecture plein écran
│   ├── user/[username].tsx Profil public
│   ├── comments/           Modale de commentaires
│   └── edit-profile.tsx    Édition du profil
├── src/
│   ├── components/         UI réutilisable (ui, feed, comments, profile, search, create)
│   ├── constants/          Thème, médias embarqués
│   ├── data/               Contrats + source locale + adaptateur Supabase
│   ├── features/           Recherche, publication
│   ├── hooks/              Hooks partagés
│   ├── store/              État global Zustand
│   ├── types/              Entités du domaine
│   └── utils/              Formatage, identifiants
├── assets/                 Icônes + 6 vidéos de démonstration (posters inclus)
├── docs/                   ARCHITECTURE.md, BACKEND.md
├── supabase/               Schéma SQL prévu (non utilisé)
├── scripts/                Serveur d'aperçu web, génération des vidéos
├── .github/workflows/      CI + build APK manuel (EAS)
├── app.json                Configuration Expo
├── eas.json                Profils de build
└── package.json
```

Architecture détaillée : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Générer un APK de test

> ⚠️ Aucun build n'est lancé automatiquement dans cette version. Les configurations
> ci-dessous sont prêtes mais doivent être déclenchées manuellement.

### Option 1 — EAS Build (recommandé)

```bash
npm install -g eas-cli
eas login
eas init                       # lie le projet à votre compte Expo
eas build --platform android --profile preview
```

Le profil `preview` de `eas.json` produit directement un **APK**.

### Option 2 — GitHub Actions (manuel)

Le workflow `.github/workflows/android-preview.yml` se lance depuis l'onglet **Actions**
(« APK de test (EAS) » → *Run workflow*). Il nécessite le secret `EXPO_TOKEN`.

### Option 3 — Build local

```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```

L'APK est produit dans `android/app/build/outputs/apk/release/`.

---

## Feuille de route

- [x] Dépôt, documentation, licence MIT
- [x] Socle Expo + TypeScript
- [x] Fil vertical, lecture vidéo, likes, commentaires, favoris, abonnements
- [x] Recherche, profils, création de publication
- [x] Tests automatisés et configuration de build
- [ ] Backend Supabase (authentification, stockage, temps réel)
- [ ] Upload réel des vidéos
- [ ] Première build APK de test

---

## Contribution

1. créer une branche depuis `main` ;
2. `npm ci`, puis `npm run typecheck && npm run lint && npm test` ;
3. ouvrir une **pull request** en décrivant la modification.

---

## Licence

Distribué sous licence **MIT**. Voir [LICENSE](LICENSE).
