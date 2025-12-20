/**
 * CSV Export Utilities
 */

/**
 * Convert array of objects to CSV string
 */
export function arrayToCSV<T extends Record<string, unknown>>(
  data: T[],
  headers?: string[],
): string {
  if (data.length === 0) {
    return "";
  }

  // Extract headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);

  // Create header row
  const headerRow = csvHeaders
    .map((header) => escapeCSVValue(String(header)))
    .join(",");

  // Create data rows
  const dataRows = data.map((row) =>
    csvHeaders
      .map((header) => {
        const value = row[header];
        return escapeCSVValue(value != null ? String(value) : "");
      })
      .join(","),
  );

  return [headerRow, ...dataRows].join("\n");
}

/**
 * Escape CSV value (handle commas, quotes, newlines)
 */
function escapeCSVValue(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data to CSV file
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  headers?: string[],
) {
  const csvContent = arrayToCSV(data, headers);
  downloadCSV(csvContent, filename);
}
