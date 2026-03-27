import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { setYouTubeOAuthToken } from './youtubeService';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY             || '',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN         || '',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID          || '',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET      || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID              || '',
};

const isConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

// Prevent re-initialization during HMR
const app = isConfigured
  ? getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0]
  : null;

export const auth = app ? getAuth(app) : null;
export const db   = app ? getFirestore(app) : null;

const googleProvider = new GoogleAuthProvider();
// On commente ce scope sensible pour éviter l'avertissement "Application non validée"
// googleProvider.addScope('https://www.googleapis.com/auth/youtube.readonly');

export const loginWithGoogle = async () => {
  if (!auth) {
    alert('Firebase non configuré. Voir SETUP_GUIDE.md.');
    return null;
  }
  
  try {
    // ── GESTION MOBILE NATIVE (Capacitor) ───────────────────────
    if (Capacitor.isNativePlatform()) {
      console.log('[Auth] Connexion Native détectée...');
      const googleUser = await GoogleAuth.signIn();
      const idToken = googleUser.authentication.idToken;
      
      if (!idToken) throw new Error("ID Token manquant");
      
      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);
      
      // Note: On ne peut pas récupérer l'accessToken Google facilement via ce plugin nativement
      // sans configuration supplémentaire, mais le login Firebase fonctionnera.
      console.log('[Auth] Connecté (Native) :', result.user.displayName);
      return result;
    }

    // ── GESTION WEB CLASSIQUE ─────────────────────────────────────
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || null;
    
    // Transmet le token OAuth au service YouTube pour les recherches
    setYouTubeOAuthToken(token);
    console.log('[Auth] Connecté (Web) :', result.user.displayName, '| YouTube token:', token ? '✅' : '❌ absent');
    return result;
  } catch (error: any) {
    // Ignorer si l'utilisateur ferme la popup
    if (error?.code === 'auth/unauthorized-domain') {
      alert(`Domaine non autorisé ! \n\nVous utilisez probablement une IP locale (ex: ${window.location.hostname}). \n\nAllez dans votre Console Firebase > Auth > Settings > Authorized Domains et ajoutez : ${window.location.hostname}`);
    } else if (error?.code !== 'auth/popup-closed-by-user' && error?.message !== 'popup-closed-by-user') {
      console.error('[Auth] Erreur de connexion:', error);
      alert(`Erreur d'authentification: ${error.message}`);
    }
    return null;
  }
};

export const logout = async () => {
  setYouTubeOAuthToken(null);
  if (!auth) return;
  await signOut(auth);
};

export const onAuthChange = (cb: (user: User | null) => void) => {
  if (!auth) {
    cb(null);
    return () => {};
  }
  return onAuthStateChanged(auth, cb);
};

export type { User };
