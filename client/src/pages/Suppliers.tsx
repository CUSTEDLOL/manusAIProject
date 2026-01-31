import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, ArrowLeft, Mail, Phone, Clock, MapPin, Package } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";

/**
 * Supplier Management Page
 * 
 * Manages Japanese matcha suppliers with lead time tracking.
 * Part of Challenge #1: Multi-supplier operations management.
 * 
 * Key Features:
 * - Track supplier lead times (critical for reorder timing)
 * - Contact information management
 * - Integration with n8n Workflow 4 (Supplier Swap Recommendations)
 */
export default function Suppliers() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    country: "Japan",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    leadTimeDays: "45",
    notes: "",
  });

  const { data: suppliers, isLoading, isError } = trpc.supplier.list.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.supplier.create.useMutation({
    onSuccess: () => {
      toast.success("Supplier created successfully!");
      utils.supplier.list.invalidate();
      setIsDialogOpen(false);
      setFormData({
        name: "",
        country: "Japan",
        contactPerson: "",
        contactEmail: "",
        contactPhone: "",
        leadTimeDays: "45",
        notes: "",
      });
    },
    onError: (error) => {
      toast.error(`Failed to create supplier: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Supplier name is required");
      return;
    }

    createMutation.mutate({
      ...formData,
      leadTimeDays: parseInt(formData.leadTimeDays) || 45,
    });
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
              <h1 className="text-2xl font-bold text-green-900">Supplier Management</h1>
              <p className="text-sm text-green-600">Manage your Japanese matcha suppliers and track lead times</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-700 hover:bg-green-800">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Supplier
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Supplier</DialogTitle>
                  <DialogDescription>
                    Enter the details for your new matcha supplier
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Supplier Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Kyoto Matcha Farm"
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        placeholder="Japan"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="leadTimeDays">Lead Time (Days)</Label>
                      <Input
                        id="leadTimeDays"
                        type="number"
                        value={formData.leadTimeDays}
                        onChange={(e) => setFormData({ ...formData, leadTimeDays: e.target.value })}
                        placeholder="45"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Contact Person</Label>
                    <Input
                      id="contactPerson"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      placeholder="e.g., Tanaka-san"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Email</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        placeholder="contact@supplier.jp"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Phone</Label>
                      <Input
                        id="contactPhone"
                        value={formData.contactPhone}
                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                        placeholder="+81 XX XXXX XXXX"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Any additional notes..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="submit"
                      className="bg-green-700 hover:bg-green-800"
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending ? "Creating..." : "Create Supplier"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Summary Stats */}
        {suppliers && suppliers.length > 0 && (
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4 text-green-600" />
                  Active Suppliers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">
                  {suppliers.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Japanese suppliers
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  Avg Lead Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">
                  {Math.round(suppliers.reduce((sum, s) => sum + s.leadTimeDays, 0) / suppliers.length)} days
                </div>
                <p className="text-xs text-muted-foreground">
                  Order to delivery
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Primary Region</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900">
                  Japan
                </div>
                <p className="text-xs text-muted-foreground">
                  Premium matcha source
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {!suppliers || suppliers.length === 0 ? (
          <Card className="border-green-200">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No suppliers yet</p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-green-700 hover:bg-green-800"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Supplier
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map((supplier) => (
              <Card key={supplier.id} className="border-green-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{supplier.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {supplier.country}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {supplier.leadTimeDays}d lead
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {supplier.contactPerson && (
                    <div>
                      <p className="text-xs text-muted-foreground">Contact Person</p>
                      <p className="text-sm font-medium">{supplier.contactPerson}</p>
                    </div>
                  )}

                  {supplier.contactEmail && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span className="text-xs">{supplier.contactEmail}</span>
                    </div>
                  )}

                  {supplier.contactPhone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span className="text-xs">{supplier.contactPhone}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-green-600" />
                      <span className="font-medium">{supplier.leadTimeDays} days</span>
                      <span className="text-muted-foreground text-xs">lead time</span>
                    </div>
                  </div>

                  {supplier.notes && (
                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {supplier.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
