import { useGetDashboard } from "@workspace/api-client-react";
import { formatMoney } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, Facebook, Send, Twitter, Mail, Wallet, ArrowUpRight, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data, isLoading } = useGetDashboard();
  const { toast } = useToast();

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const copyLink = () => {
    if (data.referralLink) {
      navigator.clipboard.writeText(data.referralLink);
      toast({ title: "Copied!", description: "Referral link copied to clipboard." });
    }
  };

  const encodedLink = encodeURIComponent(data.referralLink || "");
  const shareText = encodeURIComponent("Join me on StarCash and start earning!");

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Status: <Badge variant={data.membershipStatus === "active" ? "default" : "destructive"}>{data.membershipStatus.toUpperCase()}</Badge>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Wallet Balance</CardTitle>
            <Wallet className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">{formatMoney(data.walletBalance)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Withdrawable</CardTitle>
            <ArrowUpRight className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">{formatMoney(data.withdrawableBalance)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Earnings</CardTitle>
            <Clock className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">{formatMoney(data.pendingEarnings)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
            <Wallet className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">{formatMoney(data.totalEarnings)}</div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="md:col-span-2 lg:col-span-2 space-y-6">
          <Card className="bg-gradient-to-br from-sidebar to-background border-primary/20">
            <CardHeader>
              <CardTitle>Your Referral Link</CardTitle>
              <CardDescription>Share this link to invite users and earn commissions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 bg-muted p-3 rounded-md font-mono text-sm break-all border">
                  {data.referralLink || "Not available"}
                </div>
                <Button onClick={copyLink} className="shrink-0" variant="secondary">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" variant="outline" asChild className="bg-[#25D366] text-white hover:bg-[#25D366]/90 border-0">
                  <a href={`https://wa.me/?text=${shareText}%20${encodedLink}`} target="_blank" rel="noreferrer">
                    WhatsApp
                  </a>
                </Button>
                <Button size="sm" variant="outline" asChild className="bg-[#1877F2] text-white hover:bg-[#1877F2]/90 border-0">
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`} target="_blank" rel="noreferrer">
                    <Facebook className="w-4 h-4 mr-1" /> Facebook
                  </a>
                </Button>
                <Button size="sm" variant="outline" asChild className="bg-[#1DA1F2] text-white hover:bg-[#1DA1F2]/90 border-0">
                  <a href={`https://t.me/share/url?url=${encodedLink}&text=${shareText}`} target="_blank" rel="noreferrer">
                    <Send className="w-4 h-4 mr-1" /> Telegram
                  </a>
                </Button>
                <Button size="sm" variant="outline" asChild className="bg-black text-white hover:bg-black/90 border-0 dark:bg-white dark:text-black dark:hover:bg-white/90">
                  <a href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodedLink}`} target="_blank" rel="noreferrer">
                    <Twitter className="w-4 h-4 mr-1" /> Twitter
                  </a>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={`mailto:?subject=Join me on StarCash&body=${shareText} ${encodedLink}`}>
                    <Mail className="w-4 h-4 mr-1" /> Email
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentTransactions && data.recentTransactions.length > 0 ? (
                <div className="space-y-4">
                  {data.recentTransactions.map(tx => (
                    <div key={tx.id} className="flex justify-between items-center p-3 rounded-lg border bg-muted/30">
                      <div>
                        <p className="font-medium text-sm">{tx.description || tx.type.replace("_", " ")}</p>
                        <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-mono font-bold ${tx.amount > 0 ? 'text-primary' : 'text-foreground'}`}>
                          {tx.amount > 0 ? "+" : ""}{formatMoney(tx.amount)}
                        </p>
                        <Badge variant="outline" className="text-[10px] mt-1 uppercase">
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No recent transactions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Referral Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Referrals</p>
                  <p className="text-2xl font-bold font-mono">{data.totalReferrals}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Referrals</p>
                  <p className="text-2xl font-bold font-mono">{data.activeReferrals}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Bonus Earned</p>
                  <p className="text-2xl font-bold font-mono text-primary">{formatMoney(data.totalBonusEarned)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
