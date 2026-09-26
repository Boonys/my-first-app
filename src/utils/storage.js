const TRANSACTIONS_KEY = 'transactions';

// createStorage takes its backend as an argument so the same logic can run
// against window.localStorage in the browser, a fake in tests, and later a
// remote API without any change to the callers.
export function createStorage(backend) {
  function readRaw(key) {
    try {
      return backend.getItem(key);
    } catch {
      return null;
    }
  }

  function writeRaw(key, value) {
    try {
      backend.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  return {
    load() {
      const raw = readRaw(TRANSACTIONS_KEY);

      if (raw === null) {
        return [];
      }

      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    },

    save(transactions) {
      return writeRaw(TRANSACTIONS_KEY, JSON.stringify(transactions));
    },

    clear() {
      try {
        backend.removeItem(TRANSACTIONS_KEY);
        return true;
      } catch {
        return false;
      }
    },

    loadKey(key, fallback = null) {
      const raw = readRaw(key);
      return raw === null ? fallback : raw;
    },

    saveKey(key, value) {
      return writeRaw(key, String(value));
    }
  };
}

// Resolved lazily so importing this module in Node (tests) never touches
// window.localStorage.
export function createBrowserStorage() {
  const backend =
    typeof globalThis !== 'undefined' && globalThis.localStorage
      ? globalThis.localStorage
      : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {}
        };

  return createStorage(backend);
}
