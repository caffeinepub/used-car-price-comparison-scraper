import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  Check,
  LogIn,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useDeleteSavedSearch,
  useGetSavedSearches,
  useRenameSavedSearch,
} from "../hooks/useQueries";

interface SavedSearch {
  id: bigint;
  name: string;
  filterJson: string;
  createdAt: bigint;
}

function SearchCard({
  search,
  onDelete,
  onRename,
}: {
  search: SavedSearch;
  onDelete: (id: bigint) => void;
  onRename: (id: bigint, name: string) => void;
}) {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(search.name);

  const handleApply = () => {
    try {
      const filters = JSON.parse(search.filterJson);
      sessionStorage.setItem("dashboardFilters", JSON.stringify(filters));
      navigate({ to: "/" });
    } catch {
      toast.error("Failed to apply search filters");
    }
  };

  const handleRename = () => {
    if (newName.trim() && newName.trim() !== search.name) {
      onRename(search.id, newName.trim());
    }
    setRenaming(false);
  };

  return (
    <div className="card-panel">
      <div className="flex items-start justify-between mb-3">
        {renaming ? (
          <div className="flex items-center gap-2 flex-1 mr-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") setRenaming(false);
              }}
              className="h-7 text-sm bg-background border-steel-border"
              autoFocus
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-amber-600 dark:text-amber-400 shrink-0"
              onClick={handleRename}
            >
              <Check className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground shrink-0"
              onClick={() => setRenaming(false)}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-semibold text-foreground truncate">
              {search.name}
            </span>
          </div>
        )}
        {!renaming && (
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setRenaming(true)}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            {confirmDelete ? (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-red-400"
                  onClick={() => onDelete(search.id)}
                >
                  <Check className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground"
                  onClick={() => setConfirmDelete(false)}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </>
            ) : (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-red-400"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        Saved{" "}
        {new Date(Number(search.createdAt) / 1_000_000).toLocaleDateString()}
      </p>

      <Button
        size="sm"
        onClick={handleApply}
        className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs"
      >
        <Search className="w-3.5 h-3.5 mr-1.5" />
        Apply Search
      </Button>
    </div>
  );
}

export default function SavedSearchesPage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: searches = [], isLoading } = useGetSavedSearches();
  const deleteMutation = useDeleteSavedSearch();
  const renameMutation = useRenameSavedSearch();

  const handleDelete = async (id: bigint) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Search deleted");
    } catch {
      toast.error("Failed to delete search");
    }
  };

  const handleRename = async (id: bigint, name: string) => {
    try {
      await renameMutation.mutateAsync({ id, name });
      toast.success("Search renamed");
    } catch {
      toast.error("Failed to rename search");
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <LogIn className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2 font-display">
          Sign In Required
        </h1>
        <p className="text-muted-foreground text-sm">
          Please sign in to view your saved searches.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Search className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          <h1 className="text-2xl font-bold text-foreground font-display tracking-wide">
            Saved Searches
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Apply saved filter combinations to quickly find listings.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-panel h-32 animate-pulse bg-surface" />
          ))}
        </div>
      ) : (searches as any[]).length === 0 ? (
        <div className="card-panel text-center py-12">
          <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium mb-1">No saved searches</p>
          <p className="text-muted-foreground text-sm">
            Save a search from the dashboard filters to see it here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(searches as any[]).map((search: any) => (
            <SearchCard
              key={String(search.id)}
              search={search}
              onDelete={handleDelete}
              onRename={handleRename}
            />
          ))}
        </div>
      )}
    </main>
  );
}
