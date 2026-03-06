import { useCallback, useEffect, useState } from "react";
import { useInternetIdentity } from "./useInternetIdentity";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PrivateNote {
  id: string;
  text: string;
  lastUpdated: bigint;
}

type NotesStorage = Record<
  string,
  { id: string; text: string; lastUpdated: string }
>;

function storageKey(principal: string): string {
  return `atp_notes_${principal}`;
}

function loadFromStorage(principal: string): Map<string, PrivateNote> {
  try {
    const raw = localStorage.getItem(storageKey(principal));
    if (!raw) return new Map();
    const parsed: NotesStorage = JSON.parse(raw);
    const entries = Object.entries(parsed).map(
      ([listingId, note]) =>
        [
          listingId,
          {
            id: note.id,
            text: note.text,
            lastUpdated: BigInt(note.lastUpdated),
          } satisfies PrivateNote,
        ] as [string, PrivateNote],
    );
    return new Map(entries);
  } catch {
    return new Map();
  }
}

function saveToStorage(
  principal: string,
  notesMap: Map<string, PrivateNote>,
): void {
  try {
    const obj: NotesStorage = {};
    for (const [listingId, note] of notesMap.entries()) {
      obj[listingId] = {
        id: note.id,
        text: note.text,
        lastUpdated: String(note.lastUpdated),
      };
    }
    localStorage.setItem(storageKey(principal), JSON.stringify(obj));
  } catch {
    // localStorage quota exceeded or unavailable — silent
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePrivateNotes() {
  const { identity } = useInternetIdentity();
  const [notesMap, setNotesMap] = useState<Map<string, PrivateNote>>(new Map());
  const [principalText, setPrincipalText] = useState<string | null>(null);

  // Load from localStorage when identity becomes available
  useEffect(() => {
    if (!identity) {
      setNotesMap(new Map());
      setPrincipalText(null);
      return;
    }

    const principal = identity.getPrincipal().toString();
    setPrincipalText(principal);
    const stored = loadFromStorage(principal);
    setNotesMap(stored);
  }, [identity]);

  const saveNote = useCallback(
    (listingId: string, text: string) => {
      if (!principalText) return;

      const note: PrivateNote = {
        id: listingId,
        text,
        lastUpdated: BigInt(Date.now() * 1_000_000),
      };

      setNotesMap((prev) => {
        const next = new Map(prev);
        next.set(listingId, note);
        // Persist after state update
        saveToStorage(principalText, next);
        return next;
      });
    },
    [principalText],
  );

  const deleteNote = useCallback(
    (listingId: string) => {
      if (!principalText) return;

      setNotesMap((prev) => {
        const next = new Map(prev);
        next.delete(listingId);
        // Persist after state update
        saveToStorage(principalText, next);
        return next;
      });
    },
    [principalText],
  );

  return {
    notesMap,
    saveNote,
    deleteNote,
  };
}
