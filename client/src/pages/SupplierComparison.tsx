import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Trophy,
  BarChart3,
  FileDown,
  Share2,
  RefreshCw,
  Star,
  Loader2,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { jsPDF } from "jspdf";
import { cn } from "@/lib/utils";

export default function SupplierComparison() {
  const [clientId, setClientId] = useState<number | null>(null);
  const [whatIfSupplierId, setWhatIfSupplierId] = useState<number | null>(null);
  const [whatIfQty, setWhatIfQty] = useState(10);
  const [whatIfFreq, setWhatIfFreq] = useState<"monthly" | "quarterly">("monthly");

  const { data: clients } = trpc.b2bClient.list.useQuery();
  const { data: comparison, isLoading: comparisonLoading } =
    trpc.supplierComparison.getComparison.useQuery(
      { clientId: clientId! },
      { enabled: !!clientId }
    );
  const getRec = trpc.supplierComparison.getRecommendation.useMutation();

  const recommendation = getRec.data;
  const loadingRec = getRec.isPending;

  const cheapestSupplierId = useMemo(() => {
    if (!comparison?.rows?.length) return null;
    const min = comparison.rows.reduce((best, r) =>
      r.landedCostJpyPerKg < best.landedCostJpyPerKg ? r : best
    );
    return min.supplierId;
  }, [comparison?.rows]);

  const barData = useMemo(() => {
    if (!comparison?.rows?.length) return [];
    return comparison.rows.slice(0, 6).map((r) => ({
      name: r.supplierName.length > 12 ? r.supplierName.slice(0, 12) + "…" : r.supplierName,
      base: r.basePriceJpy,
      shipping: r.shippingJpy,
      tax: r.taxJpy,
      total: r.landedCostJpyPerKg,
    }));
  }, [comparison?.rows]);

  const whatIfRow = useMemo(() => {
    if (!comparison || !whatIfSupplierId) return null;
    return comparison.rows.find((r) => r.supplierId === whatIfSupplierId);
  }, [comparison, whatIfSupplierId]);

  const whatIfResult = useMemo(() => {
    if (!whatIfRow || !comparison) return null;
    const multiplier = whatIfFreq === "monthly" ? 1 : 1 / 3;
    const kgPerMonth = whatIfQty * multiplier;
    const ordersPerYear = whatIfFreq === "monthly" ? 12 : 4;
    const totalCostSgd = whatIfRow.landedCostSgdPerKg * whatIfQty * (whatIfFreq === "monthly" ? 1 : 1);
    const sellingPriceSgd = comparison.sellingPriceSgd;
    const profitSgd = (sellingPriceSgd - whatIfRow.landedCostSgdPerKg) * kgPerMonth;
    const currentRow = comparison.currentSupplierId
      ? comparison.rows.find((r) => r.supplierId === comparison.currentSupplierId)
      : null;
    const currentProfitAtSameVolume = currentRow
      ? (sellingPriceSgd - currentRow.landedCostSgdPerKg) * kgPerMonth
      : 0;
    const annualSavings = (profitSgd - currentProfitAtSameVolume) * ordersPerYear;
    const roi = totalCostSgd > 0 ? (profitSgd / totalCostSgd) * 100 : 0;
    return {
      totalCostSgd,
      profitSgd,
      annualSavings,
      roi,
      kgPerMonth,
    };
  }, [whatIfRow, comparison, whatIfQty, whatIfFreq]);

  const handleGetRecommendation = () => {
    if (!clientId) return;
    getRec.mutate(
      { clientId },
      {
        onError: (e) => toast.error(e.message),
      }
    );
  };

  const handleGenerateReport = () => {
    if (!comparison) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Supplier Comparison Report", 14, 20);
    doc.setFontSize(11);
    doc.text(`Client: ${comparison.client.name}`, 14, 28);
    doc.text(`Selling price: SGD ${comparison.sellingPriceSgd.toFixed(2)}/kg | Monthly volume: ${comparison.monthlyVolumeKg} kg`, 14, 34);
    doc.setFontSize(10);
    let y = 44;
    doc.text("Supplier", 14, y);
    doc.text("Base ¥/kg", 50, y);
    doc.text("Landed ¥/kg", 75, y);
    doc.text("Margin SGD", 100, y);
    doc.text("Profit/mo SGD", 130, y);
    doc.text("Lead days", 160, y);
    y += 6;
    comparison.rows.forEach((r) => {
      doc.text(r.supplierName, 14, y);
      doc.text(String(r.basePriceJpy), 50, y);
      doc.text(r.landedCostJpyPerKg.toFixed(0), 75, y);
      doc.text(r.marginSgd.toFixed(2), 100, y);
      doc.text(r.monthlyProfitSgd.toFixed(2), 130, y);
      doc.text(String(r.leadTimeDays), 160, y);
      y += 6;
    });
    if (recommendation) {
      y += 4;
      doc.setFontSize(11);
      doc.text("AI Recommendation: " + recommendation.recommendedSupplierName, 14, y);
      y += 6;
      doc.setFontSize(9);
      const split = doc.splitTextToSize(recommendation.reasoning, 180);
      doc.text(split, 14, y);
      y += split.length * 5 + 4;
      doc.text(`Potential savings: ¥${recommendation.potentialSavingsJpy}/month`, 14, y);
    }
    doc.save(`supplier-comparison-${comparison.client.name.replace(/\s+/g, "-")}.pdf`);
    toast.success("Report downloaded");
  };

  const handleShare = () => {
    if (!comparison) return;
    const lines = [
      `Supplier Comparison: ${comparison.client.name}`,
      `Selling: SGD ${comparison.sellingPriceSgd}/kg | Volume: ${comparison.monthlyVolumeKg} kg/mo`,
      "",
      ...comparison.rows.map(
        (r) =>
          `${r.supplierName}: Landed ¥${r.landedCostJpyPerKg.toFixed(0)}/kg | Margin SGD ${r.marginSgd.toFixed(2)} | Profit SGD ${r.monthlyProfitSgd.toFixed(2)}/mo`
      ),
    ];
    if (recommendation) {
      lines.push("", "AI Recommendation: " + recommendation.recommendedSupplierName, recommendation.reasoning);
    }
    navigator.clipboard.writeText(lines.join("\n"));
    toast.success("Summary copied to clipboard");
  };

  const marginColor = (pct: number) => {
    if (pct >= 30) return "bg-green-100 text-green-800 border-green-200";
    if (pct >= 20) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/30 to-emerald-50/30">
      <header className="bg-white border-b border-green-100 sticky top-0 z-10 shadow-sm">
        <div className="container py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-green-900">Supplier Comparison Tool</h1>
                <p className="text-sm text-green-600">Compare suppliers and get AI recommendations</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground whitespace-nowrap">Select client</Label>
              <Select
                value={clientId != null ? String(clientId) : ""}
                onValueChange={(v) => {
                  setClientId(v ? Number(v) : null);
                  getRec.reset();
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Choose client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {!clientId && (
          <Card className="border-green-200">
            <CardContent className="py-12 text-center">
              <BarChart3 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <p className="text-muted-foreground">Select a client above to compare all suppliers and see AI recommendations.</p>
            </CardContent>
          </Card>
        )}

        {clientId && comparisonLoading && (
          <Card className="border-green-200">
            <CardContent className="py-12 flex items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-green-600" />
              <span>Loading comparison...</span>
            </CardContent>
          </Card>
        )}

        {clientId && comparison && !comparisonLoading && (
          <>
            {/* AI Recommendation */}
            <Card className="border-[#059669] shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-green-900">
                    <Trophy className="h-5 w-5 text-[#059669]" />
                    AI Recommendation
                  </CardTitle>
                  <Button
                    size="sm"
                    className="bg-[#059669] hover:bg-[#047857]"
                    onClick={handleGetRecommendation}
                    disabled={loadingRec}
                  >
                    {loadingRec ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    {loadingRec ? " Generating…" : " Get recommendation"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!recommendation && !loadingRec && (
                  <p className="text-sm text-muted-foreground">Click &quot;Get recommendation&quot; to see which supplier to use and why.</p>
                )}
                {loadingRec && (
                  <p className="text-sm text-green-700 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Analyzing suppliers…
                  </p>
                )}
                {recommendation && !loadingRec && (
                  <div className="space-y-2">
                    <p className="font-semibold text-green-900">
                      🏆 Recommended: {recommendation.recommendedSupplierName}
                    </p>
                    <p className="text-sm text-green-800">{recommendation.reasoning}</p>
                    {recommendation.potentialSavingsJpy > 0 && (
                      <p className="text-sm font-medium text-[#059669]">
                        Potential savings: ¥{recommendation.potentialSavingsJpy.toLocaleString()}/month
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comparison Table */}
            <Card className="border-green-200 shadow-sm">
              <CardHeader>
                <CardTitle>Side-by-side comparison</CardTitle>
                <CardDescription>
                  Landed cost = (base + ¥15/kg shipping) × 1.09. Margins color-coded: green &gt;30%, yellow 20–30%, red &lt;20%.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-green-200">
                      <th className="text-left py-3 px-2 font-medium">Supplier</th>
                      <th className="text-right py-3 px-2">Base (¥/kg)</th>
                      <th className="text-right py-3 px-2">+ Shipping</th>
                      <th className="text-right py-3 px-2">+ Tax (9%)</th>
                      <th className="text-right py-3 px-2">= Landed (¥/kg)</th>
                      <th className="text-right py-3 px-2">Margin (SGD/kg)</th>
                      <th className="text-right py-3 px-2">Monthly profit</th>
                      <th className="text-right py-3 px-2">Lead time</th>
                      <th className="text-right py-3 px-2">Reliability</th>
                      <th className="text-center py-3 px-2">Quality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.rows.map((r) => (
                      <tr
                        key={r.supplierId}
                        className={cn(
                          "border-b border-green-100 transition-colors",
                          r.supplierId === cheapestSupplierId && "bg-green-50"
                        )}
                      >
                        <td className="py-2 px-2 font-medium">
                          {r.supplierName}
                          {r.supplierId === comparison.currentSupplierId && (
                            <span className="ml-1 text-xs text-muted-foreground">(current)</span>
                          )}
                        </td>
                        <td className="text-right py-2 px-2">{r.basePriceJpy.toLocaleString()}</td>
                        <td className="text-right py-2 px-2">¥{r.shippingJpy}</td>
                        <td className="text-right py-2 px-2">{Math.round(r.taxJpy).toLocaleString()}</td>
                        <td className="text-right py-2 px-2 font-medium">{Math.round(r.landedCostJpyPerKg).toLocaleString()}</td>
                        <td className="text-right py-2 px-2">
                          <span className={cn("inline-block px-2 py-0.5 rounded border text-xs font-medium", marginColor(r.marginPercent))}>
                            {r.marginSgd.toFixed(2)} ({r.marginPercent.toFixed(0)}%)
                          </span>
                        </td>
                        <td className="text-right py-2 px-2 font-medium text-green-800">
                          SGD {r.monthlyProfitSgd.toFixed(2)}
                        </td>
                        <td className="text-right py-2 px-2">{r.leadTimeDays} days</td>
                        <td className="text-right py-2 px-2">{r.reliabilityScore}</td>
                        <td className="text-center py-2 px-2">
                          <div className="flex justify-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                className={cn("h-4 w-4", i <= r.qualityRating ? "fill-amber-400 text-amber-500" : "text-gray-200")}
                              />
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Cost breakdown mini chart */}
            {barData.length > 0 && (
              <Card className="border-green-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Cost breakdown (¥/kg)</CardTitle>
                  <CardDescription>Base price, shipping ¥15/kg, and 9% import tax by supplier</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} margin={{ top: 8, right: 8, left: 8, bottom: 24 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number) => `¥${v.toLocaleString()}`} />
                        <Legend />
                        <Bar dataKey="base" stackId="a" fill="#059669" name="Base" />
                        <Bar dataKey="shipping" stackId="a" fill="#34d399" name="Shipping" />
                        <Bar dataKey="tax" stackId="a" fill="#6ee7b7" name="Tax" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* What-if calculator */}
            <Card className="border-green-200 shadow-sm">
              <CardHeader>
                <CardTitle>What-if calculator</CardTitle>
                <CardDescription>Estimate total cost, profit, and ROI for a supplier and order pattern</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <Label>Supplier</Label>
                    <Select
                      value={whatIfSupplierId != null ? String(whatIfSupplierId) : ""}
                      onValueChange={(v) => setWhatIfSupplierId(v ? Number(v) : null)}
                    >
                      <SelectTrigger className="mt-1 w-full">
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {comparison.rows.map((r) => (
                          <SelectItem key={r.supplierId} value={String(r.supplierId)}>
                            {r.supplierName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Order quantity (kg)</Label>
                    <input
                      type="number"
                      min={1}
                      value={whatIfQty}
                      onChange={(e) => setWhatIfQty(Number(e.target.value) || 1)}
                      className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    />
                  </div>
                  <div>
                    <Label>Frequency</Label>
                    <Select value={whatIfFreq} onValueChange={(v) => setWhatIfFreq(v as "monthly" | "quarterly")}>
                      <SelectTrigger className="mt-1 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {whatIfResult && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-green-50 rounded-lg border border-green-100">
                    <div>
                      <p className="text-xs text-muted-foreground">Total cost</p>
                      <p className="font-semibold text-green-900">SGD {whatIfResult.totalCostSgd.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Expected profit</p>
                      <p className="font-semibold text-green-900">SGD {whatIfResult.profitSgd.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Annual savings vs current</p>
                      <p className="font-semibold text-green-900">SGD {whatIfResult.annualSavings.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">ROI</p>
                      <p className="font-semibold text-green-900">{whatIfResult.roi.toFixed(1)}%</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action buttons */}
            <Card className="border-green-200 shadow-sm">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>Export, share, or update client supplier</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button variant="outline" className="border-green-200" onClick={() => toast.info("Update the client's supplier in Google Sheets or the Clients page.")}>
                  Switch to This Supplier
                </Button>
                <Button variant="outline" className="border-green-200" onClick={handleGenerateReport}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Generate Report (PDF)
                </Button>
                <Button variant="outline" className="border-green-200" onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Analysis
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
