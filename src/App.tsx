import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./contexts/WalletContext";
import { ChainProvider } from "./contexts/ChainContext";
import ScrollToTop from "./components/ScrollToTop";
import Index from "./pages/Index";
import Pools from "./pages/Pools";
import Positions from "./pages/Positions";
import Docs from "./pages/Docs";
import Api from "./pages/Api";
import Changelog from "./pages/Changelog";
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
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/pools" element={<Pools />} />
              <Route path="/positions" element={<Positions />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="/api" element={<Api />} />
              <Route path="/changelog" element={<Changelog />} />
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

