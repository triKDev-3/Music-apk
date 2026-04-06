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
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Capacitor Google Auth
GoogleAuth.initialize({
  clientId: '742584976934-0nmes6v5qfv9vfhiqgvdcoa9qls9h86i.apps.googleusercontent.com',
  scopes: ['profile', 'email'],
  grantOfflineAccess: true,
});

const googleProvider = new GoogleAuthProvider();
// Enable YouTube scope to allow searching via user account
googleProvider.addScope('https://www.googleapis.com/auth/youtube.readonly');

export const loginWithGoogle = async () => {
  if (!auth) {
    console.error('Firebase not initialized');
    return null;
  }
  
  try {
    // ── NATIVE MOBILE (Capacitor) ───────────────────────
    if (Capacitor.isNativePlatform()) {
      console.log('[Auth] Native platform detected, using GoogleAuth plugin...');
      const googleUser = await GoogleAuth.signIn();
      const idToken = googleUser.authentication.idToken;
      
      if (!idToken) throw new Error("Missing ID Token from Google Auth");
      
      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);
      
      console.log('[Auth] Logged in (Native) :', result.user.displayName);
      return result;
    }

    // ── WEB ─────────────────────────────────────
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || null;
    
    // Pass OAuth token to YouTube service for searches
    setYouTubeOAuthToken(token);
    if (token) {
      localStorage.setItem('playme_youtube_token', token);
    }
    console.log('[Auth] Logged in (Web) :', result.user.displayName, '| YouTube token:', token ? '✅' : '❌');
    return result;
  } catch (error: any) {
    if (error?.code === 'auth/unauthorized-domain') {
      console.error('[Auth] Unauthorized domain. Add this domain to Firebase Console:', window.location.hostname);
    } else if (error?.code !== 'auth/popup-closed-by-user' && error?.code !== 'auth/cancelled-popup-request' && error?.message !== 'popup-closed-by-user') {
      console.error('[Auth] Login error:', error);
    }
    return null;
  }
};

export const logout = async () => {
  setYouTubeOAuthToken(null);
  localStorage.removeItem('playme_youtube_token');
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
