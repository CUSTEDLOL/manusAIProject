/**
 * n8n Backend Integration Service
 * 
 * This module provides the interface for communicating with n8n workflow endpoints.
 * The n8n workflows are the SINGLE SOURCE OF TRUTH for all business logic calculations.
 * 
 * Frontend responsibilities:
 * - Fetch and render results from n8n
 * - Display data exactly as returned by backend
 * - NEVER duplicate profit/inventory calculation logic
 * 
 * Backend (n8n) responsibilities:
 * - Landed cost calculation: (cost_jpy × fx_rate + shipping_sgd) × (1 + import_tax)
 * - Profit per kg and monthly profit aggregation
 * - Days of cover and low-stock detection
 * - Supplier swap recommendations with quality constraints
 */

// Base URL for n8n webhook endpoints (configured via environment)
const N8N_BASE_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || '/api/n8n';

/**
 * Response types matching n8n workflow outputs
 */

// Workflow 2: Profitability Engine Response
export interface ProfitabilityResponse {
  ok: boolean;
  client_name: string;
  rows: Array<{
    product_name: string;
    grade: string;
    profit_per_kg: number;
    monthly_profit: number;
    monthly_qty_kg: number;
    landed_cost_sgd_per_kg: number;
    effective_selling_price: number;
    margin_percent: number;
  }>;
  summary: {
    total_monthly_profit: number;
    total_monthly_qty_kg: number;
    product_count: number;
  };
  reply_text: string;
  error?: string;
  details?: string[];
}

// Workflow 3: Inventory Query Response
export interface InventoryQueryResponse {
  ok: boolean;
  data: Array<{
    product_name: string;
    grade: string;
    available_kg: number;
    allocated_kg: number;
    monthly_demand_kg: number;
    days_of_cover: number | null;
    low_stock: boolean;
    reorder_qty_kg: number;
  }>;
  summary: {
    total_products: number;
    low_stock_count: number;
  };
  reply_text: string;
  error?: string;
  details?: string[];
}

// Workflow 4: Supplier Swap Response
export interface SwapRecommendationResponse {
  ok: boolean;
  client_name: string;
  recommendations: Array<{
    contract_id: string;
    current_product: {
      product_id: string;
      product_name: string;
      grade: string;
      monthly_profit: number;
    };
    recommendation: {
      action: 'SWAP' | 'KEEP';
      reason: string;
      from_product_id: string | null;
      from_product_name: string | null;
      to_product_id: string | null;
      to_product_name: string | null;
      estimated_monthly_savings_sgd: number;
    };
    top_alternatives: Array<{
      product_id: string;
      product_name: string;
      grade: string;
      quality_score: number;
      supplier_id: string;
      landed_cost_sgd_per_kg: number;
      profit_per_kg: number;
      monthly_profit: number;
      savings_vs_current: number;
    }>;
  }>;
  summary: {
    total_contracts: number;
    swap_recommended_count: number;
    total_potential_savings_sgd: number;
  };
  reply_text: string;
  error?: string;
  details?: string[];
}

/**
 * Error class for n8n API errors
 */
export class N8nApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: string[]
  ) {
    super(message);
    this.name = 'N8nApiError';
  }
}

/**
 * Internal token for authenticating with n8n workflows
 * In production, this would be securely managed
 */
const getInternalToken = (): string => {
  return import.meta.env.VITE_N8N_INTERNAL_TOKEN || 'demo-token';
};

/**
 * Generic fetch wrapper for n8n endpoints
 */
async function fetchN8n<T>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<T> {
  try {
    const response = await fetch(`${N8N_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': getInternalToken(),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new N8nApiError(
        errorData.error || `HTTP ${response.status}`,
        response.status,
        errorData.details
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof N8nApiError) {
      throw error;
    }
    // Network errors or parsing errors
    throw new N8nApiError(
      'Failed to connect to backend workflow',
      503,
      ['Network error or service unavailable']
    );
  }
}

/**
 * Workflow 2: Get profitability analysis for a client
 * 
 * This calls the n8n Profitability Engine which calculates:
 * - Landed cost per kg
 * - Profit per kg
 * - Monthly profit aggregation
 * - Margin percentages
 * 
 * Frontend should NEVER recalculate these values.
 */
export async function getProfitability(params: {
  client_name: string;
  product_name?: string;
  time_period?: string;
  requester_phone_e164?: string;
}): Promise<ProfitabilityResponse> {
  return fetchN8n<ProfitabilityResponse>('/profit', params);
}

/**
 * Workflow 3: Get inventory status and low-stock alerts
 * 
 * This calls the n8n Inventory Query workflow which calculates:
 * - Days of cover
 * - Low-stock detection
 * - Reorder quantities
 * 
 * Frontend should NEVER recalculate days of cover or low-stock status.
 */
export async function getInventoryQuery(params: {
  product_name?: string;
  supplier_name?: string;
  requester_phone_e164?: string;
}): Promise<InventoryQueryResponse> {
  return fetchN8n<InventoryQueryResponse>('/inventory_query', params);
}

/**
 * Workflow 4: Get supplier swap recommendations
 * 
 * This calls the n8n Swap Recommendation workflow which:
 * - Compares current vs alternative suppliers
 * - Enforces grade and quality constraints
 * - Calculates potential savings
 * - Determines SWAP vs KEEP action
 * 
 * Frontend should NEVER invent swap logic locally.
 */
export async function getSwapRecommendations(params: {
  client_name: string;
  product_name?: string;
  requester_phone_e164?: string;
}): Promise<SwapRecommendationResponse> {
  return fetchN8n<SwapRecommendationResponse>('/swap', params);
}

/**
 * Check if n8n backend is available
 * Used for graceful degradation to demo mode
 */
export async function checkN8nHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${N8N_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'X-Internal-Token': getInternalToken(),
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Demo mode flag - when n8n is unavailable, frontend falls back to local data
 * This ensures the dashboard remains functional for demonstrations
 */
export function isDemoMode(): boolean {
  return import.meta.env.VITE_DEMO_MODE === 'true' || 
         !import.meta.env.VITE_N8N_WEBHOOK_URL;
}
