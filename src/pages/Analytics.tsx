
import { useQuery } from '@tanstack/react-query';
import { Calendar, TrendingUp, Users, Package, DollarSign, ShoppingCart, TrendingDown, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, ComposedChart, Area } from 'recharts';
import { formatColombianPeso } from '@/lib/currency';
import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function Analytics() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (type: 'pdf' | 'png') => {
    if (!contentRef.current) return;
    setDownloading(true);
    try {
      // Oculta los botones antes de capturar
      const buttons = contentRef.current.querySelectorAll('.no-export');
      buttons.forEach(btn => (btn as HTMLElement).style.display = 'none');
      const canvas = await html2canvas(contentRef.current, { scale: 2 });
      buttons.forEach(btn => (btn as HTMLElement).style.display = '');
      if (type === 'png') {
        const link = document.createElement('a');
        link.download = `ganancias-mensuales-${selectedYear}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`ganancias-mensuales-${selectedYear}.pdf`);
      }
    } finally {
      setDownloading(false);
    }
  };

  const { data: stats, isLoading } = useQuery({
    queryKey: ['analytics-stats', selectedYear],
    queryFn: async () => {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
      const currentMonthStart = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
      const currentMonthEnd = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0]; // Last day of current month

      // Obtener ventas con items y productos para calcular ganancias reales
      const [salesResult, productsResult, customersResult, expensesResult, currentMonthSalesResult, currentMonthExpensesResult] = await Promise.all([
        supabase
          .from('sales')
          .select(`
            total_amount, 
            sale_date, 
            discount_amount, 
            tax_amount,
            delivery_fee,
            sale_items (
              quantity,
              unit_price,
              total_price,
              products (
                cost
              )
            )
          `)
          .gte('sale_date', `${selectedYear}-01-01`)
          .lte('sale_date', `${selectedYear}-12-31`),
        supabase.from('products').select('stock_quantity, category, price, cost'),
        supabase.from('customers').select('customer_type, total_purchases'),
        supabase.from('expenses').select('amount, category, expense_date')
          .gte('expense_date', `${selectedYear}-01-01`)
          .lte('expense_date', `${selectedYear}-12-31`),
        // Current month sales
        supabase
          .from('sales')
          .select(`
            total_amount, 
            sale_date, 
            discount_amount, 
            tax_amount,
            delivery_fee,
            sale_items (
              quantity,
              unit_price,
              total_price,
              products (
                cost
              )
            )
          `)
          .gte('sale_date', currentMonthStart)
          .lte('sale_date', currentMonthEnd),
        // Current month expenses
        supabase.from('expenses').select('amount, category, expense_date')
          .gte('expense_date', currentMonthStart)
          .lte('expense_date', currentMonthEnd)
      ]);

      const sales = salesResult.data || [];
      const products = productsResult.data || [];
      const customers = customersResult.data || [];
      const expenses = expensesResult.data || [];
      const currentMonthSales = currentMonthSalesResult.data || [];
      const currentMonthExpenses = currentMonthExpensesResult.data || [];

      // Calcular ganancias reales por venta (función helper)
      const calculateSaleProfit = (sale: {
        total_amount: number;
        sale_date: string;
        discount_amount?: number;
        tax_amount?: number;
        delivery_fee?: number;
        sale_items?: Array<{
          quantity: number;
          products?: { cost?: number };
        }>;
      }) => {
        const totalCost = sale.sale_items?.reduce((sum: number, item) => {
          const itemCost = item.products?.cost || 0;
          return sum + (itemCost * item.quantity);
        }, 0) || 0;
        
        const totalRevenue = sale.total_amount;
        const discount = sale.discount_amount || 0;
        const tax = sale.tax_amount || 0;
        const deliveryFee = sale.delivery_fee || 0;
        const profit = totalRevenue - totalCost - discount - tax - deliveryFee;
        
        return {
          ...sale,
          totalCost,
          totalRevenue,
          discount,
          tax,
          deliveryFee,
          profit
        };
      };

      // Calcular ganancias reales por venta
      const salesWithProfits = sales.map(calculateSaleProfit);
      const currentMonthSalesWithProfits = currentMonthSales.map(calculateSaleProfit);

      // Estadísticas del mes actual
      const currentMonthTotalSales = currentMonthSalesWithProfits.reduce((sum, sale) => sum + sale.totalRevenue, 0);
      const currentMonthTotalCosts = currentMonthSalesWithProfits.reduce((sum, sale) => sum + sale.totalCost, 0);
      const currentMonthTotalProfit = currentMonthSalesWithProfits.reduce((sum, sale) => sum + sale.profit, 0);
      const currentMonthTotalExpenses = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const currentMonthNetProfit = currentMonthTotalProfit - currentMonthTotalExpenses;
      const currentMonthSalesCount = currentMonthSales.length;

      // Calcular estadísticas generales
      const totalSales = salesWithProfits.reduce((sum, sale) => sum + sale.totalRevenue, 0);
      const totalCosts = salesWithProfits.reduce((sum, sale) => sum + sale.totalCost, 0);
      const totalDiscounts = salesWithProfits.reduce((sum, sale) => sum + sale.discount, 0);
      const totalTaxes = salesWithProfits.reduce((sum, sale) => sum + sale.tax, 0);
      const totalDeliveryFees = salesWithProfits.reduce((sum, sale) => sum + sale.deliveryFee, 0);
      const totalProfit = salesWithProfits.reduce((sum, sale) => sum + sale.profit, 0);
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalProducts = products.length;
      const totalCustomers = customers.length;
      const lowStockProducts = products.filter(p => p.stock_quantity <= 5).length;

      // Ganancia por mes para el año seleccionado
      const months = [
        'ene', 'feb', 'mar', 'abr', 'may', 'jun',
        'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
      ];

      const profitByMonth = salesWithProfits.reduce((acc: Record<string, { revenue: number; cost: number; profit: number }>, sale) => {
        const month = new Date(sale.sale_date).toLocaleDateString('es-ES', { month: 'short' });
        if (!acc[month]) {
          acc[month] = { revenue: 0, cost: 0, profit: 0 };
        }
        acc[month].revenue += sale.totalRevenue;
        acc[month].cost += sale.totalCost;
        acc[month].profit += sale.profit;
        return acc;
      }, {});

      // Crear datos mensuales completos para el año seleccionado
      const monthlyData = months.map(month => {
        const monthData = profitByMonth[month] || { revenue: 0, cost: 0, profit: 0 };
        return {
          month: month.charAt(0).toUpperCase() + month.slice(1), // Capitalizar primera letra
          ingresos: monthData.revenue,
          costos: monthData.cost,
          ganancia: monthData.profit
        };
      });

      // Ganancia por semana
      const profitByWeek = salesWithProfits.reduce((acc: Record<string, { revenue: number; cost: number; profit: number }>, sale) => {
        const date = new Date(sale.sale_date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!acc[weekKey]) {
          acc[weekKey] = { revenue: 0, cost: 0, profit: 0 };
        }
        acc[weekKey].revenue += sale.totalRevenue;
        acc[weekKey].cost += sale.totalCost;
        acc[weekKey].profit += sale.profit;
        return acc;
      }, {});

      const weeklyData = Object.entries(profitByWeek)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-8) // Últimas 8 semanas
        .map(([week, data]: [string, { revenue: number; cost: number; profit: number }]) => ({
          semana: `Sem ${new Date(week).getDate()}/${new Date(week).getMonth() + 1}`,
          ingresos: data.revenue,
          costos: data.cost,
          ganancia: data.profit
        }));

      // Ganancia por día
      const profitByDay = salesWithProfits.reduce((acc: Record<string, { revenue: number; cost: number; profit: number }>, sale) => {
        const dayKey = sale.sale_date.split('T')[0];
        
        if (!acc[dayKey]) {
          acc[dayKey] = { revenue: 0, cost: 0, profit: 0 };
        }
        acc[dayKey].revenue += sale.totalRevenue;
        acc[dayKey].cost += sale.totalCost;
        acc[dayKey].profit += sale.profit;
        return acc;
      }, {});

      const dailyData = Object.entries(profitByDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-14) // Últimos 14 días
        .map(([day, data]: [string, { revenue: number; cost: number; profit: number }]) => ({
          dia: new Date(day).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
          ingresos: data.revenue,
          costos: data.cost,
          ganancia: data.profit
        }));

      // Productos por categoría
      const productsByCategory = products.reduce((acc: Record<string, number>, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      }, {});

      const categoryData = Object.entries(productsByCategory).map(([category, count]) => ({
        name: category,
        value: count
      }));

      // Gastos por categoría
      const expensesByCategory = expenses.reduce((acc: Record<string, number>, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      }, {});

      const expenseCategoryData = Object.entries(expensesByCategory).map(([category, amount]) => ({
        category,
        amount
      }));

      // Tipos de clientes
      const customerTypes = customers.reduce((acc: Record<string, number>, customer) => {
        acc[customer.customer_type || 'regular'] = (acc[customer.customer_type || 'regular'] || 0) + 1;
        return acc;
      }, {});

      const customerTypeData = Object.entries(customerTypes).map(([type, count]) => ({
        name: type,
        value: count
      }));

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
        weeklyData,
        dailyData,
        categoryData,
        expenseCategoryData,
        customerTypeData,
        netProfit: totalProfit - totalExpenses,
        // Current month stats
        currentMonth: {
          totalSales: currentMonthTotalSales,
          totalCosts: currentMonthTotalCosts,
          totalProfit: currentMonthTotalProfit,
          totalExpenses: currentMonthTotalExpenses,
          netProfit: currentMonthNetProfit,
          salesCount: currentMonthSalesCount,
          monthName: currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
        }
      };
    },
  });

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Cargando analytics...</div>;
  }

  if (!stats) {
    return <div className="flex justify-center items-center h-64">Error al cargar los datos</div>;
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

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatColombianPeso(stats.totalSales)}</div>
            <p className="text-xs text-muted-foreground">
              Ganancia neta: {formatColombianPeso(stats.netProfit)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Costos Totales</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatColombianPeso(stats.totalCosts)}</div>
            <p className="text-xs text-muted-foreground">
              Descuentos: {formatColombianPeso(stats.totalDiscounts)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganancia Bruta</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatColombianPeso(stats.totalProfit)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalProducts} productos en inventario
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos Operativos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatColombianPeso(stats.totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCustomers} clientes registrados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* KPIs del Mes Actual */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">KPIs del Mes Actual - {stats.currentMonth.monthName}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatColombianPeso(stats.currentMonth.totalSales)}</div>
              <p className="text-xs text-muted-foreground">
                {stats.currentMonth.salesCount} ventas realizadas
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Costos del Mes</CardTitle>
              <Package className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatColombianPeso(stats.currentMonth.totalCosts)}</div>
              <p className="text-xs text-muted-foreground">
                Margen: {stats.currentMonth.totalSales > 0 ? 
                  Math.round(((stats.currentMonth.totalSales - stats.currentMonth.totalCosts) / stats.currentMonth.totalSales) * 100) : 0}%
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ganancia del Mes</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatColombianPeso(stats.currentMonth.totalProfit)}</div>
              <p className="text-xs text-muted-foreground">
                Gastos: {formatColombianPeso(stats.currentMonth.totalExpenses)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ganancia Neta Mensual</CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.currentMonth.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatColombianPeso(stats.currentMonth.netProfit)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.currentMonth.netProfit >= 0 ? 'Rentable' : 'En pérdida'} este mes
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
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800">Ganancias</CardTitle>
              <div className="flex items-center space-x-2 mt-2">
                <label className="text-sm font-medium">Año</label>
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger className="w-24 sm:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 6 }, (_, i) => 2025 - i).map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleDownload('png')}
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
                onClick={() => handleDownload('pdf')}
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
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Ganancias Mensuales</h3>
              <div className="text-3xl font-bold text-gray-800 mb-1">
                {formatColombianPeso(stats?.monthlyData.reduce((sum, month) => sum + month.ganancia, 0) || 0)}
              </div>
              <p className="text-sm text-blue-600">
                Este Año +{Math.round(((stats?.monthlyData.reduce((sum, month) => sum + month.ganancia, 0) || 0) / 
                  (stats?.monthlyData.reduce((sum, month) => sum + month.ingresos, 0) || 1)) * 100)}%
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
                    name === 'ingresos' ? 'Ingresos' : 
                    name === 'costos' ? 'Costos' : 'Ganancia'
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
        <Card>
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
        </Card>

        <Card>
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
        </Card>

        <Card>
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
        </Card>

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
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
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
        </Card>

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
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#ffc658"
                  dataKey="value"
                >
                  {stats.customerTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
