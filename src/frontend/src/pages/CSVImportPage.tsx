import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Upload,
  X,
} from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { ExternalBlob } from "../backend";
import { useBulkCreateListings } from "../hooks/useQueries";

interface ParsedRow {
  make: string;
  model: string;
  year: string;
  mileage: string;
  price: string;
  trim: string;
  condition: string;
  dealerName: string;
  source: string;
  listingUrl: string;
  errors: string[];
  status: "valid" | "error" | "skipped" | "imported";
}

interface ListingFormData {
  id: string;
  make: string;
  model: string;
  year: bigint;
  mileage: bigint;
  price: bigint;
  trim: string;
  condition: string;
  dealerName: string;
  source: string;
  listingUrl: string;
  images: ExternalBlob[];
  timestamp: bigint;
  archived: boolean;
}

const TEMPLATE_CSV = `make,model,year,price,mileage,trim,condition,dealerName,source,listingUrl
Toyota,Camry,2021,25000,35000,SE,Used,City Toyota,AutoTrader,https://example.com/listing1
Honda,Accord,2020,22000,45000,Sport,Used,Metro Honda,Cars.com,https://example.com/listing2`;

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
    const rowData: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowData[h] = values[idx] ?? "";
    });

    const errors: string[] = [];
    if (!rowData.make?.trim()) errors.push("Make is required");
    if (!rowData.model?.trim()) errors.push("Model is required");
    if (!rowData.year?.trim() || Number.isNaN(Number.parseInt(rowData.year)))
      errors.push("Valid year required");
    if (!rowData.price?.trim() || Number.isNaN(Number.parseInt(rowData.price)))
      errors.push("Valid price required");

    rows.push({
      make: rowData.make ?? "",
      model: rowData.model ?? "",
      year: rowData.year ?? "",
      mileage: rowData.mileage ?? "0",
      price: rowData.price ?? "",
      trim: rowData.trim ?? "",
      condition: rowData.condition ?? "Used",
      dealerName: rowData.dealername ?? rowData.dealerName ?? "",
      source: rowData.source ?? "Other",
      listingUrl: rowData.listingurl ?? rowData.listingUrl ?? "",
      errors,
      status: errors.length > 0 ? "error" : "valid",
    });
  }

  return rows;
}

function rowToListingData(row: ParsedRow): ListingFormData {
  return {
    id: `csv-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    make: row.make.trim(),
    model: row.model.trim(),
    year: BigInt(Number.parseInt(row.year)),
    mileage: BigInt(Number.parseInt(row.mileage) || 0),
    price: BigInt(Number.parseInt(row.price)),
    trim: row.trim.trim(),
    condition: row.condition || "Used",
    dealerName: row.dealerName.trim(),
    source: row.source || "Other",
    listingUrl: row.listingUrl.trim(),
    images: [] as ExternalBlob[],
    timestamp: BigInt(Date.now()) * BigInt(1_000_000),
    archived: false,
  };
}

export default function CSVImportPage() {
  const [csvText, setCsvText] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkCreateMutation = useBulkCreateListings();

  const handleParse = (text: string) => {
    setCsvText(text);
    const parsed = parseCSV(text);
    setRows(parsed);
  };

  const handleFileRead = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      handleParse(text);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === "text/csv" || file.name.endsWith(".csv"))) {
      handleFileRead(file);
    } else {
      toast.error("Please drop a CSV file");
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileRead(file);
  };

  const handleImport = async () => {
    const validRows = rows.filter((r) => r.status === "valid");
    if (validRows.length === 0) {
      toast.error("No valid rows to import");
      return;
    }

    const listings = validRows.map(rowToListingData);

    try {
      const inserted = await bulkCreateMutation.mutateAsync(listings);
      const skipped = validRows.length - Number(inserted);

      setRows((prev) =>
        prev.map((r) => ({
          ...r,
          status: r.status === "valid" ? "imported" : r.status,
        })),
      );

      if (Number(inserted) > 0) {
        toast.success(
          `Successfully imported ${inserted} listing${Number(inserted) !== 1 ? "s" : ""}${skipped > 0 ? `, ${skipped} skipped (duplicates)` : ""}`,
        );
      } else {
        toast.warning(`All ${skipped} rows were skipped (duplicates)`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Import failed: ${msg}`);
    }
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "listing-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = rows.filter((r) => r.status === "valid").length;
  const errorCount = rows.filter((r) => r.status === "error").length;
  const importedCount = rows.filter((r) => r.status === "imported").length;

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl font-bold text-foreground font-display tracking-wide">
            CSV Import
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Bulk import car listings from a CSV file. Required columns: make,
          model, year, price.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Drop Zone */}
        <button
          type="button"
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`card-panel w-full flex flex-col items-center justify-center py-10 cursor-pointer border-2 border-dashed transition-colors ${
            isDragging
              ? "border-amber-500 bg-amber-500/5"
              : "border-steel-border hover:border-amber-500/50"
          }`}
        >
          <Upload
            className={`w-10 h-10 mb-3 ${isDragging ? "text-amber-400" : "text-muted-foreground"}`}
          />
          <p className="text-sm font-medium text-foreground mb-1">
            Drop CSV file here
          </p>
          <p className="text-xs text-muted-foreground">or click to browse</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileInput}
          />
        </button>

        {/* Paste Area */}
        <div className="card-panel space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              Or paste CSV text
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="border-steel-border text-muted-foreground hover:text-foreground text-xs h-7"
            >
              <Download className="w-3 h-3 mr-1" />
              Template
            </Button>
          </div>
          <Textarea
            placeholder="Paste CSV content here..."
            value={csvText}
            onChange={(e) => handleParse(e.target.value)}
            className="bg-background border-steel-border text-foreground placeholder:text-muted-foreground font-mono text-xs h-32 resize-none"
          />
        </div>
      </div>

      {/* Summary */}
      {rows.length > 0 && (
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <Badge
            variant="outline"
            className="border-emerald-500/40 text-emerald-400"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {validCount} valid
          </Badge>
          {errorCount > 0 && (
            <Badge variant="outline" className="border-red-500/40 text-red-400">
              <AlertCircle className="w-3 h-3 mr-1" />
              {errorCount} errors
            </Badge>
          )}
          {importedCount > 0 && (
            <Badge
              variant="outline"
              className="border-amber-500/40 text-amber-400"
            >
              {importedCount} imported
            </Badge>
          )}
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRows([]);
                setCsvText("");
              }}
              className="border-steel-border text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Clear
            </Button>
            <Button
              size="sm"
              onClick={handleImport}
              disabled={validCount === 0 || bulkCreateMutation.isPending}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              {bulkCreateMutation.isPending ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Importing...
                </span>
              ) : (
                `Import ${validCount} Row${validCount !== 1 ? "s" : ""}`
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Preview Table */}
      {rows.length > 0 && (
        <div className="card-panel overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-steel-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs">
                    Status
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs">
                    Make
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs">
                    Model
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs">
                    Year
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs">
                    Price
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs">
                    Mileage
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs">
                    Source
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs">
                    Issues
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, i) => (
                  <TableRow
                    key={`${row.make}-${row.model}-${row.year}-${i}`}
                    className="border-steel-border/40"
                  >
                    <TableCell>
                      {row.status === "valid" && (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/40 text-emerald-400 text-xs"
                        >
                          Valid
                        </Badge>
                      )}
                      {row.status === "error" && (
                        <Badge
                          variant="outline"
                          className="border-red-500/40 text-red-400 text-xs"
                        >
                          Error
                        </Badge>
                      )}
                      {row.status === "imported" && (
                        <Badge
                          variant="outline"
                          className="border-amber-500/40 text-amber-400 text-xs"
                        >
                          Imported
                        </Badge>
                      )}
                      {row.status === "skipped" && (
                        <Badge
                          variant="outline"
                          className="border-zinc-500/40 text-zinc-400 text-xs"
                        >
                          Skipped
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-foreground text-sm">
                      {row.make || "—"}
                    </TableCell>
                    <TableCell className="text-foreground text-sm">
                      {row.model || "—"}
                    </TableCell>
                    <TableCell className="text-foreground text-sm">
                      {row.year || "—"}
                    </TableCell>
                    <TableCell className="text-amber-400 text-sm font-medium">
                      {row.price
                        ? `$${Number.parseInt(row.price).toLocaleString()}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {row.mileage
                        ? Number.parseInt(row.mileage).toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {row.source || "—"}
                    </TableCell>
                    <TableCell>
                      {row.errors.length > 0 && (
                        <div className="flex items-center gap-1 text-red-400 text-xs">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{row.errors.join("; ")}</span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </main>
  );
}
