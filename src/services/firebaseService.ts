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
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import firebaseConfig from '../../firebase-applet-config.json';
// Initialize Firebase — une seule instance (pattern singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  if (!auth) {
    alert('Firebase non configuré. Voir SETUP_GUIDE.md.');
    return null;
  }
  
  try {
    // ── GESTION MOBILE NATIVE (Capacitor) ───────────────────────
    if (Capacitor.isNativePlatform()) {
      console.log('[Auth] Connexion Native (Firebase Authentication)...');
      
      let result: any;
      try {
        result = await FirebaseAuthentication.signInWithGoogle();
      } catch (nativeErr: any) {
        console.error('[Auth] Erreur plugin natif signInWithGoogle:', nativeErr);
        const msg = nativeErr?.message || nativeErr?.code || JSON.stringify(nativeErr);
        alert(`Erreur Auth Native : ${msg}`);
        return null;
      }
      
      const idToken = result?.credential?.idToken;
      if (!idToken) {
        console.error('[Auth] ID Token absent dans le résultat natif:', JSON.stringify(result));
        alert('Erreur Auth : ID Token Google manquant. Vérifiez votre SHA-1 dans Firebase Console.');
        return null;
      }
      
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      
      console.log('[Auth] Connecté via Native SDK :', userCredential.user.displayName);
      return userCredential;
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
