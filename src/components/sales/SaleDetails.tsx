
import { useQuery } from '@tanstack/react-query';
import { X, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatColombianPeso } from '@/lib/currency';
import type { Tables } from '@/integrations/supabase/types';
import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

type Sale = Tables<'sales'>;

interface SaleDetailsProps {
  sale: Sale;
  onClose: () => void;
}

export function SaleDetails({ sale, onClose }: SaleDetailsProps) {
  const contentRef = useRef<HTMLDivElement>(null);
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
        link.download = `venta-${sale.id}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`venta-${sale.id}.pdf`);
      }
    } finally {
      setDownloading(false);
    }
  };

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
        <CardHeader className="flex flex-row items-center justify-between pl-14">
          <CardTitle>Detalles de la Venta</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="no-export">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contenido a exportar */}
          <div ref={contentRef} className="p-8 rounded-lg">
            {/* Sección 1: Información del Cliente */}
            <div>
              <img src="/magiainternalogo.webp" alt="Logo" width={60} height={60} className="object-contain" />
              <h3 className="text-lg font-semibold mb-3">Información del Cliente</h3>
              {customer ? (
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  <div><strong>Nombre:</strong> {customer.name}</div>
                  <div><strong>Teléfono:</strong> {customer.phone || 'N/A'}</div>
                  <div><strong>Dirección:</strong> {customer.address || 'N/A'}</div>
                  <div><strong>Ciudad:</strong> {customer.city || 'N/A'}</div>
                  <div><strong>Email:</strong> {customer.email || 'N/A'}</div>
                  <div><strong>Tipo:</strong> 
                    <Badge variant={customer.customer_type === 'premium' ? 'default' : 'secondary'} className="ml-2">
                      {customer.customer_type}
                    </Badge>
                  </div>
                  <div><strong>Tipo de Documento:</strong> {customer.document_type || 'N/A'}</div>
                  <div><strong>Número de Documento:</strong> {customer.document_number || 'N/A'}</div>
                </div>
              ) : (
                <p>Cliente Anónimo</p>
              )}
            </div>

            {/* Sección 2: Información de la Venta y Productos */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Información de la Venta</h3>
              <div className="grid grid-cols-3 gap-x-8 gap-y-2 mb-6">
                <div><strong>Fecha:</strong> {format(new Date(sale.sale_date), 'dd/MM/yyyy HH:mm')}</div>
                <div><strong>Método de Pago:</strong> {sale.payment_method}</div>
                <div><strong>Estado:</strong> 
                  <Badge variant={sale.status === 'completed' ? 'default' : 'secondary'} className="ml-2">
                    {sale.status}
                  </Badge>
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Productos</h3>
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
              <div className="border-t pt-4 mt-4">
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
                    {sale.notes && (
                      <p className="text-sm text-gray-500 mt-4">Nota: {sale.notes}</p>
                    )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
              {/* Popover para el botón de descarga */}
              <Popover>
              <PopoverTrigger asChild>
                <Button disabled={downloading} variant="outline" size="sm" className="bg-green-300 no-export border-2 border-green-600">
                <FileDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent side="top" align="end" className="p-0 w-40">
                <button
                  className="block w-full text-left px-4 py-2 text-sm"
                  onClick={() => handleDownload('pdf')}
                  disabled={downloading}
                >
                  Descargar como PDF
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm"
                  onClick={() => handleDownload('png')}
                  disabled={downloading}
                >
                  Descargar como PNG
                </button>
              </PopoverContent>
            </Popover>
            <Button onClick={onClose} className="no-export">Cerrar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
