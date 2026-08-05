import { HistoryItem } from '../types';

const DB_NAME = 'LogoGoDB';
const STORE_NAME = 'logo_history';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getHistoryFromDB(): Promise<HistoryItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const items = (request.result as HistoryItem[]) || [];
        items.sort((a, b) => b.timestamp - a.timestamp);
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB read error, falling back to localStorage:', err);
    try {
      const saved = localStorage.getItem('logo_go_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }
}

export async function saveHistoryToDB(history: HistoryItem[]): Promise<void> {
  const itemsToSave = history;
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    for (const item of itemsToSave) {
      store.put(item);
    }
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB write error, using compressed localStorage fallback:', err);
    try {
      const fallbackItems = itemsToSave.slice(0, 10).map(item => ({
        ...item,
        logo: {
          ...item.logo,
          referenceImage: null
        }
      }));
      localStorage.setItem('logo_go_history', JSON.stringify(fallbackItems));
    } catch (lsErr) {
      console.warn('LocalStorage fallback failed silently:', lsErr);
    }
  }
}

export async function deleteHistoryItemFromDB(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
  } catch (err) {
    console.warn('IndexedDB delete error:', err);
  }
}

export async function clearAllHistoryFromDB(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
  } catch (err) {
    console.warn('IndexedDB clear error:', err);
  } finally {
    try {
      localStorage.removeItem('logo_go_history');
    } catch {}
  }
}
