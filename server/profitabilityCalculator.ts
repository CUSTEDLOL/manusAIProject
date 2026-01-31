/**
 * Profitability Calculator
 * Calculates costs and profits for matcha transactions
 */

export interface CostCalculation {
  costYenPerKg: number;
  exchangeRate: number;
  shippingCostSgdPerKg: number;
  importTaxPercent: number;
  costSgdBeforeTax: number;
  importTaxAmount: number;
  totalCostSgdPerKg: number;
}

export interface ProfitCalculation extends CostCalculation {
  sellingPriceSgdPerKg: number;
  discountSgdPerKg: number;
  netSellingPrice: number;
  profitSgdPerKg: number;
  profitMarginPercent: number;
  monthlyVolumeKg: number;
  monthlyProfitSgd: number;
}

/**
 * Calculate total cost per kg in SGD
 * Formula: (Yen cost × Exchange rate + Shipping) × (1 + Tax%)
 */
export function calculateTotalCost(
  costYenPerKg: number,
  exchangeRate: number,
  shippingCostSgdPerKg: number = 15,
  importTaxPercent: number = 9
): CostCalculation {
  // Convert Yen to SGD and add shipping
  const costSgdBeforeTax = (costYenPerKg * exchangeRate) + shippingCostSgdPerKg;
  
  // Calculate import tax
  const importTaxAmount = costSgdBeforeTax * (importTaxPercent / 100);
  
  // Total cost including tax
  const totalCostSgdPerKg = costSgdBeforeTax + importTaxAmount;
  
  return {
    costYenPerKg,
    exchangeRate,
    shippingCostSgdPerKg,
    importTaxPercent,
    costSgdBeforeTax,
    importTaxAmount,
    totalCostSgdPerKg,
  };
}

/**
 * Calculate profit per kg and monthly profit
 */
export function calculateProfit(
  costYenPerKg: number,
  exchangeRate: number,
  sellingPriceSgdPerKg: number,
  discountSgdPerKg: number = 0,
  monthlyVolumeKg: number = 0,
  shippingCostSgdPerKg: number = 15,
  importTaxPercent: number = 9
): ProfitCalculation {
  const costCalc = calculateTotalCost(
    costYenPerKg,
    exchangeRate,
    shippingCostSgdPerKg,
    importTaxPercent
  );
  
  // Net selling price after discount
  const netSellingPrice = sellingPriceSgdPerKg - discountSgdPerKg;
  
  // Profit per kg
  const profitSgdPerKg = netSellingPrice - costCalc.totalCostSgdPerKg;
  
  // Profit margin percentage
  const profitMarginPercent = (profitSgdPerKg / netSellingPrice) * 100;
  
  // Monthly profit
  const monthlyProfitSgd = profitSgdPerKg * monthlyVolumeKg;
  
  return {
    ...costCalc,
    sellingPriceSgdPerKg,
    discountSgdPerKg,
    netSellingPrice,
    profitSgdPerKg,
    profitMarginPercent,
    monthlyVolumeKg,
    monthlyProfitSgd,
  };
}

/**
 * Compare two products for profitability
 */
export function compareProducts(
  product1: ProfitCalculation,
  product2: ProfitCalculation
): {
  profitDifference: number;
  profitIncreasePercent: number;
  monthlyProfitIncrease: number;
  isBetter: boolean;
} {
  const profitDifference = product2.profitSgdPerKg - product1.profitSgdPerKg;
  const profitIncreasePercent = (profitDifference / product1.profitSgdPerKg) * 100;
  const monthlyProfitIncrease = product2.monthlyProfitSgd - product1.monthlyProfitSgd;
  const isBetter = profitDifference > 0;
  
  return {
    profitDifference,
    profitIncreasePercent,
    monthlyProfitIncrease,
    isBetter,
  };
}

/**
 * Calculate break-even volume
 * How many kg needed to cover fixed costs
 */
export function calculateBreakEven(
  fixedCosts: number,
  profitPerKg: number
): number {
  if (profitPerKg <= 0) return Infinity;
  return fixedCosts / profitPerKg;
}

/**
 * Scenario analysis: What if exchange rate changes?
 */
export function exchangeRateScenario(
  costYenPerKg: number,
  currentExchangeRate: number,
  newExchangeRate: number,
  sellingPriceSgdPerKg: number,
  discountSgdPerKg: number = 0,
  monthlyVolumeKg: number = 0
): {
  current: ProfitCalculation;
  scenario: ProfitCalculation;
  impact: {
    costIncrease: number;
    profitDecrease: number;
    monthlyProfitImpact: number;
  };
} {
  const current = calculateProfit(
    costYenPerKg,
    currentExchangeRate,
    sellingPriceSgdPerKg,
    discountSgdPerKg,
    monthlyVolumeKg
  );
  
  const scenario = calculateProfit(
    costYenPerKg,
    newExchangeRate,
    sellingPriceSgdPerKg,
    discountSgdPerKg,
    monthlyVolumeKg
  );
  
  return {
    current,
    scenario,
    impact: {
      costIncrease: scenario.totalCostSgdPerKg - current.totalCostSgdPerKg,
      profitDecrease: current.profitSgdPerKg - scenario.profitSgdPerKg,
      monthlyProfitImpact: current.monthlyProfitSgd - scenario.monthlyProfitSgd,
    },
  };
}

/**
 * Optimal pricing calculator
 * Suggests selling price for target profit margin
 */
export function calculateOptimalPrice(
  costYenPerKg: number,
  exchangeRate: number,
  targetProfitMarginPercent: number,
  discountSgdPerKg: number = 0
): {
  totalCost: number;
  targetProfit: number;
  suggestedPrice: number;
  priceAfterDiscount: number;
} {
  const costCalc = calculateTotalCost(costYenPerKg, exchangeRate);
  const totalCost = costCalc.totalCostSgdPerKg;
  
  // Price = Cost / (1 - Target Margin%)
  const suggestedPrice = totalCost / (1 - targetProfitMarginPercent / 100) + discountSgdPerKg;
  const priceAfterDiscount = suggestedPrice - discountSgdPerKg;
  const targetProfit = priceAfterDiscount - totalCost;
  
  return {
    totalCost,
    targetProfit,
    suggestedPrice,
    priceAfterDiscount,
  };
}
