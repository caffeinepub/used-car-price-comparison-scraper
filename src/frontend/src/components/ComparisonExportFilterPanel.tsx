import {
  useDeleteFilterPreset,
  useGetFilterPresets,
  useSaveFilterPreset,
  useUpdateFilterPreset,
} from "@/hooks/useQueries";
import { Check, Download, Save, Trash2, X } from "lucide-react";
import React, { useState } from "react";

interface ComparisonExportFilterPanelProps {
  make: string;
  model: string;
  onClose: () => void;
}

export default function ComparisonExportFilterPanel({
  make,
  model,
  onClose,
}: ComparisonExportFilterPanelProps) {
  const [presetName, setPresetName] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const [renamingId, setRenamingId] = useState<bigint | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const { data: presets = [] } = useGetFilterPresets("comparison");
  const savePreset = useSaveFilterPreset();
  const updatePreset = useUpdateFilterPreset();
  const deletePreset = useDeleteFilterPreset();

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;
    await savePreset.mutateAsync({
      name: presetName.trim(),
      filterJson: JSON.stringify({ make, model }),
      presetType: "comparison",
    });
    setPresetName("");
    setSavedMsg("Preset saved!");
    setTimeout(() => setSavedMsg(""), 2000);
  };

  const handleRenamePreset = async (id: bigint) => {
    if (!renameValue.trim()) return;
    await updatePreset.mutateAsync({
      id,
      name: renameValue.trim(),
      filterJson: "{}",
      presetType: "comparison",
    });
    setRenamingId(null);
    setRenameValue("");
  };

  const handleDeletePreset = async (id: bigint) => {
    await deletePreset.mutateAsync({ id, presetType: "comparison" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-steel-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-steel-border">
          <h2 className="text-lg font-semibold text-foreground">
            Export — {make} {model}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Saved Presets */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Saved Presets
            </h3>
            {presets.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No presets saved yet.
              </p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {(presets as any[]).map((preset: any) => (
                  <div
                    key={String(preset.id)}
                    className="flex items-center justify-between bg-background/40 rounded-lg px-3 py-2"
                  >
                    {renamingId === preset.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="flex-1 bg-surface border border-amber-500 rounded px-2 py-1 text-xs text-foreground focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleRenamePreset(preset.id)}
                          className="text-emerald-400 hover:text-emerald-300"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRenamingId(null)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm text-foreground">
                          {preset.name}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setRenamingId(preset.id);
                              setRenameValue(preset.name);
                            }}
                            className="p-1 text-muted-foreground hover:text-amber-400 transition-colors"
                            title="Rename"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePreset(preset.id)}
                            disabled={deletePreset.isPending}
                            className="p-1 text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Save new preset */}
            <div className="flex items-center gap-2 mt-3">
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Preset name…"
                className="flex-1 bg-background border border-steel-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleSavePreset}
                disabled={!presetName.trim() || savePreset.isPending}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm hover:bg-amber-500/30 transition-colors disabled:opacity-50"
              >
                Save
              </button>
            </div>
            {savedMsg && (
              <p className="text-xs text-emerald-400 mt-1">{savedMsg}</p>
            )}
          </div>

          {/* Export button */}
          <div className="flex justify-end gap-3 pt-2 border-t border-steel-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-steel-border text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
