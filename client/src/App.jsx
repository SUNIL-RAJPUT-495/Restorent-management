import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/app/AppLayout";
import POS from "./pages/POS";
import Tables from "./pages/Tables";
import Inventory from "./pages/Inventory";
import MenuKDS from "./pages/MenuKDS";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound.jsx";
import AdminLogin from "./pages/AdminLogin";
import { ProtectedAdminRoute } from "./utils/ProtectedAdminRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false, // Prevents re-fetching when user switches back to the tab
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Public Route */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected Routes */}
          <Route
            path="/*"
            element={
              <ProtectedAdminRoute>
                <Routes>
                  <Route element={<AppLayout />}>
                    <Route path="/" element={<POS />} />
                    <Route path="/tables" element={<Tables />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/menu" element={<MenuKDS />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/settings" element={<Settings />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ProtectedAdminRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
