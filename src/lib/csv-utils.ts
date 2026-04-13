/**
 * @file CSV Export Utilities
 * @description Functions for converting data to CSV format and triggering downloads.
 */

/** A generic CSV safe record — values must be serializable to string  */
export type CSVRecord = Record<
  string,
  string | number | boolean | null | undefined
>;

/**
 * Converts an array of objects to CSV format.
 *
 * @param data - Array of objects to convert
 * @param filename - Name for the downloaded file
 */
export function downloadCSV(data: CSVRecord[], filename: string) {
  if (data.length === 0) {
    console.warn("No data to export");
    return;
  }

  // Extract headers from first object
  const headers = Object.keys(data[0]);

  // Build CSV rows
  const csvRows = [
    // Header row
    headers.join(","),
    // Data rows
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value ?? "");
          if (stringValue.includes(",") || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(",")
    ),
  ];

  // Join rows with newlines
  const csvContent = csvRows.join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/** Shape of a revenue data item */
interface RevenueItem {
  date: string;
  revenue: number;
}

/** Shape of a bookings data item */
interface BookingsItem {
  date: string;
  count: number;
}

/** Shape of a services data item */
interface ServicesItem {
  serviceName: string;
  revenue: number;
  bookings: number;
}

/** Shape of a customers data item */
export interface CustomersItem {
  name: string | null;
  email: string;
  bookings: number;
  spent: number;
  lastVisit: string;
}

/** Union of all possible analytics data item shapes */
export type AnalyticsDataItem =
  | RevenueItem
  | BookingsItem
  | ServicesItem
  | CustomersItem;

/** Result typ for formatAnalyticsForCSV */
interface CSVExportResult {
  data: CSVRecord[];
  filename: string;
}

/**
 * Formats analytics data for CSV export.
 *
 * @param type - Type of export (revenue, bookings, services, customers)
 * @param data - The data to export
 * @param dateRange - The date range string for the filename
 * @returns Formatted data ready for CSV export
 */
export function formatAnalyticsForCSV(
  type: "revenue" | "bookings" | "services" | "customers",
  data: AnalyticsDataItem[],
  dateRange: string
): CSVExportResult {
  const timestamp = new Date().toISOString().split("T")[0];
  const sanitizedRange = dateRange.replace(/[^a-z0-9]/gi, "-");

  switch (type) {
    case "revenue":
      return {
        data: (data as RevenueItem[]).map((item) => ({
          Date: item.date,
          Revenue: `ETB ${item.revenue.toFixed(2)}`,
        })),
        filename: `revenue-${sanitizedRange}-${timestamp}`,
      };

    case "bookings":
      return {
        data: (data as BookingsItem[]).map((item) => ({
          Date: item.date,
          Bookings: item.count,
        })),
        filename: `bookings-${sanitizedRange}-${timestamp}`,
      };

    case "services":
      return {
        data: (data as ServicesItem[]).map((item) => ({
          Service: item.serviceName,
          Revenue: `ETB ${item.revenue.toFixed(2)}`,
          Bookings: item.bookings,
          "Avg Value": `ETB ${(item.revenue / item.bookings).toFixed(2)}`,
        })),
        filename: `service-performance-${sanitizedRange}-${timestamp}`,
      };

    case "customers":
      return {
        data: (data as CustomersItem[]).map((item) => ({
          Customer: item.name || "Unknown",
          Email: item.email,
          "Total Bookings": item.bookings,
          "Total Spent": `ETB ${item.spent.toFixed(2)}`,
          "Last Visit": item.lastVisit,
        })),
        filename: `customers-${sanitizedRange}-${timestamp}`,
      };

    default:
      return {
        data: [],
        filename: `export-${timestamp}`,
      };
  }
}
