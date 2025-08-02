import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  FileText, 
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Productos', href: '/productos', icon: Package },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Ventas', href: '/ventas', icon: ShoppingCart },
  { name: 'Gastos', href: '/gastos', icon: FileText },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Cumpleaños', href: '/cumpleanos', icon: Calendar },
];

// Función para detectar si es mobile o tablet
const isMobileOrTablet = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 1024; // lg breakpoint de Tailwind
};

export function Sidebar() {
  // Estado inicial basado en el tamaño de pantalla
  const [collapsed, setCollapsed] = useState(() => isMobileOrTablet());
  const location = useLocation();

  // Efecto para manejar cambios de tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      const shouldCollapse = isMobileOrTablet();
      setCollapsed(shouldCollapse);
    };

    // Agregar listener para resize
    window.addEventListener('resize', handleResize);
    
    // Limpiar listener al desmontar
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={cn(
      "flex flex-col h-screen bg-card border-r border-border transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-magia-zinc to-magia-zinc-200 rounded-lg flex items-center justify-center">
              <img 
                src="/witch-hat.png" 
                alt="Magia Interna Logo" 
                className="w-6 h-6 object-contain rounded-sm"
              />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Magia Interna</h1>
              <p className="text-xs text-muted-foreground">Gestión Textil</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon size={18} className={cn(
                "flex-shrink-0",
                isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
              )} />
              {!collapsed && (
                <span className="truncate">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-center mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-magia-purple to-magia-gold rounded-lg flex items-center justify-center">
              <img 
                src="/magiainternalogo.webp" 
                alt="Magia Interna Logo" 
                className="w-12 h-12 object-contain rounded-xl p-1"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-magia-success rounded-full"></div>
            <span>Sistema activo</span>
          </div>
        </div>
      )}
    </div>
  );
}