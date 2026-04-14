import { useState, useEffect } from 'react';
import { onAuthChange, type User } from '../services/firebaseService';

/**
 * Custom hook for Firebase Authentication.
 * Handles user state and provides sign-in/sign-out functionality.
 */
export function useAuth() {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthChange(u => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { user, loading };
}
