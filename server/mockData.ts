/**
 * Hardcoded demo data for when database is not available
 * This allows the app to run fully without MySQL
 */

// ============= SUPPLIERS =============
export const MOCK_SUPPLIERS = [
  {
    id: 1,
    name: "Kyoto Premium Matcha Co.",
    country: "Japan",
    contactPerson: "Tanaka Hiroshi",
    contactEmail: "tanaka@kyotomatcha.jp",
    contactPhone: "+81-75-123-4567",
    leadTimeDays: 45,
    notes: "Premium ceremonial grade supplier from Uji, Kyoto",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: 2,
    name: "Shizuoka Organic Tea Farm",
    country: "Japan",
    contactPerson: "Yamamoto Yuki",
    contactEmail: "yamamoto@shizuokateas.jp",
    contactPhone: "+81-54-987-6543",
    leadTimeDays: 50,
    notes: "Organic certified, excellent cafe-grade matcha",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: 3,
    name: "Nishio Matcha Masters",
    country: "Japan",
    contactPerson: "Sato Kenji",
    contactEmail: "sato@nishiomatcha.jp",
    contactPhone: "+81-563-555-1234",
    leadTimeDays: 40,
    notes: "Competition grade matcha specialist",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

// ============= PRODUCTS =============
export const MOCK_PRODUCTS = [
  {
    id: 1,
    supplierId: 1,
    name: "Uji Ceremonial Matcha Premium",
    grade: "ceremonial",
    costYenPerKg: "12000.00",
    qualityScore: 9,
    description: "Premium ceremonial grade from Uji, perfect for traditional tea ceremonies",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: 2,
    supplierId: 1,
    name: "Kyoto Competition Grade",
    grade: "competition",
    costYenPerKg: "18000.00",
    qualityScore: 10,
    description: "Award-winning competition grade matcha",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: 3,
    supplierId: 2,
    name: "Shizuoka Organic Cafe Blend",
    grade: "cafe",
    costYenPerKg: "6000.00",
    qualityScore: 7,
    description: "Organic cafe-grade matcha, great for lattes",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: 4,
    supplierId: 2,
    name: "Premium Culinary Matcha",
    grade: "culinary",
    costYenPerKg: "4500.00",
    qualityScore: 6,
    description: "High-quality culinary grade for baking and cooking",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: 5,
    supplierId: 3,
    name: "Nishio Premium Ceremonial",
    grade: "premium",
    costYenPerKg: "10000.00",
    qualityScore: 8,
    description: "Premium grade matcha with excellent balance",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

// ============= CLIENTS =============
export const MOCK_CLIENTS = [
  {
    id: 1,
    name: "Green Leaf Cafe",
    businessType: "Cafe",
    contactPerson: "Sarah Tan",
    contactEmail: "sarah@greenleaf.sg",
    contactPhone: "+65 9123 4567",
    address: "123 Orchard Road, Singapore 238858",
    discountPercent: "5.00",
    paymentTerms: "NET30",
    notes: "Regular customer, orders monthly",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: 2,
    name: "Zen Tea House",
    businessType: "Tea House",
    contactPerson: "David Lim",
    contactEmail: "david@zentea.sg",
    contactPhone: "+65 8234 5678",
    address: "45 Tanjong Pagar Road, Singapore 088463",
    discountPercent: "10.00",
    paymentTerms: "NET30",
    notes: "Premium client, high volume orders",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: 3,
    name: "Healthy Bites Bakery",
    businessType: "Bakery",
    contactPerson: "Michelle Wong",
    contactEmail: "michelle@healthybites.sg",
    contactPhone: "+65 9345 6789",
    address: "78 Bukit Timah Road, Singapore 229833",
    discountPercent: "0.00",
    paymentTerms: "NET60",
    notes: "Uses matcha for baking",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: 4,
    name: "Matcha Lovers Distributor",
    businessType: "Distributor",
    contactPerson: "Alex Chen",
    contactEmail: "alex@matchalovers.sg",
    contactPhone: "+65 9456 7890",
    address: "90 Paya Lebar Road, Singapore 409003",
    discountPercent: "15.00",
    paymentTerms: "NET45",
    notes: "Bulk distributor, largest client",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

// ============= CLIENT PRODUCTS =============
export const MOCK_CLIENT_PRODUCTS = [
  {
    id: 1,
    clientId: 1,
    productId: 3,
    monthlyVolumeKg: "15.00",
    sellingPriceSgdPerKg: "120.00",
    specialDiscount: "0.00",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: 2,
    clientId: 2,
    productId: 1,
    monthlyVolumeKg: "25.00",
    sellingPriceSgdPerKg: "180.00",
    specialDiscount: "5.00",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: 3,
    clientId: 3,
    productId: 4,
    monthlyVolumeKg: "20.00",
    sellingPriceSgdPerKg: "85.00",
    specialDiscount: "0.00",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: 4,
    clientId: 4,
    productId: 5,
    monthlyVolumeKg: "50.00",
    sellingPriceSgdPerKg: "150.00",
    specialDiscount: "10.00",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

// ============= INVENTORY =============
export const MOCK_INVENTORY = [
  {
    id: 1,
    productId: 1,
    quantityKg: "8.00",
    allocatedKg: "5.00",
    reorderPointKg: "15.00",
    warehouseLocation: "Main Warehouse A",
    lastOrderDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    lastArrivalDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: 2,
    productId: 2,
    quantityKg: "50.00",
    allocatedKg: "10.00",
    reorderPointKg: "15.00",
    warehouseLocation: "Main Warehouse A",
    lastOrderDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    lastArrivalDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: 3,
    productId: 3,
    quantityKg: "25.00",
    allocatedKg: "10.00",
    reorderPointKg: "15.00",
    warehouseLocation: "Main Warehouse A",
    lastOrderDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    lastArrivalDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: 4,
    productId: 4,
    quantityKg: "50.00",
    allocatedKg: "10.00",
    reorderPointKg: "15.00",
    warehouseLocation: "Main Warehouse A",
    lastOrderDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    lastArrivalDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: 5,
    productId: 5,
    quantityKg: "50.00",
    allocatedKg: "10.00",
    reorderPointKg: "15.00",
    warehouseLocation: "Main Warehouse A",
    lastOrderDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    lastArrivalDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

// ============= RECOMMENDATIONS =============
export const MOCK_RECOMMENDATIONS = [
  {
    id: 1,
    clientId: 1,
    currentProductId: 3,
    recommendedProductId: 5,
    reason: "Recommend Nishio Premium Ceremonial from Nishio Matcha Masters: 12% higher margin (+SGD 5.20/kg) with premium grade quality. Monthly profit increase: +SGD 78.00.",
    currentProfitPerKg: "46.47",
    recommendedProfitPerKg: "51.67",
    profitIncreaseSgd: "78.00",
    profitIncreasePercent: "11.20",
    status: "pending" as const,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: 2,
    clientId: 3,
    currentProductId: 4,
    recommendedProductId: 3,
    reason: "Recommend Shizuoka Organic Cafe Blend: 8% higher margin with organic certification. Better fit for bakery use.",
    currentProfitPerKg: "18.50",
    recommendedProfitPerKg: "22.00",
    profitIncreaseSgd: "70.00",
    profitIncreasePercent: "18.90",
    status: "pending" as const,
    createdAt: new Date("2024-01-16"),
    updatedAt: new Date("2024-01-16"),
  },
];

// ============= REORDER ALERTS =============
export const MOCK_REORDER_ALERTS = [
  {
    id: 1,
    productId: 1,
    supplierId: 1,
    currentStockKg: "8.00",
    reorderPointKg: "15.00",
    recommendedOrderKg: "25.00",
    urgencyLevel: "high" as const,
    reason: "Uji Ceremonial Matcha Premium stock critically low (8 kg, 48 days remaining). Order from Kyoto Premium Matcha Co. within 1 week.",
    status: "active" as const,
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
  },
];

// ============= TRANSACTIONS (for metrics) =============
export const MOCK_TRANSACTIONS = [
  {
    id: 1,
    orderId: 1,
    clientId: 1,
    productId: 3,
    quantityKg: "15.00",
    costYenPerKg: "6000.00",
    exchangeRate: "0.0090",
    shippingCostSgdPerKg: "15.00",
    importTaxPercent: "9.00",
    totalCostSgdPerKg: "73.53",
    sellingPriceSgdPerKg: "120.00",
    discountSgdPerKg: "0.00",
    profitSgdPerKg: "46.47",
    totalProfitSgd: "697.05",
    transactionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    createdAt: new Date("2024-01-01"),
  },
  {
    id: 2,
    orderId: 2,
    clientId: 2,
    productId: 1,
    quantityKg: "25.00",
    costYenPerKg: "12000.00",
    exchangeRate: "0.0090",
    shippingCostSgdPerKg: "15.00",
    importTaxPercent: "9.00",
    totalCostSgdPerKg: "132.03",
    sellingPriceSgdPerKg: "180.00",
    discountSgdPerKg: "5.00",
    profitSgdPerKg: "42.97",
    totalProfitSgd: "1074.25",
    transactionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    createdAt: new Date("2024-01-01"),
  },
  {
    id: 3,
    orderId: 3,
    clientId: 3,
    productId: 4,
    quantityKg: "20.00",
    costYenPerKg: "4500.00",
    exchangeRate: "0.0090",
    shippingCostSgdPerKg: "12.00",
    importTaxPercent: "9.00",
    totalCostSgdPerKg: "56.11",
    sellingPriceSgdPerKg: "85.00",
    discountSgdPerKg: "0.00",
    profitSgdPerKg: "28.89",
    totalProfitSgd: "577.80",
    transactionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    createdAt: new Date("2024-01-01"),
  },
  {
    id: 4,
    orderId: 4,
    clientId: 4,
    productId: 5,
    quantityKg: "50.00",
    costYenPerKg: "10000.00",
    exchangeRate: "0.0090",
    shippingCostSgdPerKg: "14.00",
    importTaxPercent: "9.00",
    totalCostSgdPerKg: "112.10",
    sellingPriceSgdPerKg: "150.00",
    discountSgdPerKg: "10.00",
    profitSgdPerKg: "27.90",
    totalProfitSgd: "1395.00",
    transactionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    createdAt: new Date("2024-01-01"),
  },
];

// ============= EXCHANGE RATES =============
export const MOCK_EXCHANGE_RATES = [
  {
    id: 1,
    date: new Date(),
    jpyToSgdRate: "0.0090",
    source: "manual",
    createdAt: new Date("2024-01-01"),
  },
];

// ============= CLIENT PROFITABILITY (pre-calculated) =============
export const MOCK_CLIENT_PROFITABILITY = [
  { clientId: 1, totalProfit: "697.05", avgProfitPerKg: "46.47" },
  { clientId: 2, totalProfit: "1074.25", avgProfitPerKg: "42.97" },
  { clientId: 3, totalProfit: "577.80", avgProfitPerKg: "28.89" },
  { clientId: 4, totalProfit: "1395.00", avgProfitPerKg: "27.90" },
];

// ============= DASHBOARD METRICS (pre-calculated) =============
export const MOCK_DASHBOARD_METRICS = {
  totalProfitThisMonth: "3744.10",
  avgProfitPerKg: "36.56",
  totalQuantityThisMonth: "110.00",
  totalClients: 4,
  activeAlerts: 1,
  pendingRecommendations: 2,
};

// ============= CSV DATA LOADER (prefer data/*.csv when available) =============
import {
  hasCsvData,
  getSuppliersFromCsv,
  getProductsFromCsv,
  getClientsFromCsv,
  getClientProductsFromCsv,
  getInventoryFromCsv,
  getTransactionsFromCsv,
  getMessagesFromCsv,
} from "./csvData";

let _csvSuppliers: typeof MOCK_SUPPLIERS | null = null;
let _csvProducts: typeof MOCK_PRODUCTS | null = null;
let _csvClients: typeof MOCK_CLIENTS | null = null;
let _csvClientProducts: typeof MOCK_CLIENT_PRODUCTS | null = null;
let _csvInventory: typeof MOCK_INVENTORY | null = null;
let _csvTransactions: typeof MOCK_TRANSACTIONS | null = null;

function loadCsvData() {
  if (!hasCsvData()) return false;
  const s = getSuppliersFromCsv();
  if (!s || s.length === 0) return false;
  const p = getProductsFromCsv(s);
  const c = getClientsFromCsv(p);
  const cp = getClientProductsFromCsv(c, p, s);
  const i = getInventoryFromCsv(p);
  const t = getTransactionsFromCsv(c, p, cp);
  _csvSuppliers = s;
  _csvProducts = p ?? [];
  _csvClients = c ?? [];
  _csvClientProducts = cp ?? [];
  _csvInventory = i ?? [];
  _csvTransactions = t ?? [];
  return true;
}

export function getSuppliers(): typeof MOCK_SUPPLIERS {
  if (_csvSuppliers) return _csvSuppliers;
  if (loadCsvData() && _csvSuppliers) {
    console.log("[Data] Returning CSV suppliers:", _csvSuppliers.length);
    return _csvSuppliers;
  }
  console.log("[Data] Returning mock suppliers:", MOCK_SUPPLIERS.length);
  return MOCK_SUPPLIERS;
}

export function getProducts(): typeof MOCK_PRODUCTS {
  if (_csvProducts) return _csvProducts;
  if (loadCsvData() && _csvProducts) return _csvProducts;
  return MOCK_PRODUCTS;
}

export function getClients(): typeof MOCK_CLIENTS {
  if (_csvClients) return _csvClients;
  if (loadCsvData() && _csvClients) return _csvClients;
  return MOCK_CLIENTS;
}

export function getClientProducts(): typeof MOCK_CLIENT_PRODUCTS {
  if (_csvClientProducts) return _csvClientProducts;
  if (loadCsvData() && _csvClientProducts) return _csvClientProducts;
  return MOCK_CLIENT_PRODUCTS;
}

export function getInventory(): typeof MOCK_INVENTORY {
  if (_csvInventory) return _csvInventory;
  if (loadCsvData() && _csvInventory) return _csvInventory;
  return MOCK_INVENTORY;
}

export function getTransactions(): typeof MOCK_TRANSACTIONS {
  if (_csvTransactions) return _csvTransactions;
  if (loadCsvData() && _csvTransactions) return _csvTransactions;
  return MOCK_TRANSACTIONS;
}

export function getClientProfitability() {
  const tx = getTransactions();
  const clients = getClients();
  const byClient = new Map<number, { total: number; qty: number; count: number }>();
  for (const t of tx) {
    const existing = byClient.get(t.clientId) ?? { total: 0, qty: 0, count: 0 };
    existing.total += parseFloat(t.totalProfitSgd);
    existing.qty += parseFloat(t.quantityKg);
    existing.count++;
    byClient.set(t.clientId, existing);
  }
  return Array.from(byClient.entries()).map(([clientId, data]) => ({
    clientId,
    clientName: clients.find((c) => c.id === clientId)?.name ?? "Unknown",
    totalProfit: data.total.toFixed(2),
    totalQuantity: data.qty.toFixed(2),
    avgProfitPerKg: (data.qty > 0 ? data.total / data.qty : 0).toFixed(2),
  }));
}

export function getMessages() {
  if (hasCsvData()) {
    const msgs = getMessagesFromCsv();
    if (msgs.length > 0) return msgs;
  }
  return [];
}

export function getDashboardMetricsFromFile() {
  const tx = getTransactions();
  const clients = getClients();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const thisMonth = tx.filter((t) => new Date(t.transactionDate) >= monthStart);
  const totalProfit = thisMonth.reduce((s, t) => s + parseFloat(t.totalProfitSgd), 0);
  const totalQty = thisMonth.reduce((s, t) => s + parseFloat(t.quantityKg), 0);
  const inv = getInventory();
  const lowStock = inv.filter(
    (i) => parseFloat(i.quantityKg) - parseFloat(i.allocatedKg) < parseFloat(i.reorderPointKg)
  ).length;
  return {
    totalProfitThisMonth: totalProfit.toFixed(2),
    avgProfitPerKg: totalQty > 0 ? (totalProfit / totalQty).toFixed(2) : "0",
    totalQuantityThisMonth: totalQty.toFixed(2),
    activeClients: clients.length,
    lowStockAlerts: lowStock,
    pendingOrders: 2,
  };
}
