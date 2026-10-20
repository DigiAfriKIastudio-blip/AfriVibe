# AfriVibe

Application mobile Android développée avec **React Native**, **Expo** et **TypeScript**.

---

## À propos

**AfriVibe** est un projet d'application mobile destiné à l'écosystème Android. Ce dépôt
regroupe le code source de l'application, sa configuration de build et l'automatisation
permettant de générer des APK de test.

> **Statut :** dépôt initialisé. Le socle applicatif (Expo + TypeScript) sera ajouté à
> l'étape suivante du projet. Ce README décrit la cible technique retenue.

---

## Stack technique

| Domaine | Outil |
| --- | --- |
| Framework mobile | React Native |
| Plateforme de développement | Expo (SDK à définir) |
| Langage | TypeScript |
| Navigation | Expo Router *(à confirmer)* |
| Build Android | EAS Build / GitHub Actions |
| Gestionnaire de paquets | npm |

---

## Prérequis

Avant de travailler sur le projet, installer :

- **Node.js 20 LTS** ou supérieur — [nodejs.org](https://nodejs.org)
- **npm 10** ou supérieur (fourni avec Node.js)
- **Git**
- Pour tester sur Android :
  - un téléphone Android avec l'application **Expo Go**, ou
  - **Android Studio** avec un émulateur configuré (API 34 recommandé)

Vérification de l'environnement :

```bash
node --version
npm --version
git --version
```

---

## Installation

```bash
git clone https://github.com/DigiAfriKIastudio-blip/AfriVibe.git
cd AfriVibe
npm install
```

> Les dépendances seront installées dès que le socle Expo sera présent dans le dépôt.

---

## Lancer l'application en développement

```bash
npx expo start
```

Puis :

- scanner le QR code avec **Expo Go** sur un appareil Android ;
- ou appuyer sur `a` pour ouvrir l'émulateur Android.

---

## Générer un APK de test

Deux approches sont prévues :

### 1. Build local (Android SDK requis)

```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```

L'APK est produit dans `android/app/build/outputs/apk/release/`.

### 2. Build automatisé avec EAS

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

Un lien de téléchargement de l'APK est fourni à la fin du build.

### 3. Build automatisé avec GitHub Actions

Un workflow de compilation sera ajouté dans `.github/workflows/` afin de produire un APK
à chaque version publiée. L'artefact sera téléchargeable depuis l'onglet **Actions** du
dépôt.

---

## Structure du dépôt

État actuel :

```text
AfriVibe/
├── README.md      # Présentation du projet
├── .gitignore     # Fichiers exclus du versionnement
└── LICENSE        # Licence MIT
```

Cible à venir :

```text
AfriVibe/
├── app/                 # Écrans et navigation (Expo Router)
├── assets/              # Images, polices, sons
├── components/          # Composants réutilisables
├── constants/           # Thème, couleurs, configuration
├── hooks/               # Hooks personnalisés
├── services/            # Accès aux données et aux API
├── types/               # Types TypeScript partagés
├── app.json             # Configuration Expo
├── eas.json             # Profils de build EAS
├── tsconfig.json        # Configuration TypeScript
└── package.json
```

---

## Feuille de route

- [x] Création du dépôt et de la documentation
- [ ] Initialisation du projet Expo + TypeScript
- [ ] Conception des écrans principaux
- [ ] Intégration des données et des services
- [ ] Configuration de la génération d'APK (EAS + GitHub Actions)
- [ ] Publication d'une version de test

---

## Contribution

Les contributions sont les bienvenues. Pour proposer une modification :

1. créer une branche depuis `main` ;
2. effectuer les changements et les tester ;
3. ouvrir une **pull request** en décrivant la modification.

---

## Licence

Ce projet est distribué sous licence **MIT**. Voir le fichier [LICENSE](LICENSE).
