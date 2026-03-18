import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import PageHeader from "../components/PageHeader";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Textarea } from "../components/ui/textarea";
import { useActor } from "../hooks/useActor";
import { useAppRoleContext } from "../hooks/useAppRoleContext";

const TEMPLATE_HEADERS = [
  "make",
  "model",
  "year",
  "price",
  "mileage",
  "trim",
  "condition",
  "description",
  "dealerPhone",
  "dealerEmail",
  "dealerCity",
  "dealerState",
];

const TEMPLATE_CSV = [
  TEMPLATE_HEADERS.join(","),
  "Toyota,Camry,2022,26500,18000,SE,Used,One owner clean title,555-0100,dealer@example.com,Dallas,TX",
  "Honda,Accord,2021,24900,32000,Sport,Used,Fully loaded backup camera,555-0101,dealer@example.com,Dallas,TX",
].join("\n");

interface ParsedRow {
  make: string;
  model: string;
  year: string;
  price: string;
  mileage: string;
  trim: string;
  condition: string;
  description: string;
  dealerPhone: string;
  dealerEmail: string;
  dealerCity: string;
  dealerState: string;
  errors: string[];
  status: "valid" | "error" | "importing" | "imported" | "failed";
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/\s+/g, ""),
  );
  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const get = (key: string) => {
      const idx = headers.indexOf(key.toLowerCase());
      return idx >= 0 ? values[idx] || "" : "";
    };

    const errors: string[] = [];
    const make = get("make");
    const model = get("model");
    const year = get("year");
    const price = get("price");

    if (!make) errors.push("Make required");
    if (!model) errors.push("Model required");
    if (!year || Number.isNaN(Number(year))) errors.push("Valid year required");
    if (!price || Number.isNaN(Number(price)))
      errors.push("Valid price required");

    rows.push({
      make,
      model,
      year,
      price,
      mileage: get("mileage"),
      trim: get("trim"),
      condition: get("condition") || "Used",
      description: get("description"),
      dealerPhone: get("dealerphone"),
      dealerEmail: get("dealeremail"),
      dealerCity: get("dealercity"),
      dealerState: get("dealerstate"),
      errors,
      status: errors.length > 0 ? "error" : "valid",
    });
  }
  return rows;
}

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dealer-inventory-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function DealerInventoryImportPage() {
  const navigate = useNavigate();
  const role = useAppRoleContext();
  const { actor } = useActor();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvText, setCsvText] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleParse = (text: string) => {
    setCsvText(text);
    const parsed = parseCSV(text);
    setRows(parsed);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file || !file.name.endsWith(".csv")) {
      toast.error("Please drop a CSV file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => handleParse(ev.target?.result as string);
    reader.readAsText(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => handleParse(ev.target?.result as string);
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleImport = async () => {
    if (!actor) return;
    const validRows = rows.filter((r) => r.status === "valid");
    if (validRows.length === 0) {
      toast.error("No valid rows to import");
      return;
    }

    setImporting(true);
    setImportProgress({ current: 0, total: validRows.length });
    let imported = 0;
    let failed = 0;

    // Update rows to show importing state
    setRows((prev) =>
      prev.map((r) =>
        r.status === "valid" ? { ...r, status: "importing" as const } : r,
      ),
    );

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        await (actor as any).createMarketplaceListing({
          make: row.make,
          model: row.model,
          year: BigInt(Number.parseInt(row.year)),
          mileage: BigInt(Number.parseInt(row.mileage) || 0),
          price: BigInt(Number.parseInt(row.price)),
          trim: row.trim,
          condition: row.condition || "Used",
          description: row.description || "",
          images: [],
          dealerPhone: row.dealerPhone || "",
          dealerEmail: row.dealerEmail || "",
          dealerCity: row.dealerCity || "",
          dealerState: row.dealerState || "",
        });
        imported++;
        // Mark this specific row as imported
        const originalIdx = rows.findIndex(
          (r) =>
            r.make === row.make &&
            r.model === row.model &&
            r.year === row.year &&
            r.price === row.price,
        );
        if (originalIdx >= 0) {
          setRows((prev) =>
            prev.map((r, idx) =>
              idx === originalIdx ? { ...r, status: "imported" as const } : r,
            ),
          );
        }
      } catch {
        failed++;
        const originalIdx = rows.findIndex(
          (r) =>
            r.make === row.make &&
            r.model === row.model &&
            r.year === row.year &&
            r.price === row.price,
        );
        if (originalIdx >= 0) {
          setRows((prev) =>
            prev.map((r, idx) =>
              idx === originalIdx ? { ...r, status: "failed" as const } : r,
            ),
          );
        }
      }
      setImportProgress({ current: i + 1, total: validRows.length });
    }

    setImporting(false);
    setImportProgress(null);

    if (imported > 0) {
      toast.success(
        `Successfully imported ${imported} vehicle${imported !== 1 ? "s" : ""} to your marketplace${
          failed > 0 ? ` (${failed} failed)` : ""
        }`,
      );
    } else {
      toast.error(`Import failed: all ${failed} rows encountered errors`);
    }
  };

  if (role !== "dealer") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-xl font-semibold">Dealer Access Required</p>
          <p className="text-muted-foreground">
            Sign in as a Dealer to import inventory.
          </p>
          <Button onClick={() => navigate({ to: "/" })}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const validCount = rows.filter(
    (r) => r.status === "valid" || r.status === "importing",
  ).length;
  const errorCount = rows.filter((r) => r.status === "error").length;
  const importedCount = rows.filter((r) => r.status === "imported").length;
  const failedCount = rows.filter((r) => r.status === "failed").length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <PageHeader
        title="Dealer Inventory Import"
        description="Bulk import your vehicle inventory to the marketplace"
      />

      <div className="mt-6 space-y-6">
        {/* Upload area */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Drop zone */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload CSV File
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  dragging
                    ? "border-amber-400 bg-amber-500/10"
                    : "border-border hover:border-amber-400/60 hover:bg-muted/30"
                }`}
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    fileInputRef.current?.click();
                }}
                data-ocid="inventory_import.dropzone"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileInput}
                />
                <FileSpreadsheet className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium">
                  {dragging
                    ? "Drop your CSV here"
                    : "Drag & drop or click to browse"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  .csv files only
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full mt-3"
                onClick={downloadTemplate}
                data-ocid="inventory_import.download_template_button"
              >
                <Download className="h-3.5 w-3.5 mr-2" />
                Download Template CSV
              </Button>
            </CardContent>
          </Card>

          {/* Paste area */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Paste CSV Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                rows={8}
                placeholder="Paste CSV content here... Example: make,model,year,price,mileage"
                value={csvText}
                onChange={(e) => handleParse(e.target.value)}
                className="font-mono text-xs resize-none"
                data-ocid="inventory_import.csv_textarea"
              />
              {csvText && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCsvText("");
                    setRows([]);
                  }}
                  data-ocid="inventory_import.clear_button"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Clear
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview + import */}
        {rows.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-sm">
                  Preview — {rows.length} rows
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  {validCount > 0 && (
                    <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {validCount} valid
                    </Badge>
                  )}
                  {errorCount > 0 && (
                    <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errorCount} errors
                    </Badge>
                  )}
                  {importedCount > 0 && (
                    <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">
                      {importedCount} imported
                    </Badge>
                  )}
                  {failedCount > 0 && (
                    <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">
                      {failedCount} failed
                    </Badge>
                  )}
                  <Button
                    onClick={handleImport}
                    disabled={importing || validCount === 0}
                    className="bg-amber-500 hover:bg-amber-600 text-black text-sm"
                    data-ocid="inventory_import.import_button"
                  >
                    {importing && importProgress ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Importing {importProgress.current}/
                        {importProgress.total}...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Import {validCount} Vehicle{validCount !== 1 ? "s" : ""}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[90px]">Status</TableHead>
                      <TableHead>Make</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Mileage</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Issues</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, i) => (
                      <TableRow
                        key={`${row.make}-${row.model}-${row.year}-${row.price}-${i}`}
                        className={
                          row.status === "error" || row.status === "failed"
                            ? "bg-red-500/5"
                            : row.status === "imported"
                              ? "bg-emerald-500/5"
                              : ""
                        }
                        data-ocid={`inventory_import.row.item.${i + 1}`}
                      >
                        <TableCell>
                          {row.status === "valid" && (
                            <Badge className="text-xs bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                              Valid
                            </Badge>
                          )}
                          {row.status === "error" && (
                            <Badge className="text-xs bg-red-500/20 text-red-500 border-red-500/30">
                              Error
                            </Badge>
                          )}
                          {row.status === "importing" && (
                            <Badge className="text-xs bg-amber-500/20 text-amber-600 border-amber-500/30">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Importing
                            </Badge>
                          )}
                          {row.status === "imported" && (
                            <Badge className="text-xs bg-blue-500/20 text-blue-500 border-blue-500/30">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Imported
                            </Badge>
                          )}
                          {row.status === "failed" && (
                            <Badge className="text-xs bg-orange-500/20 text-orange-500 border-orange-500/30">
                              Failed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {row.make || "—"}
                        </TableCell>
                        <TableCell>{row.model || "—"}</TableCell>
                        <TableCell>{row.year || "—"}</TableCell>
                        <TableCell>
                          {row.price
                            ? `$${Number(row.price).toLocaleString()}`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {row.mileage
                            ? `${Number(row.mileage).toLocaleString()} mi`
                            : "—"}
                        </TableCell>
                        <TableCell>{row.condition || "—"}</TableCell>
                        <TableCell className="text-xs text-destructive">
                          {row.errors.join("; ") || ""}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {rows.length === 0 && (
          <div
            className="text-center py-12 text-muted-foreground"
            data-ocid="inventory_import.empty_state"
          >
            <FileSpreadsheet className="mx-auto h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">
              Upload or paste a CSV file to preview your inventory
            </p>
            <p className="text-xs mt-1">
              Required columns: make, model, year, price
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
