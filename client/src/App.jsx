import React, { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/app/AppLayout";
const POS = React.lazy(() => import("./pages/POS"));
const Tables = React.lazy(() => import("./pages/Tables"));
const Inventory = React.lazy(() => import("./pages/Inventory"));
const MenuKDS = React.lazy(() => import("./pages/MenuKDS"));
const Reports = React.lazy(() => import("./pages/Reports"));
const Settings = React.lazy(() => import("./pages/Settings"));
const NotFound = React.lazy(() => import("./pages/NotFound.jsx"));
const AdminLogin = React.lazy(() => import("./pages/AdminLogin"));
import { ProtectedAdminRoute } from "./utils/ProtectedAdminRoute";
const QRBuilder = React.lazy(() => import("./pages/QRBuilder"));
const QROrderFlow = React.lazy(() => import("./pages/QROrderFlow"));

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
        <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center text-accent"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div></div>}>
          <Routes>
            {/* Public Route */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/order" element={<QROrderFlow />} />
          <Route path="/order/status/:orderNumber" element={<QROrderFlow />} />

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
                    <Route path="/qr-builder" element={<QRBuilder />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ProtectedAdminRoute>
            }
          />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
