import { X } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatColombianPeso } from '@/lib/currency';
import { formatBirthDate } from '@/lib/date-utils';
import type { Tables } from '@/integrations/supabase/types';

type Customer = Tables<'customers'>;

interface CustomerDetailsProps {
  customer: Customer;
  onClose: () => void;
}

export function CustomerDetails({ customer, onClose }: CustomerDetailsProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Detalles del Cliente</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Información Personal */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-blue-600">Información Personal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-gray-700">Nombre:</span>
                  <p className="text-gray-900">{customer.name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <p className="text-gray-900">{customer.email || 'No especificado'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Teléfono:</span>
                  <p className="text-gray-900">{customer.phone || 'No especificado'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Fecha de Nacimiento:</span>
                  <p className="text-gray-900">
                    {formatBirthDate(customer.birth_date)}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Tipo de Documento:</span>
                  <p className="text-gray-900">{customer.document_type || 'No especificado'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Número de Documento:</span>
                  <p className="text-gray-900">{customer.document_number || 'No especificado'}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-gray-700">Tipo de Cliente:</span>
                  <div className="mt-1">
                    <Badge variant={customer.customer_type === 'premium' ? 'default' : 'secondary'}>
                      {customer.customer_type || 'regular'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Estado:</span>
                  <div className="mt-1">
                    <Badge variant={customer.is_active ? 'default' : 'destructive'}>
                      {customer.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Total de Compras:</span>
                  <p className="text-gray-900 font-semibold">
                    {formatColombianPeso(customer.total_purchases || 0)}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Última Compra:</span>
                  <p className="text-gray-900">
                    {customer.last_purchase_date 
                      ? format(new Date(customer.last_purchase_date), 'dd/MM/yyyy HH:mm')
                      : 'Sin compras registradas'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Información de Dirección */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-green-600">Información de Dirección</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-700">Dirección:</span>
                <p className="text-gray-900">{customer.address || 'No especificada'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Ciudad:</span>
                <p className="text-gray-900">{customer.city || 'No especificada'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Código Postal:</span>
                <p className="text-gray-900">{customer.postal_code || 'No especificado'}</p>
              </div>
            </div>
          </div>

          {/* Información del Sistema */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-purple-600">Información del Sistema</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-700">Fecha de Creación:</span>
                <p className="text-gray-900">
                  {format(new Date(customer.created_at), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Última Actualización:</span>
                <p className="text-gray-900">
                  {format(new Date(customer.updated_at), 'dd/MM/yyyy HH:mm')}
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