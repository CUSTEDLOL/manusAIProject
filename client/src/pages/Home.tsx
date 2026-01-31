import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  Package, 
  ArrowRight,
  BarChart3,
  Lightbulb,
  RefreshCw,
  Clock,
  CheckCircle,
  Info,
  Sparkles,
  MessageCircle,
  GitCompare
} from "lucide-react";
import { Link } from "wouter";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Home Dashboard - Executive Snapshot View
 * 
 * This dashboard integrates with n8n backend workflows for all business logic.
 * The frontend displays data fetched from backend - it does NOT recalculate
 * profitability, inventory levels, or recommendations locally.
 * 
 * Challenge #1 Alignment:
 * - Multi-client, multi-supplier operations
 * - FX exposure and landed cost calculations (via n8n Workflow 2)
 * - Inventory buffers and reorder timing (via n8n Workflow 3)
 * - AI-assisted (not autonomous) decision support (via n8n Workflow 4)
 */
export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  
  // Fetch dashboard metrics from backend
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = trpc.analytics.getDashboardMetrics.useQuery(
    undefined,
    { 
      enabled: isAuthenticated,
      refetchInterval: 30000, // Refresh every 30s to catch WhatsApp-triggered updates
    }
  );
  
  // Fetch AI-assisted recommendations
  const { data: recommendations, refetch: refetchRecommendations } = trpc.recommendation.getPending.useQuery(
    undefined,
    { 
      enabled: isAuthenticated,
      refetchInterval: 30000,
    }
  );
  
  // Fetch reorder alerts
  const { data: reorderAlerts, refetch: refetchAlerts } = trpc.reorderAlert.getActive.useQuery(
    undefined,
    { 
      enabled: isAuthenticated,
      refetchInterval: 30000,
    }
  );

  // Fetch inventory for additional metrics
  const { data: inventory } = trpc.inventory.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Calculate derived metrics
  const inventoryAtRisk = inventory?.reduce((sum, item) => {
    const available = parseFloat(item.availableKg);
    const reorderPoint = parseFloat(item.reorderPointKg);
    if (available < reorderPoint) {
      return sum + available;
    }
    return sum;
  }, 0) || 0;

  // Find nearest reorder deadline (days until stockout)
  const nearestReorder = inventory?.reduce((min, item) => {
    const available = parseFloat(item.availableKg);
    const allocated = parseFloat(item.allocatedKg);
    if (allocated > 0) {
      const daysOfCover = (available / allocated) * 30;
      if (daysOfCover < min && daysOfCover > 0) {
        return Math.round(daysOfCover);
      }
    }
    return min;
  }, 999) || 999;

  // Refresh all data (useful after WhatsApp-triggered backend updates)
  const handleRefreshAll = () => {
    refetchMetrics();
    refetchRecommendations();
    refetchAlerts();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center space-y-6 max-w-2xl px-4">
          <div className="space-y-2">
            <h1 className="text-5xl font-bold text-green-900">
              Matsu Matcha B2B Intelligence
            </h1>
            <p className="text-xl text-green-700">
              AI-Assisted Dashboard for Wholesale Matcha Business Management
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 my-8">
            <Card className="border-green-200">
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle className="text-lg">Real-Time Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Track profitability, inventory, and client performance with explainable insights
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-green-200">
              <CardHeader>
                <Lightbulb className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle className="text-lg">AI-Assisted Decisions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Human-in-the-loop recommendations to optimize margins and product selection
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-green-200">
              <CardHeader>
                <RefreshCw className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle className="text-lg">Proactive Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Automated reorder alerts based on stock levels and demand patterns
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Button size="lg" asChild className="bg-green-700 hover:bg-green-800">
            <a href={getLoginUrl()}>
              Sign In to Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/30 to-emerald-50/30">
      {/* Header */}
      <header className="bg-white border-b border-green-100 sticky top-0 z-10 shadow-sm">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-green-900">Matsu Matcha Dashboard</h1>
              <p className="text-sm text-green-600">Welcome back, {user?.name || 'User'}</p>
            </div>
            <nav className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleRefreshAll}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/clients">Clients</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/inventory">Inventory</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/suppliers">Suppliers</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/analytics">Analytics</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/messages">Messages</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Executive Snapshot - 4 Key Metrics */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-green-900">Executive Snapshot</h2>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">
                  Key metrics calculated by backend workflows. Data refreshes automatically 
                  or when triggered via WhatsApp queries.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Monthly Profit */}
            <Card className="border-green-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Monthly Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">
                  SGD {metricsLoading ? "..." : parseFloat(metrics?.totalProfitThisMonth || "0").toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Calculated via landed cost formula
                </p>
              </CardContent>
            </Card>

            {/* Average Profit per Kg */}
            <Card className="border-blue-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Profit per Kg</CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">
                  SGD {metricsLoading ? "..." : parseFloat(metrics?.avgProfitPerKg || "0").toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all active clients
                </p>
              </CardContent>
            </Card>

            {/* Inventory at Risk */}
            <Card className={`shadow-sm hover:shadow-md transition-shadow ${inventoryAtRisk > 0 ? 'border-orange-200' : 'border-green-200'}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inventory at Risk</CardTitle>
                <Package className={`h-4 w-4 ${inventoryAtRisk > 0 ? 'text-orange-600' : 'text-green-600'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${inventoryAtRisk > 0 ? 'text-orange-900' : 'text-green-900'}`}>
                  {metricsLoading ? "..." : `${inventoryAtRisk.toFixed(0)} kg`}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Below reorder point threshold
                </p>
              </CardContent>
            </Card>

            {/* Nearest Reorder Deadline */}
            <Card className={`shadow-sm hover:shadow-md transition-shadow ${nearestReorder < 14 ? 'border-red-200' : nearestReorder < 30 ? 'border-orange-200' : 'border-green-200'}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Nearest Reorder</CardTitle>
                <Clock className={`h-4 w-4 ${nearestReorder < 14 ? 'text-red-600' : nearestReorder < 30 ? 'text-orange-600' : 'text-green-600'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${nearestReorder < 14 ? 'text-red-900' : nearestReorder < 30 ? 'text-orange-900' : 'text-green-900'}`}>
                  {metricsLoading ? "..." : nearestReorder >= 999 ? "No urgent" : `${nearestReorder} days`}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Days until stockout risk
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Manus AI Recommendations & Reorder Alerts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Manus AI-Assisted Recommendations */}
          <Card className="border-green-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-emerald-500" />
                    Manus AI-Assisted Recommendations
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <Info className="h-3 w-3" />
                    Human-in-the-loop suggestions with explainable reasoning
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/analytics">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!recommendations || recommendations.length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No pending recommendations at this time
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    AI analysis runs continuously on your data
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendations.slice(0, 3).map((rec) => {
                    // Calculate confidence indicator
                    const profitIncrease = parseFloat(rec.profitIncreaseSgd);
                    const profitPercent = parseFloat(rec.profitIncreasePercent);
                    let confidence: 'High' | 'Medium' | 'Low' = 'Medium';
                    let confidenceColor = 'bg-yellow-100 text-yellow-800';
                    
                    if (profitPercent > 20) {
                      confidence = 'High';
                      confidenceColor = 'bg-green-100 text-green-800';
                    } else if (profitPercent < 10) {
                      confidence = 'Low';
                      confidenceColor = 'bg-gray-100 text-gray-800';
                    }

                    return (
                      <div key={rec.id} className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={confidenceColor}>
                              {confidence} Confidence
                            </Badge>
                          </div>
                          <span className="text-sm font-bold text-green-700">
                            +SGD {profitIncrease.toFixed(2)}/mo
                          </span>
                        </div>
                        <p className="text-sm text-green-900 font-medium mb-1">
                          Potential margin improvement
                        </p>
                        <p className="text-xs text-green-700 line-clamp-2">
                          {rec.reason}
                        </p>
                        <div className="mt-2 pt-2 border-t border-green-100">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Impact strength:</span>
                            <Progress 
                              value={Math.min(profitPercent * 3, 100)} 
                              className="h-1.5 flex-1" 
                            />
                            <span className="text-xs font-medium text-green-700">
                              +{profitPercent.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inventory & Reorder Intelligence */}
          <Card className="border-orange-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Inventory & Reorder Intelligence
                  </CardTitle>
                  <CardDescription>
                    Products requiring attention based on days of cover analysis
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/inventory">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!reorderAlerts || reorderAlerts.length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    All inventory levels are healthy
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Monitoring continues via hourly checks
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reorderAlerts.slice(0, 3).map((alert) => {
                    const urgencyConfig = {
                      critical: { color: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-800', icon: '🚨' },
                      high: { color: 'bg-orange-50 border-orange-200', badge: 'bg-orange-100 text-orange-800', icon: '⚠️' },
                      medium: { color: 'bg-yellow-50 border-yellow-200', badge: 'bg-yellow-100 text-yellow-800', icon: '📋' },
                      low: { color: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-800', icon: '📝' },
                    };
                    
                    const config = urgencyConfig[alert.urgencyLevel as keyof typeof urgencyConfig] || urgencyConfig.medium;

                    return (
                      <div 
                        key={alert.id} 
                        className={`p-4 rounded-lg border ${config.color}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="outline" className={config.badge}>
                            {config.icon} {alert.urgencyLevel.charAt(0).toUpperCase() + alert.urgencyLevel.slice(1)}
                          </Badge>
                          <span className="text-sm font-semibold">
                            Order {parseFloat(alert.recommendedOrderKg).toFixed(0)} kg
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {alert.reason}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">Current:</span>
                          <span className="font-medium">{parseFloat(alert.currentStockKg).toFixed(0)} kg</span>
                          <span className="text-muted-foreground">/ Reorder at:</span>
                          <span className="font-medium">{parseFloat(alert.reorderPointKg).toFixed(0)} kg</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Client Profitability Quick View */}
        <Card className="border-green-200 shadow-sm mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Client Profitability Overview
                </CardTitle>
                <CardDescription>
                  Multi-client performance at a glance
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/clients">Manage Clients</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                <p className="text-sm text-muted-foreground mb-1">Active Clients</p>
                <p className="text-2xl font-bold text-green-900">
                  {metricsLoading ? "..." : metrics?.activeClients || 0}
                </p>
                <p className="text-xs text-green-700 mt-1">B2B partnerships</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-muted-foreground mb-1">Pending Orders</p>
                <p className="text-2xl font-bold text-blue-900">
                  {metricsLoading ? "..." : metrics?.pendingOrders || 0}
                </p>
                <p className="text-xs text-blue-700 mt-1">Awaiting fulfillment</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                <p className="text-sm text-muted-foreground mb-1">Low Stock Alerts</p>
                <p className="text-2xl font-bold text-purple-900">
                  {metricsLoading ? "..." : metrics?.lowStockAlerts || 0}
                </p>
                <p className="text-xs text-purple-700 mt-1">Requires attention</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-green-200 shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <Button variant="outline" className="w-full justify-start" size="lg" asChild>
                <Link href="/clients/new">
                  <Users className="mr-2 h-4 w-4" />
                  Add New Client
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" size="lg" asChild>
                <Link href="/inventory">
                  <Package className="mr-2 h-4 w-4" />
                  Update Inventory
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" size="lg" asChild>
                <Link href="/suppliers">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Manage Suppliers
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" size="lg" asChild>
                <Link href="/analytics">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Analytics
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" size="lg" asChild>
                <Link href="/messages">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Messages
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" size="lg" asChild>
                <Link href="/suppliers/compare">
                  <GitCompare className="mr-2 h-4 w-4" />
                  Compare Suppliers
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer with n8n integration status */}
      <footer className="bg-white border-t border-green-100 py-4 mt-8">
        <div className="container">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <p>Matsu Matcha B2B Intelligence Dashboard • Powered by n8n Workflows</p>
            <p className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Backend Connected • WhatsApp Integration Active
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
