import { describe, expect, it } from "vitest";
import { calculateProfit, calculateTotalCost, exchangeRateScenario, calculateOptimalPrice } from "./profitabilityCalculator";

describe("Profitability Calculator", () => {
  describe("calculateTotalCost", () => {
    it("should calculate total cost correctly with default shipping and tax", () => {
      const result = calculateTotalCost(
        10000, // 10,000 JPY per kg
        0.009, // Exchange rate
        15, // $15 shipping per kg
        9 // 9% import tax
      );

      // (10000 * 0.009 + 15) = 105
      // 105 * 1.09 = 114.45
      expect(result.costSgdBeforeTax).toBe(105);
      expect(result.importTaxAmount).toBeCloseTo(9.45, 2);
      expect(result.totalCostSgdPerKg).toBeCloseTo(114.45, 2);
    });

    it("should handle different exchange rates", () => {
      const result = calculateTotalCost(
        12000,
        0.0095,
        15,
        9
      );

      // (12000 * 0.0095 + 15) = 129
      // 129 * 1.09 = 140.61
      expect(result.totalCostSgdPerKg).toBeCloseTo(140.61, 2);
    });
  });

  describe("calculateProfit", () => {
    it("should calculate profit correctly", () => {
      const result = calculateProfit(
        10000, // Cost in Yen
        0.009, // Exchange rate
        150, // Selling price SGD
        0, // No discount
        20 // 20 kg monthly volume
      );

      // Total cost: 114.45 (from previous test)
      // Profit per kg: 150 - 114.45 = 35.55
      // Monthly profit: 35.55 * 20 = 711
      expect(result.totalCostSgdPerKg).toBeCloseTo(114.45, 2);
      expect(result.profitSgdPerKg).toBeCloseTo(35.55, 2);
      expect(result.monthlyProfitSgd).toBeCloseTo(711, 2);
      expect(result.profitMarginPercent).toBeCloseTo(23.7, 1);
    });

    it("should account for discounts", () => {
      const result = calculateProfit(
        10000,
        0.009,
        150,
        10, // $10 discount per kg
        20
      );

      // Net selling price: 150 - 10 = 140
      // Profit per kg: 140 - 114.45 = 25.55
      expect(result.netSellingPrice).toBe(140);
      expect(result.profitSgdPerKg).toBeCloseTo(25.55, 2);
    });

    it("should handle zero monthly volume", () => {
      const result = calculateProfit(
        10000,
        0.009,
        150,
        0,
        0
      );

      expect(result.monthlyProfitSgd).toBe(0);
    });
  });

  describe("exchangeRateScenario", () => {
    it("should compare current vs scenario exchange rates", () => {
      const result = exchangeRateScenario(
        10000, // Cost in Yen
        0.009, // Current rate
        0.0099, // New rate (10% increase)
        150, // Selling price
        0, // No discount
        20 // Monthly volume
      );

      // Current cost: 114.45
      // Scenario cost: (10000 * 0.0099 + 15) * 1.09 = 124.245
      // Cost increase: ~9.8
      expect(result.current.totalCostSgdPerKg).toBeCloseTo(114.45, 2);
      expect(result.scenario.totalCostSgdPerKg).toBeCloseTo(124.26, 2);
      expect(result.impact.costIncrease).toBeCloseTo(9.81, 2);
      expect(result.impact.profitDecrease).toBeCloseTo(9.81, 2);
    });

    it("should show positive impact when exchange rate decreases", () => {
      const result = exchangeRateScenario(
        10000,
        0.009,
        0.0081, // 10% decrease
        150,
        0,
        20
      );

      // Scenario should have lower cost and higher profit
      expect(result.scenario.totalCostSgdPerKg).toBeLessThan(result.current.totalCostSgdPerKg);
      expect(result.scenario.profitSgdPerKg).toBeGreaterThan(result.current.profitSgdPerKg);
    });
  });

  describe("calculateOptimalPrice", () => {
    it("should calculate optimal price for target margin", () => {
      const result = calculateOptimalPrice(
        10000,
        0.009,
        25, // Target 25% profit margin
        0
      );

      // Total cost: 114.45
      // For 25% margin: Price = Cost / (1 - 0.25) = 114.45 / 0.75 = 152.6
      expect(result.totalCost).toBeCloseTo(114.45, 2);
      expect(result.suggestedPrice).toBeCloseTo(152.6, 1);
      expect(result.targetProfit).toBeCloseTo(38.15, 1);
    });

    it("should account for discounts in optimal pricing", () => {
      const result = calculateOptimalPrice(
        10000,
        0.009,
        25,
        10 // $10 discount
      );

      // Price should be higher to account for discount
      expect(result.suggestedPrice).toBeGreaterThan(152.6);
      expect(result.priceAfterDiscount).toBeCloseTo(152.6, 1);
    });
  });
});

describe("Business Logic Validation", () => {
  it("should ensure profit margin is reasonable for ceremonial grade", () => {
    // Ceremonial grade: 12,000 JPY/kg
    const result = calculateProfit(
      12000,
      0.009,
      180, // Selling price
      0,
      25
    );

    // Expect at least 20% margin for premium product
    expect(result.profitMarginPercent).toBeGreaterThan(20);
  });

  it("should ensure cafe grade has lower cost than ceremonial", () => {
    const ceremonial = calculateTotalCost(12000, 0.009);
    const cafe = calculateTotalCost(6000, 0.009);

    expect(cafe.totalCostSgdPerKg).toBeLessThan(ceremonial.totalCostSgdPerKg);
  });

  it("should validate that import tax is always 9%", () => {
    const result = calculateTotalCost(10000, 0.009, 15, 9);
    
    expect(result.importTaxPercent).toBe(9);
    expect(result.importTaxAmount).toBeCloseTo(
      result.costSgdBeforeTax * 0.09,
      2
    );
  });

  it("should validate shipping cost is $15/kg", () => {
    const result = calculateTotalCost(10000, 0.009, 15, 9);
    
    expect(result.shippingCostSgdPerKg).toBe(15);
  });
});

describe("Edge Cases", () => {
  it("should handle zero cost", () => {
    const result = calculateProfit(0, 0.009, 100, 0, 10);
    
    expect(result.profitSgdPerKg).toBeGreaterThan(0);
    expect(result.monthlyProfitSgd).toBeGreaterThan(0);
  });

  it("should handle negative profit scenario", () => {
    const result = calculateProfit(
      20000, // Very high cost
      0.009,
      100, // Low selling price
      0,
      10
    );

    // Cost: (20000 * 0.009 + 15) * 1.09 = 212.85
    // Profit: 100 - 212.85 = -112.85 (loss)
    expect(result.profitSgdPerKg).toBeLessThan(0);
    expect(result.profitMarginPercent).toBeLessThan(0);
  });

  it("should handle very large volumes", () => {
    const result = calculateProfit(
      10000,
      0.009,
      150,
      0,
      1000 // 1000 kg per month
    );

    expect(result.monthlyProfitSgd).toBeGreaterThan(30000);
  });

  it("should handle very small exchange rates", () => {
    const result = calculateTotalCost(
      10000,
      0.001, // Very small rate
      15,
      9
    );

    // (10000 * 0.001 + 15) = 25
    // 25 * 1.09 = 27.25
    expect(result.totalCostSgdPerKg).toBeCloseTo(27.25, 2);
  });
});
