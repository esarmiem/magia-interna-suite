
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { ChristmasProvider } from "./contexts/ChristmasContext";
import { SnowfallEffect } from "./components/SnowfallEffect";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedLayout } from "./components/ProtectedLayout";
import { Dashboard } from "./pages/Dashboard";
import { Products } from "./pages/Products";
import { Customers } from "./pages/Customers";
import { Sales } from "./pages/Sales";
import { Expenses } from "./pages/Expenses";
import { Analytics } from "./pages/Analytics";
import { Promotions } from "./pages/Promotions";
import { Birthdays } from "./pages/Birthdays";
import { Settings } from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider defaultTheme="light">
        <ChristmasProvider>
          <AuthProvider>
            <SnowfallEffect />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ProtectedLayout>
                <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/productos" element={<Products />} />
                <Route path="/clientes" element={<Customers />} />
                <Route path="/ventas" element={<Sales />} />
                <Route path="/gastos" element={<Expenses />} />
                <Route path="/promociones" element={<Promotions />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/cumpleanos" element={<Birthdays />} />
                <Route path="/configuracion" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ProtectedLayout>
          </BrowserRouter>
        </AuthProvider>
      </ChristmasProvider>
    </ThemeProvider>
  </TooltipProvider>
  </QueryClientProvider>
);

export default App;
