import { useQuery } from '@tanstack/react-query';
import { Calendar, Gift, Users, Clock, MessageCircle, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { calculateAge, getDaysUntilBirthday } from '@/lib/date-utils';

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

type NotificationStatus = {
  customerId: string;
  notificationDate: string;
  type: 'week' | 'day';
  sent: boolean;
};

export function Birthdays() {
  const { toast } = useToast();
  
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

  // Función para enviar notificación por WhatsApp
  const sendWhatsAppNotification = (customer: Customer, daysUntil: number) => {
    const age = calculateAge(customer.birth_date);
    const birthDate = new Date(customer.birth_date);
    const formattedDate = birthDate.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long' 
    });

    const message = `🎉 *Recordatorio de Cumpleaños - Magia Interna*

👤 *Cliente:* ${customer.name}
📅 *Fecha de cumpleaños:* ${formattedDate}
🎂 *Edad:* ${age} años
⏰ *Faltan:* ${daysUntil} días

💝 *Acción requerida:*
• Enviar promoción especial
• Preparar tarjeta de regalo
• Contactar al cliente

📞 *Contacto del cliente:*
${customer.phone ? `Teléfono: ${customer.phone}` : 'Sin teléfono'}
${customer.email ? `Email: ${customer.email}` : 'Sin email'}

🏷️ *Tipo de cliente:* ${customer.customer_type.toUpperCase()}

---
*Sistema de Gestión Magia Interna*`;

    const whatsappUrl = `https://wa.me/573214930228?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Función para obtener clientes que necesitan notificación
  const getCustomersNeedingNotification = () => {
    const today = new Date();
    const customersNeedingNotification: Array<{customer: Customer, daysUntil: number, type: 'week' | 'day'}> = [];

    customers.forEach(customer => {
      const daysUntil = getDaysUntilBirthday(customer.birth_date);
      
      // Notificar 7 días antes
      if (daysUntil === 7) {
        customersNeedingNotification.push({
          customer,
          daysUntil,
          type: 'week'
        });
      }
      
      // Notificar 1 día antes
      if (daysUntil === 1) {
        customersNeedingNotification.push({
          customer,
          daysUntil,
          type: 'day'
        });
      }
    });

    return customersNeedingNotification;
  };

  // Función para obtener todos los clientes próximos (para envío manual)
  const getAllUpcomingCustomers = () => {
    const upcomingCustomers: Array<{customer: Customer, daysUntil: number, type: 'week' | 'day'}> = [];

    customers.forEach(customer => {
      const daysUntil = getDaysUntilBirthday(customer.birth_date);
      
      // Mostrar clientes que cumplen en los próximos 30 días
      if (daysUntil <= 30 && daysUntil > 0) {
        upcomingCustomers.push({
          customer,
          daysUntil,
          type: daysUntil <= 7 ? 'week' : 'day'
        });
      }
    });

    return upcomingCustomers.sort((a, b) => a.daysUntil - b.daysUntil);
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

  // Obtener clientes que necesitan notificación
  const customersNeedingNotification = getCustomersNeedingNotification();
  
  // Obtener todos los clientes próximos para envío manual
  const allUpcomingCustomers = getAllUpcomingCustomers();

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
        <div className="flex items-center space-x-4">
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
      </div>

      {/* Notificaciones - Siempre visible 
      <Card className="border-2 border-magia-warning bg-magia-warning/5">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-magia-warning" />
            <span>Notificaciones de Cumpleaños</span>
            <Badge variant="destructive">{customersNeedingNotification.length}</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Notificaciones automáticas: 7 días y 1 día antes. Envío manual disponible para todos los clientes próximos.
          </p>
        </CardHeader>
        <CardContent>
          {customersNeedingNotification.length > 0 && (
            <div className="space-y-3 mb-4">
              <h4 className="font-medium text-sm text-magia-warning">⚠️ Notificaciones Automáticas Pendientes</h4>
              {customersNeedingNotification.map(({ customer, daysUntil, type }) => (
                <div key={`${customer.id}-${type}`} className="flex items-center justify-between p-3 bg-background rounded-lg border border-magia-warning">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-gradient-to-br from-magia-purple to-magia-gold text-white">
                        {customer.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Cumple en {daysUntil} día{daysUntil > 1 ? 's' : ''} • {type === 'week' ? 'Notificación semanal' : 'Notificación diaria'}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => sendWhatsAppNotification(customer, daysUntil)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Enviar WhatsApp
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {allUpcomingCustomers.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-foreground">📅 Envío Manual - Todos los Próximos Cumpleaños</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {allUpcomingCustomers.slice(0, 6).map(({ customer, daysUntil, type }) => (
                  <div key={`manual-${customer.id}`} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-gradient-to-br from-magia-purple to-magia-gold text-white">
                          {customer.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Cumple en {daysUntil} día{daysUntil > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendWhatsAppNotification(customer, daysUntil)}
                      className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Notificar
                    </Button>
                  </div>
                ))}
              </div>
              {allUpcomingCustomers.length > 6 && (
                <p className="text-xs text-muted-foreground text-center">
                  Mostrando 6 de {allUpcomingCustomers.length} clientes próximos
                </p>
              )}
            </div>
          )}
          
          {customers.length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                No hay clientes con fecha de nacimiento registrada. Agrega fechas de nacimiento a tus clientes para activar las notificaciones.
              </p>
            </div>
          )}
        </CardContent>
      </Card> */}

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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendWhatsAppNotification(customer, daysUntil)}
                        className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white border-green-600"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Notificar a Lore
                      </Button>
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
            const hasMoreCustomers = monthData.customers.length > 6;
            
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
                  <div className={cn(
                    "space-y-3",
                    hasMoreCustomers && "max-h-80 overflow-y-auto pr-2"
                  )}>
                    {monthData.customers.map((customer) => {
                      const age = calculateAge(customer.birth_date);
                      const birthDate = new Date(customer.birth_date);
                      const daysUntil = getDaysUntilBirthday(customer.birth_date);
                      
                      return (
                        <div 
                          key={customer.id}
                          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent transition-colors"
                        >
                          <Avatar className="h-8 w-8 flex-shrink-0">
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
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                              {customer.customer_type.toUpperCase()}
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => sendWhatsAppNotification(customer, daysUntil)}
                            className="h-6 w-6 p-0 bg-green-600 hover:bg-green-700 text-white flex-shrink-0"
                          >
                            <MessageCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                  {hasMoreCustomers && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground text-center">
                        +{monthData.customers.length - 6} más clientes
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
} 