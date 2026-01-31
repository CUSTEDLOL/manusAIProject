import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, TrendingUp, Package, Mail, Phone, MapPin, Sparkles } from "lucide-react";
import { Link } from "wouter";

export default function ClientDetail() {
  const [, params] = useRoute("/clients/:id");
  const clientId = params?.id ? parseInt(params.id, 10) : null;

  const { data: client, isLoading: clientLoading } = trpc.b2bClient.getById.useQuery(
    { id: clientId! },
    { enabled: !!clientId && !isNaN(clientId) }
  );
  const { data: products, isLoading: productsLoading } = trpc.b2bClient.getProducts.useQuery(
    { clientId: clientId! },
    { enabled: !!clientId && !isNaN(clientId) }
  );
  const { data: recommendations } = trpc.recommendation.getByClient.useQuery(
    { clientId: clientId! },
    { enabled: !!clientId && !isNaN(clientId) }
  );
  const { data: profitability } = trpc.b2bClient.getProfitability.useQuery();
  const { data: allProducts } = trpc.product.list.useQuery();

  const clientProfit = profitability?.find(p => p.clientId === clientId);
  const isLoading = clientLoading || (clientId && !client);

  if (isLoading || !clientId || isNaN(clientId)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Client not found</p>
        <Button asChild>
          <Link href="/clients">Back to Clients</Link>
        </Button>
      </div>
    );
  }

  const totalProfit = clientProfit ? parseFloat(clientProfit.totalProfit) : 0;
  const avgMargin = clientProfit ? parseFloat(clientProfit.avgProfitPerKg) : 0;

  const getProductName = (productId: number) =>
    allProducts?.find(p => p.id === productId)?.name ?? `Product #${productId}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/30 to-emerald-50/30">
      <header className="bg-white border-b border-green-100 sticky top-0 z-10 shadow-sm">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <Button variant="ghost" size="sm" asChild className="mb-2">
                <Link href="/clients">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Clients
                </Link>
              </Button>
              <h1 className="text-2xl font-bold text-green-900">{client.name}</h1>
              <p className="text-sm text-green-600">
                {client.businessType || "B2B Client"} • SGD {totalProfit.toFixed(0)}/mo profit
              </p>
            </div>
            <Button className="bg-green-700 hover:bg-green-800" asChild>
              <Link href="/clients">View All Clients</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Monthly Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">
                SGD {totalProfit.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Avg Margin</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">
                SGD {avgMargin.toFixed(2)}/kg
              </div>
            </CardContent>
          </Card>
          <Card className="border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">
                {products?.length ?? 0}
              </div>
            </CardContent>
          </Card>
          <Card className="border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Discount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">
                {parseFloat(client.discountPercent || "0")}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Info */}
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle>Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            {client.contactPerson && (
              <div>
                <p className="text-xs text-muted-foreground">Contact Person</p>
                <p className="font-medium">{client.contactPerson}</p>
              </div>
            )}
            {client.contactEmail && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{client.contactEmail}</span>
              </div>
            )}
            {client.contactPhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{client.contactPhone}</span>
              </div>
            )}
            {client.address && (
              <div className="flex items-start gap-2 md:col-span-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{client.address}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Products */}
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Products & Pricing
            </CardTitle>
            <CardDescription>Products this client orders</CardDescription>
          </CardHeader>
          <CardContent>
            {!products || products.length === 0 ? (
              <p className="text-muted-foreground py-4">No products assigned yet</p>
            ) : (
              <div className="space-y-4">
                {products.map((cp) => (
                  <div
                    key={cp.id}
                    className="p-4 bg-green-50 rounded-lg border border-green-100 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">{getProductName(cp.productId)}</p>
                      <p className="text-sm text-muted-foreground">
                        {parseFloat(cp.monthlyVolumeKg)} kg/mo • SGD {parseFloat(cp.sellingPriceSgdPerKg).toFixed(2)}/kg
                        {parseFloat(cp.specialDiscount || "0") > 0 && (
                          <span className="ml-2 text-orange-600">
                            • {cp.specialDiscount}% special discount
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI-Assisted Recommendations */}
        <Card className="border-emerald-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-500" />
              AI-Assisted Recommendations
            </CardTitle>
            <CardDescription>Product swap suggestions to improve margins</CardDescription>
          </CardHeader>
          <CardContent>
            {!recommendations || recommendations.length === 0 ? (
              <p className="text-muted-foreground py-4">No pending recommendations for this client</p>
            ) : (
              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-4 bg-emerald-50 rounded-lg border border-emerald-100"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Badge className="bg-green-100 text-green-800">
                        +SGD {parseFloat(rec.profitIncreaseSgd).toFixed(2)}/mo
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        +{parseFloat(rec.profitIncreasePercent).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-sm text-green-900">{rec.reason}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Current: SGD {parseFloat(rec.currentProfitPerKg).toFixed(2)}/kg → 
                      Recommended: SGD {parseFloat(rec.recommendedProfitPerKg).toFixed(2)}/kg
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
