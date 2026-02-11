import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import OnboardingWizard from "./pages/OnboardingWizard";
import Dashboard from "./pages/Dashboard";
import CreativeStudio from "./pages/CreativeStudio";
import InternalStudio from "./pages/InternalStudio";
import SectorBrain from "./pages/SectorBrain";
import ClientProfile from "./pages/ClientProfile";
import FastTrackWizard from "./pages/FastTrackWizard";
import AgencyClients from "./pages/AgencyClients";
import AdminAuth from "./pages/AdminAuth";
import AdminDashboard from "./pages/AdminDashboard";
import MediaPortal from "./pages/MediaPortal";
import AdkopWizard from "./pages/AdkopWizard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<OnboardingWizard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/studio" element={<CreativeStudio />} />
            <Route path="/internal-studio" element={<InternalStudio />} />
            <Route path="/brain" element={<SectorBrain />} />
            <Route path="/profile" element={<ClientProfile />} />
            <Route path="/new-campaign" element={<FastTrackWizard />} />
            <Route path="/clients" element={<AgencyClients />} />
            <Route path="/admin-auth" element={<AdminAuth />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/media-portal" element={<MediaPortal />} />
            <Route path="/adkop" element={<AdkopWizard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
