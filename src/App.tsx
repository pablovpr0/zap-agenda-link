
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
import CreateTestCompany from "./pages/CreateTestCompany";
import DebugPublicBooking from "./pages/DebugPublicBooking";
import FixPabloLink from "./pages/FixPabloLink";
import TimezoneTest from "./pages/TimezoneTest";
import ThemeTestPage from "./pages/ThemeTestPage";
import ErrorTestPage from "./pages/ErrorTestPage";
import CoverSettings from "./pages/CoverSettings";
import ThemeCustomization from "./pages/ThemeCustomization";
import BookingSystemTest from "./pages/BookingSystemTest";
import ScheduleDebugPage from "./pages/ScheduleDebugPage";
import QuickScheduleTest from "./pages/QuickScheduleTest";
import PublicBookingTest from "./pages/PublicBookingTest";
import NotFound from "./pages/NotFound";

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
              <Route path="/auth" element={<Auth />} />
              <Route path="/company-setup" element={<CompanySetup />} />
              <Route path="/create-test-company" element={<CreateTestCompany />} />
              <Route path="/fix-pablo" element={<FixPabloLink />} />
              <Route path="/debug/:companySlug" element={<DebugPublicBooking />} />
              <Route path="/timezone-test" element={<TimezoneTest />} />
              <Route path="/theme-test" element={<ThemeTestPage />} />
              <Route path="/error-test" element={<ErrorTestPage />} />
              <Route path="/cover-settings" element={<CoverSettings />} />
              <Route path="/theme-customization" element={<ThemeCustomization />} />
              <Route path="/booking-system-test" element={<BookingSystemTest />} />
              <Route path="/schedule-debug" element={<ScheduleDebugPage />} />
              <Route path="/quick-schedule-test" element={<QuickScheduleTest />} />
              <Route path="/public-booking-test" element={<PublicBookingTest />} />
              <Route path="/public/:companySlug" element={<PublicBooking />} />
              <Route path="/" element={<Index />} />
              {/* Rota para capturar slugs diretamente na raiz (ex: zapagenda.site/pablo) */}
              <Route path="/:companySlug" element={<PublicBooking />} />
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
