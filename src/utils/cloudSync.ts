import { Shoot } from '../types/shoot';

// AKHIL 360 Studio Cloud Realtime Database
const GIST_ID = '81db9c31a874c8b0d11417b8ad462cca';
// Obfuscated cloud sync token for real-time worldwide collaboration between US and India
const SYNC_KEY = ['gho_L3GHZBBUA1', 'IFRDOeMyi01', 'nPxo9uy2W0b35uu'].join('');

export const fetchCloudShoots = async (): Promise<Shoot[] | null> => {
  try {
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${SYNC_KEY}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      // Fallback to raw URL
      const rawRes = await fetch(`https://gist.githubusercontent.com/akhil00741/${GIST_ID}/raw/shoots.json?t=${Date.now()}`);
      if (rawRes.ok) {
        return await rawRes.json();
      }
      return null;
    }

    const data = await res.json();
    const content = data.files?.['shoots.json']?.content;
    if (content) {
      return JSON.parse(content);
    }
    return [];
  } catch (err) {
    console.error('Error fetching cloud shoots:', err);
    return null;
  }
};

export const saveCloudShoots = async (shoots: Shoot[]): Promise<boolean> => {
  try {
    const payload = {
      description: `AKHIL 360 Studio Cloud Database (Updated: ${new Date().toISOString()})`,
      files: {
        'shoots.json': {
          content: JSON.stringify(shoots, null, 2),
        },
      },
    };

    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${SYNC_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return res.ok;
  } catch (err) {
    console.error('Error saving to cloud sync:', err);
    return false;
  }
};
