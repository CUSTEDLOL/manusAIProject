/**
 * Live data loader - prioritizes Google Sheets, falls back to CSV files, then mock data.
 * This provides real-time data sync with the same Google Sheets used by n8n workflows.
 */

import {
  fetchSuppliers,
  fetchInventory,
  fetchClients,
  fetchMessages,
  hasGoogleSheets,
  clearCache as clearSheetsCache,
} from "./sheetsLoader";

import {
  loadSuppliers as loadCsvSuppliers,
  loadInventory as loadCsvInventory,
  loadClients as loadCsvClients,
  loadMessages as loadCsvMessages,
  hasCsvData,
} from "./csvLoader";

import {
  MOCK_SUPPLIERS,
  MOCK_PRODUCTS,
  MOCK_CLIENTS,
  MOCK_CLIENT_PRODUCTS,
  MOCK_INVENTORY,
  MOCK_TRANSACTIONS,
} from "./mockData";

// Transform Google Sheets / CSV data to app schema format
function transformSuppliers(rows: any[]): typeof MOCK_SUPPLIERS {
  const seen = new Set<string>();
  const suppliers: typeof MOCK_SUPPLIERS = [];
  let id = 1;

  for (const r of rows) {
    const key = r.supplier_id || r.supplier_name || r.name;
    if (!key || seen.has(key)) continue;
    seen.add(key);

    suppliers.push({
      id: id++,
      name: r.supplier_name || r.name || "Unknown",
      country: r.country || "Japan",
      contactPerson: r.contact_person || null,
      contactEmail: r.contact_email || null,
      contactPhone: r.contact_phone || null,
      leadTimeDays: parseInt(r.lead_time_days) || 14,
      notes: r.reliability_score ? `Reliability: ${r.reliability_score}` : null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  return suppliers;
}

function transformInventory(rows: any[], suppliers: typeof MOCK_SUPPLIERS): typeof MOCK_INVENTORY {
  const inventory: typeof MOCK_INVENTORY = [];
  let id = 1;

  for (const r of rows) {
    const supplierName = r.supplier || r.supplier_name || "";
    const supplier = suppliers.find(s => 
      s.name.toLowerCase().includes(supplierName.toLowerCase()) ||
      supplierName.toLowerCase().includes(s.name.toLowerCase())
    );

    inventory.push({
      inventoryId: id,
      productId: id,
      productName: r.product_name || r.name || `Product ${id}`,
      grade: r.grade || (r.product_name?.toLowerCase().includes("ceremonial") ? "ceremonial" : "culinary"),
      supplierId: supplier?.id || 1,
      supplierName: supplier?.name || supplierName || "Unknown",
      quantityKg: r.total_stock || r.quantity_kg || "0",
      allocatedKg: r.allocated || "0",
      availableKg: r.unallocated || String(parseFloat(r.total_stock || "0") - parseFloat(r.allocated || "0")),
      reorderPointKg: r.reorder_point || "50",
      warehouseLocation: r.warehouse || "Main Warehouse",
      lastOrderDate: new Date(),
      lastArrivalDate: new Date(),
      nextOrderDate: null,
    });
    id++;
  }
  return inventory;
}

function transformClients(rows: any[]): typeof MOCK_CLIENTS {
  const seen = new Set<string>();
  const clients: typeof MOCK_CLIENTS = [];
  let id = 1;

  for (const r of rows) {
    const name = r.client_name || r.name;
    if (!name || seen.has(name)) continue;
    seen.add(name);

    clients.push({
      id: id++,
      name,
      businessType: r.business_type || null,
      contactPerson: r.contact_person || null,
      contactEmail: r.contact_email || null,
      contactPhone: r.contact_phone || null,
      address: r.address || null,
      discountPercent: r.discount || "0",
      paymentTerms: r.payment_terms || "NET30",
      notes: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  return clients;
}

function transformProducts(inventoryRows: any[], suppliers: typeof MOCK_SUPPLIERS): typeof MOCK_PRODUCTS {
  const products: typeof MOCK_PRODUCTS = [];
  let id = 1;

  for (const r of inventoryRows) {
    const supplierName = r.supplier || "";
    const supplier = suppliers.find(s => 
      s.name.toLowerCase().includes(supplierName.toLowerCase())
    );

    products.push({
      id: id++,
      name: r.product_name || `Product ${id}`,
      grade: r.grade || "culinary",
      origin: "Japan",
      supplierId: supplier?.id || 1,
      costJpy: r.cost_jpy || "3500",
      basePriceSgd: String((parseFloat(r.cost_jpy || "3500") * 0.009 * 1.5).toFixed(2)),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  return products;
}

function transformClientProducts(
  clientRows: any[],
  clients: typeof MOCK_CLIENTS,
  products: typeof MOCK_PRODUCTS,
  suppliers: typeof MOCK_SUPPLIERS
): typeof MOCK_CLIENT_PRODUCTS {
  const clientProducts: typeof MOCK_CLIENT_PRODUCTS = [];
  let id = 1;

  for (const r of clientRows) {
    const clientName = r.client_name || r.name;
    const client = clients.find(c => c.name === clientName);
    if (!client) continue;

    const productName = r.matcha_type || r.product_name;
    const product = products.find(p => 
      p.name.toLowerCase().includes(productName?.toLowerCase() || "") ||
      productName?.toLowerCase().includes(p.name.toLowerCase())
    );

    const supplierName = r.supplier || "";
    const supplier = suppliers.find(s => 
      s.name.toLowerCase().includes(supplierName.toLowerCase())
    );

    clientProducts.push({
      id: id++,
      clientId: client.id,
      productId: product?.id || 1,
      supplierId: supplier?.id || product?.supplierId || 1,
      customPriceSgd: r.sell_price_sgd || null,
      monthlyVolumeKg: r.monthly_kg || "10",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  return clientProducts;
}

function generateTransactions(
  clients: typeof MOCK_CLIENTS,
  products: typeof MOCK_PRODUCTS,
  clientProducts: typeof MOCK_CLIENT_PRODUCTS,
  clientRows: any[]
): typeof MOCK_TRANSACTIONS {
  const transactions: typeof MOCK_TRANSACTIONS = [];
  let id = 1;
  const now = new Date();

  for (const cp of clientProducts) {
    const client = clients.find(c => c.id === cp.clientId);
    const product = products.find(p => p.id === cp.productId);
    if (!client || !product) continue;

    // Find original row for pricing
    const row = clientRows.find(r => 
      (r.client_name || r.name) === client.name
    );

    const costJpy = parseFloat(row?.cost_jpy || product.costJpy || "3500");
    const sellPriceSgd = parseFloat(row?.sell_price_sgd || cp.customPriceSgd || product.basePriceSgd || "50");
    const qty = parseFloat(cp.monthlyVolumeKg || "10");
    const fxRate = 0.009;
    const costSgd = costJpy * fxRate;
    const profitPerKg = sellPriceSgd - costSgd;
    const totalProfit = profitPerKg * qty;

    transactions.push({
      id: id++,
      clientId: client.id,
      productId: product.id,
      orderId: null,
      transactionDate: now,
      quantityKg: String(qty),
      costJpyPerKg: String(costJpy),
      fxRateJpySgd: String(fxRate),
      costSgdPerKg: costSgd.toFixed(2),
      sellPriceSgdPerKg: sellPriceSgd.toFixed(2),
      discountPercent: row?.discount || "0",
      profitSgdPerKg: profitPerKg.toFixed(2),
      totalProfitSgd: totalProfit.toFixed(2),
      notes: null,
      createdAt: now,
      updatedAt: now,
    });
  }
  return transactions;
}

export interface LiveData {
  suppliers: typeof MOCK_SUPPLIERS;
  products: typeof MOCK_PRODUCTS;
  clients: typeof MOCK_CLIENTS;
  clientProducts: typeof MOCK_CLIENT_PRODUCTS;
  inventory: typeof MOCK_INVENTORY;
  transactions: typeof MOCK_TRANSACTIONS;
  messages: any[];
  source: "sheets" | "csv" | "mock";
}

let _cachedData: LiveData | null = null;
let _lastFetch = 0;
const DATA_TTL_MS = 30_000; // 30 seconds

export async function getLiveData(): Promise<LiveData> {
  // Return cached data if fresh
  if (_cachedData && Date.now() - _lastFetch < DATA_TTL_MS) {
    return _cachedData;
  }

  // Try Google Sheets first
  if (hasGoogleSheets()) {
    try {
      const [supplierRows, inventoryRows, clientRows, messageRows] = await Promise.all([
        fetchSuppliers(),
        fetchInventory(),
        fetchClients(),
        fetchMessages(),
      ]);

      if (supplierRows.length > 0 || inventoryRows.length > 0 || clientRows.length > 0) {
        const suppliers = transformSuppliers(supplierRows);
        const inventory = transformInventory(inventoryRows, suppliers);
        const clients = transformClients(clientRows);
        const products = transformProducts(inventoryRows, suppliers);
        const clientProducts = transformClientProducts(clientRows, clients, products, suppliers);
        const transactions = generateTransactions(clients, products, clientProducts, clientRows);

        _cachedData = {
          suppliers,
          products,
          clients,
          clientProducts,
          inventory,
          transactions,
          messages: messageRows,
          source: "sheets",
        };
        _lastFetch = Date.now();
        console.log(`[LiveData] Loaded from Google Sheets: ${suppliers.length} suppliers, ${clients.length} clients, ${inventory.length} inventory`);
        return _cachedData;
      }
    } catch (error) {
      console.error("[LiveData] Google Sheets error:", error);
    }
  }

  // Try CSV files
  if (hasCsvData()) {
    const supplierRows = loadCsvSuppliers();
    const inventoryRows = loadCsvInventory();
    const clientRows = loadCsvClients();
    const messageRows = loadCsvMessages();

    const suppliers = transformSuppliers(supplierRows);
    const inventory = transformInventory(inventoryRows, suppliers);
    const clients = transformClients(clientRows);
    const products = transformProducts(inventoryRows, suppliers);
    const clientProducts = transformClientProducts(clientRows, clients, products, suppliers);
    const transactions = generateTransactions(clients, products, clientProducts, clientRows);

    _cachedData = {
      suppliers,
      products,
      clients,
      clientProducts,
      inventory,
      transactions,
      messages: messageRows,
      source: "csv",
    };
    _lastFetch = Date.now();
    console.log(`[LiveData] Loaded from CSV files`);
    return _cachedData;
  }

  // Fall back to mock data
  _cachedData = {
    suppliers: MOCK_SUPPLIERS,
    products: MOCK_PRODUCTS,
    clients: MOCK_CLIENTS,
    clientProducts: MOCK_CLIENT_PRODUCTS,
    inventory: MOCK_INVENTORY,
    transactions: MOCK_TRANSACTIONS,
    messages: [],
    source: "mock",
  };
  _lastFetch = Date.now();
  console.log(`[LiveData] Using mock data`);
  return _cachedData;
}

export function refreshData(): void {
  _cachedData = null;
  _lastFetch = 0;
  clearSheetsCache();
  console.log("[LiveData] Cache cleared - next request will fetch fresh data");
}

/** JSON-serializable snapshot for AI context (no Date objects) */
export async function getLiveDataForContext(): Promise<Record<string, unknown>> {
  const data = await getLiveData();
  return {
    source: data.source,
    suppliers: data.suppliers.map(s => ({
      id: s.id,
      name: s.name,
      country: s.country,
      leadTimeDays: s.leadTimeDays,
      notes: s.notes,
    })),
    clients: data.clients.map(c => ({
      id: c.id,
      name: c.name,
      businessType: c.businessType,
      discountPercent: c.discountPercent,
      paymentTerms: c.paymentTerms,
    })),
    products: data.products.map(p => ({
      id: p.id,
      name: p.name,
      grade: p.grade,
      supplierId: p.supplierId,
      costJpy: p.costJpy,
      basePriceSgd: p.basePriceSgd,
    })),
    inventory: data.inventory.map(i => ({
      productName: i.productName,
      grade: i.grade,
      supplierName: i.supplierName,
      quantityKg: i.quantityKg,
      allocatedKg: i.allocatedKg,
      availableKg: i.availableKg,
      reorderPointKg: i.reorderPointKg,
    })),
    transactions: data.transactions.map(t => ({
      clientId: t.clientId,
      productId: t.productId,
      quantityKg: t.quantityKg,
      totalProfitSgd: t.totalProfitSgd,
      profitSgdPerKg: t.profitSgdPerKg,
    })),
  };
}
