import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2, StickyNote, Trash2 } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";

// Local type definition (matches PrivateNote from usePrivateNotes)
export interface PrivateNote {
  id: string;
  text: string;
  lastUpdated: bigint;
}

const MAX_CHARS = 500;

function formatRelativeTime(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  const diffMs = Date.now() - ms;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export interface ListingNoteButtonProps {
  listingId: string;
  note: PrivateNote | null | undefined;
  isAuthenticated: boolean;
  /** Called when user saves a note (listingId, text) */
  onSave: (listingId: string, text: string) => void;
  /** Called when user deletes a note (listingId) */
  onDelete: (listingId: string) => void;
  /** @deprecated Use onSave/onDelete instead — kept for backward compatibility */
  onNoteChange?: (listingId: string, note: PrivateNote | null) => void;
}

export default function ListingNoteButton({
  listingId,
  note,
  isAuthenticated,
  onSave,
  onDelete,
  onNoteChange,
}: ListingNoteButtonProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync local text state when popover opens or note changes
  useEffect(() => {
    if (open) {
      setText(note?.text ?? "");
      // Focus textarea after open animation
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    }
  }, [open, note]);

  const hasNote = Boolean(note?.text);
  const charsLeft = MAX_CHARS - text.length;
  const isDirty = text !== (note?.text ?? "");

  const handleSave = () => {
    if (!isDirty || text.length === 0) return;
    setIsSaving(true);

    // Brief UX spinner (localStorage is synchronous — feels instant without it)
    setTimeout(() => {
      onSave(listingId, text);
      // Also call legacy callback if provided
      if (onNoteChange) {
        const updated: PrivateNote = {
          id: listingId,
          text,
          lastUpdated: BigInt(Date.now() * 1_000_000),
        };
        onNoteChange(listingId, updated);
      }
      setIsSaving(false);
      setOpen(false);
    }, 100);
  };

  const handleDelete = () => {
    setIsDeleting(true);

    setTimeout(() => {
      onDelete(listingId);
      // Also call legacy callback if provided
      if (onNoteChange) {
        onNoteChange(listingId, null);
      }
      setIsDeleting(false);
      setOpen(false);
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="p-1.5 rounded text-muted-foreground/40 cursor-not-allowed"
              tabIndex={-1}
              aria-disabled="true"
              type="button"
            >
              <StickyNote className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Log in to add notes</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={`p-1.5 rounded transition-colors ${
                  hasNote
                    ? "text-amber-500 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-amber-500/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface"
                }`}
                aria-label={hasNote ? "Edit note" : "Add note"}
              >
                <StickyNote className="w-3.5 h-3.5" />
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{hasNote ? "Edit note" : "Add private note"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <PopoverContent
        className="w-80 p-0 overflow-hidden border border-steel-border bg-popover shadow-xl"
        side="left"
        align="start"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-steel-border bg-surface/50">
          <StickyNote className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Private Note
          </span>
          {note?.lastUpdated && (
            <span className="ml-auto text-xs text-muted-foreground">
              {formatRelativeTime(note.lastUpdated)}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-3 space-y-2.5">
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              if (e.target.value.length <= MAX_CHARS) {
                setText(e.target.value);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Called dealer — willing to negotiate…"
            rows={4}
            className="resize-none text-sm bg-background border-steel-border focus:border-amber-500 focus:ring-0 placeholder:text-muted-foreground/60"
          />

          {/* Character counter */}
          <div className="flex items-center justify-between">
            <span
              className={`text-xs ${
                charsLeft < 50
                  ? charsLeft < 10
                    ? "text-red-600 dark:text-red-400"
                    : "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground"
              }`}
            >
              {text.length} / {MAX_CHARS}
            </span>
            <span className="text-xs text-muted-foreground/60">⌘↵ to save</span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-2 px-3 pb-3">
          <Button
            onClick={handleSave}
            disabled={isSaving || isDeleting || !isDirty || text.length === 0}
            size="sm"
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Note"
            )}
          </Button>

          {hasNote && (
            <Button
              onClick={handleDelete}
              disabled={isSaving || isDeleting}
              size="sm"
              variant="ghost"
              className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/10 disabled:opacity-50 px-2.5"
            >
              {isDeleting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Trash2 className="w-3 h-3" />
              )}
            </Button>
          )}

          <Button
            onClick={() => setOpen(false)}
            disabled={isSaving || isDeleting}
            size="sm"
            variant="ghost"
            className="text-xs text-muted-foreground hover:text-foreground px-2.5"
          >
            Cancel
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
