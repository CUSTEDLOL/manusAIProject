import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { 
  Search, 
  Plus, 
  TrendingUp, 
  Mail, 
  Phone, 
  MapPin,
  ArrowLeft,
  Users,
  DollarSign
} from "lucide-react";
import { Link } from "wouter";

/**
 * Client Management Page
 * 
 * Displays B2B client list with profitability metrics.
 * Client profitability data comes from backend calculations.
 * 
 * Challenge #1 Alignment:
 * - Multi-client operations view
 * - Per-client profitability visibility
 * - Drill-down capability without page reloads
 */
export default function Clients() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: clients, isLoading, isError } = trpc.b2bClient.list.useQuery();
  const { data: profitability } = trpc.b2bClient.getProfitability.useQuery();

  const filteredClients = clients?.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.businessType?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getClientProfit = (clientId: number) => {
    const profit = profitability?.find(p => p.clientId === clientId);
    return {
      totalProfit: profit ? parseFloat(profit.totalProfit) : 0,
      avgProfitPerKg: profit ? parseFloat(profit.avgProfitPerKg) : 0,
    };
  };

  // Calculate summary stats
  const summaryStats = {
    totalClients: clients?.length || 0,
    activeClients: clients?.filter(c => c.isActive)?.length || 0,
    totalProfit: profitability?.reduce((sum, p) => sum + parseFloat(p.totalProfit), 0) || 0,
    avgMargin: profitability && profitability.length > 0
      ? profitability.reduce((sum, p) => sum + parseFloat(p.avgProfitPerKg), 0) / profitability.length
      : 0,
  };

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
              <h1 className="text-2xl font-bold text-green-900">Client Profitability View</h1>
              <p className="text-sm text-green-600">Manage B2B client relationships and track per-client margins</p>
            </div>
            <Button className="bg-green-700 hover:bg-green-800" asChild>
              <Link href="/clients/new">
                <Plus className="mr-2 h-4 w-4" />
                Add New Client
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card className="border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-green-600" />
                Total Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">
                {summaryStats.totalClients}
              </div>
              <p className="text-xs text-muted-foreground">
                {summaryStats.activeClients} active
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                Total Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">
                SGD {summaryStats.totalProfit.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                Avg Margin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">
                SGD {summaryStats.avgMargin.toFixed(2)}/kg
              </div>
              <p className="text-xs text-muted-foreground">
                Across all clients
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-orange-900">
                {profitability && profitability.length > 0 
                  ? clients?.find(c => c.id === profitability[0].clientId)?.name || 'N/A'
                  : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                {profitability && profitability.length > 0 
                  ? `SGD ${parseFloat(profitability[0].totalProfit).toFixed(0)}`
                  : ''}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6 border-green-200">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients by name or business type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clients Grid */}
        {!filteredClients || filteredClients.length === 0 ? (
          <Card className="border-green-200">
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "No clients found matching your search" : "No clients yet"}
              </p>
              <Button className="bg-green-700 hover:bg-green-800" asChild>
                <Link href="/clients/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Client
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => {
              const { totalProfit, avgProfitPerKg } = getClientProfit(client.id);
              
              // Determine performance tier
              let performanceTier = 'standard';
              let tierColor = 'bg-gray-100 text-gray-800';
              if (totalProfit > 500) {
                performanceTier = 'high-value';
                tierColor = 'bg-green-100 text-green-800';
              } else if (totalProfit > 200) {
                performanceTier = 'growing';
                tierColor = 'bg-blue-100 text-blue-800';
              }

              return (
                <Link key={client.id} href={`/clients/${client.id}`}>
                  <Card className="border-green-200 hover:shadow-lg transition-all cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">{client.name}</CardTitle>
                          <div className="flex items-center gap-2">
                            {client.businessType && (
                              <CardDescription className="text-xs">
                                {client.businessType}
                              </CardDescription>
                            )}
                            <Badge variant="outline" className={`text-xs ${tierColor}`}>
                              {performanceTier === 'high-value' ? '⭐ High Value' :
                               performanceTier === 'growing' ? '📈 Growing' : 'Standard'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Profitability Metrics */}
                      <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="text-xs text-muted-foreground">Monthly Profit</p>
                          <p className="text-lg font-bold text-green-700">
                            SGD {totalProfit.toFixed(0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Margin</p>
                          <p className="text-lg font-bold text-green-700">
                            SGD {avgProfitPerKg.toFixed(2)}/kg
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        {client.contactPerson && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="font-medium">Contact:</span>
                            <span>{client.contactPerson}</span>
                          </div>
                        )}
                        {client.contactEmail && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="text-xs truncate">{client.contactEmail}</span>
                          </div>
                        )}
                        {client.contactPhone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span className="text-xs">{client.contactPhone}</span>
                          </div>
                        )}
                        {client.address && (
                          <div className="flex items-start gap-2 text-muted-foreground">
                            <MapPin className="h-3 w-3 mt-0.5" />
                            <span className="text-xs line-clamp-2">{client.address}</span>
                          </div>
                        )}
                      </div>

                      {/* Discount Info */}
                      {client.discountPercent && parseFloat(client.discountPercent) > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <Badge variant="outline" className="bg-orange-50 text-orange-700">
                            {parseFloat(client.discountPercent)}% Discount Applied
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Footer note */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>
            Click on any client to view detailed profitability breakdown and AI-assisted product recommendations.
          </p>
        </div>
      </main>
    </div>
  );
}
