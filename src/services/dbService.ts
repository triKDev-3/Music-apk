import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebaseService';
import { Track, Playlist } from '../types';

interface UserData {
  favorites: string[];
  stats: {
    totalTime: number;
    playCount: Record<string, number>;
    recentlyPlayed: string[];
  };
  playlists: Playlist[];
  localTracks: Track[];
}

/**
 * Saves all user-related data to Firestore.
 */
export async function saveUserData(userId: string, data: Partial<UserData>) {
  if (!db) return;
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, data, { merge: true });
  } catch (err) {
    console.error('[dbService] Error saving user data:', err);
  }
}

/**
 * Loads user-related data from Firestore.
 */
export async function loadUserData(userId: string): Promise<UserData | null> {
  if (!db) return null;
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserData;
    }
    return null;
  } catch (err) {
    console.error('[dbService] Error loading user data:', err);
    return null;
  }
}
