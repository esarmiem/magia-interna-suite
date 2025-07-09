import { 
  DollarSign, 
  Package, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle 
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { formatColombianPeso, getCurrentDateString } from '@/lib/currency';

export function Dashboard() {
  const navigate = useNavigate();

  // Fetch dashboard data
  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const [
        { data: products },
        { data: customers },
        { data: sales },
        { data: expenses }
      ] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('customers').select('*'),
        supabase.from('sales').select('*, sale_items(*)').gte('sale_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('expenses').select('*').eq('expense_date', getCurrentDateString())
      ]);

      return { products, customers, sales, expenses };
    },
  });

  const stats = [
    {
      title: 'Ventas del Día',
      value: dashboardData?.sales ? 
        formatColombianPeso(dashboardData.sales.reduce((sum, sale) => sum + sale.total_amount, 0)) : 
        formatColombianPeso(0),
      change: dashboardData?.sales?.length ? `+${dashboardData.sales.length} ventas` : 'Sin ventas',
      changeType: 'positive' as const,
      icon: DollarSign
    },
    {
      title: 'Productos en Stock',
      value: dashboardData?.products?.reduce((sum, p) => sum + p.stock_quantity, 0) || 0,
      change: dashboardData?.products?.filter(p => p.stock_quantity <= p.min_stock).length ? 
        `-${dashboardData.products.filter(p => p.stock_quantity <= p.min_stock).length} bajo stock` : 
        'Stock normal',
      changeType: 'neutral' as const,
      icon: Package
    },
    {
      title: 'Clientes Activos',
      value: dashboardData?.customers?.filter(c => c.is_active).length || 0,
      change: `${dashboardData?.customers?.length || 0} total`,
      changeType: 'positive' as const,
      icon: Users
    },
    {
      title: 'Gastos del Día',
      value: dashboardData?.expenses ? 
        formatColombianPeso(dashboardData.expenses.reduce((sum, expense) => sum + expense.amount, 0)) : 
        formatColombianPeso(0),
      change: dashboardData?.expenses?.length ? `${dashboardData.expenses.length} gastos` : 'Sin gastos',
      changeType: 'neutral' as const,
      icon: ShoppingCart
    }
  ];

  const topProducts = dashboardData?.products
    ?.sort((a, b) => b.stock_quantity - a.stock_quantity)
    ?.slice(0, 5)
    ?.map(product => ({
      name: product.name,
      sales: Math.floor(Math.random() * 50), // Mock sales data
      stock: product.stock_quantity
    })) || [];

  const alerts = dashboardData?.products
    ?.filter(product => product.stock_quantity <= product.min_stock)
    ?.slice(0, 5)
    ?.map(product => ({
      product: `${product.name} ${product.size ? `Talla ${product.size}` : ''}`,
      stock: product.stock_quantity,
      type: product.stock_quantity <= 2 ? 'critical' : 'warning'
    })) || [];

  const handleQuickAction = (actionType: string) => {
    switch (actionType) {
      case 'nueva-venta':
        navigate('/ventas');
        break;
      case 'agregar-producto':
        navigate('/productos');
        break;
      case 'registrar-cliente':
        navigate('/clientes');
        break;
      case 'ver-reportes':
        navigate('/analytics');
        break;
      default:
        console.log(`Acción no implementada: ${actionType}`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <img src="/spell-book.png" alt="Spell Book" className="w-12 h-12" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen ejecutivo de Magia Interna
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.title}
            {...stat}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          />
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span>Productos con Más Stock</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topProducts.length > 0 ? topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{product.name}</span>
                    <span className="text-sm text-muted-foreground">
                      Stock: {product.stock}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress 
                      value={Math.min((product.stock / 50) * 100, 100)} 
                      className="flex-1 h-2" 
                    />
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      product.stock < 5 
                        ? 'text-red-500 bg-red-500/10' 
                        : 'text-magia-success bg-magia-success/10'
                    }`}>
                      {product.stock < 5 ? 'Bajo' : 'Normal'}
                    </span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-4 text-muted-foreground">
                No hay productos disponibles
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-magia-warning" />
              <span>Alertas de Stock</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.length > 0 ? alerts.map((alert, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg border-l-4 ${
                  alert.type === 'critical' 
                    ? 'border-red-500 bg-red-50 dark:bg-red-950/20' 
                    : 'border-magia-warning bg-yellow-50 dark:bg-yellow-950/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{alert.product}</p>
                    <p className="text-xs text-muted-foreground">
                      Solo {alert.stock} unidades restantes
                    </p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    alert.type === 'critical' ? 'bg-red-500' : 'bg-magia-warning'
                  }`} />
                </div>
              </div>
            )) : (
              <div className="text-center py-4 text-muted-foreground">
                No hay alertas de stock
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Nueva Venta', action: 'nueva-venta', color: 'bg-magia-success' },
              { name: 'Agregar Producto', action: 'agregar-producto', color: 'bg-primary' },
              { name: 'Registrar Cliente', action: 'registrar-cliente', color: 'bg-magia-purple' },
              { name: 'Ver Reportes', action: 'ver-reportes', color: 'bg-magia-gold' }
            ].map((action) => (
              <button
                key={action.name}
                className={`${action.color} text-white p-4 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity`}
                onClick={() => handleQuickAction(action.action)}
              >
                {action.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
