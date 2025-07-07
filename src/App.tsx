
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider defaultTheme="light">
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/productos" element={<div className="text-center p-8 text-muted-foreground">Módulo de Productos - En desarrollo</div>} />
              <Route path="/clientes" element={<div className="text-center p-8 text-muted-foreground">Módulo de Clientes - En desarrollo</div>} />
              <Route path="/ventas" element={<div className="text-center p-8 text-muted-foreground">Módulo de Ventas - En desarrollo</div>} />
              <Route path="/gastos" element={<div className="text-center p-8 text-muted-foreground">Módulo de Gastos - En desarrollo</div>} />
              <Route path="/analytics" element={<div className="text-center p-8 text-muted-foreground">Módulo de Analytics - En desarrollo</div>} />
              <Route path="/configuracion" element={<div className="text-center p-8 text-muted-foreground">Configuración - En desarrollo</div>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
