import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Calculator,
  Info,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Link } from "wouter";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const COLORS = ['#16a34a', '#059669', '#10b981', '#34d399', '#6ee7b7'];

/**
 * Analytics & Reports Page
 * 
 * Displays profitability insights and scenario planning tools.
 * All profit calculations are performed by n8n Workflow 2 (Profitability Engine).
 * 
 * Key Features:
 * - Client profitability visualization
 * - Product performance comparison
 * - FX rate impact analysis (scenario planning)
 * - AI-assisted insights with explainable reasoning
 */
export default function Analytics() {
  const [scenarioFxChange, setScenarioFxChange] = useState("0");
  
  const { data: clientProfitability, isLoading: clientLoading, isError: clientError } = trpc.analytics.getClientProfitability.useQuery();
  const { data: productProfitability, isLoading: productLoading, isError: productError } = trpc.analytics.getProductProfitability.useQuery();
  const { data: metrics } = trpc.analytics.getDashboardMetrics.useQuery();
  const { data: recommendations } = trpc.recommendation.getPending.useQuery();

  // Current base FX rate (JPY to SGD)
  const baseFxRate = 0.0090;
  const fxChangePercent = parseFloat(scenarioFxChange) || 0;
  const scenarioFxRate = baseFxRate * (1 + fxChangePercent / 100);

  const clientChartData = clientProfitability?.slice(0, 10).map(c => ({
    name: c.clientName.length > 15 ? c.clientName.substring(0, 15) + '...' : c.clientName,
    profit: parseFloat(c.totalProfit),
    avgMargin: parseFloat(c.avgProfitPerKg),
  })) || [];

  const productChartData = productProfitability?.slice(0, 8).map(p => ({
    name: p.productName.length > 20 ? p.productName.substring(0, 20) + '...' : p.productName,
    profit: parseFloat(p.totalProfit),
    grade: p.grade,
  })) || [];

  const gradeDistribution = productProfitability?.reduce((acc: any[], p) => {
    const existing = acc.find(item => item.name === p.grade);
    if (existing) {
      existing.value += parseFloat(p.totalProfit);
    } else {
      acc.push({ name: p.grade, value: parseFloat(p.totalProfit) });
    }
    return acc;
  }, []) || [];

  // Calculate average margin
  const avgMargin = clientProfitability && clientProfitability.length > 0 
    ? clientProfitability.reduce((sum, c) => sum + parseFloat(c.avgProfitPerKg), 0) / clientProfitability.length
    : 0;

  // Scenario impact calculation (simplified for display)
  const calculateScenarioImpact = () => {
    const totalProfit = parseFloat(metrics?.totalProfitThisMonth || "0");
    // Rough estimate: FX change affects ~50% of cost structure
    const impactMultiplier = fxChangePercent / 100 * 0.5;
    const profitImpact = totalProfit * impactMultiplier * -1; // Higher FX = higher cost = lower profit
    return profitImpact;
  };

  const scenarioImpact = calculateScenarioImpact();

  if ((clientLoading || productLoading) && !clientError && !productError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/30 to-emerald-50/30">
      <header className="bg-white border-b border-green-100 sticky top-0 z-10 shadow-sm">
        <div className="container py-4">
          <Button variant="ghost" size="sm" className="mb-2" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-green-900">Analytics & Reports</h1>
          <p className="text-sm text-green-600">Profitability insights, scenario planning, and AI-assisted recommendations</p>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                Total Profit (Month)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">
                SGD {parseFloat(metrics?.totalProfitThisMonth || "0").toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Via landed cost formula
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Top Client
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-blue-900">
                {clientProfitability?.[0]?.clientName || "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                SGD {parseFloat(clientProfitability?.[0]?.totalProfit || "0").toLocaleString('en-SG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4 text-purple-600" />
                Top Product
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-purple-900">
                {productProfitability?.[0]?.productName || "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                SGD {parseFloat(productProfitability?.[0]?.totalProfit || "0").toLocaleString('en-SG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calculator className="h-4 w-4 text-orange-600" />
                Avg Margin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">
                SGD {avgMargin.toFixed(2)}/kg
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all clients
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Client Profitability Chart */}
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Client Profitability
              <UITooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">
                    Profit calculated using: (cost_jpy × fx_rate + shipping_sgd) × (1 + import_tax)
                  </p>
                </TooltipContent>
              </UITooltip>
            </CardTitle>
            <CardDescription>Total profit contribution by client (SGD)</CardDescription>
          </CardHeader>
          <CardContent>
            {clientChartData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={clientChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: any) => `SGD ${parseFloat(value).toLocaleString('en-SG', { minimumFractionDigits: 2 })}`}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
                  />
                  <Legend />
                  <Bar dataKey="profit" fill="#16a34a" name="Total Profit (SGD)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Product Performance */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Product Profitability Bar Chart */}
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
              <CardDescription>Profit by product (SGD)</CardDescription>
            </CardHeader>
            <CardContent>
              {productChartData.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={productChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={120}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip 
                      formatter={(value: any) => `SGD ${parseFloat(value).toLocaleString('en-SG', { minimumFractionDigits: 2 })}`}
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
                    />
                    <Bar dataKey="profit" fill="#059669" name="Profit (SGD)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Grade Distribution Pie Chart */}
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle>Profit by Grade</CardTitle>
              <CardDescription>Distribution across matcha grades</CardDescription>
            </CardHeader>
            <CardContent>
              {gradeDistribution.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={gradeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: SGD ${entry.value.toFixed(0)}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {gradeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => `SGD ${parseFloat(value).toLocaleString('en-SG', { minimumFractionDigits: 2 })}`}
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Scenario Planning - FX Impact Analysis */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-orange-600" />
              FX Rate Scenario Planning
              <Badge variant="outline" className="ml-2">What-If Analysis</Badge>
            </CardTitle>
            <CardDescription>
              Analyze the impact of JPY/SGD exchange rate changes on your profitability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* FX Rate Slider */}
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Label htmlFor="fx-scenario" className="text-sm font-medium">
                      Exchange Rate Change (%)
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Simulate JPY strengthening (+) or weakening (-) against SGD
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Scenario Rate</p>
                    <p className="text-lg font-bold text-orange-900">
                      {scenarioFxRate.toFixed(4)} SGD/JPY
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">-20%</span>
                  <Input
                    id="fx-scenario"
                    type="range"
                    min="-20"
                    max="20"
                    step="1"
                    value={scenarioFxChange}
                    onChange={(e) => setScenarioFxChange(e.target.value)}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">+20%</span>
                  <Badge variant="outline" className={`min-w-[60px] justify-center ${
                    fxChangePercent > 0 ? 'bg-red-100 text-red-800' :
                    fxChangePercent < 0 ? 'bg-green-100 text-green-800' :
                    ''
                  }`}>
                    {fxChangePercent > 0 ? '+' : ''}{fxChangePercent}%
                  </Badge>
                </div>
              </div>

              {/* Scenario Results */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="border-green-100">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Current Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold">{baseFxRate.toFixed(4)} SGD/JPY</p>
                    <p className="text-xs text-muted-foreground">Base scenario</p>
                  </CardContent>
                </Card>

                <Card className={`${fxChangePercent !== 0 ? (fxChangePercent > 0 ? 'border-red-200' : 'border-green-200') : 'border-gray-100'}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Scenario Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold">{scenarioFxRate.toFixed(4)} SGD/JPY</p>
                    <p className={`text-xs ${fxChangePercent > 0 ? 'text-red-600' : fxChangePercent < 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {fxChangePercent > 0 ? 'Higher costs' : fxChangePercent < 0 ? 'Lower costs' : 'No change'}
                    </p>
                  </CardContent>
                </Card>

                <Card className={`${scenarioImpact !== 0 ? (scenarioImpact < 0 ? 'border-red-200' : 'border-green-200') : 'border-gray-100'}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-1">
                      Profit Impact
                      {scenarioImpact !== 0 && (
                        scenarioImpact < 0 
                          ? <ArrowDownRight className="h-4 w-4 text-red-500" />
                          : <ArrowUpRight className="h-4 w-4 text-green-500" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-lg font-semibold ${
                      scenarioImpact < 0 ? 'text-red-700' : scenarioImpact > 0 ? 'text-green-700' : ''
                    }`}>
                      {scenarioImpact >= 0 ? '+' : ''}SGD {scenarioImpact.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">Monthly impact estimate</p>
                  </CardContent>
                </Card>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> This is a simplified scenario analysis. Actual impact depends on 
                  product mix, order timing, and hedging strategies. For detailed analysis, use the 
                  <code className="mx-1 px-1 py-0.5 bg-gray-200 rounded">trpc.calculator.exchangeRateScenario</code> 
                  API with specific product parameters.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI-Assisted Insights */}
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-500" />
              Manus AI-Assisted Insights
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                Human-in-the-loop
              </Badge>
            </CardTitle>
            <CardDescription>
              Explainable recommendations based on your profitability data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {clientProfitability && clientProfitability.length > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">✅</span>
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        Top 3 clients contribute SGD {clientProfitability.slice(0, 3).reduce((sum, c) => sum + parseFloat(c.totalProfit), 0).toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in total profit
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        <strong>Recommendation:</strong> Focus on maintaining strong relationships with your top performers. 
                        Consider volume-based incentives to increase their orders.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {productProfitability && productProfitability.length > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">📊</span>
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        {productProfitability[0].productName} is your best-performing product
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        <strong>Recommendation:</strong> Consider promoting this product to more clients. 
                        Its {productProfitability[0].grade} grade offers strong margin potential.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {recommendations && recommendations.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">💡</span>
                    <div>
                      <p className="text-sm font-medium text-amber-900">
                        {recommendations.length} pending AI recommendations available
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        <strong>Potential impact:</strong> SGD {recommendations.reduce((sum, r) => sum + parseFloat(r.profitIncreaseSgd), 0).toFixed(2)}/month 
                        additional profit if all recommendations are implemented.
                      </p>
                      <Button variant="link" size="sm" className="p-0 h-auto mt-1 text-amber-700" asChild>
                        <Link href="/">
                          View recommendations →
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-lg">🎯</span>
                  <div>
                    <p className="text-sm font-medium text-purple-900">
                      Use AI-assisted product swap analysis for margin optimization
                    </p>
                    <p className="text-xs text-purple-700 mt-1">
                      <strong>How it works:</strong> Navigate to individual clients to see AI-powered product 
                      swap suggestions. The system finds alternatives with same or higher grade/quality 
                      that could improve your margins. All recommendations include explainable reasoning.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer note about n8n integration */}
        <div className="text-center text-xs text-muted-foreground pt-4 border-t">
          <p>
            All profitability calculations performed by n8n Workflow 2 (Profitability Engine).
            <br />
            Formula: Landed Cost = (cost_jpy × fx_rate + shipping_sgd) × (1 + import_tax_rate)
          </p>
        </div>
      </main>
    </div>
  );
}
