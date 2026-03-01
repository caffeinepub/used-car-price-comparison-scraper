import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  totalRows: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
}

const ROWS_OPTIONS = [10, 25, 50, 100];

export default function PaginationControls({
  currentPage,
  totalPages,
  rowsPerPage,
  totalRows,
  onPageChange,
  onRowsPerPageChange,
}: PaginationControlsProps) {
  if (totalRows === 0) return null;

  const startRow = (currentPage - 1) * rowsPerPage + 1;
  const endRow = Math.min(currentPage * rowsPerPage, totalRows);

  // Build page number buttons: show up to 5 pages around current
  const getPageNumbers = (): (number | "ellipsis")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "ellipsis")[] = [1];
    if (currentPage > 3) pages.push("ellipsis");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("ellipsis");
    pages.push(totalPages);
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-3 border-t border-steel-border">
      {/* Row info + rows per page */}
      <div className="flex items-center gap-3 text-xs text-muted-text">
        <span>
          {startRow}–{endRow} of {totalRows.toLocaleString()} listings
        </span>
        <div className="flex items-center gap-1.5">
          <span className="hidden sm:inline">Rows:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
            className="bg-surface border border-steel-border text-foreground text-xs rounded px-2 py-1 focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            {ROWS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Page navigation */}
      <div className="flex items-center gap-1">
        {/* Previous */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-7 w-7 border-steel-border text-muted-text hover:text-foreground hover:border-amber-500/50 disabled:opacity-30"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>

        {/* Page numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((page, idx) =>
            page === "ellipsis" ? (
              <span
                key={`ellipsis-before-${pageNumbers[idx + 1] ?? idx}`}
                className="px-1 text-xs text-muted-text/50"
              >
                …
              </span>
            ) : (
              <button
                type="button"
                key={page}
                onClick={() => onPageChange(page as number)}
                className={`h-7 min-w-[28px] px-2 rounded text-xs font-medium transition-colors ${
                  currentPage === page
                    ? "bg-amber-500 text-surface font-semibold"
                    : "text-muted-text hover:text-foreground hover:bg-surface"
                }`}
              >
                {page}
              </button>
            ),
          )}
        </div>

        {/* Mobile: page indicator */}
        <span className="sm:hidden text-xs text-muted-text px-2">
          {currentPage} / {totalPages}
        </span>

        {/* Next */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="h-7 w-7 border-steel-border text-muted-text hover:text-foreground hover:border-amber-500/50 disabled:opacity-30"
          aria-label="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
