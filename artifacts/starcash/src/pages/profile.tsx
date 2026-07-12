import { useGetMe } from "@workspace/api-client-react";
import { formatMoney } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Mail,
  Phone,
  Copy,
  CalendarDays,
  ShieldCheck,
  Wallet,
  TrendingUp,
  Users,
  Hash,
} from "lucide-react";

function DetailRow({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string | undefined;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-border last:border-0">
      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm font-medium truncate ${mono ? "font-mono" : ""}`}>
          {value ?? "—"}
        </p>
      </div>
    </div>
  );
}

export default function Profile() {
  const { data: user, isLoading } = useGetMe();
  const { toast } = useToast();

  if (isLoading || !user) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-72 bg-muted rounded-xl animate-pulse" />
          <div className="lg:col-span-2 h-72 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const initials = (user.fullName ?? user.username ?? "?")
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : undefined;

  const copyCode = () => {
    if (user.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      toast({ title: "Copied!", description: "Referral code copied to clipboard." });
    }
  };

  const isAdmin = user.role === "admin";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground mt-1 text-sm">Your account details and earnings overview</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar card */}
        <Card className="flex flex-col items-center justify-center text-center py-10 gap-4">
          <div className="w-24 h-24 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <span className="text-primary-foreground font-bold text-3xl">{initials}</span>
          </div>
          <div>
            <p className="text-xl font-bold">{user.fullName ?? user.username}</p>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            <Badge variant={user.status === "active" ? "default" : "destructive"}>
              {user.status?.toUpperCase()}
            </Badge>
            {isAdmin && (
              <Badge variant="secondary" className="gap-1">
                <ShieldCheck className="w-3 h-3" /> Admin
              </Badge>
            )}
          </div>
          {joinedDate && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CalendarDays className="w-3 h-3" /> Joined {joinedDate}
            </p>
          )}
        </Card>

        {/* Details card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <DetailRow icon={User} label="Full Name" value={user.fullName ?? undefined} />
            <DetailRow icon={Hash} label="Username" value={user.username ?? undefined} mono />
            <DetailRow icon={Mail} label="Email Address" value={user.email ?? undefined} />
            <DetailRow icon={Phone} label="Phone Number" value={user.phone ?? undefined} />
            <div className="flex items-center gap-4 py-3">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Copy className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Referral Code</p>
                <p className="text-sm font-medium font-mono">{user.referralCode}</p>
              </div>
              <Button size="sm" variant="outline" onClick={copyCode} className="flex-shrink-0">
                <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Wallet Balance</p>
                <p className="text-2xl font-bold font-mono">
                  {formatMoney(Number(user.walletBalance ?? 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold font-mono">
                  {formatMoney(Number(user.totalEarnings ?? 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Referrals</p>
                <p className="text-2xl font-bold font-mono">
                  {user.totalReferrals ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
