import { useGetMyWithdrawals, useCreateWithdrawal, useGetDashboard } from "@workspace/api-client-react";
import { formatMoney, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Wallet, CalendarClock } from "lucide-react";

function isSunday() {
  return new Date().getDay() === 0;
}

function daysUntilSunday() {
  const day = new Date().getDay(); // 0=Sun … 6=Sat
  return day === 0 ? 0 : 7 - day;
}

const withdrawalSchema = z.object({
  bankName: z.string().min(2, "Bank name is required"),
  accountName: z.string().min(2, "Account name is required"),
  accountNumber: z.string().min(5, "Valid account number is required"),
  amount: z.coerce.number().min(6, "Minimum withdrawal amount is $6"),
});

type WithdrawalValues = z.infer<typeof withdrawalSchema>;

export default function Withdraw() {
  const { data: dashboard } = useGetDashboard();
  const { data: withdrawals, isLoading } = useGetMyWithdrawals();
  const createWithdrawal = useCreateWithdrawal();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const today = isSunday();
  const daysLeft = daysUntilSunday();

  const form = useForm<WithdrawalValues>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      bankName: "",
      accountName: "",
      accountNumber: "",
      amount: 6,
    },
  });

  const withdrawableBalance = dashboard?.withdrawableBalance || 0;

  const onSubmit = (values: WithdrawalValues) => {
    if (!isSunday()) {
      toast({
        variant: "destructive",
        title: "Not Available",
        description: "Payout requests are only accepted on Sundays.",
      });
      return;
    }

    if (values.amount > withdrawableBalance) {
      form.setError("amount", { message: "Amount exceeds withdrawable balance" });
      return;
    }

    createWithdrawal.mutate({ data: values }, {
      onSuccess: () => {
        toast({
          title: "Withdrawal Requested",
          description: "Your withdrawal request has been submitted successfully.",
        });
        form.reset();
        queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
        queryClient.invalidateQueries({ queryKey: ["/api/users/me/dashboard"] });
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Request Failed",
          description: error.message || "Failed to submit withdrawal request",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Withdraw Funds</h1>
        <p className="text-muted-foreground mt-1">Request a payout directly to your bank account.</p>
      </div>

      {/* Sunday-only notice */}
      {!today && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 text-sm text-amber-600 dark:text-amber-400">
          <CalendarClock className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Payouts open on Sundays only</p>
            <p className="text-xs mt-0.5 opacity-80">
              {daysLeft === 1
                ? "Come back tomorrow — Sunday is just 1 day away."
                : `Next payout window opens in ${daysLeft} days.`}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-gradient-to-br from-sidebar to-background border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Available to Withdraw</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Wallet className="w-8 h-8 text-primary" />
                <div className="text-4xl font-bold font-mono">
                  {formatMoney(withdrawableBalance)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={!today ? "opacity-60 pointer-events-none select-none" : ""}>
            <CardHeader>
              <CardTitle>Request Payout</CardTitle>
              <CardDescription>
                {today
                  ? "Minimum withdrawal amount is $6.00"
                  : "Available on Sundays only"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (USD)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" min="6" {...field} disabled={!today} />
                        </FormControl>
                        <FormDescription className="text-xs">Minimum withdrawal is $6.00</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Chase Bank" {...field} disabled={!today} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="accountName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} disabled={!today} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input placeholder="0000000000" {...field} disabled={!today} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!today || createWithdrawal.isPending || withdrawableBalance < 6}
                  >
                    {createWithdrawal.isPending ? "Submitting..." : "Submit Request"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Recent Requests</CardTitle>
              <CardDescription>Track the status of your past withdrawal requests.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-12 flex justify-center">
                  <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                </div>
              ) : !withdrawals || withdrawals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>You haven't requested any withdrawals yet.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Bank</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawals.map((w) => (
                        <TableRow key={w.id}>
                          <TableCell className="text-sm text-muted-foreground">{formatDate(w.createdAt)}</TableCell>
                          <TableCell>
                            <div className="font-medium text-sm">{w.bankName}</div>
                            <div className="text-xs text-muted-foreground">****{w.accountNumber.slice(-4)}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              w.status === "completed" ? "default" :
                              w.status === "pending" ? "secondary" : 
                              w.status === "approved" ? "outline" : "destructive"
                            }>
                              {w.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            {formatMoney(w.amount)}
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
      </div>
    </div>
  );
}
