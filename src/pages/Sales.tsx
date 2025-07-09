
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Search, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { SaleForm } from '@/components/sales/SaleForm';
import { SaleDetails } from '@/components/sales/SaleDetails';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Sale = Tables<'sales'>;

export function Sales() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          customers(name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: "Venta eliminada",
        description: "La venta ha sido eliminada exitosamente y el inventario ha sido restaurado.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la venta.",
        variant: "destructive",
      });
    },
  });

  const filteredSales = sales.filter(sale =>
    sale.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.payment_method.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta venta?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleViewDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setShowDetails(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingSale(null);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedSale(null);
  };

  const handleNewSale = () => {
    setEditingSale(null);
    setShowForm(true);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <img src="/magic.png" alt="Magic" className="w-12 h-12" />
          <div>
            <h1 className="text-3xl font-bold">Gestión de Ventas</h1>
          </div>
        </div>
        <Button onClick={handleNewSale}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Venta
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Ventas</CardTitle>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente o método de pago..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Método de Pago</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{format(new Date(sale.sale_date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{sale.customers?.name || 'Cliente Anónimo'}</TableCell>
                  <TableCell>${sale.total_amount.toFixed(2)}</TableCell>
                  <TableCell>{sale.payment_method}</TableCell>
                  <TableCell>
                    <Badge variant={sale.status === 'completed' ? 'default' : 'secondary'}>
                      {sale.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(sale)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(sale)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(sale.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {showForm && (
        <SaleForm
          sale={editingSale}
          onClose={handleCloseForm}
        />
      )}

      {showDetails && selectedSale && (
        <SaleDetails
          sale={selectedSale}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
}
