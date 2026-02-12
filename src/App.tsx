import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./contexts/WalletContext";
import { ChainProvider } from "./contexts/ChainContext";
import ScrollToTop from "./components/ScrollToTop";
import ActivityTracker from "./components/ActivityTracker";
import Index from "./pages/Index";
import Pools from "./pages/Pools";
import Positions from "./pages/Positions";
import Docs from "./pages/Docs";
import Api from "./pages/Api";
import Changelog from "./pages/Changelog";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import NotFound from "./pages/NotFound";

// Initialize AppKit
import './config/appkit';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ChainProvider>
      <WalletProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <ActivityTracker />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/pools" element={<Pools />} />
              <Route path="/positions" element={<Positions />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="/api" element={<Api />} />
              <Route path="/changelog" element={<Changelog />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<Admin />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </WalletProvider>
    </ChainProvider>
  </QueryClientProvider>
);

export default App;

