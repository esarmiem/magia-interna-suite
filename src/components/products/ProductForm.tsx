
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatColombianPeso, parseColombianPeso, formatInputForDisplay } from '@/lib/currency';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  cost: number;
  sku: string;
  category: string;
  size: string | null;
  color: string | null;
  stock_quantity: number;
  min_stock: number;
  image_url: string | null;
  is_active: boolean;
}

interface ProductFormProps {
  product?: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProductForm({ product, onClose, onSuccess }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost: '',
    sku: '',
    category: '',
    size: '',
    color: '',
    stock_quantity: '',
    min_stock: '5',
    image_url: '',
    is_active: true,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        price: formatColombianPeso(product.price),
        cost: formatColombianPeso(product.cost),
        sku: product.sku,
        category: product.category,
        size: product.size || '',
        color: product.color || '',
        stock_quantity: product.stock_quantity.toString(),
        min_stock: product.min_stock.toString(),
        image_url: product.image_url || '',
        is_active: product.is_active,
      });
    }
  }, [product]);

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const productData = {
        name: data.name,
        description: data.description || null,
        price: parseColombianPeso(data.price),
        cost: parseColombianPeso(data.cost),
        sku: data.sku,
        category: data.category,
        size: data.size || null,
        color: data.color || null,
        stock_quantity: parseInt(data.stock_quantity),
        min_stock: parseInt(data.min_stock),
        image_url: data.image_url || null,
        is_active: data.is_active,
      };

      if (product) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: product ? "Producto actualizado" : "Producto creado",
        description: `El producto ha sido ${product ? 'actualizado' : 'creado'} exitosamente.`,
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo ${product ? 'actualizar' : 'crear'} el producto. ` + error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar longitud del nombre
    if (formData.name.length > 60) {
      toast({
        title: "Error de validación",
        description: "El nombre no puede exceder los 60 caracteres.",
        variant: "destructive",
      });
      return;
    }
    
    mutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'price' || name === 'cost') {
      // Formatear campos de moneda
      const formattedValue = formatInputForDisplay(value);
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              {product ? 'Editar Producto' : 'Nuevo Producto'}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  maxLength={60}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoría *</Label>
                <Input
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Precio de Venta *</Label>
                <Input
                  id="price"
                  name="price"
                  type="text"
                  placeholder="Ej: 129.000"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">Costo *</Label>
                <Input
                  id="cost"
                  name="cost"
                  type="text"
                  placeholder="Ej: 89.000"
                  value={formData.cost}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock_quantity">Cantidad en Stock *</Label>
                <Input
                  id="stock_quantity"
                  name="stock_quantity"
                  type="number"
                  value={formData.stock_quantity}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_stock">Stock Mínimo</Label>
                <Input
                  id="min_stock"
                  name="min_stock"
                  type="number"
                  value={formData.min_stock}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Talla</Label>
                <Input
                  id="size"
                  name="size"
                  value={formData.size}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">URL de Imagen</Label>
                <Input
                  id="image_url"
                  name="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <Label htmlFor="is_active">Producto activo</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending 
                  ? (product ? 'Actualizando...' : 'Creando...') 
                  : (product ? 'Actualizar' : 'Crear')
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
