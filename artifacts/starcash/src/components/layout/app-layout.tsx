import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Users, 
  Ticket, 
  Banknote, 
  History, 
  LogOut,
  Wallet,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

function SidebarContent({ isAdmin }: { isAdmin: boolean }) {
  const [location] = useLocation();
  const { logout } = useAuth();

  const links = isAdmin
    ? [
        { href: "/admin", label: "Overview", icon: LayoutDashboard },
        { href: "/admin/users", label: "Users", icon: Users },
        { href: "/admin/coupons", label: "Coupons", icon: Ticket },
        { href: "/admin/withdrawals", label: "Withdrawals", icon: Banknote },
        { href: "/admin/transactions", label: "Transactions", icon: History },
      ]
    : [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/referrals", label: "Referrals", icon: Users },
        { href: "/withdraw", label: "Withdraw", icon: Wallet },
        { href: "/transactions", label: "Transactions", icon: History },
      ];

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border text-sidebar-foreground">
      <div className="p-6">
        <Link href={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl leading-none">S</span>
          </div>
          <span className="text-xl font-bold tracking-tight">StarCash</span>
        </Link>
      </div>

      <div className="flex-1 px-4 space-y-1">
        {links.map((link) => {
          const isActive = location === link.href || (link.href !== "/admin" && link.href !== "/dashboard" && location.startsWith(link.href));
          const Icon = link.icon;
          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium",
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {link.label}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-sidebar-border space-y-1">
        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="text-xs text-sidebar-foreground/50 font-medium">Theme</span>
          <ThemeToggle className="text-sidebar-foreground/70 hover:text-sidebar-foreground" />
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground" 
          onClick={() => logout()}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, isAdmin, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 flex-shrink-0">
        <SidebarContent isAdmin={isAdmin} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="md:hidden h-16 border-b border-border flex items-center px-4 justify-between bg-card">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">S</span>
            </div>
            <span className="font-bold">StarCash</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 border-r-0">
                <SidebarContent isAdmin={isAdmin} />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8 max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
