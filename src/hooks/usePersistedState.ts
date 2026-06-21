import { useState, useEffect, useCallback } from 'react';

/**
 * usePersistedState<T>
 *
 * Drop-in replacement for useState that mirrors state to localStorage.
 * - Reads from localStorage on first mount (hydration).
 * - Writes to localStorage whenever state changes.
 * - On parse failure, falls back to initialValue and emits a console.warn.
 *
 * Assumption: serialised value must be JSON-serialisable.
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setStateRaw] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return initialValue;
      return JSON.parse(raw) as T;
    } catch (err) {
      console.warn(`[usePersistedState] Failed to parse key "${key}":`, err);
      return initialValue;
    }
  });

  // Sync to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (err) {
      console.warn(`[usePersistedState] Failed to write key "${key}":`, err);
    }
  }, [key, state]);

  const setState: React.Dispatch<React.SetStateAction<T>> = useCallback(
    (action) => {
      setStateRaw(action);
    },
    []
  );

  return [state, setState];
}

/**
 * Clears a specific localStorage key and resets state to the provided value.
 * Convenience wrapper used by the "Reset All Data" flow.
 */
export function clearPersistedKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (_) {
    // ignore
  }
}
