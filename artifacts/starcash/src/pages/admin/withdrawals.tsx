import { useState } from "react";
import { useGetAdminWithdrawals, useUpdateWithdrawal, GetAdminWithdrawalsStatus } from "@workspace/api-client-react";
import { formatMoney, formatDate } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminWithdrawals() {
  const [status, setStatus] = useState<GetAdminWithdrawalsStatus | "all">("pending");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: withdrawals, isLoading } = useGetAdminWithdrawals({
    status: status === "all" ? undefined : status
  });

  const updateMutation = useUpdateWithdrawal();

  const handleStatusUpdate = (id: number, newStatus: "approved" | "rejected" | "completed") => {
    updateMutation.mutate(
      { id, data: { status: newStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
          toast({ title: "Withdrawal updated", description: `Status changed to ${newStatus}.` });
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Withdrawal Requests</h1>
        <p className="text-muted-foreground mt-1">Review and process user payout requests.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-4">
          <CardTitle>Requests</CardTitle>
          <Select value={status} onValueChange={(val: any) => setStatus(val)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
          ) : !withdrawals || withdrawals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No withdrawal requests found.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Bank Details</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>
                        <div className="font-medium">{req.fullName}</div>
                        <div className="text-xs text-muted-foreground">@{req.username}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{req.bankName}</div>
                        <div className="text-xs text-muted-foreground">{req.accountName}</div>
                        <div className="text-xs font-mono">{req.accountNumber}</div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-primary">
                        {formatMoney(req.amount)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(req.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          req.status === "completed" ? "default" :
                          req.status === "pending" ? "secondary" : 
                          req.status === "approved" ? "outline" : "destructive"
                        }>
                          {req.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {req.status === "pending" && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                              onClick={() => handleStatusUpdate(req.id, "approved")}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                              onClick={() => handleStatusUpdate(req.id, "rejected")}
                            >
                              <XCircle className="w-4 h-4 mr-1" /> Reject
                            </Button>
                          </>
                        )}
                        {req.status === "approved" && (
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={() => handleStatusUpdate(req.id, "completed")}
                          >
                            Mark Paid
                          </Button>
                        )}
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
