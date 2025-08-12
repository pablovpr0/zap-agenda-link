
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CompanySetup from "./pages/CompanySetup";
import PublicBooking from "./pages/PublicBooking";
import PublicBookingRedirect from "./components/PublicBookingRedirect";
import CreateTestCompany from "./pages/CreateTestCompany";
import CoverSettings from "./pages/CoverSettings";
import ThemeCustomization from "./pages/ThemeCustomization";
import DoubleBookingTestPage from "./pages/DoubleBookingTestPage";
import NotFound from "./pages/NotFound";
import FinalTimezoneDebug from "./components/debug/FinalTimezoneDebug";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Rotas administrativas e de sistema */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/company-setup" element={<CompanySetup />} />
              <Route path="/create-test-company" element={<CreateTestCompany />} />
              <Route path="/cover-settings" element={<CoverSettings />} />
              <Route path="/theme-customization" element={<ThemeCustomization />} />
              
              {/* Rotas de desenvolvimento/teste (manter apenas essenciais) */}
              <Route path="/double-booking-test" element={<DoubleBookingTestPage />} />
              <Route path="/timezone-final-test" element={<FinalTimezoneDebug />} />
              
              {/* Redirecionamento para compatibilidade com links antigos */}
              <Route path="/public/:companySlug" element={<PublicBookingRedirect />} />
              
              {/* Página inicial */}
              <Route path="/" element={<Index />} />
              
              {/* Nova rota principal para booking público (dominio.com/{slug}) */}
              <Route path="/:companySlug" element={<PublicBooking />} />
              
              {/* Página 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <PWAInstallPrompt />
          </BrowserRouter>
          <Toaster />
          <Sonner />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
