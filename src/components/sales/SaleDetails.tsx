
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatColombianPeso } from '@/lib/currency';
import type { Tables } from '@/integrations/supabase/types';

type Sale = Tables<'sales'>;

interface SaleDetailsProps {
  sale: Sale;
  onClose: () => void;
}

export function SaleDetails({ sale, onClose }: SaleDetailsProps) {
  const { data: saleItems = [] } = useQuery({
    queryKey: ['sale-items', sale.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sale_items')
        .select(`
          *,
          products(name, sku)
        `)
        .eq('sale_id', sale.id);
      
      if (error) throw error;
      return data;
    },
  });

  const { data: customer } = useQuery({
    queryKey: ['customer', sale.customer_id],
    queryFn: async () => {
      if (!sale.customer_id) return null;
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', sale.customer_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!sale.customer_id,
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Detalles de la Venta</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Información de la Venta</h3>
              <div className="space-y-2">
                <p><strong>Fecha:</strong> {format(new Date(sale.sale_date), 'dd/MM/yyyy HH:mm')}</p>
                <p><strong>Método de Pago:</strong> {sale.payment_method}</p>
                <p><strong>Estado:</strong> 
                  <Badge variant={sale.status === 'completed' ? 'default' : 'secondary'} className="ml-2">
                    {sale.status}
                  </Badge>
                </p>
                {sale.notes && <p><strong>Notas:</strong> {sale.notes}</p>}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Información del Cliente</h3>
              {customer ? (
                <div className="space-y-2">
                  <p><strong>Nombre:</strong> {customer.name}</p>
                  <p><strong>Email:</strong> {customer.email || 'N/A'}</p>
                  <p><strong>Teléfono:</strong> {customer.phone || 'N/A'}</p>
                  <p><strong>Tipo:</strong> 
                    <Badge variant={customer.customer_type === 'premium' ? 'default' : 'secondary'} className="ml-2">
                      {customer.customer_type}
                    </Badge>
                  </p>
                </div>
              ) : (
                <p>Cliente Anónimo</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Productos</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Precio Unit.</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {saleItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.products?.name || 'Producto no encontrado'}</TableCell>
                    <TableCell>{item.products?.sku || 'N/A'}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatColombianPeso(item.unit_price)}</TableCell>
                    <TableCell>{formatColombianPeso(item.total_price)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-end space-y-2">
              <div className="text-right space-y-1">
                <p>Subtotal: {formatColombianPeso(sale.total_amount + (sale.discount_amount || 0) - (sale.tax_amount || 0))}</p>
                {sale.discount_amount > 0 && (
                  <p>Descuento: -{formatColombianPeso(sale.discount_amount)}</p>
                )}
                {sale.tax_amount > 0 && (
                  <p>Impuestos: {formatColombianPeso(sale.tax_amount)}</p>
                )}
                <p className="text-lg font-bold">Total: {formatColombianPeso(sale.total_amount)}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={onClose}>Cerrar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
