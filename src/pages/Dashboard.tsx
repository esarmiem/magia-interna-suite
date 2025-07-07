
import { 
  DollarSign, 
  Package, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle 
} from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function Dashboard() {
  // Mock data - será reemplazado por datos reales
  const stats = [
    {
      title: 'Ventas del Día',
      value: '$1,234,567',
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: DollarSign
    },
    {
      title: 'Productos en Stock',
      value: '1,234',
      change: '-5 hoy',
      changeType: 'neutral' as const,
      icon: Package
    },
    {
      title: 'Clientes Activos',
      value: '856',
      change: '+23 nuevo',
      changeType: 'positive' as const,
      icon: Users
    },
    {
      title: 'Pedidos Pendientes',
      value: '42',
      change: '+8 hoy',
      changeType: 'neutral' as const,
      icon: ShoppingCart
    }
  ];

  const topProducts = [
    { name: 'Blusa Elegante', sales: 45, stock: 12 },
    { name: 'Vestido Casual', sales: 38, stock: 8 },
    { name: 'Pantalón Formal', sales: 32, stock: 15 },
    { name: 'Falda Midi', sales: 29, stock: 3 },
    { name: 'Camisa Básica', sales: 25, stock: 20 }
  ];

  const alerts = [
    { product: 'Vestido Rojo Talla M', stock: 2, type: 'critical' },
    { product: 'Blusa Blanca Talla S', stock: 4, type: 'warning' },
    { product: 'Pantalón Negro Talla L', stock: 3, type: 'critical' }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen ejecutivo de Magia Interna
        </p>
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
              <span>Productos Más Vendidos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{product.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {product.sales} vendidos
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress 
                      value={(product.sales / 50) * 100} 
                      className="flex-1 h-2" 
                    />
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      product.stock < 5 
                        ? 'text-red-500 bg-red-500/10' 
                        : 'text-magia-success bg-magia-success/10'
                    }`}>
                      Stock: {product.stock}
                    </span>
                  </div>
                </div>
              </div>
            ))}
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
            {alerts.map((alert, index) => (
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
            ))}
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
              { name: 'Nueva Venta', href: '/ventas/nueva', color: 'bg-magia-success' },
              { name: 'Agregar Producto', href: '/productos/nuevo', color: 'bg-primary' },
              { name: 'Registrar Cliente', href: '/clientes/nuevo', color: 'bg-magia-purple' },
              { name: 'Ver Reportes', href: '/analytics', color: 'bg-magia-gold' }
            ].map((action) => (
              <button
                key={action.name}
                className={`${action.color} text-white p-4 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity`}
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
