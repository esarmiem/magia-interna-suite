
import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X, Plus, Trash2, AlertTriangle, Search, Check, ChevronsUpDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { formatColombianPeso, parseColombianPeso, formatInputForDisplay } from '@/lib/currency';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';
import confetti from 'canvas-confetti';

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
    delivery_fee: sale?.delivery_fee || 0,
    notes: sale?.notes || '',
    status: sale?.status || 'completed',
  });

  const [displayData, setDisplayData] = useState({
    discount_amount: formatColombianPeso(sale?.discount_amount || 0),
    tax_amount: formatColombianPeso(sale?.tax_amount || 0),
    delivery_fee: formatColombianPeso(sale?.delivery_fee || 0),
  });

  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [displayItems, setDisplayItems] = useState<Array<{
    unit_price: string;
    total_price: string;
  }>>([]);
  
  // Estados para los buscadores
  const [customerOpen, setCustomerOpen] = useState(false);
  const [productOpens, setProductOpens] = useState<boolean[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar el cliente anónimo (activo o inactivo)
  const [anonymousCustomer, setAnonymousCustomer] = useState<Customer | null>(null);

  // Buscar todos los clientes activos para el selector
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, document_number, document_type')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  const filteredCustomers = customers.filter((customer: Customer) =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (customer.document_number && customer.document_number.toLowerCase().includes(customerSearch.toLowerCase()))
  );

  // Función para buscar o crear el cliente anónimo
  const fetchOrCreateAnonymousCustomer = useCallback(async () => {
    // Buscar cualquier cliente anónimo, activo o no
    const { data: existing, error: findError } = await supabase
      .from('customers')
      .select('*')
      .eq('name', 'Cliente Anónimo')
      .limit(1)
      .maybeSingle();

    if (findError) {
      console.error('Error searching for anonymous customer:', findError);
      return;
    }

    if (existing) {
      // Si existe pero está inactivo, actívalo
      if (!existing.is_active) {
        const { error: updateError } = await supabase
          .from('customers')
          .update({ is_active: true })
          .eq('id', existing.id);
        if (updateError) {
          console.error('Error reactivating anonymous customer:', updateError);
          return;
        }
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        setAnonymousCustomer({ ...existing, is_active: true });
      } else {
        setAnonymousCustomer(existing);
      }
      return;
    }

    // Si no existe, créalo
    const { data: created, error: createError } = await supabase
      .from('customers')
      .insert({
        name: 'Cliente Anónimo',
        customer_type: 'anonymous',
        is_active: true
      })
      .select()
      .single();
    if (createError) {
      console.error('Error creating anonymous customer:', createError);
      return;
    }
    setAnonymousCustomer(created);
    queryClient.invalidateQueries({ queryKey: ['customers'] });
  }, [queryClient]);

  // Ejecutar la función al cargar el componente
  useEffect(() => {
    fetchOrCreateAnonymousCustomer();
  }, [fetchOrCreateAnonymousCustomer]);

  // Cuando el cliente anónimo esté disponible y no haya cliente seleccionado, pon su UUID como valor por defecto
  useEffect(() => {
    if (anonymousCustomer && !formData.customer_id) {
      setFormData(prev => ({ ...prev, customer_id: anonymousCustomer.id }));
    }
  }, [anonymousCustomer, formData.customer_id]);

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, stock_quantity, sku, size')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  // Función para obtener el nombre y documento del cliente seleccionado
  const getSelectedCustomerDisplay = () => {
    const selectedCustomer = customers.find((c: Customer) => c.id === formData.customer_id);
    if (!selectedCustomer) return '';
    return `${selectedCustomer.name} ${selectedCustomer.document_number ? `(${selectedCustomer.document_number})` : ''}`;
  };

  // Función para manejar el estado de apertura de productos
  const handleProductOpenChange = (index: number, open: boolean) => {
    const newOpens = [...productOpens];
    newOpens[index] = open;
    setProductOpens(newOpens);
  };

  // Inicializar el array de estados de apertura de productos
  useEffect(() => {
    if (productOpens.length !== saleItems.length) {
      const newOpens = new Array(saleItems.length).fill(false);
      setProductOpens(newOpens);
    }
  }, [saleItems.length, productOpens.length]);

  const mutation = useMutation({
    mutationFn: async (data: { saleData: typeof formData; items: SaleItem[] }) => {
      const totalAmount = data.items.reduce((sum, item) => sum + item.total_price, 0) 
        + data.saleData.tax_amount - data.saleData.discount_amount + data.saleData.delivery_fee;

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
      // Lanzar confeti solo si es una nueva venta
      if (!sale) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.7 },
        });
      }
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: sale ? "Venta actualizada" : "Venta creada",
        description: `La venta ha sido ${sale ? 'actualizada' : 'creada'} exitosamente.`,
      });
      onClose();
    },
    onError: (error: Error) => {
      let errorMessage = `No se pudo ${sale ? 'actualizar' : 'crear'} la venta.`;
      
      // Manejar errores específicos de stock insuficiente
      if (error.message && error.message.includes('Stock insuficiente')) {
        errorMessage = error.message;
      } else if (error.message) {
        // Mostrar el mensaje de error específico si está disponible
        errorMessage = error.message;
      }
      
      console.error('Error en la venta:', error);
      
      toast({
        title: "Error",
        description: errorMessage,
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
    setDisplayItems([...displayItems, {
      unit_price: '',
      total_price: '',
    }]);
    setProductOpens([...productOpens, false]); // Add a new open state for the new item
  };

  const removeSaleItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
    setDisplayItems(displayItems.filter((_, i) => i !== index));
    setProductOpens(productOpens.filter((_, i) => i !== index)); // Remove the open state
  };

  const updateSaleItem = (index: number, field: keyof SaleItem, value: string | number) => {
    const updatedItems = [...saleItems];
    const updatedDisplayItems = [...displayItems];

    if (field === 'product_id') {
      // Actualizar el product_id primero
      updatedItems[index].product_id = value as string;
      
      const product = products.find(p => p.id === value);
      if (product) {
        updatedItems[index].unit_price = product.price;
        updatedItems[index].total_price = updatedItems[index].quantity * product.price;
        updatedDisplayItems[index].unit_price = formatColombianPeso(product.price);
        updatedDisplayItems[index].total_price = formatColombianPeso(updatedItems[index].total_price);
      }
    } else if (field === 'quantity' || field === 'unit_price') {
      if (field === 'quantity') {
        updatedItems[index].quantity = Math.max(1, value as number);
      } else {
        updatedItems[index].unit_price = Math.max(0, value as number);
        updatedDisplayItems[index].unit_price = formatColombianPeso(Math.max(0, value as number));
      }
      updatedItems[index].total_price = updatedItems[index].quantity * updatedItems[index].unit_price;
      updatedDisplayItems[index].total_price = formatColombianPeso(updatedItems[index].total_price);
    }

    setSaleItems(updatedItems);
    setDisplayItems(updatedDisplayItems);
  };

  const updateDisplayItem = (index: number, field: 'unit_price' | 'total_price', value: string) => {
    const updatedDisplayItems = [...displayItems];
    const updatedItems = [...saleItems];

    if (field === 'unit_price') {
      const numericValue = Math.max(0, parseColombianPeso(value));
      updatedItems[index].unit_price = numericValue;
      updatedItems[index].total_price = updatedItems[index].quantity * numericValue;
      updatedDisplayItems[index].unit_price = value;
      updatedDisplayItems[index].total_price = formatColombianPeso(updatedItems[index].total_price);
    }

    setSaleItems(updatedItems);
    setDisplayItems(updatedDisplayItems);
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

    // Validar que todos los items tengan un producto seleccionado
    const itemsWithoutProduct = saleItems.filter(item => !item.product_id);
    if (itemsWithoutProduct.length > 0) {
      toast({
        title: "Error",
        description: "Todos los items deben tener un producto seleccionado.",
        variant: "destructive",
      });
      return;
    }

    // Validar que no haya stock insuficiente
    const itemsWithInsufficientStock = saleItems.filter(hasInsufficientStock);
    if (itemsWithInsufficientStock.length > 0) {
      toast({
        title: "Error",
        description: "Hay productos con stock insuficiente. Revise las cantidades.",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate({ saleData: formData, items: saleItems });
  };

  const handleChange = (field: string, value: string | number) => {
    if (field === 'discount_amount' || field === 'tax_amount' || field === 'delivery_fee') {
      const numericValue = typeof value === 'string' ? parseColombianPeso(value) : value;
      
      // Prevenir valores negativos
      const validatedValue = Math.max(0, numericValue);
      
      setFormData(prev => ({ ...prev, [field]: validatedValue }));
      setDisplayData(prev => ({ 
        ...prev, 
        [field]: typeof value === 'string' 
          ? (validatedValue === 0 ? '' : formatColombianPeso(validatedValue))
          : formatColombianPeso(validatedValue)
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const subtotal = saleItems.reduce((sum, item) => sum + item.total_price, 0);
  const total = subtotal + formData.tax_amount - formData.discount_amount + formData.delivery_fee;

  // Función para obtener el stock disponible de un producto
  const getProductStock = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.stock_quantity || 0;
  };

  // Función para verificar si hay stock insuficiente
  const hasInsufficientStock = (item: SaleItem) => {
    if (!item.product_id) return false;
    const availableStock = getProductStock(item.product_id);
    return item.quantity > availableStock;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle>{sale ? 'Editar Venta' : 'Nueva Venta'}</CardTitle>
            <img
              src="/witch-broom-transparent.gif"
              alt="Witch Broom"
              className="h-8 w-8 object-contain"
            />
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer_id">Cliente</Label>
                <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={customerOpen}
                      className="w-full justify-between"
                    >
                      {getSelectedCustomerDisplay() || "Seleccionar cliente..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Buscar cliente..." />
                      <CommandList>
                        <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                        <CommandGroup>
                          {filteredCustomers.map((customer: Customer) => (
                            <CommandItem
                              key={customer.id}
                              value={customer.name + (customer.document_number ? ' ' + customer.document_number : '')}
                              onSelect={() => {
                                handleChange('customer_id', customer.id);
                                setCustomerOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  formData.customer_id === customer.id ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{customer.name}</span>
                                <span className="text-xs text-gray-500">
                                  {customer.document_type ? customer.document_type + ': ' : ''}{customer.document_number || 'Sin documento'}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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

              {saleItems.map((item, index) => {
                const product = products.find(p => p.id === item.product_id);
                const insufficientStock = hasInsufficientStock(item);
                
                return (
                  <div key={index} className="flex flex-wrap items-end gap-2 mb-2 border p-3 rounded-lg">
                    <div className="w-full sm:flex-[2_1_0%] sm:min-w-0">
                      <Label>Producto</Label>
                      <Popover open={productOpens[index]} onOpenChange={(open) => handleProductOpenChange(index, open)}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={productOpens[index]}
                            className="w-full justify-between min-w-0 max-w-full truncate"
                          >
                            <span className="block truncate text-left min-w-0 max-w-[180px] overflow-hidden text-ellipsis">
                              {product ? `${product.name} (${product.sku})` : "Seleccionar producto..."}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Buscar producto por nombre o SKU..." />
                            <CommandList>
                              <CommandEmpty>No se encontraron productos.</CommandEmpty>
                              <CommandGroup>
                                {products.map((product) => (
                                  <CommandItem
                                    key={product.id}
                                    value={`${product.name} ${product.sku}`}
                                    onSelect={() => {
                                      updateSaleItem(index, 'product_id', product.id);
                                      handleProductOpenChange(index, false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        item.product_id === product.id ? 'opacity-100' : 'opacity-0'
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-medium">{product.name}</span>
                                      <span className="text-xs text-gray-500">
                                        SKU: {product.sku} • Talla: {product.size || 'N/A'} • Stock: {product.stock_quantity}
                                      </span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="w-16">
                      <Label>Cantidad</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateSaleItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className={insufficientStock ? 'border-red-500' : ''}
                      />
                      {insufficientStock && (
                        <div className="flex items-center text-red-500 text-xs mt-1">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Stock insuficiente
                        </div>
                      )}
                    </div>
                    <div className="w-16">
                      <Label>Stock</Label>
                      <Input
                        value={product ? product.stock_quantity : '-'}
                        readOnly
                        className=""
                      />
                    </div>
                    <div className="w-28">
                      <Label>Precio Unit.</Label>
                      <Input
                        type="text"
                        placeholder="Ej: 129.000"
                        value={displayItems[index]?.unit_price || ''}
                        onChange={(e) => updateDisplayItem(index, 'unit_price', e.target.value)}
                      />
                    </div>
                    <div className="w-28">
                      <Label>Total</Label>
                      <Input
                        type="text"
                        value={displayItems[index]?.total_price || ''}
                        readOnly
                        className=""
                      />
                    </div>
                    <div className="w-10 flex-shrink-0 flex justify-end items-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeSaleItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="discount_amount">Descuento</Label>
                <Input
                  id="discount_amount"
                  type="text"
                  placeholder="Ej: 10.000"
                  min="0"
                  value={displayData.discount_amount}
                  onChange={(e) => handleChange('discount_amount', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="tax_amount">Impuestos</Label>
                <Input
                  id="tax_amount"
                  type="text"
                  placeholder="Ej: 5.000"
                  min="0"
                  value={displayData.tax_amount}
                  onChange={(e) => handleChange('tax_amount', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="delivery_fee">Envío</Label>
                <Input
                  id="delivery_fee"
                  type="text"
                  placeholder="Ej: 5.000"
                  min="0"
                  value={displayData.delivery_fee}
                  onChange={(e) => handleChange('delivery_fee', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Total Final</Label>
              <Input
                value={formatColombianPeso(total)}
                readOnly
              />
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
              <Button 
                type="submit" 
                disabled={
                  mutation.isPending || 
                  saleItems.some(hasInsufficientStock) ||
                  saleItems.some(item => !item.product_id)
                }
                className="flex-1"
              >
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
