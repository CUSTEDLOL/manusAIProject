import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { getMessages } from "./mockData";
import { generateRecommendations, generateReorderAlerts, analyzeClientProfitability } from "./aiRecommendations";
import { calculateProfit, exchangeRateScenario, calculateOptimalPrice } from "./profitabilityCalculator";
import { refreshData as refreshLiveData, getLiveData, getLiveDataForContext } from "./liveData";

// ============= SUPPLIER ROUTER =============

const supplierRouter = router({
  list: protectedProcedure.query(async () => {
    return await db.getAllSuppliers();
  }),
  
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.getSupplierById(input.id);
    }),
  
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      country: z.string().default("Japan"),
      contactPerson: z.string().optional(),
      contactEmail: z.string().email().optional(),
      contactPhone: z.string().optional(),
      leadTimeDays: z.number().default(45),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await db.createSupplier(input);
    }),
  
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      country: z.string().optional(),
      contactPerson: z.string().optional(),
      contactEmail: z.string().email().optional(),
      contactPhone: z.string().optional(),
      leadTimeDays: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateSupplier(id, data);
      return { success: true };
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteSupplier(input.id);
      return { success: true };
    }),
});

// ============= PRODUCT ROUTER =============

const productRouter = router({
  list: protectedProcedure.query(async () => {
    return await db.getAllProducts();
  }),
  
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.getProductById(input.id);
    }),
  
  getBySupplier: protectedProcedure
    .input(z.object({ supplierId: z.number() }))
    .query(async ({ input }) => {
      return await db.getProductsBySupplier(input.supplierId);
    }),
  
  create: protectedProcedure
    .input(z.object({
      supplierId: z.number(),
      name: z.string(),
      grade: z.enum(["competition", "ceremonial", "premium", "cafe", "culinary"]),
      costYenPerKg: z.string(),
      qualityScore: z.number().min(1).max(10).default(5),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await db.createProduct(input);
    }),
  
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      supplierId: z.number().optional(),
      name: z.string().optional(),
      grade: z.enum(["competition", "ceremonial", "premium", "cafe", "culinary"]).optional(),
      costYenPerKg: z.string().optional(),
      qualityScore: z.number().min(1).max(10).optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateProduct(id, data);
      return { success: true };
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteProduct(input.id);
      return { success: true };
    }),
});

// ============= CLIENT ROUTER =============

const b2bClientRouter = router({
  list: protectedProcedure.query(async () => {
    return await db.getAllClients();
  }),
  
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.getClientById(input.id);
    }),
  
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      businessType: z.string().optional(),
      contactPerson: z.string().optional(),
      contactEmail: z.string().email().optional(),
      contactPhone: z.string().optional(),
      address: z.string().optional(),
      discountPercent: z.string().default("0"),
      paymentTerms: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await db.createClient(input);
    }),
  
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      businessType: z.string().optional(),
      contactPerson: z.string().optional(),
      contactEmail: z.string().email().optional(),
      contactPhone: z.string().optional(),
      address: z.string().optional(),
      discountPercent: z.string().optional(),
      paymentTerms: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateClient(id, data);
      return { success: true };
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteClient(input.id);
      return { success: true };
    }),
  
  getProducts: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ input }) => {
      return await db.getClientProductsByClientId(input.clientId);
    }),
  
  addProduct: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      productId: z.number(),
      monthlyVolumeKg: z.string(),
      sellingPriceSgdPerKg: z.string(),
      specialDiscount: z.string().default("0"),
    }))
    .mutation(async ({ input }) => {
      return await db.createClientProduct(input);
    }),
  
  updateProduct: protectedProcedure
    .input(z.object({
      id: z.number(),
      monthlyVolumeKg: z.string().optional(),
      sellingPriceSgdPerKg: z.string().optional(),
      specialDiscount: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateClientProduct(id, data);
      return { success: true };
    }),
  
  deleteProduct: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteClientProduct(input.id);
      return { success: true };
    }),
  
  getProfitability: protectedProcedure.query(async () => {
    return await db.getClientProfitability();
  }),
});

// ============= INVENTORY ROUTER =============

const inventoryRouter = router({
  list: protectedProcedure.query(async () => {
    return await db.getInventoryWithProducts();
  }),
  
  getByProduct: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      return await db.getInventoryByProduct(input.productId);
    }),
  
  upsert: protectedProcedure
    .input(z.object({
      productId: z.number(),
      quantityKg: z.string(),
      allocatedKg: z.string().default("0"),
      reorderPointKg: z.string().default("10"),
      warehouseLocation: z.string().optional(),
      lastOrderDate: z.date().optional(),
      lastArrivalDate: z.date().optional(),
      nextOrderDate: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.upsertInventory(input);
      return { success: true };
    }),
  
  updateQuantity: protectedProcedure
    .input(z.object({
      productId: z.number(),
      quantityKg: z.string(),
      allocatedKg: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.updateInventoryQuantity(input.productId, input.quantityKg, input.allocatedKg);
      return { success: true };
    }),
  
  createSnapshot: protectedProcedure
    .input(z.object({
      snapshotName: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const inventoryData = await db.getAllInventory();
      const snapshotData = JSON.stringify(inventoryData);
      
      await db.createInventorySnapshot({
        snapshotName: input.snapshotName,
        snapshotData,
        createdBy: ctx.user.id,
      });
      
      return { success: true };
    }),
  
  listSnapshots: protectedProcedure.query(async () => {
    return await db.getAllSnapshots();
  }),
  
  restoreSnapshot: protectedProcedure
    .input(z.object({ snapshotId: z.number() }))
    .mutation(async ({ input }) => {
      const snapshot = await db.getSnapshotById(input.snapshotId);
      if (!snapshot) {
        throw new Error("Snapshot not found");
      }
      
      const inventoryData = JSON.parse(snapshot.snapshotData);
      
      // Restore each inventory record
      for (const item of inventoryData) {
        await db.upsertInventory(item);
      }
      
      return { success: true };
    }),
});

// ============= ORDER ROUTER =============

const orderRouter = router({
  list: protectedProcedure.query(async () => {
    return await db.getAllOrders();
  }),
  
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.getOrderById(input.id);
    }),
  
  getByClient: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ input }) => {
      return await db.getOrdersByClient(input.clientId);
    }),
  
  create: protectedProcedure
    .input(z.object({
      orderType: z.enum(["supplier_order", "client_delivery"]),
      supplierId: z.number().optional(),
      clientId: z.number().optional(),
      productId: z.number(),
      quantityKg: z.string(),
      expectedDeliveryDate: z.date().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await db.createOrder(input);
    }),
  
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]).optional(),
      expectedDeliveryDate: z.date().optional(),
      actualDeliveryDate: z.date().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateOrder(id, data);
      return { success: true };
    }),
});

// ============= TRANSACTION ROUTER =============

const transactionRouter = router({
  list: protectedProcedure.query(async () => {
    return await db.getAllTransactions();
  }),
  
  getByClient: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ input }) => {
      return await db.getTransactionsByClient(input.clientId);
    }),
  
  getByDateRange: protectedProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date(),
    }))
    .query(async ({ input }) => {
      return await db.getTransactionsByDateRange(input.startDate, input.endDate);
    }),
  
  create: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      clientId: z.number(),
      productId: z.number(),
      quantityKg: z.string(),
      costYenPerKg: z.string(),
      exchangeRate: z.string(),
      shippingCostSgdPerKg: z.string().default("15"),
      importTaxPercent: z.string().default("9"),
      sellingPriceSgdPerKg: z.string(),
      discountSgdPerKg: z.string().default("0"),
    }))
    .mutation(async ({ input }) => {
      // Calculate costs
      const costYen = parseFloat(input.costYenPerKg);
      const exchangeRate = parseFloat(input.exchangeRate);
      const shipping = parseFloat(input.shippingCostSgdPerKg);
      const taxPercent = parseFloat(input.importTaxPercent);
      const sellingPrice = parseFloat(input.sellingPriceSgdPerKg);
      const discount = parseFloat(input.discountSgdPerKg);
      const quantity = parseFloat(input.quantityKg);
      
      // Total cost = (Yen cost × Exchange rate + Shipping) × (1 + Tax%)
      const costSgdBeforeTax = (costYen * exchangeRate) + shipping;
      const totalCostPerKg = costSgdBeforeTax * (1 + taxPercent / 100);
      const profitPerKg = sellingPrice - discount - totalCostPerKg;
      const totalProfit = profitPerKg * quantity;
      
      return await db.createTransaction({
        ...input,
        totalCostSgdPerKg: totalCostPerKg.toFixed(2),
        profitSgdPerKg: profitPerKg.toFixed(2),
        totalProfitSgd: totalProfit.toFixed(2),
      });
    }),
});

// ============= EXCHANGE RATE ROUTER =============

const exchangeRateRouter = router({
  getLatest: protectedProcedure.query(async () => {
    return await db.getLatestExchangeRate();
  }),
  
  getHistory: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input }) => {
      return await db.getExchangeRateHistory(input.days);
    }),
  
  create: protectedProcedure
    .input(z.object({
      date: z.date(),
      jpyToSgdRate: z.string(),
      source: z.string().default("manual"),
    }))
    .mutation(async ({ input }) => {
      await db.createExchangeRate(input);
      return { success: true };
    }),
});

// ============= RECOMMENDATION ROUTER =============

const recommendationRouter = router({
  list: protectedProcedure.query(async () => {
    return await db.getAllRecommendations();
  }),
  
  getPending: protectedProcedure.query(async () => {
    return await db.getPendingRecommendations();
  }),
  
  getByClient: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ input }) => {
      return await db.getRecommendationsByClient(input.clientId);
    }),
  
  create: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      currentProductId: z.number(),
      recommendedProductId: z.number(),
      reason: z.string(),
      currentProfitPerKg: z.string(),
      recommendedProfitPerKg: z.string(),
      profitIncreaseSgd: z.string(),
      profitIncreasePercent: z.string(),
    }))
    .mutation(async ({ input }) => {
      return await db.createRecommendation(input);
    }),
  
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "accepted", "rejected", "implemented"]),
    }))
    .mutation(async ({ input }) => {
      await db.updateRecommendation(input.id, { status: input.status });
      return { success: true };
    }),
});

// ============= REORDER ALERT ROUTER =============

const messagesRouter = router({
  list: protectedProcedure.query(async () => {
    return getMessages();
  }),
});

const reorderAlertRouter = router({
  getActive: protectedProcedure.query(async () => {
    return await db.getActiveReorderAlerts();
  }),
  
  getByProduct: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      return await db.getReorderAlertsByProduct(input.productId);
    }),
  
  create: protectedProcedure
    .input(z.object({
      productId: z.number(),
      supplierId: z.number(),
      currentStockKg: z.string(),
      reorderPointKg: z.string(),
      recommendedOrderKg: z.string(),
      urgencyLevel: z.enum(["low", "medium", "high", "critical"]),
      reason: z.string(),
    }))
    .mutation(async ({ input }) => {
      return await db.createReorderAlert(input);
    }),
  
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["active", "ordered", "dismissed"]),
    }))
    .mutation(async ({ input }) => {
      await db.updateReorderAlert(input.id, { status: input.status });
      return { success: true };
    }),
});

// ============= ANALYTICS ROUTER =============

const analyticsRouter = router({
  getDashboardMetrics: protectedProcedure.query(async () => {
    return await db.getDashboardMetrics();
  }),
  
  getClientProfitability: protectedProcedure.query(async () => {
    return await db.getClientProfitability();
  }),
  
  getProductProfitability: protectedProcedure.query(async () => {
    return await db.getProductProfitability();
  }),
});

// ============= CHAT ROUTER (MatsuMind AI) =============

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini"; // gpt-4o-mini is widely available; use gpt-4o or gpt-4 for premium

const chatRouter = router({
  send: protectedProcedure
    .input(z.object({ message: z.string().min(1), history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).optional() }))
    .mutation(async ({ input }) => {
      const apiKey = process.env.OPENAI_API_KEY?.trim();
      if (!apiKey) {
        console.error("[Chat] OPENAI_API_KEY is missing or empty in .env");
        throw new Error("OpenAI API key is not configured. Add OPENAI_API_KEY to your .env file.");
      }

      let context: Record<string, unknown>;
      try {
        context = await getLiveDataForContext();
      } catch (e) {
        console.error("[Chat] getLiveDataForContext failed:", e);
        throw new Error("Could not load business data. Please try again.");
      }

      const contextStr = JSON.stringify(context, null, 2);
      const maxContextLen = 8000;
      const truncatedContext = contextStr.length > maxContextLen
        ? contextStr.slice(0, maxContextLen) + "\n... (truncated)"
        : contextStr;

      const systemPrompt = `You are MatsuMind, an AI assistant for Matsu Matcha's B2B matcha wholesale business. Use the current business data below to answer questions. Be specific with numbers (SGD, kg, etc.) when the data supports it. Use bullet points and **bold** for key figures. If the data doesn't have something, say so briefly.

Current business data:
${truncatedContext}`;

      const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: systemPrompt },
      ];
      const lastHistory = (input.history ?? []).slice(-5);
      for (const h of lastHistory) {
        messages.push({ role: h.role as "user" | "assistant", content: h.content });
      }
      messages.push({ role: "user", content: input.message });

      let res: Response;
      try {
        res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: OPENAI_MODEL,
            messages,
            max_tokens: 1024,
            temperature: 0.4,
          }),
        });
      } catch (networkError: unknown) {
        console.error("[Chat] Network error calling OpenAI:", networkError);
        throw new Error("Could not reach the AI service. Check your connection and try again.");
      }

      const errText = await res.text();

      if (!res.ok) {
        console.error("[Chat] OpenAI API error:", res.status, errText.slice(0, 500));
        if (res.status === 401) {
          throw new Error("Invalid API key. Check OPENAI_API_KEY in your .env file.");
        }
        if (res.status === 429) {
          throw new Error("Too many requests. Please wait a moment and try again.");
        }
        if (res.status === 404) {
          throw new Error("AI model unavailable. Try setting OPENAI_MODEL=gpt-4o-mini in .env.");
        }
        throw new Error("The AI service returned an error. Please rephrase or try again in a moment.");
      }

      let json: { choices?: { message?: { content?: string } }[] };
      try {
        json = JSON.parse(errText);
      } catch {
        console.error("[Chat] Invalid JSON from OpenAI:", errText.slice(0, 200));
        throw new Error("Invalid response from the AI. Please try again.");
      }

      const content = json.choices?.[0]?.message?.content?.trim() ?? "I couldn't generate a response. Please try rephrasing.";
      return { content };
    }),
});

// ============= SUPPLIER COMPARISON ROUTER =============

const JPY_TO_SGD = 0.009;
const SHIPPING_JPY_PER_KG = 15;
const IMPORT_TAX_RATE = 1.09;

const supplierComparisonRouter = router({
  getComparison: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ input }) => {
      const data = await getLiveData();
      const client = data.clients.find(c => c.id === input.clientId);
      if (!client) throw new Error("Client not found");

      const clientProds = data.clientProducts.filter(cp => cp.clientId === input.clientId && (cp as { isActive?: boolean }).isActive !== false);
      const cp0 = clientProds[0] as { customPriceSgd?: string | null; productId: number } | undefined;
      const prod0 = cp0 && data.products.find(p => p.id === cp0.productId) as { basePriceSgd?: string } | undefined;
      const sellingPriceSgd = cp0?.customPriceSgd ? parseFloat(cp0.customPriceSgd) : prod0?.basePriceSgd ? parseFloat(prod0.basePriceSgd) : 50;
      const monthlyVolumeKg = clientProds.reduce((sum, cp) => sum + parseFloat(cp.monthlyVolumeKg || "0"), 0) || 10;
      const currentSupplierId = clientProds[0] ? data.products.find(p => p.id === clientProds[0].productId)?.supplierId : null;

      const rows: {
        supplierId: number;
        supplierName: string;
        basePriceJpy: number;
        shippingJpy: number;
        taxJpy: number;
        landedCostJpyPerKg: number;
        landedCostSgdPerKg: number;
        marginSgd: number;
        marginPercent: number;
        monthlyProfitSgd: number;
        leadTimeDays: number;
        reliabilityScore: string;
        qualityRating: number;
      }[] = [];

      for (const s of data.suppliers) {
        const supplierProducts = data.products.filter(p => p.supplierId === s.id);
        const basePriceJpy = supplierProducts.length
          ? Math.min(...supplierProducts.map(p => parseFloat((p as { costJpy?: string }).costJpy || (p as { costYenPerKg?: string }).costYenPerKg || "3500")))
          : 3500;
        const shippingJpy = SHIPPING_JPY_PER_KG;
        const landedCostJpyPerKg = (basePriceJpy + shippingJpy) * IMPORT_TAX_RATE;
        const taxJpy = landedCostJpyPerKg - (basePriceJpy + shippingJpy);
        const landedCostSgdPerKg = landedCostJpyPerKg * JPY_TO_SGD;
        const marginSgd = sellingPriceSgd - landedCostSgdPerKg;
        const marginPercent = landedCostSgdPerKg > 0 ? (marginSgd / landedCostSgdPerKg) * 100 : 0;
        const monthlyProfitSgd = marginSgd * monthlyVolumeKg;
        const reliabilityMatch = s.notes?.match(/[\d.]+/);
        const reliabilityScore = reliabilityMatch ? reliabilityMatch[0] : "—";
        const qualityRating = supplierProducts.length
          ? Math.min(5, Math.max(1, Math.round(supplierProducts.length * 1.5)))
          : 3;

        rows.push({
          supplierId: s.id,
          supplierName: s.name,
          basePriceJpy,
          shippingJpy,
          taxJpy,
          landedCostJpyPerKg,
          landedCostSgdPerKg,
          marginSgd,
          marginPercent,
          monthlyProfitSgd,
          leadTimeDays: s.leadTimeDays,
          reliabilityScore,
          qualityRating,
        });
      }

      rows.sort((a, b) => b.monthlyProfitSgd - a.monthlyProfitSgd);

      return {
        client: { id: client.id, name: client.name },
        sellingPriceSgd,
        monthlyVolumeKg,
        currentSupplierId,
        rows,
      };
    }),

  getRecommendation: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .mutation(async ({ input }) => {
      const apiKey = process.env.OPENAI_API_KEY?.trim();
      if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

      const data = await getLiveData();
      const client = data.clients.find(c => c.id === input.clientId);
      if (!client) throw new Error("Client not found");

      const clientProds = data.clientProducts.filter(cp => cp.clientId === input.clientId && (cp as { isActive?: boolean }).isActive !== false);
      const cpFirst = clientProds[0] as { customPriceSgd?: string; productId: number } | undefined;
      const sellingPriceSgd = cpFirst?.customPriceSgd ? parseFloat(cpFirst.customPriceSgd) : 50;
      const monthlyVolumeKg = clientProds.reduce((sum, cp) => sum + parseFloat(cp.monthlyVolumeKg || "0"), 0) || 10;
      const currentSupplierId = cpFirst ? data.products.find(p => p.id === cpFirst.productId)?.supplierId : null;

      const rows: { supplierName: string; basePriceJpy: number; landedCostJpyPerKg: number; marginSgd: number; monthlyProfitSgd: number; leadTimeDays: number; reliabilityScore: string }[] = [];
      for (const s of data.suppliers) {
        const supplierProducts = data.products.filter(p => p.supplierId === s.id);
        const basePriceJpy = supplierProducts.length ? Math.min(...supplierProducts.map(p => parseFloat((p as { costJpy?: string }).costJpy || (p as { costYenPerKg?: string }).costYenPerKg || "3500"))) : 3500;
        const landedCostJpyPerKg = (basePriceJpy + SHIPPING_JPY_PER_KG) * IMPORT_TAX_RATE;
        const landedCostSgdPerKg = landedCostJpyPerKg * JPY_TO_SGD;
        const marginSgd = sellingPriceSgd - landedCostSgdPerKg;
        const monthlyProfitSgd = marginSgd * monthlyVolumeKg;
        const reliabilityMatch = s.notes?.match(/[\d.]+/);
        rows.push({
          supplierName: s.name,
          basePriceJpy,
          landedCostJpyPerKg,
          marginSgd,
          monthlyProfitSgd,
          leadTimeDays: s.leadTimeDays,
          reliabilityScore: reliabilityMatch ? reliabilityMatch[0] : "—",
        });
      }
      rows.sort((a, b) => b.monthlyProfitSgd - a.monthlyProfitSgd);
      const best = rows[0];
      const currentRow = currentSupplierId ? rows.find(r => data.suppliers.find(sup => sup.id === currentSupplierId)?.name === r.supplierName) : null;
      const potentialSavingsSgd = currentRow && best ? best.monthlyProfitSgd - currentRow.monthlyProfitSgd : 0;
      const potentialSavingsJpy = potentialSavingsSgd / JPY_TO_SGD;

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a B2B matcha procurement advisor. Answer in 2-3 concise sentences. Be specific with numbers.",
            },
            {
              role: "user",
              content: `Analyze these suppliers for client "${client.name}". Consider price, quality, reliability, lead time. Which supplier should they use and why? Data: ${JSON.stringify(rows)}. Best margin supplier: ${best?.supplierName}. Current supplier profit: ${currentRow?.monthlyProfitSgd?.toFixed(2) ?? "N/A"} SGD/month.`,
            },
          ],
          max_tokens: 256,
          temperature: 0.3,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error("[SupplierComparison] OpenAI error:", res.status, err);
        throw new Error("Could not generate recommendation.");
      }
      const json = await res.json();
      const reasoning = json.choices?.[0]?.message?.content?.trim() ?? "Unable to generate recommendation.";
      return {
        recommendedSupplierName: best?.supplierName ?? "—",
        reasoning,
        potentialSavingsJpy: Math.round(potentialSavingsJpy),
      };
    }),
});

// ============= DATA ROUTER (Google Sheets / CSV) =============

const dataRouter = router({
  // Refresh data from Google Sheets (clears cache)
  refresh: protectedProcedure.mutation(async () => {
    refreshLiveData();
    const data = await getLiveData();
    return { 
      success: true, 
      source: data.source,
      counts: {
        suppliers: data.suppliers.length,
        clients: data.clients.length,
        products: data.products.length,
        inventory: data.inventory.length,
      }
    };
  }),

  // Get current data source status
  status: protectedProcedure.query(async () => {
    const data = await getLiveData();
    return {
      source: data.source,
      counts: {
        suppliers: data.suppliers.length,
        clients: data.clients.length,
        products: data.products.length,
        inventory: data.inventory.length,
        transactions: data.transactions.length,
        messages: data.messages.length,
      }
    };
  }),
});

// ============= MAIN APP ROUTER =============

export const appRouter = router({
  system: systemRouter,
  data: dataRouter,
  chat: chatRouter,
  supplierComparison: supplierComparisonRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  
  supplier: supplierRouter,
  product: productRouter,
  b2bClient: b2bClientRouter,
  inventory: inventoryRouter,
  order: orderRouter,
  transaction: transactionRouter,
  exchangeRate: exchangeRateRouter,
  recommendation: recommendationRouter,
  reorderAlert: reorderAlertRouter,
  messages: messagesRouter,
  analytics: analyticsRouter,
  
  // AI & Calculator
  ai: router({
    generateRecommendations: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        clientProductId: z.number(),
      }))
      .mutation(async ({ input }) => {
        // Get client product details
        const clientProduct = await db.getClientProductsByClientId(input.clientId);
        const cp = clientProduct.find(p => p.id === input.clientProductId);
        if (!cp) throw new Error("Client product not found");
        
        const product = await db.getProductById(cp.productId);
        if (!product) throw new Error("Product not found");
        
        const client = await db.getClientById(input.clientId);
        if (!client) throw new Error("Client not found");
        
        const exchangeRate = await db.getLatestExchangeRate();
        if (!exchangeRate) throw new Error("Exchange rate not found");
        
        // Get alternative products
        const allProducts = await db.getAllProducts();
        const alternativeProducts = await Promise.all(
          allProducts.map(async (p) => {
            const supplier = await db.getSupplierById(p.supplierId);
            return {
              id: p.id,
              name: p.name,
              grade: p.grade,
              costYenPerKg: p.costYenPerKg,
              qualityScore: p.qualityScore,
              supplierName: supplier?.name || "Unknown",
            };
          })
        );
        
        // Generate recommendations
        const recommendations = await generateRecommendations(
          {
            clientId: input.clientId,
            clientName: client.name,
            currentProductId: product.id,
            currentProductName: product.name,
            currentProductGrade: product.grade,
            currentCostYen: parseFloat(product.costYenPerKg),
            currentSellingPrice: parseFloat(cp.sellingPriceSgdPerKg),
            monthlyVolume: parseFloat(cp.monthlyVolumeKg),
            exchangeRate: parseFloat(exchangeRate.jpyToSgdRate),
            discount: parseFloat(cp.specialDiscount),
          },
          alternativeProducts
        );
        
        // Save recommendations to database
        for (const rec of recommendations) {
          await db.createRecommendation({
            clientId: input.clientId,
            currentProductId: product.id,
            recommendedProductId: rec.recommendedProductId,
            reason: rec.reason,
            currentProfitPerKg: rec.currentProfitPerKg.toFixed(2),
            recommendedProfitPerKg: rec.recommendedProfitPerKg.toFixed(2),
            profitIncreaseSgd: rec.profitIncreaseSgd.toFixed(2),
            profitIncreasePercent: rec.profitIncreasePercent.toFixed(2),
          });
        }
        
        return { success: true, count: recommendations.length };
      }),
    
    generateReorderAlerts: protectedProcedure
      .mutation(async () => {
        const alerts = await generateReorderAlerts();
        
        // Save alerts to database
        for (const alert of alerts) {
          await db.createReorderAlert(alert);
        }
        
        return { success: true, count: alerts.length };
      }),
    
    analyzeClient: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return await analyzeClientProfitability(input.clientId);
      }),
  }),
  
  calculator: router({
    calculateProfit: protectedProcedure
      .input(z.object({
        costYenPerKg: z.number(),
        exchangeRate: z.number(),
        sellingPriceSgdPerKg: z.number(),
        discountSgdPerKg: z.number().default(0),
        monthlyVolumeKg: z.number().default(0),
      }))
      .query(({ input }) => {
        return calculateProfit(
          input.costYenPerKg,
          input.exchangeRate,
          input.sellingPriceSgdPerKg,
          input.discountSgdPerKg,
          input.monthlyVolumeKg
        );
      }),
    
    exchangeRateScenario: protectedProcedure
      .input(z.object({
        costYenPerKg: z.number(),
        currentExchangeRate: z.number(),
        newExchangeRate: z.number(),
        sellingPriceSgdPerKg: z.number(),
        discountSgdPerKg: z.number().default(0),
        monthlyVolumeKg: z.number().default(0),
      }))
      .query(({ input }) => {
        return exchangeRateScenario(
          input.costYenPerKg,
          input.currentExchangeRate,
          input.newExchangeRate,
          input.sellingPriceSgdPerKg,
          input.discountSgdPerKg,
          input.monthlyVolumeKg
        );
      }),
    
    optimalPrice: protectedProcedure
      .input(z.object({
        costYenPerKg: z.number(),
        exchangeRate: z.number(),
        targetProfitMarginPercent: z.number(),
        discountSgdPerKg: z.number().default(0),
      }))
      .query(({ input }) => {
        return calculateOptimalPrice(
          input.costYenPerKg,
          input.exchangeRate,
          input.targetProfitMarginPercent,
          input.discountSgdPerKg
        );
      }),
  }),
});

export type AppRouter = typeof appRouter;
