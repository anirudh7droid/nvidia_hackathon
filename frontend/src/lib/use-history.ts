"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { SavedReport } from "@/lib/types";

const STORAGE_KEY = "deepdive.history.v1";
const MAX_ITEMS = 50;
const EMPTY: SavedReport[] = [];

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedItems: SavedReport[] = EMPTY;

function getSnapshot(): SavedReport[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return cachedItems;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedItems = raw ? (JSON.parse(raw) as SavedReport[]) : EMPTY;
    } catch {
      cachedItems = EMPTY;
    }
  }
  return cachedItems;
}

function getServerSnapshot(): SavedReport[] {
  return EMPTY;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function write(items: SavedReport[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage full or unavailable — history is a convenience, not critical.
  }
  listeners.forEach((listener) => listener());
}

export function useHistory() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const save = useCallback((report: Omit<SavedReport, "id">) => {
    const item: SavedReport = { ...report, id: crypto.randomUUID() };
    write([item, ...getSnapshot()].slice(0, MAX_ITEMS));
    return item;
  }, []);

  const remove = useCallback((id: string) => {
    write(getSnapshot().filter((item) => item.id !== id));
  }, []);

  const clear = useCallback(() => {
    write([]);
  }, []);

  return { items, save, remove, clear };
}
