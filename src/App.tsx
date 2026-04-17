import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Questionnaire from "./pages/Questionnaire";
import Results from "./pages/Results";
import NotFound from "./pages/NotFound";
import PlanCity from "./pages/PlanCity";

// Heavy pages split into their own chunks — recharts and leaflet stay out of the main bundle
const CityDetail = lazy(() => import("./pages/CityDetail"));
const Compare = lazy(() => import("./pages/Compare"));
const ItineraryBuilder = lazy(() => import("./pages/ItineraryBuilder"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/questionnaire" element={<Questionnaire />} />
            <Route path="/plan" element={<PlanCity />} />
            <Route path="/results" element={<Results />} />
            <Route path="/city/:cityName" element={<CityDetail />} />
            <Route path="/itinerary/:cityName" element={<ItineraryBuilder />} />
            <Route path="/compare" element={<Compare />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
