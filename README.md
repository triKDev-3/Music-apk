<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AI Music Player - Guide d'Installation et de Configuration

Bienvenue dans le code source de votre application AI Music Player ! 
Après avoir téléchargé le projet, voici les étapes nécessaires pour configurer l'environnement et faire fonctionner l'application normalement sur votre machine locale.

## 🛠 Prérequis

- **Node.js** (version 18 ou supérieure recommandée)
- Un gestionnaire de paquets comme **npm** (inclus avec Node.js) ou **yarn**.

## 🚀 Installation

1. Ouvrez un terminal dans le dossier racine du projet.
2. Installez toutes les dépendances nécessaires en exécutant la commande suivante :
   ```bash
   npm install
   ```

## ⚙️ Configuration des Variables d'Environnement

L'application utilise plusieurs API externes (Gemini, YouTube, Spotify) qui nécessitent des clés d'accès.

1. À la racine du projet, copiez le fichier `.env.example` et renommez-le en `.env`.
2. Ouvrez le fichier `.env` et remplissez les valeurs suivantes :

   - **`GEMINI_API_KEY`** : Votre clé API Google Gemini (récupérable sur [Google AI Studio](https://aistudio.google.com/)).
   - **`VITE_YOUTUBE_API_KEY`** : Votre clé API YouTube Data v3 (récupérable sur [Google Cloud Console](https://console.cloud.google.com/)).
   - **`VITE_SPOTIFY_CLIENT_ID`** & **`VITE_SPOTIFY_CLIENT_SECRET`** : Vos identifiants Spotify (récupérables sur le [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)).
   - **`DATABASE_URL`** *(Optionnel)* : Si vous souhaitez utiliser PostgreSQL pour le cache des recherches. Si laissé vide, l'application utilisera un cache en mémoire.

## 🔥 Configuration de Firebase (Authentification & Base de données)

L'application utilise Firebase pour gérer la connexion des utilisateurs (Google Auth) et sauvegarder leurs playlists/favoris (Firestore). Vous devez lier l'application à votre propre projet Firebase.

1. Allez sur la [Console Firebase](https://console.firebase.google.com/) et créez un nouveau projet.
2. **Activez l'Authentification** : Allez dans *Authentication* > *Sign-in method* et activez le fournisseur **Google**.
3. **Activez Firestore** : Allez dans *Firestore Database* et créez une base de données.
4. **Récupérez vos identifiants** : Allez dans les paramètres du projet (icône engrenage) > *Général* > *Vos applications*, ajoutez une application Web `</>` et copiez l'objet de configuration `firebaseConfig`.
5. **Intégration au projet** :
   - Soit vous remplissez les variables `VITE_FIREBASE_*` dans votre fichier `.env`.
   - Soit vous créez un fichier `firebase-applet-config.json` à la racine du projet avec la structure suivante :
     ```json
     {
       "apiKey": "VOTRE_API_KEY",
       "authDomain": "VOTRE_AUTH_DOMAIN",
       "projectId": "VOTRE_PROJECT_ID",
       "appId": "VOTRE_APP_ID",
       "firestoreDatabaseId": "(default)"
     }
     ```

## ▶️ Lancement de l'Application

Une fois les dépendances installées et les clés API configurées, vous pouvez démarrer le serveur de développement (qui inclut à la fois le backend Express et le frontend React/Vite) :

```bash
npm run dev
```

L'application sera accessible dans votre navigateur, généralement à l'adresse `http://localhost:3000`.

## 📱 Déploiement Mobile (Android & iOS)

L'application utilise **Capacitor** pour être compilée en application mobile native.

1. Compilez d'abord l'application web :
   ```bash
   npm run build
   ```
2. Synchronisez les fichiers avec les projets natifs :
   ```bash
   npx cap sync
   ```
3. Ouvrez les IDE natifs pour compiler et lancer :
   - **Android** : `npx cap open android` (Nécessite Android Studio)
   - **iOS** : `npx cap open ios` (Nécessite Xcode sur macOS)

> ⚠️ **Important** : Pour que l'authentification Google et Firebase fonctionnent sur mobile, des étapes supplémentaires sont requises (ajout des fichiers `google-services.json` et `GoogleService-Info.plist`). 

👉 **Consultez le fichier [DOCUMENTATION.md](./DOCUMENTATION.md) pour les instructions complètes de configuration mobile et l'architecture détaillée du projet.**
