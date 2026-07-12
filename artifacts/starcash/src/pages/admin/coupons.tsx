import { useState } from "react";
import { useGetAdminCoupons, useCreateCoupon, useBulkCreateCoupons, useUpdateCoupon, useDeleteCoupon, GetAdminCouponsStatus } from "@workspace/api-client-react";
import { formatDate, formatMoney } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MoreVertical, Trash, Ban, Plus, Copy, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const singleCouponSchema = z.object({
  code: z.string().optional(),
  value: z.coerce.number().min(1, "Value must be at least 1"),
});

const bulkCouponSchema = z.object({
  count: z.coerce.number().min(1).max(500, "Maximum 500 at a time"),
  value: z.coerce.number().min(1, "Value must be at least 1"),
});

export default function AdminCoupons() {
  const [status, setStatus] = useState<GetAdminCouponsStatus | "all">("all");
  const [isSingleOpen, setIsSingleOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: coupons, isLoading } = useGetAdminCoupons({
    status: status === "all" ? undefined : status
  });

  const createMutation = useCreateCoupon();
  const bulkMutation = useBulkCreateCoupons();
  const updateMutation = useUpdateCoupon();
  const deleteMutation = useDeleteCoupon();

  const singleForm = useForm<z.infer<typeof singleCouponSchema>>({
    resolver: zodResolver(singleCouponSchema),
    defaultValues: { code: "", value: 10 },
  });

  const bulkForm = useForm<z.infer<typeof bulkCouponSchema>>({
    resolver: zodResolver(bulkCouponSchema),
    defaultValues: { count: 10, value: 10 },
  });

  const onSingleSubmit = (values: z.infer<typeof singleCouponSchema>) => {
    createMutation.mutate({ data: { code: values.code || undefined, value: values.value } }, {
      onSuccess: () => {
        setIsSingleOpen(false);
        singleForm.reset();
        queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
        toast({ title: "Coupon created" });
      }
    });
  };

  const onBulkSubmit = (values: z.infer<typeof bulkCouponSchema>) => {
    bulkMutation.mutate({ data: values }, {
      onSuccess: (res) => {
        setIsBulkOpen(false);
        bulkForm.reset();
        queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
        toast({ title: "Coupons generated", description: `Successfully generated ${values.count} coupons.` });
      }
    });
  };

  const handleDisable = (id: number) => {
    updateMutation.mutate({ id, data: { status: "disabled" } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
        toast({ title: "Coupon disabled" });
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
        toast({ title: "Coupon deleted" });
      }
    });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: "Coupon code copied to clipboard." });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground mt-1">Manage activation coupons.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isSingleOpen} onOpenChange={setIsSingleOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Plus className="w-4 h-4 mr-2" /> Single</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Coupon</DialogTitle>
                <DialogDescription>Generate a single activation coupon.</DialogDescription>
              </DialogHeader>
              <Form {...singleForm}>
                <form onSubmit={singleForm.handleSubmit(onSingleSubmit)} className="space-y-4">
                  <FormField
                    control={singleForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Code (Optional)</FormLabel>
                        <FormControl><Input placeholder="Leave blank to auto-generate" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={singleForm.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Value ($)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Bulk Generate</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Generate Coupons</DialogTitle>
                <DialogDescription>Generate up to 500 coupons at once.</DialogDescription>
              </DialogHeader>
              <Form {...bulkForm}>
                <form onSubmit={bulkForm.handleSubmit(onBulkSubmit)} className="space-y-4">
                  <FormField
                    control={bulkForm.control}
                    name="count"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl><Input type="number" min="1" max="500" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={bulkForm.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Value per Coupon ($)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={bulkMutation.isPending}>
                    {bulkMutation.isPending ? "Generating..." : "Generate"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-4">
          <CardTitle>Coupon Inventory</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={status} onValueChange={(val: any) => setStatus(val)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="unused">Unused</SelectItem>
                <SelectItem value="used">Used</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
          ) : !coupons || coupons.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No coupons found.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Used By</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-sm">{coupon.code}</code>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(coupon.code)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono font-medium">
                        {formatMoney(coupon.value)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          coupon.status === "unused" ? "default" :
                          coupon.status === "used" ? "secondary" : "destructive"
                        }>
                          {coupon.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {coupon.usedByUsername ? `@${coupon.usedByUsername}` : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(coupon.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {coupon.status === "unused" && (
                              <DropdownMenuItem onClick={() => handleDisable(coupon.id)}>
                                <Ban className="mr-2 h-4 w-4" /> Disable
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(coupon.id)}>
                              <Trash className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
