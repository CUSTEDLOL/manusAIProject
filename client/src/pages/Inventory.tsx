import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { 
  Search, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  ArrowLeft, 
  Save,
  Clock,
  TrendingDown,
  Info
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Inventory Management Page
 * 
 * Displays inventory status with Days of Cover calculation and urgency levels.
 * All inventory analysis logic is handled by n8n Workflow 3.
 * 
 * Frontend responsibilities:
 * - Visualize inventory health
 * - Highlight low-stock items with urgency levels (Critical/High/Medium/Low)
 * - Display reorder recommendations
 * - Support version snapshots for rollback
 * 
 * Backend (n8n) responsibilities:
 * - Days of cover calculation
 * - Low-stock detection
 * - Reorder quantity logic
 */
export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [snapshotName, setSnapshotName] = useState("");
  const { data: inventory, isLoading, isError } = trpc.inventory.list.useQuery();
  const utils = trpc.useUtils();

  const createSnapshotMutation = trpc.inventory.createSnapshot.useMutation({
    onSuccess: () => {
      toast.success("Inventory snapshot created successfully!");
      setSnapshotName("");
      utils.inventory.listSnapshots.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to create snapshot: ${error.message}`);
    },
  });

  const filteredInventory = inventory?.filter(item =>
    item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.grade.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /**
   * Calculate Days of Cover
   * Formula: (Available Stock / Monthly Demand) × 30
   * This mirrors the calculation in n8n Workflow 3
   */
  const calculateDaysOfCover = (availableKg: string, allocatedKg: string): number | null => {
    const available = parseFloat(availableKg);
    const allocated = parseFloat(allocatedKg);
    
    if (allocated <= 0) return null; // No demand = infinite cover
    
    // Assuming allocated represents monthly demand
    const daysOfCover = (available / allocated) * 30;
    return Math.round(daysOfCover * 10) / 10;
  };

  /**
   * Determine stock status and urgency level
   * Matches n8n Workflow 3 logic for consistency
   */
  const getStockStatus = (available: string, reorderPoint: string, allocatedKg: string) => {
    const avail = parseFloat(available);
    const reorder = parseFloat(reorderPoint);
    const daysOfCover = calculateDaysOfCover(available, allocatedKg);
    
    // Status based on both reorder point and days of cover
    if (avail <= 0) {
      return { 
        status: "out", 
        urgency: "critical" as const,
        color: "bg-red-100 text-red-800 border-red-200", 
        label: "Out of Stock",
        icon: "🚨"
      };
    }
    
    if (daysOfCover !== null && daysOfCover < 7) {
      return { 
        status: "critical", 
        urgency: "critical" as const,
        color: "bg-red-100 text-red-800 border-red-200", 
        label: "Critical",
        icon: "🚨"
      };
    }
    
    if (avail < reorder || (daysOfCover !== null && daysOfCover < 14)) {
      return { 
        status: "low", 
        urgency: "high" as const,
        color: "bg-orange-100 text-orange-800 border-orange-200", 
        label: "Low Stock",
        icon: "⚠️"
      };
    }
    
    if (avail < reorder * 2 || (daysOfCover !== null && daysOfCover < 30)) {
      return { 
        status: "medium", 
        urgency: "medium" as const,
        color: "bg-yellow-100 text-yellow-800 border-yellow-200", 
        label: "Medium",
        icon: "📋"
      };
    }
    
    return { 
      status: "good", 
      urgency: "low" as const,
      color: "bg-green-100 text-green-800 border-green-200", 
      label: "Good Stock",
      icon: "✅"
    };
  };

  /**
   * Calculate recommended reorder quantity
   * Formula: (Monthly Demand × 2) - Available Stock
   * Provides 2-month buffer
   */
  const calculateReorderQty = (availableKg: string, allocatedKg: string): number => {
    const available = parseFloat(availableKg);
    const allocated = parseFloat(allocatedKg);
    
    if (allocated <= 0) return 0;
    
    const reorderQty = (allocated * 2) - available;
    return Math.max(0, Math.ceil(reorderQty));
  };

  const handleCreateSnapshot = () => {
    if (!snapshotName.trim()) {
      toast.error("Please enter a snapshot name");
      return;
    }
    createSnapshotMutation.mutate({ snapshotName });
  };

  // Calculate summary statistics
  const summaryStats = inventory ? {
    totalProducts: inventory.length,
    totalStock: inventory.reduce((sum, item) => sum + parseFloat(item.quantityKg), 0),
    lowStockItems: inventory.filter(item => {
      const status = getStockStatus(item.availableKg, item.reorderPointKg, item.allocatedKg);
      return status.urgency === 'critical' || status.urgency === 'high';
    }).length,
    allocatedStock: inventory.reduce((sum, item) => sum + parseFloat(item.allocatedKg), 0),
    criticalItems: inventory.filter(item => {
      const status = getStockStatus(item.availableKg, item.reorderPointKg, item.allocatedKg);
      return status.urgency === 'critical';
    }).length,
  } : null;

  if (isLoading && !isError) {
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
          <div className="flex items-center justify-between">
            <div>
              <Button variant="ghost" size="sm" className="mb-2" asChild>
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
              <h1 className="text-2xl font-bold text-green-900">Inventory & Reorder Intelligence</h1>
              <p className="text-sm text-green-600">Track stock levels, days of cover, and reorder timing</p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-green-700 hover:bg-green-800">
                  <Save className="mr-2 h-4 w-4" />
                  Create Snapshot
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Inventory Snapshot</DialogTitle>
                  <DialogDescription>
                    Save the current inventory state for version control and rollback capability
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="snapshot-name">Snapshot Name</Label>
                    <Input
                      id="snapshot-name"
                      value={snapshotName}
                      onChange={(e) => setSnapshotName(e.target.value)}
                      placeholder="e.g., Before January Orders"
                    />
                  </div>
                  <Button
                    onClick={handleCreateSnapshot}
                    disabled={createSnapshotMutation.isPending}
                    className="w-full bg-green-700 hover:bg-green-800"
                  >
                    {createSnapshotMutation.isPending ? "Creating..." : "Create Snapshot"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Search */}
        <Card className="mb-6 border-green-200">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by product name, supplier, or grade..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-5 gap-4 mb-6">
          <Card className="border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4 text-green-600" />
                Total Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">
                {summaryStats?.totalProducts || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-blue-600" />
                Total Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">
                {summaryStats?.totalStock.toFixed(0)} kg
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-600" />
                Allocated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">
                {summaryStats?.allocatedStock.toFixed(0)} kg
              </div>
            </CardContent>
          </Card>

          <Card className={`${summaryStats?.criticalItems ? 'border-red-200' : 'border-orange-200'}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className={`h-4 w-4 ${summaryStats?.criticalItems ? 'text-red-600' : 'text-orange-600'}`} />
                Critical Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summaryStats?.criticalItems ? 'text-red-900' : 'text-orange-900'}`}>
                {summaryStats?.criticalItems || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                Low Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900">
                {summaryStats?.lowStockItems || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Table */}
        {!filteredInventory || filteredInventory.length === 0 ? (
          <Card className="border-green-200">
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "No inventory items found matching your search" : "No inventory items yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredInventory.map((item) => {
              const stockStatus = getStockStatus(item.availableKg, item.reorderPointKg, item.allocatedKg);
              const daysOfCover = calculateDaysOfCover(item.availableKg, item.allocatedKg);
              const reorderQty = calculateReorderQty(item.availableKg, item.allocatedKg);
              const utilizationPercent = (parseFloat(item.allocatedKg) / parseFloat(item.quantityKg) * 100);
              const available = parseFloat(item.availableKg);
              const total = parseFloat(item.quantityKg);
              const availablePercent = total > 0 ? (available / total) * 100 : 0;
              
              return (
                <Card 
                  key={item.inventoryId} 
                  className={`border-green-200 hover:shadow-md transition-shadow ${
                    stockStatus.urgency === 'critical' ? 'border-l-4 border-l-red-500' :
                    stockStatus.urgency === 'high' ? 'border-l-4 border-l-orange-500' :
                    stockStatus.urgency === 'medium' ? 'border-l-4 border-l-yellow-500' :
                    'border-l-4 border-l-green-500'
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-green-900">{item.productName}</h3>
                          <Badge variant="outline" className="text-xs">
                            {item.grade}
                          </Badge>
                          <Badge className={stockStatus.color}>
                            {stockStatus.icon} {stockStatus.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Supplier: {item.supplierName}
                        </p>
                        {item.warehouseLocation && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Location: {item.warehouseLocation}
                          </p>
                        )}
                      </div>
                      
                      {/* Days of Cover - Key Metric */}
                      <div className="text-right">
                        <Tooltip>
                          <TooltipTrigger>
                            <div className={`px-4 py-2 rounded-lg ${
                              daysOfCover === null ? 'bg-gray-100' :
                              daysOfCover < 7 ? 'bg-red-100' :
                              daysOfCover < 14 ? 'bg-orange-100' :
                              daysOfCover < 30 ? 'bg-yellow-100' :
                              'bg-green-100'
                            }`}>
                              <p className="text-xs text-muted-foreground">Days of Cover</p>
                              <p className={`text-xl font-bold ${
                                daysOfCover === null ? 'text-gray-600' :
                                daysOfCover < 7 ? 'text-red-700' :
                                daysOfCover < 14 ? 'text-orange-700' :
                                daysOfCover < 30 ? 'text-yellow-700' :
                                'text-green-700'
                              }`}>
                                {daysOfCover === null ? '∞' : daysOfCover.toFixed(0)}
                              </p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">
                              Formula: (Available ÷ Monthly Demand) × 30 days
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Stock Level Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Stock Level</span>
                        <span>{available.toFixed(0)} / {total.toFixed(0)} kg available</span>
                      </div>
                      <Progress 
                        value={availablePercent} 
                        className="h-2"
                      />
                    </div>

                    <div className="grid md:grid-cols-5 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Total Stock</p>
                        <p className="text-lg font-semibold text-green-900">
                          {parseFloat(item.quantityKg).toFixed(1)} kg
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Allocated</p>
                        <p className="text-lg font-semibold text-purple-900">
                          {parseFloat(item.allocatedKg).toFixed(1)} kg
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {utilizationPercent.toFixed(0)}% committed
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Available</p>
                        <p className="text-lg font-semibold text-blue-900">
                          {parseFloat(item.availableKg).toFixed(1)} kg
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Reorder Point</p>
                        <p className="text-lg font-semibold text-orange-900">
                          {parseFloat(item.reorderPointKg).toFixed(1)} kg
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Last Arrival</p>
                        <p className="text-sm">
                          {item.lastArrivalDate 
                            ? new Date(item.lastArrivalDate).toLocaleDateString()
                            : "N/A"
                          }
                        </p>
                      </div>
                    </div>

                    {/* Reorder Recommendation */}
                    {(stockStatus.urgency === 'critical' || stockStatus.urgency === 'high' || stockStatus.urgency === 'medium') && reorderQty > 0 && (
                      <div className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
                        stockStatus.urgency === 'critical' ? 'bg-red-50 border border-red-200' :
                        stockStatus.urgency === 'high' ? 'bg-orange-50 border border-orange-200' :
                        'bg-yellow-50 border border-yellow-200'
                      }`}>
                        <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                          stockStatus.urgency === 'critical' ? 'text-red-600' :
                          stockStatus.urgency === 'high' ? 'text-orange-600' :
                          'text-yellow-600'
                        }`} />
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            stockStatus.urgency === 'critical' ? 'text-red-900' :
                            stockStatus.urgency === 'high' ? 'text-orange-900' :
                            'text-yellow-900'
                          }`}>
                            Reorder Recommended: {reorderQty} kg
                          </p>
                          <p className={`text-xs mt-1 ${
                            stockStatus.urgency === 'critical' ? 'text-red-700' :
                            stockStatus.urgency === 'high' ? 'text-orange-700' :
                            'text-yellow-700'
                          }`}>
                            {stockStatus.urgency === 'critical' 
                              ? '🚨 URGENT: Stock critically low. Order immediately to prevent stockout.'
                              : stockStatus.urgency === 'high'
                              ? '⚠️ Stock below reorder point. Place order within 1 week.'
                              : '📋 Approaching reorder threshold. Plan order within 2 weeks.'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Recommendation based on 2-month buffer strategy
                          </p>
                        </div>
                      </div>
                    )}

                    {stockStatus.urgency === 'low' && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <p className="text-sm text-green-700">
                          Stock levels healthy. {daysOfCover !== null ? `${daysOfCover.toFixed(0)} days of cover available.` : 'No active demand.'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <Card className="mt-8 border-green-200">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Info className="h-4 w-4" />
              Stock Status Legend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Badge className="bg-red-100 text-red-800">🚨 Critical</Badge>
                <span className="text-muted-foreground">{"< 7 days cover"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-orange-100 text-orange-800">⚠️ Low Stock</Badge>
                <span className="text-muted-foreground">{"< 14 days cover"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-100 text-yellow-800">📋 Medium</Badge>
                <span className="text-muted-foreground">{"< 30 days cover"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800">✅ Good Stock</Badge>
                <span className="text-muted-foreground">{"> 30 days cover"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
