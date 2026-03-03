import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Loader2,
  LogIn,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
// Local type definitions (match backend types)
interface AlertCondition {
  field: string;
  operator: string;
  value: string;
}
interface CustomAlertFormula {
  id: string;
  name: string;
  conditions: AlertCondition[];
  createdAt: bigint;
}
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useDeleteCustomAlertFormula,
  useEvaluateCustomAlertFormulas,
  useGetCustomAlertFormulas,
  useSaveCustomAlertFormula,
} from "../hooks/useQueries";

// ─── Constants ────────────────────────────────────────────────────────────────

const FIELD_OPTIONS = [
  { value: "make", label: "Make" },
  { value: "model", label: "Model" },
  { value: "price", label: "Price" },
  { value: "mileage", label: "Mileage" },
  { value: "year", label: "Year" },
  { value: "dealScore", label: "Deal Score" },
];

const OPERATOR_OPTIONS = [
  { value: "eq", label: "equals" },
  { value: "neq", label: "not equals" },
  { value: "lt", label: "less than" },
  { value: "gt", label: "greater than" },
  { value: "lte", label: "≤ less than or equal" },
  { value: "gte", label: "≥ greater than or equal" },
  { value: "contains", label: "contains" },
];

const DEAL_SCORE_OPTIONS = ["Good Deal", "Fair", "Overpriced"];

interface ConditionRow {
  field: string;
  operator: string;
  value: string;
}

function emptyCondition(): ConditionRow {
  return { field: "price", operator: "lt", value: "" };
}

// ─── Condition Row ────────────────────────────────────────────────────────────

interface ConditionRowEditorProps {
  index: number;
  condition: ConditionRow;
  onChange: (index: number, updated: ConditionRow) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

function ConditionRowEditor({
  index,
  condition,
  onChange,
  onRemove,
  canRemove,
}: ConditionRowEditorProps) {
  const isDealScore = condition.field === "dealScore";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Field */}
      <select
        data-ocid={`custom_alerts.condition_field_select.${index + 1}`}
        value={condition.field}
        onChange={(e) =>
          onChange(index, { ...condition, field: e.target.value, value: "" })
        }
        className="bg-surface border border-steel-border rounded-lg px-2 py-1.5 text-sm text-foreground focus:outline-none focus:border-amber-500 min-w-[110px]"
        aria-label={`Condition ${index + 1} field`}
      >
        {FIELD_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Operator */}
      <select
        data-ocid={`custom_alerts.condition_operator_select.${index + 1}`}
        value={condition.operator}
        onChange={(e) =>
          onChange(index, { ...condition, operator: e.target.value })
        }
        className="bg-surface border border-steel-border rounded-lg px-2 py-1.5 text-sm text-foreground focus:outline-none focus:border-amber-500 min-w-[160px]"
        aria-label={`Condition ${index + 1} operator`}
      >
        {OPERATOR_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Value */}
      {isDealScore ? (
        <select
          data-ocid={`custom_alerts.condition_value_input.${index + 1}`}
          value={condition.value}
          onChange={(e) =>
            onChange(index, { ...condition, value: e.target.value })
          }
          className="bg-surface border border-steel-border rounded-lg px-2 py-1.5 text-sm text-foreground focus:outline-none focus:border-amber-500 min-w-[130px]"
          aria-label={`Condition ${index + 1} value`}
        >
          <option value="">Select score…</option>
          {DEAL_SCORE_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      ) : (
        <input
          data-ocid={`custom_alerts.condition_value_input.${index + 1}`}
          type="text"
          value={condition.value}
          onChange={(e) =>
            onChange(index, { ...condition, value: e.target.value })
          }
          placeholder={
            condition.field === "price" || condition.field === "mileage"
              ? "e.g. 25000"
              : condition.field === "year"
                ? "e.g. 2020"
                : "e.g. Toyota"
          }
          className="bg-surface border border-steel-border rounded-lg px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 min-w-[130px]"
          aria-label={`Condition ${index + 1} value`}
        />
      )}

      {/* Remove */}
      {canRemove && (
        <button
          type="button"
          data-ocid={`custom_alerts.condition_remove_button.${index + 1}`}
          onClick={() => onRemove(index)}
          className="p-1.5 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors shrink-0"
          aria-label={`Remove condition ${index + 1}`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ─── Formula Card ─────────────────────────────────────────────────────────────

interface FormulaCardProps {
  formula: CustomAlertFormula;
  index: number;
  onDelete: (id: string) => void;
  onEvaluate: (id: string, name: string) => void;
  isDeleting: boolean;
  isEvaluating: boolean;
  matchResult?: { matchedListingIds: string[] } | null;
}

function FormulaCard({
  formula,
  index,
  onDelete,
  onEvaluate,
  isDeleting,
  isEvaluating,
  matchResult,
}: FormulaCardProps) {
  const createdDate = new Date(Number(formula.createdAt) / 1_000_000);
  const dateStr = createdDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      data-ocid={`custom_alerts.formula_item.${index + 1}`}
      className="card-panel p-4 flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
          <h3 className="font-semibold text-foreground text-sm truncate">
            {formula.name}
          </h3>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            data-ocid={`custom_alerts.formula_evaluate_button.${index + 1}`}
            onClick={() => onEvaluate(formula.id, formula.name)}
            disabled={isEvaluating}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors disabled:opacity-50"
          >
            {isEvaluating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Play className="w-3 h-3" />
            )}
            Evaluate
          </button>
          <button
            type="button"
            data-ocid={`custom_alerts.formula_delete_button.${index + 1}`}
            onClick={() => onDelete(formula.id)}
            disabled={isDeleting}
            className="p-1.5 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-50"
            aria-label={`Delete formula: ${formula.name}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Conditions summary */}
      <div className="space-y-1">
        {formula.conditions.map((cond, i) => {
          const fieldLabel =
            FIELD_OPTIONS.find((f) => f.value === cond.field)?.label ??
            cond.field;
          const opLabel =
            OPERATOR_OPTIONS.find((o) => o.value === cond.operator)?.label ??
            cond.operator;
          return (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: condition index within a formula
              key={i}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50 shrink-0" />
              <span className="text-foreground font-medium">{fieldLabel}</span>
              <span>{opLabel}</span>
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                {cond.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Created date */}
      <p className="text-xs text-muted-foreground">{dateStr}</p>

      {/* Match result */}
      {matchResult !== undefined && (
        <div
          className={`flex items-center gap-2 text-xs px-2.5 py-2 rounded-lg border ${
            matchResult && matchResult.matchedListingIds.length > 0
              ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
              : "bg-surface border-steel-border text-muted-foreground"
          }`}
        >
          {matchResult && matchResult.matchedListingIds.length > 0 ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>
                {matchResult.matchedListingIds.length} listing
                {matchResult.matchedListingIds.length !== 1 ? "s" : ""} matched
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>No listings matched</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CustomAlertFormulasPage() {
  const { identity } = useInternetIdentity();
  const { login, loginStatus } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  // Builder state
  const [formulaName, setFormulaName] = useState("");
  const [conditions, setConditions] = useState<ConditionRow[]>([
    emptyCondition(),
  ]);

  // Results state: map of formulaId -> match or "all"
  const [matchResults, setMatchResults] = useState<
    Record<string, { matchedListingIds: string[] } | null>
  >({});
  const [runAllResults, setRunAllResults] = useState<Array<{
    formulaId: string;
    formulaName: string;
    matchedListingIds: string[];
  }> | null>(null);

  const { data: formulas = [], isLoading } = useGetCustomAlertFormulas();
  const saveFormula = useSaveCustomAlertFormula();
  const deleteFormula = useDeleteCustomAlertFormula();
  const evaluateAll = useEvaluateCustomAlertFormulas();

  const handleAddCondition = () => {
    setConditions((prev) => [...prev, emptyCondition()]);
  };

  const handleConditionChange = (index: number, updated: ConditionRow) => {
    setConditions((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  };

  const handleConditionRemove = (index: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveFormula = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formulaName.trim()) {
      toast.error("Please enter a formula name.");
      return;
    }
    const invalidConditions = conditions.filter((c) => !c.value.trim());
    if (invalidConditions.length > 0) {
      toast.error("All conditions must have a value.");
      return;
    }

    const formula = {
      id: crypto.randomUUID(),
      name: formulaName.trim(),
      createdAt: BigInt(Date.now()) * BigInt(1_000_000),
      conditions: conditions.map(
        (c): AlertCondition => ({
          field: c.field,
          operator: c.operator,
          value: c.value,
        }),
      ),
    };

    try {
      await saveFormula.mutateAsync(formula);
      toast.success("Formula saved!");
      setFormulaName("");
      setConditions([emptyCondition()]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save formula. Please try again.");
    }
  };

  const handleDeleteFormula = async (id: string) => {
    try {
      await deleteFormula.mutateAsync(id);
      toast.success("Formula deleted.");
      setMatchResults((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete formula.");
    }
  };

  const handleEvaluateSingle = async (formulaId: string, name: string) => {
    try {
      const results = await evaluateAll.mutateAsync();
      const match = results.find((r) => r.formulaId === formulaId);
      setMatchResults((prev) => ({
        ...prev,
        [formulaId]: match
          ? { matchedListingIds: match.matchedListingIds }
          : { matchedListingIds: [] },
      }));
      toast.success(`"${name}" evaluated.`);
    } catch (err) {
      console.error(err);
      toast.error("Evaluation failed.");
    }
  };

  const handleRunAll = async () => {
    try {
      const results = await evaluateAll.mutateAsync();
      const mapped = results.map((r) => ({
        formulaId: r.formulaId,
        formulaName: r.formulaName,
        matchedListingIds: r.matchedListingIds,
      }));
      setRunAllResults(mapped);

      // Also update individual results
      const resultMap: Record<string, { matchedListingIds: string[] }> = {};
      for (const r of results) {
        resultMap[r.formulaId] = { matchedListingIds: r.matchedListingIds };
      }
      setMatchResults(resultMap);
      toast.success(
        `Evaluated ${formulas.length} formula${formulas.length !== 1 ? "s" : ""}.`,
      );
    } catch (err) {
      console.error(err);
      toast.error("Run All failed.");
    }
  };

  // Login prompt for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-screen-2xl mx-auto px-4 py-16 flex flex-col items-center justify-center gap-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-2">
            <Zap className="w-7 h-7 text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Custom Alert Formulas
          </h1>
          <p className="text-muted-foreground max-w-md">
            Build multi-condition rules that automatically flag matching
            listings. Sign in to create and manage your alert formulas.
          </p>
          <button
            type="button"
            onClick={login}
            disabled={isLoggingIn}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50"
          >
            {isLoggingIn ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            {isLoggingIn ? "Signing in…" : "Sign in to continue"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-screen-2xl mx-auto px-4 py-8 space-y-8">
        {/* Page header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Custom Alert Formulas
              </h1>
              <p className="text-sm text-muted-foreground">
                Build multi-condition rules that flag matching listings
                automatically
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* ── Formula Builder ── */}
          <div className="card-panel p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <Plus className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-semibold text-foreground">
                New Formula
              </h2>
            </div>

            <form onSubmit={handleSaveFormula} className="space-y-5">
              {/* Formula name */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="formula-name"
                  className="text-sm text-foreground"
                >
                  Formula name
                </Label>
                <Input
                  id="formula-name"
                  data-ocid="custom_alerts.formula_name_input"
                  type="text"
                  value={formulaName}
                  onChange={(e) => setFormulaName(e.target.value)}
                  placeholder="e.g. Cheap Hondas Under 40k Miles"
                  className="bg-surface border-steel-border focus:border-amber-500"
                  required
                />
              </div>

              {/* Conditions */}
              <div className="space-y-2">
                <p className="text-sm text-foreground font-medium">
                  Conditions
                </p>
                {conditions.map((cond, idx) => (
                  <ConditionRowEditor
                    // biome-ignore lint/suspicious/noArrayIndexKey: condition index is stable during editing
                    key={idx}
                    index={idx}
                    condition={cond}
                    onChange={handleConditionChange}
                    onRemove={handleConditionRemove}
                    canRemove={conditions.length > 1}
                  />
                ))}
              </div>

              {/* Add condition */}
              <button
                type="button"
                data-ocid="custom_alerts.add_condition_button"
                onClick={handleAddCondition}
                className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Condition
              </button>

              {/* Submit */}
              <Button
                type="submit"
                data-ocid="custom_alerts.save_formula_button"
                disabled={saveFormula.isPending || !formulaName.trim()}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold"
              >
                {saveFormula.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving…
                  </>
                ) : (
                  "Save Formula"
                )}
              </Button>
            </form>
          </div>

          {/* ── Saved Formulas ── */}
          <div className="space-y-4">
            {/* Header with Run All */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <h2 className="text-base font-semibold text-foreground">
                  Saved Formulas
                </h2>
                {formulas.length > 0 && (
                  <span className="text-xs text-muted-foreground bg-surface px-2 py-0.5 rounded-full border border-steel-border">
                    {formulas.length}
                  </span>
                )}
              </div>
              {formulas.length > 0 && (
                <button
                  type="button"
                  data-ocid="custom_alerts.run_all_button"
                  onClick={handleRunAll}
                  disabled={evaluateAll.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                >
                  {evaluateAll.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  Run All
                </button>
              )}
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="card-panel p-8 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
              </div>
            )}

            {/* Empty state */}
            {!isLoading && formulas.length === 0 && (
              <div
                data-ocid="custom_alerts.empty_state"
                className="card-panel p-10 flex flex-col items-center justify-center text-center gap-3"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-amber-400 opacity-60" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  No formulas yet
                </p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Create your first formula using the builder on the left to
                  automatically flag matching listings.
                </p>
              </div>
            )}

            {/* Formula list */}
            {!isLoading && formulas.length > 0 && (
              <div className="space-y-3">
                {(formulas as CustomAlertFormula[]).map((formula, idx) => (
                  <FormulaCard
                    key={formula.id}
                    formula={formula}
                    index={idx}
                    onDelete={handleDeleteFormula}
                    onEvaluate={handleEvaluateSingle}
                    isDeleting={deleteFormula.isPending}
                    isEvaluating={evaluateAll.isPending}
                    matchResult={
                      matchResults[formula.id] !== undefined
                        ? matchResults[formula.id]
                        : undefined
                    }
                  />
                ))}
              </div>
            )}

            {/* Run All aggregated results */}
            {runAllResults !== null && runAllResults.length > 0 && (
              <div className="card-panel p-4 space-y-2">
                <p className="text-xs font-semibold text-foreground">
                  Run All Results
                </p>
                {runAllResults.map((r) => (
                  <div
                    key={r.formulaId}
                    className="flex items-center justify-between text-xs py-1 border-b border-steel-border/40 last:border-0"
                  >
                    <span className="text-muted-foreground truncate flex-1 mr-3">
                      {r.formulaName}
                    </span>
                    <span
                      className={`font-semibold shrink-0 ${
                        r.matchedListingIds.length > 0
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {r.matchedListingIds.length} match
                      {r.matchedListingIds.length !== 1 ? "es" : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
