
import { useQuery } from '@tanstack/react-query';
import { Calendar, TrendingUp, Users, Package, DollarSign, ShoppingCart, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, ComposedChart, Area } from 'recharts';
import { formatColombianPeso } from '@/lib/currency';

export function Analytics() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['analytics-stats'],
    queryFn: async () => {
      // Obtener ventas con items y productos para calcular ganancias reales
      const [salesResult, productsResult, customersResult, expensesResult] = await Promise.all([
        supabase
          .from('sales')
          .select(`
            total_amount, 
            sale_date, 
            discount_amount, 
            tax_amount,
            sale_items (
              quantity,
              unit_price,
              total_price,
              products (
                cost
              )
            )
          `),
        supabase.from('products').select('stock_quantity, category, price, cost'),
        supabase.from('customers').select('customer_type, total_purchases'),
        supabase.from('expenses').select('amount, category, expense_date')
      ]);

      const sales = salesResult.data || [];
      const products = productsResult.data || [];
      const customers = customersResult.data || [];
      const expenses = expensesResult.data || [];

      // Calcular ganancias reales por venta
      const salesWithProfits = sales.map(sale => {
        const totalCost = sale.sale_items?.reduce((sum, item) => {
          const itemCost = item.products?.cost || 0;
          return sum + (itemCost * item.quantity);
        }, 0) || 0;
        
        const totalRevenue = sale.total_amount;
        const discount = sale.discount_amount || 0;
        const tax = sale.tax_amount || 0;
        const profit = totalRevenue - totalCost - discount - tax;
        
        return {
          ...sale,
          totalCost,
          totalRevenue,
          discount,
          tax,
          profit
        };
      });

      // Calcular estadísticas generales
      const totalSales = salesWithProfits.reduce((sum, sale) => sum + sale.totalRevenue, 0);
      const totalCosts = salesWithProfits.reduce((sum, sale) => sum + sale.totalCost, 0);
      const totalDiscounts = salesWithProfits.reduce((sum, sale) => sum + sale.discount, 0);
      const totalTaxes = salesWithProfits.reduce((sum, sale) => sum + sale.tax, 0);
      const totalProfit = salesWithProfits.reduce((sum, sale) => sum + sale.profit, 0);
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalProducts = products.length;
      const totalCustomers = customers.length;
      const lowStockProducts = products.filter(p => p.stock_quantity <= 5).length;

      // Ganancia por mes
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

      const monthlyData = Object.entries(profitByMonth).map(([month, data]) => ({
        month,
        ingresos: data.revenue,
        costos: data.cost,
        ganancia: data.profit
      }));

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
        .map(([week, data]) => ({
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
        .map(([day, data]) => ({
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
        netProfit: totalProfit - totalExpenses
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
