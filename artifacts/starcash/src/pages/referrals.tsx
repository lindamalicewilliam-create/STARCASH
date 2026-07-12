import { useGetMyReferrals } from "@workspace/api-client-react";
import { formatMoney, formatDate } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Referrals() {
  const { data: referrals, isLoading } = useGetMyReferrals();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Referrals</h1>
        <p className="text-muted-foreground mt-1">Track the users you have invited and your earned bonuses.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Referred Users</CardTitle>
          <CardDescription>A list of all users who signed up with your code.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
          ) : !referrals || referrals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>You haven't referred anyone yet.</p>
              <p className="text-sm mt-1">Share your link to start earning!</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Bonus</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((ref) => (
                    <TableRow key={ref.id}>
                      <TableCell>
                        <div className="font-medium">{ref.referredFullName}</div>
                        <div className="text-xs text-muted-foreground">@{ref.referredUsername}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(ref.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant={ref.status === "active" ? "default" : "secondary"}>
                          {ref.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-primary">
                        {formatMoney(ref.bonusAmount)}
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
