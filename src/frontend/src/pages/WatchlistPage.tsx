import { Skeleton } from "@/components/ui/skeleton";
import {
  Bookmark,
  Car,
  Link as LinkIcon,
  Loader2,
  Plus,
  Share2,
  Trash2,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddToWatchlist,
  useGenerateWatchlistShareToken,
  useGetWatchlist,
  useRemoveFromWatchlist,
} from "../hooks/useQueries";

export default function WatchlistPage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: watchlist, isLoading } = useGetWatchlist();
  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();
  const generateShareToken = useGenerateWatchlistShareToken();

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [note, setNote] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!make.trim() || !model.trim()) return;
    await addToWatchlist.mutateAsync({
      make: make.trim(),
      model: model.trim(),
      note: note.trim() || undefined,
    });
    setMake("");
    setModel("");
    setNote("");
    setShowForm(false);
    toast.success("Added to watchlist");
  };

  const handleRemove = async (id: bigint) => {
    await removeFromWatchlist.mutateAsync(id);
    toast.success("Removed from watchlist");
  };

  const handleShare = async () => {
    try {
      const token = await generateShareToken.mutateAsync();
      const url = `${window.location.origin}/shared-watchlist/${token}`;
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      toast.success("Link copied to clipboard!", {
        description: url,
        duration: 4000,
      });
      setTimeout(() => setLinkCopied(false), 3000);
    } catch {
      toast.error("Failed to generate share link");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8 bg-surface border border-steel-border rounded-xl max-w-sm">
          <Bookmark className="w-10 h-10 text-amber mx-auto mb-3" />
          <h2 className="text-lg font-bold text-foreground mb-2 font-rajdhani">
            Sign In Required
          </h2>
          <p className="text-sm text-muted-text">
            Please sign in to view and manage your watchlist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber/10 border border-amber/20">
              <Bookmark className="w-6 h-6 text-amber" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground font-rajdhani tracking-wide">
                My Watchlist
              </h1>
              <p className="text-sm text-muted-text">
                Track cars you're interested in
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Share Watchlist Button */}
            <button
              type="button"
              onClick={handleShare}
              disabled={generateShareToken.isPending}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-steel-border text-sm text-muted-text hover:text-amber hover:border-amber/40 transition-colors disabled:opacity-50"
              title="Generate a shareable read-only link"
            >
              {generateShareToken.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : linkCopied ? (
                <LinkIcon className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
              <span>{linkCopied ? "Link copied!" : "Share Watchlist"}</span>
            </button>

            {/* Add Button */}
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber text-zinc-900 text-sm font-semibold hover:bg-amber/80 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Car
            </button>
          </div>
        </div>

        {/* Add Form */}
        {showForm && (
          <form
            onSubmit={handleAdd}
            className="mb-6 p-4 bg-surface border border-steel-border rounded-xl space-y-3"
          >
            <h3 className="text-sm font-semibold text-foreground">
              Add to Watchlist
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Make (e.g. Toyota)"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                required
                className="px-3 py-2 rounded bg-background border border-steel-border text-foreground text-sm placeholder:text-muted-text focus:outline-none focus:border-amber/50"
              />
              <input
                type="text"
                placeholder="Model (e.g. Camry)"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
                className="px-3 py-2 rounded bg-background border border-steel-border text-foreground text-sm placeholder:text-muted-text focus:outline-none focus:border-amber/50"
              />
            </div>
            <input
              type="text"
              placeholder="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 rounded bg-background border border-steel-border text-foreground text-sm placeholder:text-muted-text focus:outline-none focus:border-amber/50"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={addToWatchlist.isPending}
                className="px-4 py-2 rounded bg-amber text-zinc-900 text-sm font-semibold hover:bg-amber/80 disabled:opacity-50 transition-colors"
              >
                {addToWatchlist.isPending ? "Adding…" : "Add"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded bg-surface border border-steel-border text-muted-foreground text-sm hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Watchlist */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => `skeleton-${i}`).map((key) => (
              <div
                key={key}
                className="p-4 rounded-lg bg-surface border border-steel-border"
              >
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </div>
        ) : !watchlist || watchlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bookmark className="w-12 h-12 text-muted-text mb-4 opacity-40" />
            <p className="text-lg font-semibold text-foreground mb-1">
              Your watchlist is empty
            </p>
            <p className="text-sm text-muted-text">
              Add cars you're interested in to track them here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {watchlist.map((entry) => (
              <div
                key={Number(entry.id)}
                className="flex items-start gap-4 p-4 rounded-lg bg-surface border border-steel-border hover:border-amber/40 transition-colors"
              >
                <div className="p-2 rounded-md bg-amber/10 border border-amber/20 shrink-0">
                  <Car className="w-4 h-4 text-amber" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">
                    {entry.make} {entry.model}
                  </p>
                  {entry.note && (
                    <p className="text-xs text-muted-text mt-0.5">
                      {entry.note}
                    </p>
                  )}
                  <p className="text-xs text-muted-text mt-1">
                    Added{" "}
                    {new Date(
                      Number(entry.createdAt) / 1_000_000,
                    ).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(entry.id)}
                  className="p-1.5 rounded text-muted-text hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
                  title="Remove from watchlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
