import { useQuery } from '@tanstack/react-query';
import { Calendar, Gift, Users, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

type Customer = {
  id: string;
  name: string;
  birth_date: string;
  email?: string;
  phone?: string;
  customer_type: string;
};

type BirthdayByMonth = {
  month: string;
  monthNumber: number;
  customers: Customer[];
};

export function Birthdays() {
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers-birthdays'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, birth_date, email, phone, customer_type')
        .not('birth_date', 'is', null)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Función para obtener el nombre del mes
  const getMonthName = (monthNumber: number) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[monthNumber - 1];
  };

  // Función para calcular la edad
  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  // Función para calcular días hasta el cumpleaños
  const getDaysUntilBirthday = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    const nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
    
    if (nextBirthday < today) {
      nextBirthday.setFullYear(today.getFullYear() + 1);
    }
    
    const diffTime = nextBirthday.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Organizar clientes por mes
  const birthdaysByMonth: BirthdayByMonth[] = [];
  const currentMonth = new Date().getMonth() + 1;
  
  for (let month = 1; month <= 12; month++) {
    const monthCustomers = customers.filter(customer => {
      const birthDate = new Date(customer.birth_date);
      return birthDate.getMonth() + 1 === month;
    });
    
    if (monthCustomers.length > 0) {
      birthdaysByMonth.push({
        month: getMonthName(month),
        monthNumber: month,
        customers: monthCustomers
      });
    }
  }

  // Obtener próximos cumpleaños (próximos 30 días)
  const upcomingBirthdays = customers
    .filter(customer => {
      const daysUntil = getDaysUntilBirthday(customer.birth_date);
      return daysUntil <= 30 && daysUntil > 0;
    })
    .sort((a, b) => getDaysUntilBirthday(a.birth_date) - getDaysUntilBirthday(b.birth_date));

  // Obtener cumpleaños del mes actual
  const currentMonthBirthdays = customers.filter(customer => {
    const birthDate = new Date(customer.birth_date);
    return birthDate.getMonth() + 1 === currentMonth;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img src="/voodoo.png" alt="Voodoo" className="w-12 h-12" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Cumpleaños</h1>
            <p className="text-muted-foreground">Gestiona y celebra los cumpleaños de tus clientes</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-6 w-6 text-primary" />
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('es-ES', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clientes</p>
                <p className="text-2xl font-bold">{customers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Gift className="h-5 w-5 text-magia-success" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Este Mes</p>
                <p className="text-2xl font-bold">{currentMonthBirthdays.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-magia-warning" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Próximos 30 días</p>
                <p className="text-2xl font-bold">{upcomingBirthdays.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Próximos Cumpleaños */}
      {upcomingBirthdays.length > 0 && (
        <Card className="border-2 border-magia-success">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Gift className="h-5 w-5 text-magia-success" />
              <span>Próximos Cumpleaños</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingBirthdays.slice(0, 6).map((customer) => {
                const daysUntil = getDaysUntilBirthday(customer.birth_date);
                const age = calculateAge(customer.birth_date);
                const birthDate = new Date(customer.birth_date);
                
                return (
                  <Card key={customer.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-br from-magia-purple to-magia-gold text-white">
                            {customer.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {birthDate.toLocaleDateString('es-ES', { 
                              day: 'numeric', 
                              month: 'long' 
                            })} • {age} años
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant={daysUntil <= 7 ? "destructive" : "secondary"}>
                              {daysUntil === 1 ? 'Mañana' : `${daysUntil} días`}
                            </Badge>
                            {customer.customer_type !== 'regular' && (
                              <Badge variant="outline" className="text-xs">
                                {customer.customer_type.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cumpleaños por Mes - Estilo Bento */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Cumpleaños por Mes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {birthdaysByMonth.map((monthData) => {
            const isCurrentMonth = monthData.monthNumber === currentMonth;
            
            return (
              <Card 
                key={monthData.month} 
                className={cn(
                  "hover:shadow-lg transition-all duration-300",
                  isCurrentMonth && "ring-2 ring-magia-success ring-offset-2"
                )}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span className={cn(
                      "text-lg",
                      isCurrentMonth && "text-magia-success font-bold"
                    )}>
                      {monthData.month}
                    </span>
                    <Badge variant="outline">
                      {monthData.customers.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {monthData.customers.map((customer) => {
                    const age = calculateAge(customer.birth_date);
                    const birthDate = new Date(customer.birth_date);
                    
                    return (
                      <div 
                        key={customer.id}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent transition-colors"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-gradient-to-br from-magia-purple to-magia-gold text-white">
                            {customer.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{customer.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {birthDate.getDate()} • {age} años
                          </p>
                        </div>
                        {customer.customer_type !== 'regular' && (
                          <Badge variant="outline" className="text-xs">
                            {customer.customer_type.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Mensaje cuando no hay cumpleaños */}
      {customers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay cumpleaños registrados</h3>
            <p className="text-muted-foreground">
              Agrega fechas de nacimiento a tus clientes para ver sus cumpleaños aquí.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 