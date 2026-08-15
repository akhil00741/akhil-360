import { Shoot } from '../types/shoot';

// Dedicated High-Speed Worldwide Studio Cloud Database for AKHIL 360
const CLOUD_DB_URL = 'https://api.restful-api.dev/objects/ff8081819ff5b11001a003b9052f218f';

export interface CloudPayload {
  shoots: Shoot[];
  deletedIds: string[];
  updatedAt: string;
}

export const fetchCloudDatabase = async (): Promise<CloudPayload | null> => {
  try {
    const res = await fetch(CLOUD_DB_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    const data = json.data;
    if (data) {
      return {
        shoots: Array.isArray(data.shoots) ? data.shoots : [],
        deletedIds: Array.isArray(data.deletedIds) ? data.deletedIds : [],
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
    }
    return { shoots: [], deletedIds: [], updatedAt: new Date().toISOString() };
  } catch (err) {
    console.error('Error fetching cloud database:', err);
    return null;
  }
};

export const saveCloudDatabase = async (shoots: Shoot[], deletedIds: string[]): Promise<boolean> => {
  try {
    const cleanShoots = shoots.filter(s => !deletedIds.includes(s.id));
    const payload = {
      name: 'AKHIL_360_STUDIO_DB',
      data: {
        shoots: cleanShoots,
        deletedIds,
        updatedAt: new Date().toISOString(),
      },
    };

    const res = await fetch(CLOUD_DB_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return res.ok;
  } catch (err) {
    console.error('Error saving cloud database:', err);
    return false;
  }
};
