import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const titles = {
  "/": { title: "POS & Billing", sub: "Fast service · Tablet optimized" },
  "/tables": {
    title: "Table Management",
    sub: "Live floor plan & reservations",
  },
  "/inventory": {
    title: "Inventory & Recipes",
    sub: "Stock levels and ingredient costing",
  },
  "/menu": {
    title: "Menu & Kitchen Display",
    sub: "Edit menu and track tickets",
  },
  "/reports": {
    title: "Reports & Analytics",
    sub: "Sales, expenses, customer behavior",
  },
  "/settings": { title: "Settings", sub: "Permissions, integrations and more" },
};

export const AppLayout = () => {
  const { pathname } = useLocation();
  const meta = titles[pathname] ?? { title: "Dashboard", sub: "" };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur md:px-6">
            <SidebarTrigger />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-bold text-primary md:text-lg">
                {meta.title}
              </h1>
              <p className="hidden truncate text-xs text-muted-foreground md:block">
                {meta.sub}
              </p>
            </div>
            <div className="relative hidden w-72 md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search orders, items, tables…"
                className="pl-9"
              />
            </div>
            <button
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background hover:bg-muted"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" />
            </button>
          </header>
          <main className="min-w-0 flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
