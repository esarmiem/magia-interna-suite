import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  ShoppingCart,
  TrendingDown,
  Download,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Area,
} from "recharts";
import { formatColombianPeso } from "@/lib/currency";
import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { payload: { total: number; categories: Record<string, number> } }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 border border-gray-200 rounded shadow-md z-50">
        <p className="font-bold mb-2 text-gray-800">{label}</p>
        <p className="text-sm mb-2 font-semibold text-blue-600">
          Total: {data.total} prendas
        </p>
        <div className="text-xs space-y-1">
          {Object.entries(data.categories).map(
            ([cat, count]) => (
              <div key={cat} className="flex justify-between gap-4">
                <span className="capitalize text-gray-600">{cat}:</span>
                <span className="font-medium">{count}</span>
              </div>
            )
          )}
        </div>
      </div>
    );
  }
  return null;
};

export function Analytics() {
  const contentRef = useRef<HTMLDivElement>(null);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (type: "pdf" | "png") => {
    if (!contentRef.current) return;
    setDownloading(true);
    try {
      // Oculta los botones antes de capturar
      const buttons = contentRef.current.querySelectorAll(".no-export");
      buttons.forEach((btn) => ((btn as HTMLElement).style.display = "none"));
      const canvas = await html2canvas(contentRef.current, { scale: 2 });
      buttons.forEach((btn) => ((btn as HTMLElement).style.display = ""));
      if (type === "png") {
        const link = document.createElement("a");
        link.download = `ganancias-mensuales-${selectedYear}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } else {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "px",
          format: [canvas.width, canvas.height],
        });
        pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
        pdf.save(`ganancias-mensuales-${selectedYear}.pdf`);
      }
    } finally {
      setDownloading(false);
    }
  };

  const {
    data: stats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["analytics-stats", selectedYear],
    queryFn: async () => {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
      const currentMonthStart = `${currentYear}-${currentMonth
        .toString()
        .padStart(2, "0")}-01`;
      const currentMonthEnd = new Date(currentYear, currentMonth, 0)
        .toISOString()
        .split("T")[0]; // Last day of current month

      // Obtener ventas con items y productos para calcular ganancias reales
      const [
        salesResult,
        productsResult,
        customersResult,
        expensesResult,
        currentMonthSalesResult,
        currentMonthExpensesResult,
      ] = await Promise.all([
        supabase
          .from("sales")
          .select(
            `
            id,
            total_amount,
            sale_date,
            discount_amount,
            tax_amount,
            delivery_fee,
            payment_method,
            sale_items (
              quantity,
              unit_price,
              unit_cost,
              total_price,
              products (
                cost,
                category
              )
            )
          `
          )
          .gte("sale_date", `${selectedYear}-01-01`)
          .lte("sale_date", `${selectedYear}-12-31`),
        supabase
          .from("products")
          .select("stock_quantity, category, price, cost"),
        supabase.from("customers").select("customer_type, total_purchases"),
        supabase
          .from("expenses")
          .select("amount, category, expense_date")
          .gte("expense_date", `${selectedYear}-01-01`)
          .lte("expense_date", `${selectedYear}-12-31`),
        // Current month sales
        supabase
          .from("sales")
          .select(
            `
            id,
            total_amount,
            sale_date,
            discount_amount,
            tax_amount,
            delivery_fee,
            payment_method,
            sale_items (
              quantity,
              unit_price,
              unit_cost,
              total_price,
              products (
                cost,
                category
              )
            )
          `
          )
          .gte("sale_date", currentMonthStart)
          .lte("sale_date", currentMonthEnd),
        // Current month expenses
        supabase
          .from("expenses")
          .select("amount, category, expense_date")
          .gte("expense_date", currentMonthStart)
          .lte("expense_date", currentMonthEnd),
      ]);

      const sales = salesResult.data || [];
      const products = productsResult.data || [];
      const customers = customersResult.data || [];
      const expenses = expensesResult.data || [];
      const currentMonthSales = currentMonthSalesResult.data || [];
      const currentMonthExpenses = currentMonthExpensesResult.data || [];

      // Calcular ganancias reales por venta (función helper)
      const calculateSaleProfit = (sale: {
        id: string;
        total_amount: number;
        sale_date: string;
        discount_amount?: number;
        tax_amount?: number;
        delivery_fee?: number;
        payment_method: string;
        sale_items?: Array<{
          quantity: number;
          unit_cost?: number;
          products?: { cost?: number };
        }>;
      }) => {
        const totalCost =
          sale.sale_items?.reduce((sum: number, item) => {
            const itemCost = item.unit_cost ?? item.products?.cost ?? 0;
            return sum + itemCost * item.quantity;
          }, 0) || 0;

        const totalRevenue = sale.total_amount;
        const discount = sale.discount_amount || 0;
        const tax = sale.tax_amount || 0;
        const deliveryFee = sale.delivery_fee || 0;

        // Calcular ingresos netos (excluyendo delivery_fee como indica el comentario)
        const netRevenue = totalRevenue - deliveryFee;
        const profit = netRevenue - totalCost - discount - tax;

        return {
          ...sale,
          totalCost,
          totalRevenue,
          netRevenue,
          discount,
          tax,
          deliveryFee,
          profit,
        };
      };

      // Calcular ganancias reales por venta
      const salesWithProfits = sales.map(calculateSaleProfit);
      const currentMonthSalesWithProfits =
        currentMonthSales.map(calculateSaleProfit);

      // Estadísticas del mes actual
      // Usamos netRevenue (ingresos excluyendo delivery_fee) para mantener consistencia
      const currentMonthTotalSales = currentMonthSalesWithProfits.reduce(
        (sum, sale) => sum + sale.netRevenue,
        0
      );
      const currentMonthTotalCosts = currentMonthSalesWithProfits.reduce(
        (sum, sale) => sum + sale.totalCost,
        0
      );
      const currentMonthTotalProfit = currentMonthSalesWithProfits.reduce(
        (sum, sale) => sum + sale.profit,
        0
      );
      const currentMonthTotalExpenses = currentMonthExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );
      const currentMonthNetProfit =
        currentMonthTotalProfit - currentMonthTotalExpenses;
      const currentMonthSalesCount = currentMonthSales.length;

      // Calcular estadísticas generales
      // Usamos netRevenue para mantener consistencia con el cálculo de ganancias
      const totalSales = salesWithProfits.reduce(
        (sum, sale) => sum + sale.netRevenue,
        0
      );
      const totalCosts = salesWithProfits.reduce(
        (sum, sale) => sum + sale.totalCost,
        0
      );
      const totalDiscounts = salesWithProfits.reduce(
        (sum, sale) => sum + sale.discount,
        0
      );
      const totalTaxes = salesWithProfits.reduce(
        (sum, sale) => sum + sale.tax,
        0
      );
      const totalDeliveryFees = salesWithProfits.reduce(
        (sum, sale) => sum + sale.deliveryFee,
        0
      );
      const totalProfit = salesWithProfits.reduce(
        (sum, sale) => sum + sale.profit,
        0
      );
      const totalExpenses = expenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );
      const totalProducts = products.length;
      const totalCustomers = customers.length;
      const lowStockProducts = products.filter(
        (p) => p.stock_quantity <= 5
      ).length;

      // Ganancia por mes para el año seleccionado
      const months = [
        "ene",
        "feb",
        "mar",
        "abr",
        "may",
        "jun",
        "jul",
        "ago",
        "sep",
        "oct",
        "nov",
        "dic",
      ];

      const profitByMonth = salesWithProfits.reduce(
        (
          acc: Record<
            string,
            { revenue: number; cost: number; profit: number }
          >,
          sale
        ) => {
          // Usar método más confiable para obtener el nombre del mes
          const monthNames = [
            "ene",
            "feb",
            "mar",
            "abr",
            "may",
            "jun",
            "jul",
            "ago",
            "sep",
            "oct",
            "nov",
            "dic",
          ];
          const date = new Date(sale.sale_date);
          const monthIndex = date.getMonth(); // getMonth() devuelve 0-11
          const month = monthNames[monthIndex];

          if (!acc[month]) {
            acc[month] = { revenue: 0, cost: 0, profit: 0 };
          }
          acc[month].revenue += sale.netRevenue;
          acc[month].cost += sale.totalCost;
          acc[month].profit += sale.profit;
          return acc;
        },
        {}
      );

      // Crear datos mensuales completos para el año seleccionado
      const monthlyData = months.map((month) => {
        const monthData = profitByMonth[month] || {
          revenue: 0,
          cost: 0,
          profit: 0,
        };
        return {
          month: month.charAt(0).toUpperCase() + month.slice(1), // Capitalizar primera letra
          ingresos: monthData.revenue,
          costos: monthData.cost,
          ganancia: monthData.profit,
        };
      });

      // Calcular prendas vendidas por mes y categoría
      const productSalesByMonth = sales.reduce(
        (
          acc: Record<
            string,
            { total: number; categories: Record<string, number> }
          >,
          sale
        ) => {
          const date = new Date(sale.sale_date);
          const monthIndex = date.getMonth();
          const monthNames = [
            "ene",
            "feb",
            "mar",
            "abr",
            "may",
            "jun",
            "jul",
            "ago",
            "sep",
            "oct",
            "nov",
            "dic",
          ];
          const month = monthNames[monthIndex];

          if (!acc[month]) {
            acc[month] = { total: 0, categories: {} };
          }

          sale.sale_items?.forEach(
            (item: { quantity: number; products: { category: string } }) => {
              const category = item.products?.category || "Sin categoría";
              const quantity = item.quantity || 0;

              acc[month].total += quantity;
              acc[month].categories[category] =
                (acc[month].categories[category] || 0) + quantity;
            }
          );

          return acc;
        },
        {}
      );

      const monthlyProductSalesData = months.map((month) => {
        const data = productSalesByMonth[month] || { total: 0, categories: {} };
        return {
          month: month.charAt(0).toUpperCase() + month.slice(1),
          total: data.total,
          categories: data.categories,
        };
      });

      // Ganancia por semana
      const profitByWeek = salesWithProfits.reduce(
        (
          acc: Record<
            string,
            { revenue: number; cost: number; profit: number }
          >,
          sale
        ) => {
          const date = new Date(sale.sale_date);
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          const weekKey = weekStart.toISOString().split("T")[0];

          if (!acc[weekKey]) {
            acc[weekKey] = { revenue: 0, cost: 0, profit: 0 };
          }
          acc[weekKey].revenue += sale.netRevenue;
          acc[weekKey].cost += sale.totalCost;
          acc[weekKey].profit += sale.profit;
          return acc;
        },
        {}
      );

      const weeklyData = Object.entries(profitByWeek)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-8) // Últimas 8 semanas
        .map(
          ([week, data]: [
            string,
            { revenue: number; cost: number; profit: number }
          ]) => ({
            semana: `Sem ${new Date(week).getDate()}/${
              new Date(week).getMonth() + 1
            }`,
            ingresos: data.revenue,
            costos: data.cost,
            ganancia: data.profit,
          })
        );

      // Ganancia por día
      const profitByDay = salesWithProfits.reduce(
        (
          acc: Record<
            string,
            { revenue: number; cost: number; profit: number }
          >,
          sale
        ) => {
          const dayKey = sale.sale_date.split("T")[0];

          if (!acc[dayKey]) {
            acc[dayKey] = { revenue: 0, cost: 0, profit: 0 };
          }
          acc[dayKey].revenue += sale.netRevenue;
          acc[dayKey].cost += sale.totalCost;
          acc[dayKey].profit += sale.profit;
          return acc;
        },
        {}
      );

      const dailyData = Object.entries(profitByDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-14) // Últimos 14 días
        .map(
          ([day, data]: [
            string,
            { revenue: number; cost: number; profit: number }
          ]) => ({
            dia: new Date(day).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "2-digit",
            }),
            ingresos: data.revenue,
            costos: data.cost,
            ganancia: data.profit,
          })
        );

      // Productos por categoría
      const productsByCategory = products.reduce(
        (acc: Record<string, number>, product) => {
          acc[product.category] = (acc[product.category] || 0) + 1;
          return acc;
        },
        {}
      );

      const categoryData = Object.entries(productsByCategory).map(
        ([category, count]) => ({
          name: category,
          value: count,
        })
      );

      // Gastos por categoría
      const expensesByCategory = expenses.reduce(
        (acc: Record<string, number>, expense) => {
          acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
          return acc;
        },
        {}
      );

      const expenseCategoryData = Object.entries(expensesByCategory).map(
        ([category, amount]) => ({
          category,
          amount,
        })
      );

      // Tipos de clientes
      const customerTypes = customers.reduce(
        (acc: Record<string, number>, customer) => {
          acc[customer.customer_type || "regular"] =
            (acc[customer.customer_type || "regular"] || 0) + 1;
          return acc;
        },
        {}
      );

      const customerTypeData = Object.entries(customerTypes).map(
        ([type, count]) => ({
          name: type,
          value: count,
        })
      );

      // Métodos de pago
      const paymentMethods = salesWithProfits.reduce(
        (acc: Record<string, number>, sale) => {
          acc[sale.payment_method] = (acc[sale.payment_method] || 0) + 1;
          return acc;
        },
        {}
      );

      const paymentMethodData = Object.entries(paymentMethods).map(
        ([method, count]) => ({
          metodo: method,
          cantidad: count,
          porcentaje:
            salesWithProfits.length > 0
              ? Math.round((count / salesWithProfits.length) * 100)
              : 0,
        })
      );

      return {
        totalSales,
        totalCosts,
        totalDiscounts,
        totalTaxes,
        totalDeliveryFees,
        totalProfit,
        totalExpenses,
        totalProducts,
        totalCustomers,
        lowStockProducts,
        monthlyData,
        monthlyProductSalesData,
        weeklyData,
        dailyData,
        categoryData,
        expenseCategoryData,
        customerTypeData,
        paymentMethodData,
        netProfit: totalProfit - totalExpenses,
        // Current month stats
        currentMonth: {
          totalSales: currentMonthTotalSales,
          totalCosts: currentMonthTotalCosts,
          totalProfit: currentMonthTotalProfit,
          totalExpenses: currentMonthTotalExpenses,
          netProfit: currentMonthNetProfit,
          salesCount: currentMonthSalesCount,
          monthName: currentDate.toLocaleDateString("es-ES", {
            month: "long",
            year: "numeric",
          }),
        },
      };
    },
  });

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088fe"];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        Cargando analytics...
      </div>
    );
  }

  if (error) {
    console.error("Error en Analytics:", error);
    return (
      <div className="flex justify-center items-center h-64">
        Error al cargar los datos: {error.message}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex justify-center items-center h-64">
        Error al cargar los datos
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <img src="/cauldron.png" alt="Cauldron" className="w-12 h-12" />
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
          </div>
        </div>
        <Calendar className="h-6 w-6 text-muted-foreground" />
      </div>

      <div className="flex items-center space-x-2">
        <Calendar className="h-5 w-5 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-800">
          KPIs Históricos - {currentYear}
        </h2>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos Totales
            </CardTitle>
            <DollarSign className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatColombianPeso(stats.totalSales)}
            </div>
            <p className="text-xs">
              Ganancia neta: {formatColombianPeso(stats.netProfit)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Costos Totales
            </CardTitle>
            <TrendingDown className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatColombianPeso(stats.totalCosts)}
            </div>
            <p className="text-xs">
              Descuentos: {formatColombianPeso(stats.totalDiscounts)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ganancia Bruta
            </CardTitle>
            <TrendingUp className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatColombianPeso(stats.totalProfit)}
            </div>
            <p className="text-xs">
              {stats.totalProducts} productos en inventario
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gastos Operativos
            </CardTitle>
            <ShoppingCart className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatColombianPeso(stats.totalExpenses)}
            </div>
            <p className="text-xs">
              {stats.totalCustomers} clientes registrados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* KPIs del Mes Actual */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">
            KPIs del Mes Actual - {stats.currentMonth.monthName}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ingresos del Mes
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatColombianPeso(stats.currentMonth.totalSales)}
              </div>
              <p className="text-xs">
                {stats.currentMonth.salesCount} ventas realizadas
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Costos del Mes
              </CardTitle>
              <Package className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatColombianPeso(stats.currentMonth.totalCosts)}
              </div>
              <p className="text-xs">
                Margen:{" "}
                {stats.currentMonth.totalSales > 0
                  ? Math.round(
                      ((stats.currentMonth.totalSales -
                        stats.currentMonth.totalCosts) /
                        stats.currentMonth.totalSales) *
                        100
                    )
                  : 0}
                %
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ganancia del Mes
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatColombianPeso(stats.currentMonth.totalProfit)}
              </div>
              <p className="text-xs">
                Gastos: {formatColombianPeso(stats.currentMonth.totalExpenses)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ganancia Neta Mensual
              </CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  stats.currentMonth.netProfit >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {formatColombianPeso(stats.currentMonth.netProfit)}
              </div>
              <p className="text-xs">
                {stats.currentMonth.netProfit >= 0 ? "Rentable" : "En pérdida"}{" "}
                este mes
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Análisis de Ganancias Mensuales */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800">
                Ganancias
              </CardTitle>
              <div className="flex items-center space-x-2 mt-2">
                <label className="text-sm font-medium">Año</label>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => setSelectedYear(parseInt(value))}
                >
                  <SelectTrigger className="w-24 sm:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 6 }, (_, i) => currentYear - i).map(
                      (year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload("png")}
                disabled={downloading}
                className="no-export text-xs sm:text-sm"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Exportar como PNG</span>
                <span className="sm:hidden">PNG</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload("pdf")}
                disabled={downloading}
                className="no-export text-xs sm:text-sm"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Exportar como PDF</span>
                <span className="sm:hidden">PDF</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={contentRef} className="p-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">
                Ganancias Mensuales
              </h3>
              <div className="text-3xl font-bold mb-1">
                {formatColombianPeso(
                  stats?.monthlyData.reduce(
                    (sum, month) => sum + month.ganancia,
                    0
                  ) || 0
                )}
              </div>
              <p className="text-sm">
                Margen:{" "}
                {stats?.monthlyData.reduce(
                  (sum, month) => sum + month.ingresos,
                  0
                ) > 0
                  ? Math.round(
                      ((stats?.monthlyData.reduce(
                        (sum, month) => sum + month.ganancia,
                        0
                      ) || 0) /
                        (stats?.monthlyData.reduce(
                          (sum, month) => sum + month.ingresos,
                          0
                        ) || 1)) *
                        100
                    )
                  : 0}
                %
              </p>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={stats?.monthlyData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    formatColombianPeso(Number(value)),
                    name === "ingresos"
                      ? "Ingresos"
                      : name === "costos"
                      ? "Costos"
                      : "Ganancia",
                  ]}
                />
                <Bar dataKey="ganancia" fill="#3b82f6" name="ganancia" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos de Ganancia */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* <Card>
          <CardHeader>
            <CardTitle>Ganancia por Mes</CardTitle>
            <p className="text-sm text-muted-foreground">Ingresos vs Costos vs Ganancia</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={stats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    formatColombianPeso(Number(value)), 
                    name === 'ingresos' ? 'Ingresos' : 
                    name === 'costos' ? 'Costos' : 'Ganancia'
                  ]} 
                />
                <Bar dataKey="costos" fill="#ef4444" name="costos" />
                <Bar dataKey="ingresos" fill="#22c55e" name="ingresos" />
                <Line type="monotone" dataKey="ganancia" stroke="#3b82f6" strokeWidth={3} name="ganancia" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card> */}

        {/* <Card>
          <CardHeader>
            <CardTitle>Ganancia por Semana</CardTitle>
            <p className="text-sm text-muted-foreground">Últimas 8 semanas</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={stats.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="semana" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    formatColombianPeso(Number(value)), 
                    name === 'ingresos' ? 'Ingresos' : 
                    name === 'costos' ? 'Costos' : 'Ganancia'
                  ]} 
                />
                <Bar dataKey="costos" fill="#ef4444" name="costos" />
                <Bar dataKey="ingresos" fill="#22c55e" name="ingresos" />
                <Line type="monotone" dataKey="ganancia" stroke="#3b82f6" strokeWidth={3} name="ganancia" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card> */}

        {/* <Card>
          <CardHeader>
            <CardTitle>Ganancia por Día</CardTitle>
            <p className="text-sm text-muted-foreground">Últimos 14 días</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={stats.dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    formatColombianPeso(Number(value)), 
                    name === 'ingresos' ? 'Ingresos' : 
                    name === 'costos' ? 'Costos' : 'Ganancia'
                  ]} 
                />
                <Bar dataKey="costos" fill="#ef4444" name="costos" />
                <Bar dataKey="ingresos" fill="#22c55e" name="ingresos" />
                <Line type="monotone" dataKey="ganancia" stroke="#3b82f6" strokeWidth={3} name="ganancia" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card> */}

        <Card>
          <CardHeader>
            <CardTitle>Productos por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader>
            <CardTitle>Gastos por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.expenseCategoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip formatter={(value) => [formatColombianPeso(Number(value)), 'Gastos']} />
                <Bar dataKey="amount" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card> */}

        <Card>
          <CardHeader>
            <CardTitle>Tipos de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.customerTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#ffc658"
                  dataKey="value"
                >
                  {stats.customerTypeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-row justify-between items-start">
              <div>
                <CardTitle>Ventas de Prendas por Mes</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Cantidad de prendas vendidas y sus categorías
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => setSelectedYear(parseInt(value))}
                >
                  <SelectTrigger className="w-24 sm:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 6 }, (_, i) => currentYear - i).map(
                      (year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.monthlyProductSalesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "transparent" }}
                />
                <Bar dataKey="total" fill="#8884d8" name="Prendas Vendidas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Métodos de Pago</CardTitle>
            <p className="text-sm">
              Distribución de métodos de pago utilizados
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.paymentMethodData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metodo" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    name === "cantidad" ? `${value} ventas` : `${value}%`,
                    name === "cantidad" ? "Cantidad" : "Porcentaje",
                  ]}
                />
                <Bar dataKey="cantidad" fill="#8884d8" name="cantidad" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {stats.paymentMethodData.map((item, index) => (
                <div
                  key={item.metodo}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="font-medium">{item.metodo}</span>
                  <div className="flex items-center space-x-2">
                    <span>{item.cantidad} ventas</span>
                    <span>({item.porcentaje}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
