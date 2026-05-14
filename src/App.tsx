
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { RouteScrollToTop, ScrollToTopButton } from "@/components/ScrollToTop";
import HolidayEffects from "@/components/HolidayEffects";
import { applyTheme, loadTheme, useAppliedTheme } from "@/hooks/useTheme";

// Применяем кэшированную тему мгновенно, до рендера
applyTheme(loadTheme());
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
import Shop from "./pages/Shop";
import ShopProduct from "./pages/ShopProduct";
import CustomPageView from "./pages/CustomPage";
import ManagerApp from "./pages/ManagerApp";
import Login from "./pages/Login";
import Privacy from "./pages/Privacy";
import Requisites from "./pages/Requisites";
import Invoice from "./pages/Invoice";
import Blog from "./pages/Blog";
import ApiDocs from "./pages/ApiDocs";

const queryClient = new QueryClient();

// Синхронизирует тему с сервером и между вкладками
function ThemeSync() {
  useAppliedTheme();
  return null;
}

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeSync />
      <Toaster />
      <Sonner />
      <HolidayEffects />
      <BrowserRouter>
        <RouteScrollToTop />
        <ScrollToTopButton />
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
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/:id" element={<ShopProduct />} />
          <Route path="/cabinet" element={<Cabinet />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/techportal" element={<TechPortal />} />
          <Route path="/p/:slug" element={<CustomPageView />} />
          <Route path="/manager" element={<ManagerApp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/requisites" element={<Requisites />} />
          <Route path="/invoice/:id" element={<Invoice />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<Blog />} />
          <Route path="/api" element={<ApiDocs />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;