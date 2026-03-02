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
          data-ocid="columns.open_modal_button"
          className="border-steel-border text-muted-text hover:text-amber-400 hover:border-amber-400 gap-1.5"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={[
          "w-72 p-0 z-50",
          // Background: white in light, dark card in dark
          "bg-white dark:bg-[oklch(0.17_0.02_260)]",
          // Border: visible in both modes
          "border border-gray-200 dark:border-[oklch(0.28_0.02_260)]",
          // Shadow: crisp elevated panel in light, deeper in dark
          "shadow-panel dark:shadow-card",
          // Rounded corners
          "rounded-xl",
          // Text baseline
          "text-gray-900 dark:text-[oklch(0.93_0.01_260)]",
        ].join(" ")}
        align="end"
      >
        {/* Panel header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-[oklch(0.28_0.02_260)] bg-gray-50 dark:bg-[oklch(0.14_0.02_260)] rounded-t-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Customize Columns
          </p>
          <p className="text-xs mt-0.5 text-gray-500 dark:text-[oklch(0.58_0.02_260)]">
            Toggle visibility or drag to reorder
          </p>
        </div>

        {/* Scrollable column list */}
        <div className="max-h-80 overflow-y-auto py-1 bg-white dark:bg-[oklch(0.17_0.02_260)]">
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
                className={[
                  "flex items-center gap-2.5 px-4 py-2 transition-colors",
                  "hover:bg-gray-50 dark:hover:bg-[oklch(0.22_0.02_260)]",
                  isRequired
                    ? "opacity-60"
                    : "cursor-grab active:cursor-grabbing",
                ].join(" ")}
              >
                {/* Drag handle */}
                <GripVertical
                  className={[
                    "h-3.5 w-3.5 shrink-0",
                    isRequired
                      ? "text-gray-300 dark:text-[oklch(0.38_0.02_260)]"
                      : "text-gray-400 dark:text-[oklch(0.5_0.02_260)]",
                  ].join(" ")}
                />

                {/* Checkbox */}
                <Checkbox
                  id={`col-${col.key}`}
                  checked={!isHidden}
                  disabled={isRequired}
                  onCheckedChange={() => onToggle(col.key)}
                  className={[
                    "border-gray-300 dark:border-[oklch(0.38_0.02_260)]",
                    "data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500",
                    "dark:data-[state=checked]:bg-amber-500 dark:data-[state=checked]:border-amber-500",
                  ].join(" ")}
                />

                {/* Label */}
                <label
                  htmlFor={`col-${col.key}`}
                  className={[
                    "flex-1 text-sm select-none leading-snug",
                    isRequired
                      ? "text-gray-400 dark:text-[oklch(0.5_0.02_260)] cursor-default"
                      : "text-gray-800 dark:text-[oklch(0.88_0.01_260)] cursor-pointer",
                  ].join(" ")}
                >
                  {col.label}
                  {isRequired && (
                    <span className="ml-1 text-xs text-gray-400 dark:text-[oklch(0.45_0.02_260)]">
                      (required)
                    </span>
                  )}
                </label>

                {/* Up/down reorder buttons */}
                {!isRequired && (
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onMove(col.key, "up")}
                      disabled={idx === 0}
                      className="text-gray-400 dark:text-[oklch(0.5_0.02_260)] hover:text-amber-600 dark:hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMove(col.key, "down")}
                      disabled={idx === columns.length - 1}
                      className="text-gray-400 dark:text-[oklch(0.5_0.02_260)] hover:text-amber-600 dark:hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-gray-200 dark:border-[oklch(0.28_0.02_260)] bg-gray-50 dark:bg-[oklch(0.14_0.02_260)] rounded-b-xl">
          <p className="text-xs font-medium text-gray-500 dark:text-[oklch(0.55_0.02_260)]">
            <span className="text-gray-700 dark:text-[oklch(0.75_0.02_260)] font-semibold">
              {columns.length - hiddenKeys.size}
            </span>{" "}
            of{" "}
            <span className="text-gray-700 dark:text-[oklch(0.75_0.02_260)] font-semibold">
              {columns.length}
            </span>{" "}
            columns visible
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
