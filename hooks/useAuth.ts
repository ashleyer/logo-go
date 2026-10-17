import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, signOutUser, testConnection } from '../services/firebase';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuth = (): AuthState => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check initial connection
    testConnection().catch((err) => {
      console.warn('Initial connection probe:', err);
    });

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Auth state change error:', err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      setError(null);
      await signInWithGoogle();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to sign in with Google';
      // Suppress user-closed-popup cancel errors
      if (!msg.includes('popup-closed-by-user')) {
        setError(msg);
      }
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await signOutUser();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to sign out';
      setError(msg);
      throw err;
    }
  };

  return {
    user,
    isLoading,
    error,
    signIn,
    signOut,
  };
};
