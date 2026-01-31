/**
 * Loads and parses CSV files from the data folder.
 * Used when database is not available - provides real data from CSV exports.
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Use __dirname equivalent for ESM - ensures path works regardless of cwd
const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = values[j] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

export interface CsvSupplier {
  supplier_id: string;
  supplier_name: string;
  country: string;
  lead_time_days: string;
  reliability_score: string;
}

export interface CsvInventory {
  product_id: string;
  product_name: string;
  supplier: string;
  total_stock: string;
  allocated: string;
  unallocated: string;
  reorder_point: string;
  daily_usage: string;
  cost_jpy: string;
}

export interface CsvClient {
  client_id: string;
  client_name: string;
  matcha_type: string;
  supplier: string;
  monthly_kg: string;
  cost_jpy: string;
  sell_price_sgd: string;
  discount: string;
}

export interface CsvMessage {
  msg_id: string;
  channel: string;
  direction: string;
  from_id: string;
  to_id: string;
  intent: string;
  body: string;
  outcome: string;
  ts: string;
  dedupe_key: string;
  is_voice: string;
}

let _suppliers: CsvSupplier[] | null = null;
let _inventory: CsvInventory[] | null = null;
let _clients: CsvClient[] | null = null;
let _messages: CsvMessage[] | null = null;

export function loadSuppliers(): CsvSupplier[] {
  if (_suppliers) return _suppliers;
  const path = join(DATA_DIR, "Matsu-Mind - Suppliers.csv");
  if (!existsSync(path)) return [];
  const content = readFileSync(path, "utf-8");
  _suppliers = parseCSV(content) as CsvSupplier[];
  return _suppliers;
}

export function loadInventory(): CsvInventory[] {
  if (_inventory) return _inventory;
  const path = join(DATA_DIR, "Matsu-Mind - Inventory.csv");
  if (!existsSync(path)) return [];
  const content = readFileSync(path, "utf-8");
  _inventory = parseCSV(content) as CsvInventory[];
  return _inventory;
}

export function loadClients(): CsvClient[] {
  if (_clients) return _clients;
  const path = join(DATA_DIR, "Matsu-Mind - Clients.csv");
  if (!existsSync(path)) return [];
  const content = readFileSync(path, "utf-8");
  _clients = parseCSV(content) as CsvClient[];
  return _clients;
}

export function loadMessages(): CsvMessage[] {
  if (_messages) return _messages;
  const path = join(DATA_DIR, "Matsu-Mind - Messages_Log.csv");
  if (!existsSync(path)) return [];
  const content = readFileSync(path, "utf-8");
  _messages = parseCSV(content) as CsvMessage[];
  return _messages;
}

export function hasCsvData(): boolean {
  const s = loadSuppliers();
  const i = loadInventory();
  const c = loadClients();
  const hasData = s.length > 0 || i.length > 0 || c.length > 0;
  if (hasData) {
    console.log(`[CSV] Loaded data: ${s.length} suppliers, ${i.length} inventory items, ${c.length} client entries`);
  }
  return hasData;
}
