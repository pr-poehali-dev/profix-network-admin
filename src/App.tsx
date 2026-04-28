
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import DataMobile from "./pages/DataMobile";
import POSCenter from "./pages/POSCenter";
import Atol from "./pages/Atol";
import Dreamkas from "./pages/Dreamkas";
import Sbis from "./pages/Sbis";
import OfdYandex from "./pages/OfdYandex";
import PlatformaOfd from "./pages/PlatformaOfd";
import OnecFranchise from "./pages/OnecFranchise";
import Cabinet from "./pages/Cabinet";
import Admin from "./pages/Admin";
import TechPortal from "./pages/TechPortal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/datamobile" element={<DataMobile />} />
          <Route path="/poscenter" element={<POSCenter />} />
          <Route path="/atol" element={<Atol />} />
          <Route path="/dreamkas" element={<Dreamkas />} />
          <Route path="/sbis" element={<Sbis />} />
          <Route path="/ofd-yandex" element={<OfdYandex />} />
          <Route path="/platforma-ofd" element={<PlatformaOfd />} />
          <Route path="/1c" element={<OnecFranchise />} />
          <Route path="/cabinet" element={<Cabinet />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/techportal" element={<TechPortal />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;