type OfflineEntry<T> = {
  key: string;
  value: T;
  updatedAt: number;
};

const DB_NAME = "kirubai-offline-cache";
const DB_VERSION = 1;
const STORE_NAME = "entries";
const LOCAL_STORAGE_PREFIX = "kirubai-offline:";

const hasIndexedDB = typeof globalThis.indexedDB !== "undefined";
const hasLocalStorage = typeof globalThis.localStorage !== "undefined";

let dbPromise: Promise<IDBDatabase> | null = null;

function getDatabase(): Promise<IDBDatabase> | null {
  if (!hasIndexedDB) {
    return null;
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    try {
      const request = globalThis.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "key" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        const error = request.error || new Error("Unable to open offline cache.");
        dbPromise = null;
        reject(error);
      };
      request.onblocked = () => {
        dbPromise = null;
        reject(new Error("Offline cache open blocked."));
      };
    } catch (error) {
      dbPromise = null;
      reject(error);
    }
  });

  return dbPromise;
}

async function readFromDb<T>(key: string): Promise<OfflineEntry<T> | null> {
  const db = await getDatabase();
  if (!db) {
    return null;
  }

  return new Promise((resolve, reject) => {
    let transaction: IDBTransaction;
    try {
      transaction = db.transaction(STORE_NAME, "readonly");
    } catch (error) {
      reject(error);
      return;
    }

    const request = transaction.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function writeToDb<T>(entry: OfflineEntry<T>): Promise<void> {
  const db = await getDatabase();
  if (!db) {
    return;
  }

  return new Promise((resolve, reject) => {
    let transaction: IDBTransaction;
    try {
      transaction = db.transaction(STORE_NAME, "readwrite");
    } catch (error) {
      reject(error);
      return;
    }

    transaction.oncomplete = () => resolve();
    transaction.onabort = () =>
      reject(transaction.error || new Error("Offline cache write aborted."));
    transaction.onerror = () =>
      reject(transaction.error || new Error("Offline cache write failed."));

    try {
      transaction.objectStore(STORE_NAME).put(entry);
    } catch (error) {
      reject(error);
    }
  });
}

function localStorageKey(key: string) {
  return `${LOCAL_STORAGE_PREFIX}${key}`;
}

function readFromLocalStorage<T>(key: string): OfflineEntry<T> | null {
  if (!hasLocalStorage) {
    return null;
  }

  try {
    const raw = globalThis.localStorage.getItem(localStorageKey(key));
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as OfflineEntry<T>;
  } catch {
    return null;
  }
}

function writeToLocalStorage<T>(entry: OfflineEntry<T>): void {
  if (!hasLocalStorage) {
    return;
  }

  try {
    globalThis.localStorage.setItem(
      localStorageKey(entry.key),
      JSON.stringify(entry),
    );
  } catch {
    // ignore quota / private mode errors
  }
}

export async function setOfflineData<T>(key: string, value: T): Promise<void> {
  const entry: OfflineEntry<T> = {
    key,
    value,
    updatedAt: Date.now(),
  };

  try {
    await writeToDb(entry);
  } catch {
    writeToLocalStorage(entry);
    return;
  }

  writeToLocalStorage(entry);
}

export async function getOfflineData<T>(key: string): Promise<T | null> {
  const fallback = readFromLocalStorage<T>(key);

  try {
    const entry = await readFromDb<T>(key);
    if (entry?.value !== undefined) {
      return entry.value;
    }
  } catch {
    // ignore and rely on fallback
  }

  return fallback?.value ?? null;
}

export async function fetchWithOffline<T>(
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  try {
    const data = await fetcher();
    await setOfflineData(key, data);
    return data;
  } catch (error) {
    const cached = await getOfflineData<T>(key);
    if (cached !== null) {
      return cached;
    }
    throw error;
  }
}
