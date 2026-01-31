/**
 * Fetches live data from Google Sheets.
 * Sheet must be shared as "Anyone with the link can view".
 */

import type { CsvSupplier, CsvInventory, CsvClient, CsvMessage } from "./csvLoader";

// Cache to avoid hammering Google Sheets on every request
interface CacheEntry<T> {
  data: T[];
  timestamp: number;
}

const CACHE_TTL_MS = 30_000; // 30 seconds cache
const cache: Record<string, CacheEntry<any>> = {};

function getSheetId(): string | null {
  const url = process.env.GOOGLE_SHEETS_URL;
  if (!url) return null;
  
  // Extract sheet ID from URL like:
  // https://docs.google.com/spreadsheets/d/SHEET_ID/edit
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match?.[1] ?? null;
}

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  // Handle quoted CSV values properly
  const parseRow = (line: string): string[] => {
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
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = values[j] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

async function fetchSheet<T>(sheetName: string): Promise<T[]> {
  const sheetId = getSheetId();
  if (!sheetId) return [];

  // Check cache
  const cacheKey = `sheet_${sheetName}`;
  const cached = cache[cacheKey];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    // Google Sheets CSV export URL
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[Sheets] Failed to fetch ${sheetName}: ${response.status}`);
      return cached?.data ?? [];
    }

    const text = await response.text();
    const data = parseCSV(text) as T[];
    
    // Update cache
    cache[cacheKey] = { data, timestamp: Date.now() };
    console.log(`[Sheets] Loaded ${data.length} rows from "${sheetName}"`);
    
    return data;
  } catch (error) {
    console.error(`[Sheets] Error fetching ${sheetName}:`, error);
    return cached?.data ?? [];
  }
}

export async function fetchSuppliers(): Promise<CsvSupplier[]> {
  return fetchSheet<CsvSupplier>("Suppliers");
}

export async function fetchInventory(): Promise<CsvInventory[]> {
  return fetchSheet<CsvInventory>("Inventory");
}

export async function fetchClients(): Promise<CsvClient[]> {
  return fetchSheet<CsvClient>("Clients");
}

export async function fetchMessages(): Promise<CsvMessage[]> {
  return fetchSheet<CsvMessage>("Messages_Log");
}

export function hasGoogleSheets(): boolean {
  return !!getSheetId();
}

// Clear cache (useful for manual refresh)
export function clearCache(): void {
  Object.keys(cache).forEach(key => delete cache[key]);
  console.log("[Sheets] Cache cleared");
}
