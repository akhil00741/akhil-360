import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, get, set, onValue, Unsubscribe } from 'firebase/database';
import { Shoot } from '../types/shoot';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

const DB_PATH = import.meta.env.VITE_FIREBASE_DB_PATH || 'akhil360/studio';

export const isCloudSyncConfigured =
  import.meta.env.VITE_ENABLE_CLOUD_SYNC === 'true' &&
  Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.databaseURL &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
  );

const getConfiguredDatabase = () => {
  if (!isCloudSyncConfigured) return null;

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  return getDatabase(app);
};

export interface CloudPayload {
  shoots: Shoot[];
  deletedIds: string[];
  updatedAt: string;
}

export const fetchCloudDatabase = async (): Promise<CloudPayload | null> => {
  const db = getConfiguredDatabase();
  if (!db) {
    return { shoots: [], deletedIds: [], updatedAt: new Date().toISOString() };
  }

  try {
    const snapshot = await get(ref(db, DB_PATH));
    if (snapshot.exists()) {
      const data = snapshot.val();
      return {
        shoots: Array.isArray(data.shoots) ? data.shoots : [],
        deletedIds: Array.isArray(data.deletedIds) ? data.deletedIds : [],
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
    }
    return { shoots: [], deletedIds: [], updatedAt: new Date().toISOString() };
  } catch (err) {
    console.error('Firebase fetch error:', err);
    return null;
  }
};

export const saveCloudDatabase = async (shoots: Shoot[], deletedIds: string[]): Promise<boolean> => {
  const db = getConfiguredDatabase();
  if (!db) return true;

  try {
    const cleanShoots = shoots.filter(s => !deletedIds.includes(s.id));
    await set(ref(db, DB_PATH), {
      shoots: cleanShoots,
      deletedIds,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error('Firebase save error:', err);
    return false;
  }
};

export const subscribeToCloudDatabase = (callback: (payload: CloudPayload) => void): Unsubscribe => {
  const db = getConfiguredDatabase();
  if (!db) {
    callback({ shoots: [], deletedIds: [], updatedAt: new Date().toISOString() });
    return () => {};
  }

  return onValue(ref(db, DB_PATH), (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      callback({
        shoots: Array.isArray(data.shoots) ? data.shoots : [],
        deletedIds: Array.isArray(data.deletedIds) ? data.deletedIds : [],
        updatedAt: data.updatedAt || new Date().toISOString(),
      });
    } else {
      callback({ shoots: [], deletedIds: [], updatedAt: new Date().toISOString() });
    }
  }, (err) => {
    console.error('Firebase subscription error:', err);
  });
};
