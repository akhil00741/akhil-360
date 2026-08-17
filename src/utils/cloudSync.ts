import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, get, onValue, update, Unsubscribe } from 'firebase/database';
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

export const cloudDatabasePath = DB_PATH;

export const isCloudSyncConfigured =
  import.meta.env.VITE_ENABLE_CLOUD_SYNC !== 'false' &&
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

const parseCloudPayload = (value: unknown): CloudPayload => {
  const data = value && typeof value === 'object' ? value as {
    shoots?: unknown;
    shootsById?: Record<string, Shoot | null | undefined>;
    deletedIds?: unknown;
    deletedIdsById?: Record<string, boolean | null | undefined>;
    updatedAt?: string;
  } : {};

  const legacyShoots = Array.isArray(data.shoots)
    ? data.shoots.filter((shoot): shoot is Shoot => Boolean(shoot?.id))
    : [];
  const keyedShoots = data.shootsById && typeof data.shootsById === 'object'
    ? Object.values(data.shootsById).filter((shoot): shoot is Shoot => Boolean(shoot?.id))
    : [];
  const shootMap = new Map<string, Shoot>();

  [...legacyShoots, ...keyedShoots].forEach((shoot) => {
    const existing = shootMap.get(shoot.id);
    if (!existing || new Date(shoot.updatedAt || 0) >= new Date(existing.updatedAt || 0)) {
      shootMap.set(shoot.id, shoot);
    }
  });

  const legacyDeletedIds = Array.isArray(data.deletedIds)
    ? data.deletedIds.filter((id): id is string => typeof id === 'string')
    : [];
  const keyedDeletedIds = data.deletedIdsById && typeof data.deletedIdsById === 'object'
    ? Object.entries(data.deletedIdsById)
        .filter(([, isDeleted]) => Boolean(isDeleted))
        .map(([id]) => id)
    : [];

  return {
    shoots: Array.from(shootMap.values()),
    deletedIds: Array.from(new Set([...legacyDeletedIds, ...keyedDeletedIds])),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
};

export const fetchCloudDatabase = async (): Promise<CloudPayload | null> => {
  const db = getConfiguredDatabase();
  if (!db) {
    return { shoots: [], deletedIds: [], updatedAt: new Date().toISOString() };
  }

  try {
    const snapshot = await get(ref(db, DB_PATH));
    if (snapshot.exists()) {
      return parseCloudPayload(snapshot.val());
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
    const updatedAt = new Date().toISOString();
    const cleanDeletedIds = Array.from(new Set(deletedIds));
    const cleanShoots = shoots.filter(s => !cleanDeletedIds.includes(s.id));
    const updates: Record<string, Shoot | Shoot[] | string | string[] | boolean | null> = {
      updatedAt,
      shoots: cleanShoots,
      deletedIds: cleanDeletedIds,
    };

    cleanShoots.forEach((shoot) => {
      updates[`shootsById/${shoot.id}`] = shoot;
    });

    cleanDeletedIds.forEach((id) => {
      updates[`deletedIdsById/${id}`] = true;
      updates[`shootsById/${id}`] = null;
    });

    await update(ref(db, DB_PATH), updates);
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
      callback(parseCloudPayload(snapshot.val()));
    } else {
      callback({ shoots: [], deletedIds: [], updatedAt: new Date().toISOString() });
    }
  }, (err) => {
    console.error('Firebase subscription error:', err);
  });
};
