
import { useQuery } from '@tanstack/react-query';
import { Calendar, TrendingUp, Users, Package, DollarSign, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export function Analytics() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['analytics-stats'],
    queryFn: async () => {
      const [salesResult, productsResult, customersResult, expensesResult] = await Promise.all([
        supabase.from('sales').select('total_amount, sale_date'),
        supabase.from('products').select('stock_quantity, category, price, cost'),
        supabase.from('customers').select('customer_type, total_purchases'),
        supabase.from('expenses').select('amount, category, expense_date')
      ]);

      const sales = salesResult.data || [];
      const products = productsResult.data || [];
      const customers = customersResult.data || [];
      const expenses = expensesResult.data || [];

      // Calcular estadísticas
      const totalSales = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalProducts = products.length;
      const totalCustomers = customers.length;
      const lowStockProducts = products.filter(p => p.stock_quantity <= 5).length;

      // Ventas por mes
      const salesByMonth = sales.reduce((acc: Record<string, number>, sale) => {
        const month = new Date(sale.sale_date).toLocaleDateString('es-ES', { month: 'short' });
        acc[month] = (acc[month] || 0) + sale.total_amount;
        return acc;
      }, {});

      const monthlyData = Object.entries(salesByMonth).map(([month, amount]) => ({
        month,
        ventas: amount
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
        totalExpenses,
        totalProducts,
        totalCustomers,
        lowStockProducts,
        monthlyData,
        categoryData,
        expenseCategoryData,
        customerTypeData,
        profit: totalSales - totalExpenses
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
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.totalSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Beneficio: €{stats.profit.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.totalExpenses.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.lowStockProducts} con stock bajo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ventas por Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`€${Number(value).toFixed(2)}`, 'Ventas']} />
                <Line type="monotone" dataKey="ventas" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
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
                <Tooltip formatter={(value) => [`€${Number(value).toFixed(2)}`, 'Gastos']} />
                <Bar dataKey="amount" fill="#82ca9d" />
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
