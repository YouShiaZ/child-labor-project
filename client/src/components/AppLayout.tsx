// Child Labor Project — app shell: navy navbar + primary nav + user menu.
// Style: navy chrome (#1B3A6B), green active accent, light canvas content.
import { Link, useLocation } from "wouter";
import { type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_LABELS } from "@/lib/options";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  Users2,
  Users,
  LogOut,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const ICON_URL = "/favicon.png";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/project", label: "Project", icon: FolderKanban },
  { href: "/beneficiaries", label: "Beneficiaries", icon: Users2 },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const { user, logout, isRole } = useAuth();

  const nav = [...NAV];
  if (isRole("admin")) nav.push({ href: "/users", label: "Users", icon: Users });

  const initials = user
    ? user.fullName
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-md">
        <div className="container flex h-16 items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-white/95 p-1">
              <img src={ICON_URL} alt="CLP" className="h-8 w-8 object-contain" />
            </span>
            <span className="hidden flex-col leading-tight sm:flex">
              <span className="font-display text-base font-semibold">Child Labor Project</span>
              <span className="text-[11px] font-medium text-primary-foreground/70">
                Beneficiary Management System
              </span>
            </span>
          </Link>

          <nav className="ml-2 hidden items-center gap-1 md:flex">
            {nav.map((item) => {
              const active = location.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
                    active
                      ? "bg-white/15 text-white"
                      : "text-primary-foreground/75 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/10 focus:outline-none">
                  <Avatar className="h-8 w-8 border-2 border-white/30">
                    <AvatarFallback className="bg-[var(--color-brand-green)] text-xs font-semibold text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-left leading-tight sm:flex sm:flex-col">
                    <span className="text-sm font-medium">{user.fullName}</span>
                    <span className="text-[11px] text-primary-foreground/70">
                      {ROLE_LABELS[user.role]}
                    </span>
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user.fullName}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      logout();
                      navigate("/login");
                    }}
                    className="text-rose-600 focus:text-rose-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        <div className="border-t border-white/10 md:hidden">
          <div className="container flex items-center gap-1 overflow-x-auto py-2">
            {nav.map((item) => {
              const active = location.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium",
                    active ? "bg-white/15 text-white" : "text-primary-foreground/75",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <main className="container py-7">{children}</main>
    </div>
  );
}
