
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/company-setup" element={<CompanySetup />} />
            <Route path="/create-test-company" element={<CreateTestCompany />} />
            <Route path="/fix-pablo" element={<FixPabloLink />} />
            <Route path="/debug/:companySlug" element={<DebugPublicBooking />} />
            <Route path="/public/:companySlug" element={<PublicBooking />} />
            <Route path="/" element={<Index />} />
            {/* Rota para capturar slugs diretamente na raiz (ex: zapagenda.site/pablo) */}
            <Route path="/:companySlug" element={<PublicBooking />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <PWAInstallPrompt />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
