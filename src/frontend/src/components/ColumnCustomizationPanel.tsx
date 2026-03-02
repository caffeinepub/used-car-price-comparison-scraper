import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { ColumnDef } from "@/hooks/useColumnPreferences";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  SlidersHorizontal,
} from "lucide-react";
import React, { useState, useRef } from "react";

interface ColumnCustomizationPanelProps {
  columns: ColumnDef[];
  hiddenKeys: Set<string>;
  onToggle: (key: string) => void;
  onMove: (key: string, direction: "up" | "down") => void;
  onReorder: (fromKey: string, toKey: string) => void;
}

export default function ColumnCustomizationPanel({
  columns,
  hiddenKeys,
  onToggle,
  onMove,
  onReorder,
}: ColumnCustomizationPanelProps) {
  const [open, setOpen] = useState(false);
  const dragKey = useRef<string | null>(null);

  const handleDragStart = (key: string) => {
    dragKey.current = key;
  };

  const handleDrop = (toKey: string) => {
    if (dragKey.current && dragKey.current !== toKey) {
      onReorder(dragKey.current, toKey);
    }
    dragKey.current = null;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-steel-border text-muted-text hover:text-amber-400 hover:border-amber-400 gap-1.5"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-0 bg-surface border-steel-border shadow-card"
        align="end"
      >
        <div className="px-3 py-2 border-b border-steel-border">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
            Customize Columns
          </p>
          <p className="text-xs text-muted-text mt-0.5">
            Toggle visibility or drag to reorder
          </p>
        </div>
        <div className="max-h-80 overflow-y-auto py-1">
          {columns.map((col, idx) => {
            const isHidden = hiddenKeys.has(col.key);
            const isRequired = col.required;
            return (
              <div
                key={col.key}
                draggable={!isRequired}
                onDragStart={() => handleDragStart(col.key)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(col.key)}
                className={`flex items-center gap-2 px-3 py-1.5 hover:bg-muted/60 transition-colors ${
                  isRequired
                    ? "opacity-60"
                    : "cursor-grab active:cursor-grabbing"
                }`}
              >
                <GripVertical className="h-3.5 w-3.5 text-muted-text shrink-0" />
                <Checkbox
                  id={`col-${col.key}`}
                  checked={!isHidden}
                  disabled={isRequired}
                  onCheckedChange={() => onToggle(col.key)}
                  className="border-steel-border data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                />
                <label
                  htmlFor={`col-${col.key}`}
                  className={`flex-1 text-sm select-none ${
                    isRequired
                      ? "text-muted-text"
                      : "text-foreground cursor-pointer"
                  }`}
                >
                  {col.label}
                  {isRequired && (
                    <span className="ml-1 text-xs text-muted-text">
                      (required)
                    </span>
                  )}
                </label>
                {!isRequired && (
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => onMove(col.key, "up")}
                      disabled={idx === 0}
                      className="text-muted-text hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMove(col.key, "down")}
                      disabled={idx === columns.length - 1}
                      className="text-muted-text hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="px-3 py-2 border-t border-steel-border">
          <p className="text-xs text-muted-text">
            {columns.length - hiddenKeys.size} of {columns.length} columns
            visible
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
