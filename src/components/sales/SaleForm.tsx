
import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Sale = Tables<'sales'>;
type Product = Tables<'products'>;
type Customer = Tables<'customers'>;

interface SaleItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface SaleFormProps {
  sale?: Sale | null;
  onClose: () => void;
}

export function SaleForm({ sale, onClose }: SaleFormProps) {
  const [formData, setFormData] = useState({
    customer_id: sale?.customer_id || '',
    payment_method: sale?.payment_method || 'efectivo',
    discount_amount: sale?.discount_amount || 0,
    tax_amount: sale?.tax_amount || 0,
    notes: sale?.notes || '',
    status: sale?.status || 'completed',
  });

  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  // Buscar el cliente anónimo
  const anonymousCustomer = customers.find(c => c.name === 'Cliente Anónimo');

  // Función para crear el cliente anónimo si no existe
  const createAnonymousCustomer = useCallback(async () => {
    if (!anonymousCustomer) {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          name: 'Cliente Anónimo',
          customer_type: 'anonymous',
          is_active: true
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating anonymous customer:', error);
        return;
      }
      
      // Invalidar la query para refrescar la lista de clientes
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
  }, [anonymousCustomer, queryClient]);

  // Crear cliente anónimo cuando se carga el componente
  useEffect(() => {
    createAnonymousCustomer();
  }, [createAnonymousCustomer]);

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: { saleData: typeof formData; items: SaleItem[] }) => {
      const totalAmount = data.items.reduce((sum, item) => sum + item.total_price, 0) 
        + data.saleData.tax_amount - data.saleData.discount_amount;

      // Si se seleccionó cliente anónimo, usar su ID
      let customerId = data.saleData.customer_id;
      if (data.saleData.customer_id === 'anonymous' && anonymousCustomer) {
        customerId = anonymousCustomer.id;
      }

      if (sale) {
        const { error } = await supabase
          .from('sales')
          .update({ ...data.saleData, customer_id: customerId, total_amount: totalAmount })
          .eq('id', sale.id);
        if (error) throw error;
      } else {
        const { data: newSale, error: saleError } = await supabase
          .from('sales')
          .insert({ ...data.saleData, customer_id: customerId, total_amount: totalAmount })
          .select()
          .single();
        
        if (saleError) throw saleError;

        const saleItemsData = data.items.map(item => ({
          ...item,
          sale_id: newSale.id,
        }));

        const { error: itemsError } = await supabase
          .from('sale_items')
          .insert(saleItemsData);
        
        if (itemsError) throw itemsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: sale ? "Venta actualizada" : "Venta creada",
        description: `La venta ha sido ${sale ? 'actualizada' : 'creada'} exitosamente.`,
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: `No se pudo ${sale ? 'actualizar' : 'crear'} la venta.`,
        variant: "destructive",
      });
    },
  });

  const addSaleItem = () => {
    setSaleItems([...saleItems, {
      product_id: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
    }]);
  };

  const removeSaleItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const updateSaleItem = (index: number, field: keyof SaleItem, value: string | number) => {
    const updatedItems = [...saleItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        updatedItems[index].unit_price = product.price;
        updatedItems[index].total_price = updatedItems[index].quantity * product.price;
      }
    } else if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total_price = updatedItems[index].quantity * updatedItems[index].unit_price;
    }
    
    setSaleItems(updatedItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saleItems.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un producto a la venta.",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate({ saleData: formData, items: saleItems });
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: value 
    }));
  };

  const subtotal = saleItems.reduce((sum, item) => sum + item.total_price, 0);
  const total = subtotal + formData.tax_amount - formData.discount_amount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{sale ? 'Editar Venta' : 'Nueva Venta'}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer_id">Cliente</Label>
                <Select value={formData.customer_id || "anonymous"} onValueChange={(value) => handleChange('customer_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anonymous">Cliente Anónimo</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="payment_method">Método de Pago</Label>
                <Select value={formData.payment_method} onValueChange={(value) => handleChange('payment_method', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <Label>Productos</Label>
                <Button type="button" onClick={addSaleItem} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Producto
                </Button>
              </div>

              {saleItems.map((item, index) => (
                <div key={index} className="grid grid-cols-5 gap-2 mb-2 items-end">
                  <div>
                    <Label>Producto</Label>
                    <Select value={item.product_id} onValueChange={(value) => updateSaleItem(index, 'product_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Cantidad</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateSaleItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div>
                    <Label>Precio Unit.</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateSaleItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Total</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.total_price.toFixed(2)}
                      readOnly
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeSaleItem(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="discount_amount">Descuento</Label>
                <Input
                  id="discount_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.discount_amount}
                  onChange={(e) => handleChange('discount_amount', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <Label htmlFor="tax_amount">Impuestos</Label>
                <Input
                  id="tax_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.tax_amount}
                  onChange={(e) => handleChange('tax_amount', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <Label>Total Final</Label>
                <Input
                  value={`€${total.toFixed(2)}`}
                  readOnly
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notas</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Notas adicionales..."
              />
            </div>

            <div className="flex space-x-2 pt-4">
              <Button type="submit" disabled={mutation.isPending} className="flex-1">
                {mutation.isPending ? 'Guardando...' : (sale ? 'Actualizar' : 'Crear')}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
