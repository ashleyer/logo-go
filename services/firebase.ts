import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy, 
  getDocFromServer,
  Timestamp 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { HistoryItem } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Test connection on boot per Firebase skill guidelines
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline notice. Please verify network or project connectivity.');
    }
    // Expected to fail permission on dummy doc, which confirms rules and connection are reachable
    return false;
  }
}

// Structured error handling matching FirestoreErrorInfo specification
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Auth Helpers
export const signInWithGoogle = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Sync user profile document upon sign in
    if (result.user) {
      const userRef = doc(db, 'users', result.user.uid);
      await setDoc(userRef, {
        userId: result.user.uid,
        email: result.user.email || '',
        displayName: result.user.displayName || 'Logo Creator',
        photoURL: result.user.photoURL || '',
        createdAt: new Date().toISOString(),
      }, { merge: true });
    }
    return result.user;
  } catch (err) {
    console.error('Error signing in with Google:', err);
    throw err;
  }
};

export const signOutUser = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (err) {
    console.error('Error signing out:', err);
    throw err;
  }
};

// Cloud Saved Logos Operations
export const saveLogoToCloud = async (userId: string, item: HistoryItem): Promise<void> => {
  if (!userId || !item || !item.logo) return;
  const path = `users/${userId}/savedLogos/${item.id}`;
  try {
    const logoRef = doc(db, 'users', userId, 'savedLogos', item.id);
    await setDoc(logoRef, {
      id: item.id,
      userId: userId,
      prompt: item.prompt.slice(0, 2000),
      style: item.style || 'minimalist',
      base64: item.logo.base64,
      mimeType: item.logo.mimeType || 'image/png',
      svgContent: item.logo.svgContent || '',
      videoUrl: item.video?.uri || item.video?.blobUrl || '',
      timestamp: item.timestamp || Date.now(),
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

export const getUserSavedLogos = async (userId: string): Promise<HistoryItem[]> => {
  if (!userId) return [];
  const path = `users/${userId}/savedLogos`;
  try {
    const logosCollection = collection(db, 'users', userId, 'savedLogos');
    const snapshot = await getDocs(logosCollection);
    const items: HistoryItem[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      items.push({
        id: data.id || docSnap.id,
        timestamp: data.timestamp || Date.now(),
        prompt: data.prompt || 'Saved Logo',
        style: data.style || 'minimalist',
        logo: {
          base64: data.base64,
          mimeType: data.mimeType || 'image/png',
          style: data.style,
          svgContent: data.svgContent || undefined,
        },
        video: data.videoUrl ? {
          uri: data.videoUrl,
          blobUrl: data.videoUrl,
          mimeType: 'video/mp4',
        } : null,
        isCloudSaved: true,
      });
    });
    // Sort newest first
    return items.sort((a, b) => b.timestamp - a.timestamp);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
};

export const deleteUserSavedLogo = async (userId: string, logoId: string): Promise<void> => {
  if (!userId || !logoId) return;
  const path = `users/${userId}/savedLogos/${logoId}`;
  try {
    const logoRef = doc(db, 'users', userId, 'savedLogos', logoId);
    await deleteDoc(logoRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
};
