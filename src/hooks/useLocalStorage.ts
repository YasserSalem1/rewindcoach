import { useCallback, useEffect, useRef, useState } from "react";

type Serializer<T> = (value: T) => string;
type Deserializer<T> = (raw: string) => T;

const isBrowser = () => typeof window !== "undefined";

/**
 * Small helper that persists state to localStorage and rehydrates on mount.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: {
    serializer?: Serializer<T>;
    deserializer?: Deserializer<T>;
  } = {},
) {
  const { serializer = JSON.stringify, deserializer = JSON.parse } = options;
  const initialised = useRef(false);
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    if (!isBrowser() || initialised.current) {
      return;
    }
    initialised.current = true;

    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) {
        setValue(deserializer(stored));
      } else {
        window.localStorage.setItem(key, serializer(initialValue));
      }
    } catch (error) {
      console.warn("[useLocalStorage] Failed to read from localStorage", error);
    }
  }, [deserializer, initialValue, key, serializer]);

  useEffect(() => {
    if (!isBrowser()) {
      return;
    }

    try {
      window.localStorage.setItem(key, serializer(value));
    } catch (error) {
      console.warn("[useLocalStorage] Failed to persist to localStorage", error);
    }
  }, [key, serializer, value]);

  const update = useCallback((next: T | ((current: T) => T)) => {
    setValue((prev) => {
      if (typeof next === "function") {
        const updater = next as (current: T) => T;
        return updater(prev);
      }
      return next;
    });
  }, []);

  return [value, update] as const;
}
