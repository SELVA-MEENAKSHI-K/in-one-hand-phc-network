/**
 * Safe LocalStorage and JSON Parsing Utilities
 * Provides resilient, error-guarded access to browser storage
 * preventing crashes from QuotaExceededError, SecurityError, or corrupted JSON.
 */

export const safeJsonParse = (value, fallback = null) => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch (err) {
    console.warn('[Storage] Failed to parse JSON, returning fallback:', err);
    return fallback;
  }
};

export const safeStorageGet = (key, fallback = null, isJson = true) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null || raw === undefined) {
      return fallback;
    }
    if (!isJson) {
      return raw;
    }
    return safeJsonParse(raw, fallback);
  } catch (err) {
    console.warn(`[Storage] Failed to read key "${key}":`, err);
    return fallback;
  }
};

export const safeStorageSet = (key, value, isJson = true) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    const serialized = isJson ? JSON.stringify(value) : String(value);
    window.localStorage.setItem(key, serialized);
    return true;
  } catch (err) {
    console.warn(`[Storage] Failed to write key "${key}":`, err);
    return false;
  }
};

export const safeStorageRemove = (key) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (err) {
    console.warn(`[Storage] Failed to remove key "${key}":`, err);
    return false;
  }
};

export const safeStorageClear = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    window.localStorage.clear();
    return true;
  } catch (err) {
    console.warn('[Storage] Failed to clear localStorage:', err);
    return false;
  }
};
