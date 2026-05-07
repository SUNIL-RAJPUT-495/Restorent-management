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
  "/self-orders": { title: "Self Orders", sub: "Manage QR & Online orders" },
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
            
            
          </header>
          <main className="min-w-0 flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
