import { eq, and, desc, sql, gte, lte, isNull, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users,
  suppliers, InsertSupplier,
  matchaProducts, InsertMatchaProduct,
  clients, InsertClient,
  clientProducts, InsertClientProduct,
  inventory, InsertInventory,
  inventorySnapshots, InsertInventorySnapshot,
  orders, InsertOrder,
  transactions, InsertTransaction,
  exchangeRates, InsertExchangeRate,
  recommendations, InsertRecommendation,
  reorderAlerts, InsertReorderAlert
} from "../drizzle/schema";
import { ENV } from './_core/env';
import {
  MOCK_RECOMMENDATIONS,
  MOCK_REORDER_ALERTS,
  MOCK_EXCHANGE_RATES,
} from './mockData';
import { getLiveData, refreshData as refreshLiveData } from './liveData';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============= USER QUERIES =============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============= SUPPLIER QUERIES =============

export async function getAllSuppliers() {
  const db = await getDb();
  if (!db) {
    const liveData = await getLiveData();
    console.log(`[DB] getAllSuppliers returning ${liveData.suppliers.length} items from ${liveData.source}`);
    return liveData.suppliers;
  }
  return await db.select().from(suppliers).where(eq(suppliers.isActive, true)).orderBy(suppliers.name);
}

export async function getSupplierById(id: number) {
  const db = await getDb();
  if (!db) {
    const data = await getLiveData();
    return data.suppliers.find(s => s.id === id);
  }
  const result = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
  return result[0];
}

export async function createSupplier(data: InsertSupplier) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(suppliers).values(data);
  return result;
}

export async function updateSupplier(id: number, data: Partial<InsertSupplier>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(suppliers).set(data).where(eq(suppliers.id, id));
}

export async function deleteSupplier(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(suppliers).set({ isActive: false }).where(eq(suppliers.id, id));
}

// ============= PRODUCT QUERIES =============

export async function getAllProducts() {
  const db = await getDb();
  if (!db) {
    const liveData = await getLiveData();
    return liveData.products;
  }
  return await db.select().from(matchaProducts).where(eq(matchaProducts.isActive, true)).orderBy(matchaProducts.name);
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) {
    const liveData = await getLiveData();
    return liveData.products.find(p => p.id === id);
  }
  const result = await db.select().from(matchaProducts).where(eq(matchaProducts.id, id)).limit(1);
  return result[0];
}

export async function getProductsBySupplier(supplierId: number) {
  const db = await getDb();
  if (!db) {
    const liveData = await getLiveData();
    return liveData.products.filter(p => p.supplierId === supplierId);
  }
  return await db.select().from(matchaProducts)
    .where(and(eq(matchaProducts.supplierId, supplierId), eq(matchaProducts.isActive, true)))
    .orderBy(matchaProducts.name);
}

export async function createProduct(data: InsertMatchaProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(matchaProducts).values(data);
  return result;
}

export async function updateProduct(id: number, data: Partial<InsertMatchaProduct>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(matchaProducts).set(data).where(eq(matchaProducts.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(matchaProducts).set({ isActive: false }).where(eq(matchaProducts.id, id));
}

// ============= CLIENT QUERIES =============

export async function getAllClients() {
  const db = await getDb();
  if (!db) {
    const liveData = await getLiveData();
    return liveData.clients;
  }
  return await db.select().from(clients).where(eq(clients.isActive, true)).orderBy(clients.name);
}

export async function getClientById(id: number) {
  const db = await getDb();
  if (!db) {
    const liveData = await getLiveData();
    return liveData.clients.find(c => c.id === id);
  }
  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result[0];
}

export async function createClient(data: InsertClient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clients).values(data);
  return result;
}

export async function updateClient(id: number, data: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clients).set(data).where(eq(clients.id, id));
}

export async function deleteClient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clients).set({ isActive: false }).where(eq(clients.id, id));
}

// ============= CLIENT PRODUCT QUERIES =============

export async function getClientProductsByClientId(clientId: number) {
  const db = await getDb();
  if (!db) {
    const liveData = await getLiveData();
    return liveData.clientProducts.filter(cp => cp.clientId === clientId);
  }
  return await db.select().from(clientProducts)
    .where(and(eq(clientProducts.clientId, clientId), eq(clientProducts.isActive, true)));
}

export async function createClientProduct(data: InsertClientProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clientProducts).values(data);
  return result;
}

export async function updateClientProduct(id: number, data: Partial<InsertClientProduct>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clientProducts).set(data).where(eq(clientProducts.id, id));
}

export async function deleteClientProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clientProducts).set({ isActive: false }).where(eq(clientProducts.id, id));
}

// ============= INVENTORY QUERIES =============

export async function getAllInventory() {
  const db = await getDb();
  if (!db) {
    const liveData = await getLiveData();
    return liveData.inventory;
  }
  return await db.select().from(inventory).orderBy(inventory.productId);
}

export async function getInventoryByProduct(productId: number) {
  const db = await getDb();
  if (!db) {
    const liveData = await getLiveData();
    return liveData.inventory.find(inv => inv.productId === productId);
  }
  const result = await db.select().from(inventory).where(eq(inventory.productId, productId)).limit(1);
  return result[0];
}

export async function upsertInventory(data: InsertInventory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(inventory).values(data).onDuplicateKeyUpdate({
    set: {
      quantityKg: data.quantityKg,
      allocatedKg: data.allocatedKg,
      reorderPointKg: data.reorderPointKg,
      warehouseLocation: data.warehouseLocation,
      lastOrderDate: data.lastOrderDate,
      lastArrivalDate: data.lastArrivalDate,
      nextOrderDate: data.nextOrderDate,
    },
  });
}

export async function updateInventoryQuantity(productId: number, quantityKg: string, allocatedKg?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { quantityKg };
  if (allocatedKg !== undefined) {
    updateData.allocatedKg = allocatedKg;
  }
  
  await db.update(inventory).set(updateData).where(eq(inventory.productId, productId));
}

// ============= INVENTORY SNAPSHOT QUERIES =============

export async function createInventorySnapshot(data: InsertInventorySnapshot) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(inventorySnapshots).values(data);
  return result;
}

export async function getAllSnapshots() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(inventorySnapshots).orderBy(desc(inventorySnapshots.createdAt));
}

export async function getSnapshotById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(inventorySnapshots).where(eq(inventorySnapshots.id, id)).limit(1);
  return result[0];
}

// ============= ORDER QUERIES =============

export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orders).orderBy(desc(orders.orderDate));
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result[0];
}

export async function getOrdersByClient(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orders)
    .where(eq(orders.clientId, clientId))
    .orderBy(desc(orders.orderDate));
}

export async function createOrder(data: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(orders).values(data);
  return result;
}

export async function updateOrder(id: number, data: Partial<InsertOrder>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set(data).where(eq(orders.id, id));
}

// ============= TRANSACTION QUERIES =============

export async function getAllTransactions() {
  const db = await getDb();
  if (!db) {
    const liveData = await getLiveData();
    return liveData.transactions;
  }
  return await db.select().from(transactions).orderBy(desc(transactions.transactionDate));
}

export async function getTransactionsByClient(clientId: number) {
  const db = await getDb();
  if (!db) {
    const liveData = await getLiveData();
    return liveData.transactions.filter(t => t.clientId === clientId);
  }
  return await db.select().from(transactions)
    .where(eq(transactions.clientId, clientId))
    .orderBy(desc(transactions.transactionDate));
}

export async function getTransactionsByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) {
    const liveData = await getLiveData();
    return liveData.transactions.filter(t => 
      t.transactionDate >= startDate && t.transactionDate <= endDate
    );
  }
  return await db.select().from(transactions)
    .where(and(
      gte(transactions.transactionDate, startDate),
      lte(transactions.transactionDate, endDate)
    ))
    .orderBy(desc(transactions.transactionDate));
}

export async function createTransaction(data: InsertTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(transactions).values(data);
  return result;
}

// ============= EXCHANGE RATE QUERIES =============

export async function getLatestExchangeRate() {
  const db = await getDb();
  if (!db) return MOCK_EXCHANGE_RATES[0];
  const result = await db.select().from(exchangeRates).orderBy(desc(exchangeRates.date)).limit(1);
  return result[0];
}

export async function getExchangeRateByDate(date: Date) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(exchangeRates).where(eq(exchangeRates.date, date)).limit(1);
  return result[0];
}

export async function createExchangeRate(data: InsertExchangeRate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(exchangeRates).values(data).onDuplicateKeyUpdate({
    set: { jpyToSgdRate: data.jpyToSgdRate, source: data.source },
  });
}

export async function getExchangeRateHistory(days: number = 30) {
  const db = await getDb();
  if (!db) return MOCK_EXCHANGE_RATES;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  return await db.select().from(exchangeRates)
    .where(gte(exchangeRates.date, startDate))
    .orderBy(desc(exchangeRates.date));
}

// ============= RECOMMENDATION QUERIES =============

export async function getAllRecommendations() {
  const db = await getDb();
  if (!db) return MOCK_RECOMMENDATIONS;
  return await db.select().from(recommendations).orderBy(desc(recommendations.createdAt));
}

export async function getPendingRecommendations() {
  const db = await getDb();
  if (!db) return MOCK_RECOMMENDATIONS.filter(r => r.status === "pending");
  return await db.select().from(recommendations)
    .where(eq(recommendations.status, "pending"))
    .orderBy(desc(recommendations.profitIncreaseSgd));
}

export async function getRecommendationsByClient(clientId: number) {
  const db = await getDb();
  if (!db) return MOCK_RECOMMENDATIONS.filter(r => r.clientId === clientId);
  return await db.select().from(recommendations)
    .where(eq(recommendations.clientId, clientId))
    .orderBy(desc(recommendations.createdAt));
}

export async function createRecommendation(data: InsertRecommendation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(recommendations).values(data);
  return result;
}

export async function updateRecommendation(id: number, data: Partial<InsertRecommendation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(recommendations).set(data).where(eq(recommendations.id, id));
}

// ============= REORDER ALERT QUERIES =============

export async function getActiveReorderAlerts() {
  const db = await getDb();
  if (!db) return MOCK_REORDER_ALERTS.filter(r => r.status === "active");
  return await db.select().from(reorderAlerts)
    .where(eq(reorderAlerts.status, "active"))
    .orderBy(desc(reorderAlerts.urgencyLevel), desc(reorderAlerts.createdAt));
}

export async function getReorderAlertsByProduct(productId: number) {
  const db = await getDb();
  if (!db) return MOCK_REORDER_ALERTS.filter(r => r.productId === productId);
  return await db.select().from(reorderAlerts)
    .where(eq(reorderAlerts.productId, productId))
    .orderBy(desc(reorderAlerts.createdAt));
}

export async function createReorderAlert(data: InsertReorderAlert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(reorderAlerts).values(data);
  return result;
}

export async function updateReorderAlert(id: number, data: Partial<InsertReorderAlert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(reorderAlerts).set(data).where(eq(reorderAlerts.id, id));
}

// ============= ANALYTICS QUERIES =============

export async function getDashboardMetrics() {
  const db = await getDb();
  if (!db) {
    // Calculate from live data
    const liveData = await getLiveData();
    
    const totalProfit = liveData.transactions.reduce((sum, t) => sum + parseFloat(t.totalProfitSgd), 0);
    const totalQty = liveData.transactions.reduce((sum, t) => sum + parseFloat(t.quantityKg), 0);
    const avgProfitPerKg = totalQty > 0 ? totalProfit / totalQty : 0;
    
    const lowStockCount = liveData.inventory.filter(inv => {
      const available = parseFloat(inv.availableKg || "0");
      const reorderPoint = parseFloat(inv.reorderPointKg || "50");
      return available < reorderPoint;
    }).length;

    return {
      totalProfitThisMonth: totalProfit.toFixed(2),
      avgProfitPerKg: avgProfitPerKg.toFixed(2),
      totalQuantityThisMonth: totalQty.toFixed(2),
      activeClients: liveData.clients.filter(c => c.isActive).length,
      lowStockAlerts: lowStockCount,
      pendingOrders: 2, // Mock value
    };
  }

  // Get current month start
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Total profit and avg profit per kg this month
  const profitResult = await db.select({
    totalProfit: sql<string>`COALESCE(SUM(${transactions.totalProfitSgd}), 0)`,
    avgProfitPerKg: sql<string>`COALESCE(AVG(${transactions.profitSgdPerKg}), 0)`,
    totalQuantity: sql<string>`COALESCE(SUM(${transactions.quantityKg}), 0)`
  }).from(transactions).where(gte(transactions.transactionDate, monthStart));

  // Active clients count
  const clientsResult = await db.select({
    count: sql<number>`COUNT(*)`
  }).from(clients).where(eq(clients.isActive, true));

  // Low stock alerts count
  const lowStockResult = await db.select({
    count: sql<number>`COUNT(*)`
  }).from(inventory).where(sql`${inventory.quantityKg} - ${inventory.allocatedKg} < ${inventory.reorderPointKg}`);

  // Pending orders count
  const pendingOrdersResult = await db.select({
    count: sql<number>`COUNT(*)`
  }).from(orders).where(eq(orders.status, "pending"));

  return {
    totalProfitThisMonth: profitResult[0]?.totalProfit || "0",
    avgProfitPerKg: profitResult[0]?.avgProfitPerKg || "0",
    totalQuantityThisMonth: profitResult[0]?.totalQuantity || "0",
    activeClients: clientsResult[0]?.count || 0,
    lowStockAlerts: lowStockResult[0]?.count || 0,
    pendingOrders: pendingOrdersResult[0]?.count || 0,
  };
}

export async function getClientProfitability() {
  const db = await getDb();
  if (!db) {
    // Calculate from live data
    const liveData = await getLiveData();
    const byClient = new Map<number, { total: number; qty: number; count: number; name: string }>();
    
    for (const t of liveData.transactions) {
      const client = liveData.clients.find(c => c.id === t.clientId);
      const existing = byClient.get(t.clientId) ?? { total: 0, qty: 0, count: 0, name: client?.name || "Unknown" };
      existing.total += parseFloat(t.totalProfitSgd);
      existing.qty += parseFloat(t.quantityKg);
      existing.count++;
      byClient.set(t.clientId, existing);
    }

    return Array.from(byClient.entries()).map(([clientId, data]) => ({
      clientId,
      clientName: data.name,
      totalProfit: data.total.toFixed(2),
      totalQuantity: data.qty.toFixed(2),
      avgProfitPerKg: data.count > 0 ? (data.total / data.qty).toFixed(2) : "0",
    })).sort((a, b) => parseFloat(b.totalProfit) - parseFloat(a.totalProfit));
  }

  const result = await db.select({
    clientId: transactions.clientId,
    clientName: clients.name,
    totalProfit: sql<string>`SUM(${transactions.totalProfitSgd})`,
    totalQuantity: sql<string>`SUM(${transactions.quantityKg})`,
    avgProfitPerKg: sql<string>`AVG(${transactions.profitSgdPerKg})`,
  })
  .from(transactions)
  .innerJoin(clients, eq(transactions.clientId, clients.id))
  .groupBy(transactions.clientId, clients.name)
  .orderBy(desc(sql`SUM(${transactions.totalProfitSgd})`));

  return result;
}

export async function getProductProfitability() {
  const db = await getDb();
  if (!db) {
    // Aggregate live data transactions by product
    const liveData = await getLiveData();
    const profitByProduct: Record<number, { totalProfit: number; totalQty: number; count: number }> = {};
    for (const t of liveData.transactions) {
      if (!profitByProduct[t.productId]) {
        profitByProduct[t.productId] = { totalProfit: 0, totalQty: 0, count: 0 };
      }
      profitByProduct[t.productId].totalProfit += parseFloat(t.totalProfitSgd);
      profitByProduct[t.productId].totalQty += parseFloat(t.quantityKg);
      profitByProduct[t.productId].count++;
    }
    return Object.entries(profitByProduct).map(([productId, data]) => {
      const product = liveData.products.find(p => p.id === parseInt(productId));
      return {
        productId: parseInt(productId),
        productName: product?.name || "Unknown",
        grade: product?.grade || "unknown",
        totalProfit: data.totalProfit.toFixed(2),
        totalQuantity: data.totalQty.toFixed(2),
        avgProfitPerKg: data.totalQty > 0 ? (data.totalProfit / data.totalQty).toFixed(2) : "0",
      };
    });
  }

  const result = await db.select({
    productId: transactions.productId,
    productName: matchaProducts.name,
    grade: matchaProducts.grade,
    totalProfit: sql<string>`SUM(${transactions.totalProfitSgd})`,
    totalQuantity: sql<string>`SUM(${transactions.quantityKg})`,
    avgProfitPerKg: sql<string>`AVG(${transactions.profitSgdPerKg})`,
  })
  .from(transactions)
  .innerJoin(matchaProducts, eq(transactions.productId, matchaProducts.id))
  .groupBy(transactions.productId, matchaProducts.name, matchaProducts.grade)
  .orderBy(desc(sql`SUM(${transactions.totalProfitSgd})`));

  return result;
}

export async function getInventoryWithProducts() {
  const db = await getDb();
  if (!db) {
    const liveData = await getLiveData();
    return liveData.inventory.map(inv => {
      const qty = parseFloat(inv.quantityKg);
      const alloc = parseFloat(inv.allocatedKg);
      return {
        inventoryId: inv.inventoryId,
        productId: inv.productId,
        productName: inv.productName,
        grade: inv.grade,
        supplierId: inv.supplierId,
        supplierName: inv.supplierName,
        quantityKg: inv.quantityKg,
        allocatedKg: inv.allocatedKg,
        availableKg: inv.availableKg ?? (qty - alloc).toFixed(2),
        reorderPointKg: inv.reorderPointKg,
        warehouseLocation: inv.warehouseLocation,
        lastOrderDate: inv.lastOrderDate,
        lastArrivalDate: inv.lastArrivalDate,
        nextOrderDate: inv.nextOrderDate ?? null,
      };
    });
  }

  const result = await db.select({
    inventoryId: inventory.id,
    productId: matchaProducts.id,
    productName: matchaProducts.name,
    grade: matchaProducts.grade,
    supplierId: matchaProducts.supplierId,
    supplierName: suppliers.name,
    quantityKg: inventory.quantityKg,
    allocatedKg: inventory.allocatedKg,
    availableKg: sql<string>`${inventory.quantityKg} - ${inventory.allocatedKg}`,
    reorderPointKg: inventory.reorderPointKg,
    warehouseLocation: inventory.warehouseLocation,
    lastOrderDate: inventory.lastOrderDate,
    lastArrivalDate: inventory.lastArrivalDate,
    nextOrderDate: inventory.nextOrderDate,
  })
  .from(inventory)
  .innerJoin(matchaProducts, eq(inventory.productId, matchaProducts.id))
  .innerJoin(suppliers, eq(matchaProducts.supplierId, suppliers.id))
  .orderBy(matchaProducts.name);

  return result;
}
