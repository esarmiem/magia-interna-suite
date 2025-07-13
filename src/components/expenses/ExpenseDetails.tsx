import { X } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatColombianPeso } from '@/lib/currency';
import type { Tables } from '@/integrations/supabase/types';

type Expense = Tables<'expenses'>;

interface ExpenseDetailsProps {
  expense: Expense;
  onClose: () => void;
}

export function ExpenseDetails({ expense, onClose }: ExpenseDetailsProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Detalles del Gasto</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Información Principal */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-red-600">Información Principal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-gray-700">Descripción:</span>
                  <p className="text-gray-900 font-semibold">{expense.description}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Categoría:</span>
                  <div className="mt-1">
                    <Badge variant="outline" className="text-blue-600 border-blue-600">
                      {expense.category}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Método de Pago:</span>
                  <p className="text-gray-900">{expense.payment_method}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-gray-700">Monto:</span>
                  <p className="font-semibold text-xl text-red-600">
                    {formatColombianPeso(expense.amount)}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Fecha del Gasto:</span>
                  <p className="text-gray-900">
                    {format(new Date(expense.expense_date), 'dd/MM/yyyy')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Comprobante */}
          {expense.receipt_url && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-green-600">Comprobante</h3>
              <div className="flex justify-center">
                <div className="w-64 h-64 rounded-lg overflow-hidden border">
                  <img 
                    src={expense.receipt_url} 
                    alt="Comprobante del gasto"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notas */}
          {expense.notes && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-purple-600">Notas</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-900">{expense.notes}</p>
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
                  {format(new Date(expense.created_at), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Última Actualización:</span>
                <p className="text-gray-900">
                  {format(new Date(expense.updated_at), 'dd/MM/yyyy HH:mm')}
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