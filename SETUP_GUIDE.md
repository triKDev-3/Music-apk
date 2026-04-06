# Guide de Configuration - Play Me AI Music Player

Ce projet est un lecteur de musique intelligent propulsé par l'IA (Gemini). Pour qu'il fonctionne correctement après l'exportation sur GitHub, suivez ces étapes.

## 1. Clés API (Environnement)

Créez un fichier `.env` à la racine du projet (ou configurez les secrets sur votre plateforme de déploiement) :

```env
# Google Gemini (Obligatoire pour l'IA)
VITE_GEMINI_API_KEY=votre_cle_gemini

# YouTube Data API v3 (Optionnel mais recommandé pour la recherche stable)
VITE_YOUTUBE_API_KEY=votre_cle_youtube

# Spotify (Optionnel pour les suggestions)
VITE_SPOTIFY_CLIENT_ID=votre_id_spotify
VITE_SPOTIFY_CLIENT_SECRET=votre_secret_spotify
```

## 2. Firebase (Authentification & Base de données)

Le projet utilise Firebase pour la synchronisation des favoris et l'authentification Google.

1.  Créez un projet sur la [Console Firebase](https://console.firebase.google.com/).
2.  Activez **Authentication** avec la méthode **Google**.
3.  Activez **Firestore Database**.
4.  Copiez votre configuration Firebase dans le fichier `firebase-applet-config.json` à la racine.

## 3. Installation et Lancement

```bash
# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Construire pour la production
npm run build
```

## 4. Mobile (Android/iOS)

Le projet utilise **Capacitor**. Pour générer une application mobile :

```bash
# Ajouter la plateforme
npx cap add android
npx cap add ios

# Synchroniser le code web vers le mobile
npm run build
npx cap copy
npx cap sync

# Ouvrir dans Android Studio / Xcode
npx cap open android
npx cap open ios
```

---
Développé avec ❤️ par triKDev
