import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Suppliers table - tracks matcha suppliers from Japan
 */
export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  country: varchar("country", { length: 100 }).default("Japan").notNull(),
  contactPerson: varchar("contactPerson", { length: 255 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 50 }),
  leadTimeDays: int("leadTimeDays").default(45).notNull(), // 1-2 months typical
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

/**
 * Matcha products table - different grades and types from suppliers
 */
export const matchaProducts = mysqlTable("matchaProducts", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  grade: mysqlEnum("grade", ["competition", "ceremonial", "premium", "cafe", "culinary"]).notNull(),
  costYenPerKg: decimal("costYenPerKg", { precision: 10, scale: 2 }).notNull(),
  qualityScore: int("qualityScore").default(5).notNull(), // 1-10 scale
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  supplierIdx: index("supplier_idx").on(table.supplierId),
}));

export type MatchaProduct = typeof matchaProducts.$inferSelect;
export type InsertMatchaProduct = typeof matchaProducts.$inferInsert;

/**
 * Clients table - B2B customers
 */
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  businessType: varchar("businessType", { length: 100 }), // cafe, restaurant, distributor, etc.
  contactPerson: varchar("contactPerson", { length: 255 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 50 }),
  address: text("address"),
  discountPercent: decimal("discountPercent", { precision: 5, scale: 2 }).default("0").notNull(),
  paymentTerms: varchar("paymentTerms", { length: 100 }), // NET30, NET60, etc.
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Client products table - tracks which products each client orders regularly
 */
export const clientProducts = mysqlTable("clientProducts", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  productId: int("productId").notNull(),
  monthlyVolumeKg: decimal("monthlyVolumeKg", { precision: 10, scale: 2 }).notNull(),
  sellingPriceSgdPerKg: decimal("sellingPriceSgdPerKg", { precision: 10, scale: 2 }).notNull(),
  specialDiscount: decimal("specialDiscount", { precision: 5, scale: 2 }).default("0").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  clientIdx: index("client_idx").on(table.clientId),
  productIdx: index("product_idx").on(table.productId),
}));

export type ClientProduct = typeof clientProducts.$inferSelect;
export type InsertClientProduct = typeof clientProducts.$inferInsert;

/**
 * Inventory table - tracks stock levels for each product
 */
export const inventory = mysqlTable("inventory", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().unique(),
  quantityKg: decimal("quantityKg", { precision: 10, scale: 2 }).default("0").notNull(),
  allocatedKg: decimal("allocatedKg", { precision: 10, scale: 2 }).default("0").notNull(),
  reorderPointKg: decimal("reorderPointKg", { precision: 10, scale: 2 }).default("10").notNull(),
  warehouseLocation: varchar("warehouseLocation", { length: 100 }),
  lastOrderDate: timestamp("lastOrderDate"),
  lastArrivalDate: timestamp("lastArrivalDate"),
  nextOrderDate: timestamp("nextOrderDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  productIdx: index("product_idx").on(table.productId),
}));

export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = typeof inventory.$inferInsert;

/**
 * Inventory snapshots - for version control and rollback
 */
export const inventorySnapshots = mysqlTable("inventorySnapshots", {
  id: int("id").autoincrement().primaryKey(),
  snapshotName: varchar("snapshotName", { length: 255 }).notNull(),
  snapshotData: text("snapshotData").notNull(), // JSON string of inventory state
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  createdByIdx: index("created_by_idx").on(table.createdBy),
}));

export type InventorySnapshot = typeof inventorySnapshots.$inferSelect;
export type InsertInventorySnapshot = typeof inventorySnapshots.$inferInsert;

/**
 * Orders table - tracks orders from suppliers and deliveries to clients
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderType: mysqlEnum("orderType", ["supplier_order", "client_delivery"]).notNull(),
  supplierId: int("supplierId"), // for supplier orders
  clientId: int("clientId"), // for client deliveries
  productId: int("productId").notNull(),
  quantityKg: decimal("quantityKg", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "shipped", "delivered", "cancelled"]).default("pending").notNull(),
  orderDate: timestamp("orderDate").defaultNow().notNull(),
  expectedDeliveryDate: timestamp("expectedDeliveryDate"),
  actualDeliveryDate: timestamp("actualDeliveryDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  supplierIdx: index("supplier_idx").on(table.supplierId),
  clientIdx: index("client_idx").on(table.clientId),
  productIdx: index("product_idx").on(table.productId),
}));

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Transactions table - financial records for profitability tracking
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  clientId: int("clientId").notNull(),
  productId: int("productId").notNull(),
  quantityKg: decimal("quantityKg", { precision: 10, scale: 2 }).notNull(),
  costYenPerKg: decimal("costYenPerKg", { precision: 10, scale: 2 }).notNull(),
  exchangeRate: decimal("exchangeRate", { precision: 10, scale: 4 }).notNull(),
  shippingCostSgdPerKg: decimal("shippingCostSgdPerKg", { precision: 10, scale: 2 }).default("15").notNull(),
  importTaxPercent: decimal("importTaxPercent", { precision: 5, scale: 2 }).default("9").notNull(),
  totalCostSgdPerKg: decimal("totalCostSgdPerKg", { precision: 10, scale: 2 }).notNull(),
  sellingPriceSgdPerKg: decimal("sellingPriceSgdPerKg", { precision: 10, scale: 2 }).notNull(),
  discountSgdPerKg: decimal("discountSgdPerKg", { precision: 10, scale: 2 }).default("0").notNull(),
  profitSgdPerKg: decimal("profitSgdPerKg", { precision: 10, scale: 2 }).notNull(),
  totalProfitSgd: decimal("totalProfitSgd", { precision: 10, scale: 2 }).notNull(),
  transactionDate: timestamp("transactionDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  orderIdx: index("order_idx").on(table.orderId),
  clientIdx: index("client_idx").on(table.clientId),
  productIdx: index("product_idx").on(table.productId),
  dateIdx: index("date_idx").on(table.transactionDate),
}));

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Exchange rates table - tracks JPY to SGD conversion rates
 */
export const exchangeRates = mysqlTable("exchangeRates", {
  id: int("id").autoincrement().primaryKey(),
  date: timestamp("date").notNull().unique(),
  jpyToSgdRate: decimal("jpyToSgdRate", { precision: 10, scale: 4 }).notNull(),
  source: varchar("source", { length: 100 }).default("manual").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  dateIdx: index("date_idx").on(table.date),
}));

export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type InsertExchangeRate = typeof exchangeRates.$inferInsert;

/**
 * AI Recommendations table - stores product swap suggestions
 */
export const recommendations = mysqlTable("recommendations", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  currentProductId: int("currentProductId").notNull(),
  recommendedProductId: int("recommendedProductId").notNull(),
  reason: text("reason").notNull(),
  currentProfitPerKg: decimal("currentProfitPerKg", { precision: 10, scale: 2 }).notNull(),
  recommendedProfitPerKg: decimal("recommendedProfitPerKg", { precision: 10, scale: 2 }).notNull(),
  profitIncreaseSgd: decimal("profitIncreaseSgd", { precision: 10, scale: 2 }).notNull(),
  profitIncreasePercent: decimal("profitIncreasePercent", { precision: 5, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "rejected", "implemented"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  clientIdx: index("client_idx").on(table.clientId),
  statusIdx: index("status_idx").on(table.status),
}));

export type Recommendation = typeof recommendations.$inferSelect;
export type InsertRecommendation = typeof recommendations.$inferInsert;

/**
 * Reorder alerts table - tracks when products need reordering
 */
export const reorderAlerts = mysqlTable("reorderAlerts", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  supplierId: int("supplierId").notNull(),
  currentStockKg: decimal("currentStockKg", { precision: 10, scale: 2 }).notNull(),
  reorderPointKg: decimal("reorderPointKg", { precision: 10, scale: 2 }).notNull(),
  recommendedOrderKg: decimal("recommendedOrderKg", { precision: 10, scale: 2 }).notNull(),
  urgencyLevel: mysqlEnum("urgencyLevel", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  reason: text("reason").notNull(),
  status: mysqlEnum("status", ["active", "ordered", "dismissed"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  productIdx: index("product_idx").on(table.productId),
  statusIdx: index("status_idx").on(table.status),
}));

export type ReorderAlert = typeof reorderAlerts.$inferSelect;
export type InsertReorderAlert = typeof reorderAlerts.$inferInsert;
