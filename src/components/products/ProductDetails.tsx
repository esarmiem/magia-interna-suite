import { X } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatColombianPeso } from '@/lib/currency';
import type { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;

interface ProductDetailsProps {
  product: Product;
  onClose: () => void;
}

export function ProductDetails({ product, onClose }: ProductDetailsProps) {
  const getStockStatus = () => {
    if (product.stock_quantity === 0) return { status: 'Agotado', variant: 'destructive' as const };
    if (product.stock_quantity <= product.min_stock) return { status: 'Stock Bajo', variant: 'secondary' as const };
    return { status: 'Disponible', variant: 'default' as const };
  };

  const stockStatus = getStockStatus();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Detalles del Producto</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Imagen del Producto */}
          {product.image_url && (
            <div className="flex justify-center">
              <div className="w-48 h-48 rounded-lg overflow-hidden border">
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Información Básica */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-blue-600">Información Básica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-gray-700">Nombre:</span>
                  <p className="text-gray-900 font-semibold">{product.name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">SKU:</span>
                  <p className="text-gray-900 font-mono">{product.sku}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Categoría:</span>
                  <p className="text-gray-900">{product.category}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Estado:</span>
                  <div className="mt-1">
                    <Badge variant={product.is_active ? 'default' : 'destructive'}>
                      {product.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-gray-700">Talla:</span>
                  <p className="text-gray-900">{product.size || 'No especificada'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Color:</span>
                  <p className="text-gray-900">{product.color || 'No especificado'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Stock Actual:</span>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-900 font-semibold">{product.stock_quantity}</p>
                    <Badge variant={stockStatus.variant}>
                      {stockStatus.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Stock Mínimo:</span>
                  <p className="text-gray-900">{product.min_stock}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Información de Precios */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-green-600">Información de Precios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-700">Precio de Venta:</span>
                <p className="text-gray-900 font-semibold text-lg">
                  {formatColombianPeso(product.price)}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Costo:</span>
                <p className="text-gray-900 font-semibold text-lg">
                  {formatColombianPeso(product.cost)}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Margen de Ganancia:</span>
                <p className="font-semibold text-lg text-green-600">
                  {formatColombianPeso(product.price - product.cost)}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Porcentaje de Ganancia:</span>
                <p className="font-semibold text-lg text-green-600">
                  {((product.price - product.cost) / product.cost * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Descripción */}
          {product.description && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-purple-600">Descripción</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-900">{product.description}</p>
              </div>
            </div>
          )}

          {/* Información del Sistema */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-600">Información del Sistema</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-700">Fecha de Creación:</span>
                <p className="text-gray-900">
                  {format(new Date(product.created_at), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Última Actualización:</span>
                <p className="text-gray-900">
                  {format(new Date(product.updated_at), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={onClose}>Cerrar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 