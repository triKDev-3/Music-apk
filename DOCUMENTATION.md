# Documentation Complète - Play-Me (Music Player)

Cette documentation détaille l'architecture, l'installation, la configuration et le déploiement de l'application AI Music Player sur le Web, Android et iOS.

---

## 📑 Table des matières

1. [Architecture du Projet](#1-architecture-du-projet)
2. [Prérequis](#2-prérequis)
3. [Installation Web & Configuration](#3-installation-web--configuration)
4. [Configuration de Firebase](#4-configuration-de-firebase)
5. [Déploiement Mobile (Android)](#5-déploiement-mobile-android)
6. [Déploiement Mobile (iOS)](#6-déploiement-mobile-ios)
7. [Fonctionnalités Principales](#7-fonctionnalités-principales)

---

## 1. Architecture du Projet

L'application est construite avec une architecture moderne full-stack et cross-platform :

- **Frontend** : React.js avec Vite, Tailwind CSS pour le style, Framer Motion pour les animations.
- **Backend** : Serveur Express.js intégré (via `server.ts`) pour gérer les requêtes API (YouTube, Spotify, Gemini).
- **Base de données** :
  - *Cloud* : Firebase Firestore (pour les utilisateurs connectés : favoris, playlists).
  - *Local* : Dexie.js (IndexedDB) pour le stockage local et le mode hors-ligne.
- **Authentification** : Firebase Auth (Google Sign-In) + Capacitor Google Auth pour le mobile natif.
- **Mobile** : Capacitor.js pour compiler l'application web en applications natives Android et iOS.

---

## 2. Prérequis

Pour compiler et exécuter le projet sur toutes les plateformes, vous aurez besoin de :

- **Node.js** (v18+) et **npm** (ou yarn/pnpm).
- **Git** pour le contrôle de version.
- **Android Studio** (pour compiler l'application Android).
- **Xcode** (pour compiler l'application iOS - *nécessite un Mac*).
- **CocoaPods** (gestionnaire de dépendances pour iOS).

---

## 3. Installation Web & Configuration

### 3.1 Installation des dépendances

Ouvrez un terminal à la racine du projet et installez les paquets npm :

```bash
npm install
```

### 3.2 Variables d'environnement

Copiez le fichier `.env.example` et renommez-le en `.env`. Remplissez les clés API nécessaires :

- `GEMINI_API_KEY` : Clé Google Gemini.
- `VITE_YOUTUBE_API_KEY` : Clé YouTube Data API v3.
- `VITE_SPOTIFY_CLIENT_ID` & `VITE_SPOTIFY_CLIENT_SECRET` : Identifiants Spotify.

### 3.3 Lancement du serveur de développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`.

---

## 4. Configuration de Firebase

Firebase est utilisé pour l'authentification et la synchronisation des données.

1. Créez un projet sur la [Console Firebase](https://console.firebase.google.com/).
2. Activez **Authentication** (fournisseur Google) et **Firestore Database**.
3. Ajoutez une application **Web** dans les paramètres du projet et récupérez la configuration.
4. Créez un fichier `firebase-applet-config.json` à la racine du projet :

```json
{
  "apiKey": "...",
  "authDomain": "...",
  "projectId": "...",
  "appId": "...",
  "firestoreDatabaseId": "(default)"
}
```

---

## 5. Déploiement Mobile (Android)

L'application utilise **Capacitor** pour le portage sur Android.

### 5.1 Variables d'environnement pour le Mobile

IMPORTANT : L'application web exécutée nativement sur téléphone ne dispose pas de son propre backend embarqué. Vous devez impérativement indiquer l'URL de votre serveur de production (ex: Vercel) dans vos variables d'environnement avant de compiler.

1. Ajoutez `VITE_API_URL=https://votre-backend.vercel.app` dans `.env`
2. C'est nécessaire pour que le proxy audio, la recherche YouTube, et la reconnaissance musicale n'essaient pas de contacter `http://localhost/api` (qui n'existe pas sur le téléphone).

### 5.2 Préparation du build

Avant de synchroniser avec Android, vous devez compiler l'application web :

```bash
npm run build
```

### 5.3 Synchronisation Capacitor

Synchronisez les fichiers web compilés avec le projet Android :

```bash
npx cap sync android
```

*(Si le dossier android n'existe pas, exécutez d'abord `npx cap add android`)*

### 5.4 Configuration Firebase pour Android

1. Dans la console Firebase, ajoutez une application **Android**.
2. Renseignez le nom du paquet (ex: `com.aimusicplayer.app` - vérifiez dans `capacitor.config.ts`).
3. Téléchargez le fichier `google-services.json`.
4. Placez ce fichier dans le dossier `android/app/` de votre projet.

### 5.5 Configuration Google Auth & Permissions (Capacitor)

Ouvrez le fichier `android/app/src/main/res/values/strings.xml` et assurez-vous d'avoir votre ID client Web Google :

```xml
<resources>
  <string name="server_client_id">VOTRE_CLIENT_ID_WEB_GOOGLE</string>
</resources>
```

Note: Le trafic en clair (`usesCleartextTraffic="true"`) est déjà activé dans `AndroidManifest.xml` au cas où vous souhaiteriez faire vos tests locaux mobiles sans SSL HTTPS.

### 5.6 Compilation et Lancement

Ouvrez le projet dans Android Studio :

```bash
npx cap open android
```

Depuis Android Studio, attendez la fin de la synchronisation Gradle, puis cliquez sur le bouton **Run** (Play) pour lancer l'application sur un émulateur ou un appareil physique connecté.

---

## 6. Déploiement Mobile (iOS)

*Note : Un Mac avec Xcode installé est requis.*

### 6.1 Préparation et Synchronisation

N'oubliez pas les variables d'environnement comme spécifié à l'étape 5.1.
Compilez le projet web et synchronisez avec iOS :

```bash
npm run build
npx cap sync ios
```

*(Si le dossier ios n'existe pas, exécutez d'abord `npx cap add ios`)*

### 6.2 Configuration Firebase pour iOS

1. Dans la console Firebase, ajoutez une application **iOS**.
2. Renseignez le Bundle ID (ex: `com.aimusicplayer.app`).
3. Téléchargez le fichier `GoogleService-Info.plist`.
4. Ouvrez Xcode (`npx cap open ios`), faites un clic droit sur le dossier de l'application (App) dans le navigateur de projet, sélectionnez "Add Files to 'App'..." et ajoutez le fichier `GoogleService-Info.plist`.

### 6.3 Configuration Google Auth (iOS)

Dans Xcode, ouvrez le fichier `Info.plist` et ajoutez le schéma d'URL inversé (REVERSED_CLIENT_ID) trouvable dans votre fichier `GoogleService-Info.plist` :

1. Allez dans l'onglet **Info** de la cible de votre application.
2. Dépliez la section **URL Types**.
3. Cliquez sur **+** et collez le `REVERSED_CLIENT_ID` dans le champ **URL Schemes**.

### 6.4 Compilation et Lancement

Ouvrez le projet dans Xcode :

```bash
npx cap open ios
```

Sélectionnez votre simulateur ou votre iPhone connecté, puis cliquez sur le bouton **Build and then run** (Play).

---

## 7. Fonctionnalités Principales

- **Studio Créatif** : Génération de musique et recommandations visuelles via IA.
- **Conformité & Sécurité** : Écran de Conditions d'Utilisation obligatoire au premier démarrage, respect des normes OAuth 2.0.
- **Robustesse Lecture** : Basculement automatique sur backend proxy si l'API YouTube officielle échoue (401/403).
- **Synchronisation Hybride** : Métadonnées cloud (Firebase) + Fichiers binaires locaux (IndexedDB).
- **Recherche Intelligente** : Recherche unifiée via Spotify, YouTube et Gemini AI.
- **Lecteur Unifié & Streaming Audio Rapide** : Lecture transparente de vidéos YouTube (en mode pur flux audio pour contourner les protections iframes ou clip) et de fichiers audio locaux.
- **Playlists & Favoris** : Gestion des playlists synchronisée via Firebase Firestore.
- **Mode Hors-ligne** : Importation de fichiers locaux (`.mp3`, `.wav`) stockés dans le navigateur via IndexedDB.
- **Authentification** : Connexion Google transparente sur le Web, Android et iOS.
- **Picture-in-Picture (PiP)** : Mini-lecteur vidéo flottant pour les clips YouTube.
- **Reconnaissance Audio type Shazam** : Identifiez le titre, l'artiste en direct via le micro, directement via l'intelligence Gemini ou AudD selon vos clés.
