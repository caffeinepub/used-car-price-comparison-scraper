/**
 * Escapes a single CSV field value.
 * Wraps in double-quotes if the value contains commas, quotes, or newlines.
 * Doubles any existing double-quote characters.
 */
export function csvEscape(value: string | number | bigint | null | undefined): string {
  const str = value == null ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts an array of row objects to a CSV string.
 * @param headers - Ordered list of column header names
 * @param rows - Array of objects; keys must match headers
 */
export function buildCSV(headers: string[], rows: Record<string, string | number | bigint | null | undefined>[]): string {
  const headerLine = headers.map(csvEscape).join(',');
  const dataLines = rows.map((row) =>
    headers.map((h) => csvEscape(row[h])).join(',')
  );
  return [headerLine, ...dataLines].join('\r\n');
}

/**
 * Triggers a browser download of the given CSV content.
 * @param csvContent - The full CSV string
 * @param filename - The desired filename (e.g. 'export.csv')
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
