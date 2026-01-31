/**
 * Transforms CSV data into app schema format.
 * Used when database is not available - loads from data/*.csv files.
 */

import {
  loadSuppliers as loadCsvSuppliers,
  loadInventory as loadCsvInventory,
  loadClients as loadCsvClients,
  loadMessages as loadCsvMessages,
  hasCsvData,
} from "./csvLoader";
import type { CsvSupplier, CsvInventory, CsvClient } from "./csvLoader";

const FX_RATE = 0.009; // JPY to SGD
const SHIPPING_SGD_PER_KG = 15;
const TAX_PERCENT = 9;

function gradeFromMatchaType(t: string): "competition" | "ceremonial" | "premium" | "cafe" | "culinary" {
  const lower = t.toLowerCase();
  if (lower.includes("competition")) return "competition";
  if (lower.includes("ceremonial")) return "ceremonial";
  if (lower.includes("premium")) return "premium";
  if (lower.includes("café") || lower.includes("cafe")) return "cafe";
  if (lower.includes("culinary")) return "culinary";
  return "premium";
}

export function getSuppliersFromCsv() {
  const rows = loadCsvSuppliers();
  if (rows.length === 0) return null;

  const seen = new Set<string>();
  const suppliers: Array<{
    id: number;
    name: string;
    country: string;
    contactPerson: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    leadTimeDays: number;
    notes: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> = [];
  let id = 1;
  for (const r of rows) {
    const key = r.supplier_id || r.supplier_name;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    suppliers.push({
      id: id++,
      name: r.supplier_name || "Unknown",
      country: r.country || "Japan",
      contactPerson: null,
      contactEmail: null,
      contactPhone: null,
      leadTimeDays: parseInt(r.lead_time_days, 10) || 14,
      notes: r.reliability_score ? `Reliability: ${r.reliability_score}` : null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  return suppliers;
}

export function getProductsFromCsv(suppliers: ReturnType<typeof getSuppliersFromCsv>) {
  const invRows = loadCsvInventory();
  if (!suppliers || invRows.length === 0) return null;

  const supplierNameToId = new Map(suppliers.map((s) => [s.name.toLowerCase(), s.id]));

  const products: Array<{
    id: number;
    supplierId: number;
    name: string;
    grade: "competition" | "ceremonial" | "premium" | "cafe" | "culinary";
    costYenPerKg: string;
    qualityScore: number;
    description: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> = [];
  let id = 1;
  for (const r of invRows) {
    const supplierId = supplierNameToId.get(r.supplier?.toLowerCase()) ?? suppliers[0].id;
    const grade = gradeFromMatchaType(r.product_name || "");
    products.push({
      id: id++,
      supplierId,
      name: r.product_name || "Unknown",
      grade,
      costYenPerKg: r.cost_jpy || "0",
      qualityScore: 8,
      description: `${r.product_name} from ${r.supplier}`,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  return products;
}

export function getInventoryFromCsv(
  products: ReturnType<typeof getProductsFromCsv>
) {
  const invRows = loadCsvInventory();
  if (!products || invRows.length === 0) return null;

  const inventory: Array<{
    id: number;
    productId: number;
    quantityKg: string;
    allocatedKg: string;
    reorderPointKg: string;
    warehouseLocation: string;
    lastOrderDate: Date;
    lastArrivalDate: Date;
    createdAt: Date;
    updatedAt: Date;
  }> = [];
  const baseDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
  let id = 1;
  for (let i = 0; i < products.length && i < invRows.length; i++) {
    const r = invRows[i];
    const product = products[i];
    inventory.push({
      id: id++,
      productId: product.id,
      quantityKg: r.total_stock || "0",
      allocatedKg: r.allocated || "0",
      reorderPointKg: r.reorder_point || "20",
      warehouseLocation: "Main Warehouse",
      lastOrderDate: baseDate,
      lastArrivalDate: baseDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  return inventory;
}

export function getClientsFromCsv(
  products: ReturnType<typeof getProductsFromCsv>
) {
  const rows = loadCsvClients();
  if (!products || rows.length === 0) return null;

  const seen = new Set<string>();
  const clients: Array<{
    id: number;
    name: string;
    businessType: string | null;
    contactPerson: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    address: string | null;
    discountPercent: string;
    paymentTerms: string | null;
    notes: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> = [];
  let id = 1;
  for (const r of rows) {
    const key = r.client_id || r.client_name;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    clients.push({
      id: id++,
      name: r.client_name || "Unknown",
      businessType: null,
      contactPerson: null,
      contactEmail: null,
      contactPhone: null,
      address: null,
      discountPercent: r.discount || "0",
      paymentTerms: "NET30",
      notes: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  return clients;
}

export function getClientProductsFromCsv(
  clients: ReturnType<typeof getClientsFromCsv>,
  products: ReturnType<typeof getProductsFromCsv>,
  suppliers: ReturnType<typeof getSuppliersFromCsv>
) {
  const rows = loadCsvClients();
  if (!clients || !products || rows.length === 0) return null;

  const clientNameToId = new Map(clients.map((c) => [c.name.toLowerCase(), c.id]));

  const clientProducts: Array<{
    id: number;
    clientId: number;
    productId: number;
    monthlyVolumeKg: string;
    sellingPriceSgdPerKg: string;
    specialDiscount: string;
    createdAt: Date;
    updatedAt: Date;
  }> = [];
  const seen = new Set<string>();
  let id = 1;
  for (const r of rows) {
    const cpKey = `${r.client_id}_${r.matcha_type}_${r.supplier}`;
    if (seen.has(cpKey)) continue;
    seen.add(cpKey);
    const clientId = clientNameToId.get(r.client_name?.toLowerCase());
    if (!clientId) continue;

    const matchaType = (r.matcha_type || "").toLowerCase();
    const csvSupplier = (r.supplier || "").toLowerCase();
    const product = products.find((p) => {
      const pName = p.name.toLowerCase();
      const nameMatch = pName.includes(matchaType) || matchaType.includes(pName);
      const sup = suppliers?.find((s) => s.id === p.supplierId);
      const supplierMatch = !csvSupplier || sup?.name.toLowerCase() === csvSupplier;
      return nameMatch && supplierMatch;
    }) ?? products.find((p) => gradeFromMatchaType(r.matcha_type || "") === p.grade);
    const productId = product?.id ?? products[0]?.id;
    if (!productId) continue;

    clientProducts.push({
      id: id++,
      clientId,
      productId,
      monthlyVolumeKg: r.monthly_kg || "0",
      sellingPriceSgdPerKg: r.sell_price_sgd || "0",
      specialDiscount: r.discount || "0",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  return clientProducts;
}

export function getTransactionsFromCsv(
  clients: ReturnType<typeof getClientsFromCsv>,
  products: ReturnType<typeof getProductsFromCsv>,
  clientProducts: ReturnType<typeof getClientProductsFromCsv>
) {
  if (!clients || !products || !clientProducts || clientProducts.length === 0)
    return null;

  const transactions: Array<{
    id: number;
    orderId: number;
    clientId: number;
    productId: number;
    quantityKg: string;
    costYenPerKg: string;
    exchangeRate: string;
    shippingCostSgdPerKg: string;
    importTaxPercent: string;
    totalCostSgdPerKg: string;
    sellingPriceSgdPerKg: string;
    discountSgdPerKg: string;
    profitSgdPerKg: string;
    totalProfitSgd: string;
    transactionDate: Date;
    createdAt: Date;
  }> = [];
  let id = 1;
  const orderId = 1;
  for (const cp of clientProducts) {
    const product = products.find((p) => p.id === cp.productId);
    const costYen = parseFloat(product?.costYenPerKg || "0");
    const landedCost =
      costYen * FX_RATE + SHIPPING_SGD_PER_KG;
    const withTax = landedCost * (1 + TAX_PERCENT / 100);
    const sellPrice = parseFloat(cp.sellingPriceSgdPerKg);
    const discount = parseFloat(cp.specialDiscount) / 100 * sellPrice;
    const profitPerKg = sellPrice - discount - withTax;
    const qty = parseFloat(cp.monthlyVolumeKg);

    transactions.push({
      id: id++,
      orderId,
      clientId: cp.clientId,
      productId: cp.productId,
      quantityKg: cp.monthlyVolumeKg,
      costYenPerKg: product?.costYenPerKg || "0",
      exchangeRate: FX_RATE.toString(),
      shippingCostSgdPerKg: SHIPPING_SGD_PER_KG.toString(),
      importTaxPercent: TAX_PERCENT.toString(),
      totalCostSgdPerKg: withTax.toFixed(2),
      sellingPriceSgdPerKg: cp.sellingPriceSgdPerKg,
      discountSgdPerKg: (discount / qty).toFixed(2),
      profitSgdPerKg: profitPerKg.toFixed(2),
      totalProfitSgd: (profitPerKg * qty).toFixed(2),
      transactionDate: new Date(Date.now() - id * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    });
  }
  return transactions;
}

export function getMessagesFromCsv(): Array<{
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
}> {
  return loadCsvMessages();
}

export { hasCsvData };
