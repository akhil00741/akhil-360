import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, get, set, onValue, Unsubscribe } from 'firebase/database';
import { Shoot } from '../types/shoot';

const firebaseConfig = {
  apiKey: "AIzaSyDl4bTVhwdzuLQeKMCw2XQPDjt3E9wtY8U",
  authDomain: "akhil-360.firebaseapp.com",
  databaseURL: "https://akhil-360-default-rtdb.firebaseio.com",
  projectId: "akhil-360",
  storageBucket: "akhil-360.firebasestorage.app",
  messagingSenderId: "794900112395",
  appId: "1:794900112395:web:37f2a9bc345a414c8d530e",
  measurementId: "G-E6QNN8GXP4"
};

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);
const DB_PATH = 'akhil360/studio';

export interface CloudPayload {
  shoots: Shoot[];
  deletedIds: string[];
  updatedAt: string;
}

export const fetchCloudDatabase = async (): Promise<CloudPayload | null> => {
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
