import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./drizzle/schema.ts";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

async function seed() {
  console.log("🌱 Starting seed process...");
  
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  try {
    // 1. Create Suppliers
    console.log("Creating suppliers...");
    const supplierIds = [];
    
    const suppliers = [
      {
        name: "Kyoto Premium Matcha Co.",
        country: "Japan",
        contactPerson: "Tanaka Hiroshi",
        contactEmail: "tanaka@kyotomatcha.jp",
        contactPhone: "+81-75-123-4567",
        leadTimeDays: 45,
        notes: "Premium ceremonial grade supplier from Uji, Kyoto",
      },
      {
        name: "Shizuoka Organic Tea Farm",
        country: "Japan",
        contactPerson: "Yamamoto Yuki",
        contactEmail: "yamamoto@shizuokateas.jp",
        contactPhone: "+81-54-987-6543",
        leadTimeDays: 50,
        notes: "Organic certified, excellent cafe-grade matcha",
      },
      {
        name: "Nishio Matcha Masters",
        country: "Japan",
        contactPerson: "Sato Kenji",
        contactEmail: "sato@nishiomatcha.jp",
        contactPhone: "+81-563-555-1234",
        leadTimeDays: 40,
        notes: "Competition grade matcha specialist",
      },
    ];

    for (const supplier of suppliers) {
      const result = await db.insert(schema.suppliers).values(supplier);
      supplierIds.push(Number(result[0].insertId));
    }

    // 2. Create Products
    console.log("Creating products...");
    const productIds = [];
    
    const products = [
      {
        supplierId: supplierIds[0],
        name: "Uji Ceremonial Matcha Premium",
        grade: "ceremonial",
        costYenPerKg: "12000.00",
        qualityScore: 9,
        description: "Premium ceremonial grade from Uji, perfect for traditional tea ceremonies",
      },
      {
        supplierId: supplierIds[0],
        name: "Kyoto Competition Grade",
        grade: "competition",
        costYenPerKg: "18000.00",
        qualityScore: 10,
        description: "Award-winning competition grade matcha",
      },
      {
        supplierId: supplierIds[1],
        name: "Shizuoka Organic Cafe Blend",
        grade: "cafe",
        costYenPerKg: "6000.00",
        qualityScore: 7,
        description: "Organic cafe-grade matcha, great for lattes",
      },
      {
        supplierId: supplierIds[1],
        name: "Premium Culinary Matcha",
        grade: "culinary",
        costYenPerKg: "4500.00",
        qualityScore: 6,
        description: "High-quality culinary grade for baking and cooking",
      },
      {
        supplierId: supplierIds[2],
        name: "Nishio Premium Ceremonial",
        grade: "premium",
        costYenPerKg: "10000.00",
        qualityScore: 8,
        description: "Premium grade matcha with excellent balance",
      },
    ];

    for (const product of products) {
      const result = await db.insert(schema.matchaProducts).values(product);
      productIds.push(Number(result[0].insertId));
    }

    // 3. Create Exchange Rate
    console.log("Creating exchange rate...");
    await db.insert(schema.exchangeRates).values({
      date: new Date(),
      jpyToSgdRate: "0.0090",
      source: "manual",
    });

    // 4. Create Clients
    console.log("Creating clients...");
    const clientIds = [];
    
    const clients = [
      {
        name: "Green Leaf Cafe",
        businessType: "Cafe",
        contactPerson: "Sarah Tan",
        contactEmail: "sarah@greenleaf.sg",
        contactPhone: "+65 9123 4567",
        address: "123 Orchard Road, Singapore 238858",
        discountPercent: "5.00",
        paymentTerms: "NET30",
        notes: "Regular customer, orders monthly",
      },
      {
        name: "Zen Tea House",
        businessType: "Tea House",
        contactPerson: "David Lim",
        contactEmail: "david@zentea.sg",
        contactPhone: "+65 8234 5678",
        address: "45 Tanjong Pagar Road, Singapore 088463",
        discountPercent: "10.00",
        paymentTerms: "NET30",
        notes: "Premium client, high volume orders",
      },
      {
        name: "Healthy Bites Bakery",
        businessType: "Bakery",
        contactPerson: "Michelle Wong",
        contactEmail: "michelle@healthybites.sg",
        contactPhone: "+65 9345 6789",
        address: "78 Bukit Timah Road, Singapore 229833",
        discountPercent: "0.00",
        paymentTerms: "NET60",
        notes: "Uses matcha for baking",
      },
      {
        name: "Matcha Lovers Distributor",
        businessType: "Distributor",
        contactPerson: "Alex Chen",
        contactEmail: "alex@matchalovers.sg",
        contactPhone: "+65 9456 7890",
        address: "90 Paya Lebar Road, Singapore 409003",
        discountPercent: "15.00",
        paymentTerms: "NET45",
        notes: "Bulk distributor, largest client",
      },
    ];

    for (const client of clients) {
      const result = await db.insert(schema.clients).values(client);
      clientIds.push(Number(result[0].insertId));
    }

    // 5. Create Client Products
    console.log("Creating client products...");
    const clientProducts = [
      {
        clientId: clientIds[0],
        productId: productIds[2], // Cafe blend
        monthlyVolumeKg: "15.00",
        sellingPriceSgdPerKg: "120.00",
        specialDiscount: "0.00",
      },
      {
        clientId: clientIds[1],
        productId: productIds[0], // Ceremonial
        monthlyVolumeKg: "25.00",
        sellingPriceSgdPerKg: "180.00",
        specialDiscount: "5.00",
      },
      {
        clientId: clientIds[2],
        productId: productIds[3], // Culinary
        monthlyVolumeKg: "20.00",
        sellingPriceSgdPerKg: "85.00",
        specialDiscount: "0.00",
      },
      {
        clientId: clientIds[3],
        productId: productIds[4], // Premium
        monthlyVolumeKg: "50.00",
        sellingPriceSgdPerKg: "150.00",
        specialDiscount: "10.00",
      },
    ];

    for (const cp of clientProducts) {
      await db.insert(schema.clientProducts).values(cp);
    }

    // 6. Create Inventory
    console.log("Creating inventory...");
    for (let i = 0; i < productIds.length; i++) {
      await db.insert(schema.inventory).values({
        productId: productIds[i],
        quantityKg: i === 0 ? "8.00" : i === 2 ? "25.00" : "50.00", // Make first one low stock
        allocatedKg: i === 0 ? "5.00" : "10.00",
        reorderPointKg: "15.00",
        warehouseLocation: "Main Warehouse A",
        lastOrderDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        lastArrivalDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      });
    }

    // 7. Create Sample Orders (must be before transactions - FK reference)
    console.log("Creating sample orders...");
    const order1 = await db.insert(schema.orders).values({
      orderType: "client_delivery",
      clientId: clientIds[0],
      productId: productIds[2],
      quantityKg: "15.00",
      status: "pending",
      orderDate: new Date(),
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    const order2 = await db.insert(schema.orders).values({
      orderType: "supplier_order",
      supplierId: supplierIds[0],
      productId: productIds[0],
      quantityKg: "30.00",
      status: "confirmed",
      orderDate: new Date(),
      expectedDeliveryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    });
    const orderIds = [Number(order1[0].insertId), Number(order2[0].insertId)];

    // 8. Create Sample Transactions
    console.log("Creating sample transactions...");
    const transactions = [
      {
        orderId: orderIds[0],
        clientId: clientIds[0],
        productId: productIds[2],
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
      },
      {
        orderId: orderIds[1],
        clientId: clientIds[1],
        productId: productIds[0],
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
      },
    ];

    for (const transaction of transactions) {
      await db.insert(schema.transactions).values(transaction);
    }

    // 9. Create Sample AI Recommendations
    console.log("Creating sample recommendations...");
    await db.insert(schema.recommendations).values([
      {
        clientId: clientIds[0],
        currentProductId: productIds[2],
        recommendedProductId: productIds[4],
        reason: "Recommend Nishio Premium Ceremonial from Nishio Matcha Masters: 12% higher margin (+SGD 5.20/kg) with premium grade quality. Monthly profit increase: +SGD 78.00.",
        currentProfitPerKg: "46.47",
        recommendedProfitPerKg: "51.67",
        profitIncreaseSgd: "78.00",
        profitIncreasePercent: "11.2",
      },
      {
        clientId: clientIds[2],
        currentProductId: productIds[3],
        recommendedProductId: productIds[2],
        reason: "Recommend Shizuoka Organic Cafe Blend: 8% higher margin with organic certification. Better fit for bakery use.",
        currentProfitPerKg: "18.50",
        recommendedProfitPerKg: "22.00",
        profitIncreaseSgd: "70.00",
        profitIncreasePercent: "18.9",
      },
    ]);

    // 10. Create Sample Reorder Alerts
    console.log("Creating sample reorder alerts...");
    await db.insert(schema.reorderAlerts).values([
      {
        productId: productIds[0],
        supplierId: supplierIds[0],
        currentStockKg: "8.00",
        reorderPointKg: "15.00",
        recommendedOrderKg: "25.00",
        urgencyLevel: "high",
        reason: "Uji Ceremonial Matcha Premium stock critically low (8 kg, 48 days remaining). Order from Kyoto Premium Matcha Co. within 1 week.",
      },
    ]);

    console.log("✅ Seed data created successfully!");
    console.log(`Created ${supplierIds.length} suppliers`);
    console.log(`Created ${productIds.length} products`);
    console.log(`Created ${clientIds.length} clients`);
    console.log(`Created ${clientProducts.length} client products`);
    console.log(`Created ${productIds.length} inventory items`);
    console.log(`Created ${transactions.length} transactions`);
    
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

seed()
  .then(() => {
    console.log("🎉 Seeding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to seed:", error);
    process.exit(1);
  });
