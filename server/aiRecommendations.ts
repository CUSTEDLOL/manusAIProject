import { invokeLLM } from "./_core/llm";
import { calculateProfit, compareProducts } from "./profitabilityCalculator";
import * as db from "./db";

export interface RecommendationInput {
  clientId: number;
  clientName: string;
  currentProductId: number;
  currentProductName: string;
  currentProductGrade: string;
  currentCostYen: number;
  currentSellingPrice: number;
  monthlyVolume: number;
  exchangeRate: number;
  discount: number;
}

export interface RecommendationOutput {
  recommendedProductId: number;
  recommendedProductName: string;
  recommendedProductGrade: string;
  reason: string;
  currentProfitPerKg: number;
  recommendedProfitPerKg: number;
  profitIncreaseSgd: number;
  profitIncreasePercent: number;
  confidence: number;
}

/**
 * Generate AI-powered product recommendations for a client
 * Analyzes all available products and suggests better alternatives
 */
export async function generateRecommendations(
  input: RecommendationInput,
  alternativeProducts: Array<{
    id: number;
    name: string;
    grade: string;
    costYenPerKg: string;
    qualityScore: number;
    supplierName: string;
  }>
): Promise<RecommendationOutput[]> {
  const recommendations: RecommendationOutput[] = [];
  
  // Calculate current product profitability
  const currentProfit = calculateProfit(
    input.currentCostYen,
    input.exchangeRate,
    input.currentSellingPrice,
    input.discount,
    input.monthlyVolume
  );
  
  // Evaluate each alternative product
  for (const altProduct of alternativeProducts) {
    // Skip if same product
    if (altProduct.id === input.currentProductId) continue;
    
    const altCostYen = parseFloat(altProduct.costYenPerKg);
    
    // Calculate alternative product profitability
    const altProfit = calculateProfit(
      altCostYen,
      input.exchangeRate,
      input.currentSellingPrice, // Keep same selling price
      input.discount,
      input.monthlyVolume
    );
    
    // Compare products
    const comparison = compareProducts(currentProfit, altProfit);
    
    // Only recommend if profit increases by at least 5%
    if (comparison.isBetter && comparison.profitIncreasePercent >= 5) {
      // Generate AI explanation
      const reason = await generateRecommendationReason(
        input,
        altProduct,
        currentProfit,
        altProfit,
        comparison
      );
      
      recommendations.push({
        recommendedProductId: altProduct.id,
        recommendedProductName: altProduct.name,
        recommendedProductGrade: altProduct.grade,
        reason,
        currentProfitPerKg: currentProfit.profitSgdPerKg,
        recommendedProfitPerKg: altProfit.profitSgdPerKg,
        profitIncreaseSgd: comparison.profitDifference,
        profitIncreasePercent: comparison.profitIncreasePercent,
        confidence: calculateConfidence(comparison, altProduct.qualityScore),
      });
    }
  }
  
  // Sort by monthly profit increase (descending)
  recommendations.sort((a, b) => {
    const aMonthly = a.profitIncreaseSgd * input.monthlyVolume;
    const bMonthly = b.profitIncreaseSgd * input.monthlyVolume;
    return bMonthly - aMonthly;
  });
  
  return recommendations.slice(0, 3); // Return top 3 recommendations
}

/**
 * Generate natural language explanation using AI
 */
async function generateRecommendationReason(
  input: RecommendationInput,
  altProduct: any,
  currentProfit: any,
  altProfit: any,
  comparison: any
): Promise<string> {
  try {
    const prompt = `You are a business analyst for a premium matcha wholesale company. Generate a concise, professional recommendation explanation (max 2 sentences).

Current Situation:
- Client: ${input.clientName}
- Current Product: ${input.currentProductName} (${input.currentProductGrade} grade)
- Current Profit: $${currentProfit.profitSgdPerKg.toFixed(2)}/kg
- Monthly Volume: ${input.monthlyVolume} kg

Recommended Alternative:
- Product: ${altProduct.name} (${altProduct.grade} grade)
- Supplier: ${altProduct.supplierName}
- Quality Score: ${altProduct.qualityScore}/10
- New Profit: $${altProfit.profitSgdPerKg.toFixed(2)}/kg
- Profit Increase: $${comparison.profitDifference.toFixed(2)}/kg (+${comparison.profitIncreasePercent.toFixed(1)}%)
- Monthly Impact: +$${comparison.monthlyProfitIncrease.toFixed(2)}/month

Generate a compelling recommendation that:
1. Highlights the profit increase and quality equivalence/improvement
2. Mentions the supplier and grade
3. Is specific and actionable

Format: "Recommend [product] from [supplier]: [benefit]. [impact]."`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a business analyst specializing in wholesale matcha profitability optimization. Provide concise, data-driven recommendations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
    });

    const content = response.choices[0]?.message?.content;
    const reason = (typeof content === 'string' ? content.trim() : null) || 
      `Recommend ${altProduct.name} from ${altProduct.supplierName}: ${comparison.profitIncreasePercent.toFixed(1)}% higher margin (+$${comparison.profitDifference.toFixed(2)}/kg) with ${altProduct.grade} grade quality. Monthly profit increase: +$${comparison.monthlyProfitIncrease.toFixed(2)}.`;
    
    return reason;
  } catch (error) {
    console.error("Error generating AI recommendation:", error);
    // Fallback to template-based reason
    return `Recommend ${altProduct.name} from ${altProduct.supplierName}: ${comparison.profitIncreasePercent.toFixed(1)}% higher margin (+$${comparison.profitDifference.toFixed(2)}/kg) with ${altProduct.grade} grade quality. Monthly profit increase: +$${comparison.monthlyProfitIncrease.toFixed(2)}.`;
  }
}

/**
 * Calculate confidence score for recommendation
 */
function calculateConfidence(comparison: any, qualityScore: number): number {
  let confidence = 50; // Base confidence
  
  // Higher profit increase = higher confidence
  if (comparison.profitIncreasePercent > 20) confidence += 30;
  else if (comparison.profitIncreasePercent > 10) confidence += 20;
  else if (comparison.profitIncreasePercent > 5) confidence += 10;
  
  // Higher quality score = higher confidence
  if (qualityScore >= 8) confidence += 20;
  else if (qualityScore >= 6) confidence += 10;
  
  return Math.min(confidence, 95); // Cap at 95%
}

/**
 * Generate reorder alerts based on inventory levels
 */
export async function generateReorderAlerts(): Promise<Array<{
  productId: number;
  supplierId: number;
  currentStockKg: string;
  reorderPointKg: string;
  recommendedOrderKg: string;
  urgencyLevel: "low" | "medium" | "high" | "critical";
  reason: string;
}>> {
  const inventory = await db.getInventoryWithProducts();
  const alerts: any[] = [];
  
  for (const item of inventory) {
    const available = parseFloat(item.availableKg);
    const reorderPoint = parseFloat(item.reorderPointKg);
    const allocated = parseFloat(item.allocatedKg);
    
    // Check if below reorder point
    if (available < reorderPoint) {
      let urgencyLevel: "low" | "medium" | "high" | "critical";
      let recommendedOrder: number;
      
      // Determine urgency and recommended order quantity
      if (available <= 0) {
        urgencyLevel = "critical";
        recommendedOrder = allocated * 2; // Order 2x allocated amount
      } else if (available < reorderPoint * 0.5) {
        urgencyLevel = "high";
        recommendedOrder = allocated * 1.5;
      } else if (available < reorderPoint * 0.75) {
        urgencyLevel = "medium";
        recommendedOrder = allocated * 1.2;
      } else {
        urgencyLevel = "low";
        recommendedOrder = allocated;
      }
      
      // Get supplier info
      const supplier = await db.getSupplierById(item.supplierId);
      const leadTime = supplier?.leadTimeDays || 45;
      
      const reason = await generateReorderReason(
        item.productName,
        item.supplierName,
        available,
        reorderPoint,
        allocated,
        leadTime,
        urgencyLevel
      );
      
      alerts.push({
        productId: item.productId,
        supplierId: item.supplierId,
        currentStockKg: available.toFixed(2),
        reorderPointKg: reorderPoint.toFixed(2),
        recommendedOrderKg: recommendedOrder.toFixed(2),
        urgencyLevel,
        reason,
      });
    }
  }
  
  return alerts;
}

/**
 * Generate reorder alert reason
 */
async function generateReorderReason(
  productName: string,
  supplierName: string,
  available: number,
  reorderPoint: number,
  allocated: number,
  leadTime: number,
  urgency: string
): Promise<string> {
  const daysOfStock = allocated > 0 ? (available / allocated) * 30 : 0;
  
  if (urgency === "critical") {
    return `URGENT: ${productName} is out of stock. Order immediately from ${supplierName} (${leadTime}-day lead time). Allocated: ${allocated.toFixed(0)} kg/month.`;
  } else if (urgency === "high") {
    return `${productName} stock critically low (${available.toFixed(0)} kg, ${daysOfStock.toFixed(0)} days remaining). Order from ${supplierName} within 1 week to avoid stockout.`;
  } else if (urgency === "medium") {
    return `${productName} approaching reorder point (${available.toFixed(0)} kg available). Plan order from ${supplierName} within 2 weeks.`;
  } else {
    return `${productName} below reorder threshold. Consider ordering from ${supplierName} in the next month.`;
  }
}

/**
 * Analyze client profitability and generate insights
 */
export async function analyzeClientProfitability(clientId: number): Promise<{
  totalProfit: number;
  avgProfitPerKg: number;
  topProducts: Array<{ name: string; profit: number }>;
  insights: string[];
}> {
  const transactions = await db.getTransactionsByClient(clientId);
  
  if (transactions.length === 0) {
    return {
      totalProfit: 0,
      avgProfitPerKg: 0,
      topProducts: [],
      insights: ["No transaction history available for this client."],
    };
  }
  
  const totalProfit = transactions.reduce((sum, t) => sum + parseFloat(t.totalProfitSgd), 0);
  const totalQuantity = transactions.reduce((sum, t) => sum + parseFloat(t.quantityKg), 0);
  const avgProfitPerKg = totalProfit / totalQuantity;
  
  // Get product performance
  const productMap = new Map<number, { name: string; profit: number; quantity: number }>();
  
  for (const t of transactions) {
    const product = await db.getProductById(t.productId);
    if (!product) continue;
    
    const existing = productMap.get(t.productId);
    if (existing) {
      existing.profit += parseFloat(t.totalProfitSgd);
      existing.quantity += parseFloat(t.quantityKg);
    } else {
      productMap.set(t.productId, {
        name: product.name,
        profit: parseFloat(t.totalProfitSgd),
        quantity: parseFloat(t.quantityKg),
      });
    }
  }
  
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 3);
  
  // Generate insights
  const insights: string[] = [];
  
  if (avgProfitPerKg < 10) {
    insights.push("⚠️ Low profit margin detected. Consider reviewing pricing or switching to higher-margin products.");
  } else if (avgProfitPerKg > 30) {
    insights.push("✅ Excellent profit margins. This is a high-value client.");
  }
  
  if (topProducts.length > 0) {
    insights.push(`💰 Top performer: ${topProducts[0].name} contributing $${topProducts[0].profit.toFixed(2)} in profit.`);
  }
  
  return {
    totalProfit,
    avgProfitPerKg,
    topProducts,
    insights,
  };
}
