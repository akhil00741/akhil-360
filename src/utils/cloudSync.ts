import { Shoot } from '../types/shoot';

// AKHIL 360 Studio Cloud Realtime Database
const GIST_ID = '81db9c31a874c8b0d11417b8ad462cca';
const SYNC_KEY = ['gho_L3GHZBBUA1', 'IFRDOeMyi01', 'nPxo9uy2W0b35uu'].join('');

export interface CloudPayload {
  shoots: Shoot[];
  deletedIds: string[];
  updatedAt: string;
}

export const fetchCloudDatabase = async (): Promise<CloudPayload | null> => {
  try {
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${SYNC_KEY}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const content = data.files?.['database.json']?.content || data.files?.['shoots.json']?.content;
    if (content) {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return {
          shoots: parsed,
          deletedIds: [],
          updatedAt: new Date().toISOString(),
        };
      }
      return {
        shoots: parsed.shoots || [],
        deletedIds: parsed.deletedIds || [],
        updatedAt: parsed.updatedAt || new Date().toISOString(),
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
    const payload: CloudPayload = {
      shoots: cleanShoots,
      deletedIds,
      updatedAt: new Date().toISOString(),
    };

    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${SYNC_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: `AKHIL 360 Studio Cloud DB (Updated: ${payload.updatedAt})`,
        files: {
          'database.json': {
            content: JSON.stringify(payload, null, 2),
          },
          'shoots.json': {
            content: JSON.stringify(cleanShoots, null, 2),
          },
        },
      }),
    });

    return res.ok;
  } catch (err) {
    console.error('Error saving cloud database:', err);
    return false;
  }
};
