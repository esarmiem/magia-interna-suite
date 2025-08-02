
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { formatBirthDateForInput } from '@/lib/date-utils';
import type { Tables } from '@/integrations/supabase/types';

type Customer = Tables<'customers'>;

interface CustomerFormProps {
  customer?: Customer | null;
  onClose: () => void;
}

export function CustomerForm({ customer, onClose }: CustomerFormProps) {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    city: customer?.city || '',
    postal_code: customer?.postal_code || '',
    birth_date: formatBirthDateForInput(customer?.birth_date),
    customer_type: customer?.customer_type || 'regular',
    is_active: customer?.is_active ?? true,
    document_type: customer?.document_type || '',
    document_number: customer?.document_number || '',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (customer) {
        const { error } = await supabase
          .from('customers')
          .update(data)
          .eq('id', customer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('customers')
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: customer ? "Cliente actualizado" : "Cliente creado",
        description: `El cliente ha sido ${customer ? 'actualizado' : 'creado'} exitosamente.`,
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: `No se pudo ${customer ? 'actualizar' : 'crear'} el cliente.`,
        variant: "destructive",
      });
    },
  });

  const prepareData = (data: typeof formData) => ({
    ...data,
    email: data.email.trim() === '' ? null : data.email,
    phone: data.phone.trim() === '' ? null : data.phone,
    address: data.address.trim() === '' ? null : data.address,
    city: data.city.trim() === '' ? null : data.city,
    postal_code: data.postal_code.trim() === '' ? null : data.postal_code,
    birth_date: data.birth_date.trim() === '' ? null : data.birth_date,
    document_type: data.document_type.trim() === '' ? null : data.document_type,
    // name y document_number se mantienen porque son obligatorios
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
    
    mutation.mutate(prepareData(formData));
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{customer ? 'Editar Cliente' : 'Nuevo Cliente'}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                maxLength={60}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="postal_code">Código Postal</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => handleChange('postal_code', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => handleChange('birth_date', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="customer_type">Tipo de Cliente</Label>
              <Select value={formData.customer_type} onValueChange={(value) => handleChange('customer_type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="document_type">Tipo de Documento</Label>
              <Select value={formData.document_type} onValueChange={(value) => handleChange('document_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                  <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                  <SelectItem value="NIT">NIT</SelectItem>
                  <SelectItem value="PAS">Pasaporte</SelectItem>
                  <SelectItem value="OTRO">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="document_number">Número de Documento</Label>
              <Input
                id="document_number"
                value={formData.document_number}
                onChange={(e) => handleChange('document_number', e.target.value)}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(value) => handleChange('is_active', value)}
              />
              <Label htmlFor="is_active">Cliente Activo</Label>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button type="submit" disabled={mutation.isPending} className="flex-1">
                {mutation.isPending ? 'Guardando...' : (customer ? 'Actualizar' : 'Crear')}
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
