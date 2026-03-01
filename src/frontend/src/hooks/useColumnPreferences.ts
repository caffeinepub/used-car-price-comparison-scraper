import { useCallback, useEffect, useRef, useState } from "react";
import { useInternetIdentity } from "./useInternetIdentity";
import { useSaveUserPreferences, useUserPreferences } from "./useQueries";

export interface ColumnDef {
  key: string;
  label: string;
  required?: boolean;
}

export const DEFAULT_COLUMNS: ColumnDef[] = [
  { key: "checkbox", label: "Select", required: true },
  { key: "make", label: "Make" },
  { key: "model", label: "Model" },
  { key: "year", label: "Year" },
  { key: "mileage", label: "Mileage" },
  { key: "price", label: "Price" },
  { key: "pricePerMile", label: "Price/Mile" },
  { key: "trim", label: "Trim" },
  { key: "condition", label: "Condition" },
  { key: "dealer", label: "Dealer" },
  { key: "source", label: "Source" },
  { key: "dealScore", label: "Deal Score" },
  { key: "priceChange", label: "Price Change" },
  { key: "belowTarget", label: "Below Target" },
  { key: "age", label: "Age" },
  { key: "actions", label: "Actions", required: true },
];

const STORAGE_KEY = "dashboard_column_prefs";

export interface ColumnPrefs {
  order: string[];
  hidden: string[];
}

function loadLocalPrefs(): ColumnPrefs | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ColumnPrefs;
  } catch {
    return null;
  }
}

function saveLocalPrefs(prefs: ColumnPrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

function applyPrefs(prefs: ColumnPrefs): {
  columns: ColumnDef[];
  hiddenKeys: Set<string>;
} {
  const defaultKeys = DEFAULT_COLUMNS.map((c) => c.key);
  const savedOrder = prefs.order.filter((k) => defaultKeys.includes(k));
  const newKeys = defaultKeys.filter((k) => !savedOrder.includes(k));
  const finalOrder = [...savedOrder, ...newKeys];

  const columns = finalOrder.map(
    (key) => DEFAULT_COLUMNS.find((c) => c.key === key)!,
  );
  const hiddenKeys = new Set(prefs.hidden);
  return { columns, hiddenKeys };
}

export function useColumnPreferences() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: backendPrefs, isFetched: prefsFetched } = useUserPreferences();
  const saveUserPrefs = useSaveUserPreferences();

  // Track whether we've hydrated from backend
  const hydratedFromBackend = useRef(false);

  const [columns, setColumns] = useState<ColumnDef[]>(() => {
    const prefs = loadLocalPrefs();
    if (!prefs) return DEFAULT_COLUMNS;
    return applyPrefs(prefs).columns;
  });

  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(() => {
    const prefs = loadLocalPrefs();
    if (!prefs) return new Set();
    return applyPrefs(prefs).hiddenKeys;
  });

  // Hydrate from backend when authenticated and preferences are loaded
  useEffect(() => {
    if (!isAuthenticated || !prefsFetched || hydratedFromBackend.current)
      return;

    hydratedFromBackend.current = true;

    if (backendPrefs?.columnPrefsJson) {
      try {
        const parsed = JSON.parse(backendPrefs.columnPrefsJson) as ColumnPrefs;
        const { columns: hydratedColumns, hiddenKeys: hydratedHidden } =
          applyPrefs(parsed);
        setColumns(hydratedColumns);
        setHiddenKeys(hydratedHidden);
        // Also sync to localStorage
        saveLocalPrefs(parsed);
      } catch {
        // Fall back to localStorage if JSON is invalid
      }
    }
  }, [isAuthenticated, prefsFetched, backendPrefs]);

  // Reset hydration flag when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      hydratedFromBackend.current = false;
    }
  }, [isAuthenticated]);

  // Persist to localStorage and backend whenever columns or hiddenKeys change
  // Use a ref to skip the initial render and backend-hydration updates
  const isFirstRender = useRef(true);
  const prevColumnsRef = useRef(columns);
  const prevHiddenRef = useRef(hiddenKeys);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevColumnsRef.current = columns;
      prevHiddenRef.current = hiddenKeys;
      return;
    }

    // Check if anything actually changed
    const columnsChanged = columns !== prevColumnsRef.current;
    const hiddenChanged = hiddenKeys !== prevHiddenRef.current;
    if (!columnsChanged && !hiddenChanged) return;

    prevColumnsRef.current = columns;
    prevHiddenRef.current = hiddenKeys;

    const prefs: ColumnPrefs = {
      order: columns.map((c) => c.key),
      hidden: Array.from(hiddenKeys),
    };

    saveLocalPrefs(prefs);

    if (isAuthenticated && hydratedFromBackend.current) {
      const columnPrefsJson = JSON.stringify(prefs);
      const currentTheme = localStorage.getItem("app_theme") ?? "dark";
      saveUserPrefs.mutate({ columnPrefsJson, theme: currentTheme });
    }
  }, [columns, hiddenKeys, isAuthenticated, saveUserPrefs]);

  const toggleColumn = useCallback((key: string) => {
    const col = DEFAULT_COLUMNS.find((c) => c.key === key);
    if (col?.required) return;
    setHiddenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const moveColumn = useCallback((key: string, direction: "up" | "down") => {
    setColumns((prev) => {
      const idx = prev.findIndex((c) => c.key === key);
      if (idx === -1) return prev;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  }, []);

  const reorderColumns = useCallback((fromKey: string, toKey: string) => {
    setColumns((prev) => {
      const fromIdx = prev.findIndex((c) => c.key === fromKey);
      const toIdx = prev.findIndex((c) => c.key === toKey);
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  }, []);

  const visibleColumns = columns.filter((c) => !hiddenKeys.has(c.key));

  return {
    columns,
    hiddenKeys,
    visibleColumns,
    toggleColumn,
    moveColumn,
    reorderColumns,
  };
}
