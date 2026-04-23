import {
  ChefHat,
  LayoutDashboard,
  ClipboardList,
  Boxes,
  BookOpen,
  BarChart3,
  Settings,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "POS / Billing", url: "/", icon: LayoutDashboard },
  { title: "Tables", url: "/tables", icon: ClipboardList },
  { title: "Inventory", url: "/inventory", icon: Boxes },
  { title: "Menu & KDS", url: "/menu", icon: BookOpen },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  const adminInfo = (() => {
    try {
      return JSON.parse(localStorage.getItem("rw_admin_info") || "{}");
    } catch {
      return {};
    }
  })();
  const restaurantName = adminInfo.name || "ONEBY";
  const restaurantLocation = adminInfo.location || "Jaipur, Rajasthan";
  const restaurantLogo = adminInfo.logo || null;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border bg-primary">
        <div className="flex items-center gap-2.5 px-2 py-2">
          {restaurantLogo ? (
            <img src={restaurantLogo} alt="Logo" className="h-9 w-9 rounded-lg object-cover shadow-soft shrink-0 bg-white" />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-accent text-accent-foreground shadow-soft">
              <ChefHat className="h-5 w-5" />
            </span>
          )}
          {!collapsed && (
            <div className="leading-tight">
              <p className="text-sm font-bold text-primary-foreground uppercase truncate w-32">
                {restaurantName}
              </p>
              <p className="text-[11px] text-primary-foreground/70 truncate w-32">
                {restaurantLocation}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                    >
                      <NavLink to={item.url} end className="flex items-center">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <NavLink 
          to="/settings" 
          className={({ isActive }) => 
            `flex items-center gap-2.5 p-2 rounded-lg transition-colors hover:bg-muted ${isActive ? 'bg-muted' : ''}`
          }
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-accent text-accent-foreground text-xs font-bold shadow-soft">
            {JSON.parse(localStorage.getItem("rw_admin_info") || "{}").name?.charAt(0).toUpperCase() || "A"}
          </div>
          {!collapsed && (
            <div className="leading-tight overflow-hidden">
              <p className="text-xs font-bold text-primary truncate">
                {JSON.parse(localStorage.getItem("rw_admin_info") || "{}").name || "Admin"}
              </p>
              <p className="text-[10px] text-muted-foreground capitalize">
                {JSON.parse(localStorage.getItem("rw_admin_info") || "{}").role || "Manager"} · Profile
              </p>
            </div>
          )}
        </NavLink>
      </SidebarFooter>
    </Sidebar>
  );
}
