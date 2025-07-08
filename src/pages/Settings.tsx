
import { useState } from 'react';
import { Settings2, User, Building, Palette, Bell, Shield, Download, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

export function Settings() {
  const [settings, setSettings] = useState({
    // Configuración de la empresa
    companyName: 'Magia Interna',
    companyEmail: 'info@magiainterna.com',
    companyPhone: '+34 600 000 000',
    companyAddress: 'Calle Principal 123, Madrid',
    
    // Configuración de usuario
    userName: 'Administrador',
    userEmail: 'admin@magiainterna.com',
    
    // Configuración de sistema
    currency: 'COP',
    language: 'es',
    timezone: 'Europe/Madrid',
    
    // Notificaciones
    emailNotifications: true,
    lowStockAlerts: true,
    salesReports: false,
    
    // Tema
    theme: 'light',
    
    // Inventario
    defaultLowStockThreshold: 5,
    automaticReorder: false,
  });

  const { toast } = useToast();

  const handleSettingChange = (key: string, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    // Aquí se guardarían las configuraciones en la base de datos
    toast({
      title: "Configuración guardada",
      description: "Las configuraciones han sido guardadas exitosamente.",
    });
  };

  const exportData = () => {
    toast({
      title: "Exportación iniciada",
      description: "Se está preparando la exportación de datos...",
    });
  };

  const importData = () => {
    toast({
      title: "Importación disponible",
      description: "Seleccione un archivo para importar datos.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <img src="/dreamcatcher.png" alt="Dreamcatcher" className="w-12 h-12" />
          <div>
            <h1 className="text-3xl font-bold">Configuración</h1>
          </div>
        </div>
        <Settings2 className="h-6 w-6 text-muted-foreground" />
      </div>

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="company">Empresa</TabsTrigger>
          <TabsTrigger value="user">Usuario</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          <TabsTrigger value="inventory">Inventario</TabsTrigger>
          <TabsTrigger value="data">Datos</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Información de la Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Nombre de la Empresa</Label>
                  <Input
                    id="companyName"
                    value={settings.companyName}
                    onChange={(e) => handleSettingChange('companyName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="companyEmail">Email de la Empresa</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={settings.companyEmail}
                    onChange={(e) => handleSettingChange('companyEmail', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyPhone">Teléfono</Label>
                  <Input
                    id="companyPhone"
                    value={settings.companyPhone}
                    onChange={(e) => handleSettingChange('companyPhone', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="companyAddress">Dirección</Label>
                  <Input
                    id="companyAddress"
                    value={settings.companyAddress}
                    onChange={(e) => handleSettingChange('companyAddress', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Configuración de Usuario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="userName">Nombre de Usuario</Label>
                  <Input
                    id="userName"
                    value={settings.userName}
                    onChange={(e) => handleSettingChange('userName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="userEmail">Email del Usuario</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    value={settings.userEmail}
                    onChange={(e) => handleSettingChange('userEmail', e.target.value)}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div>
                <Label>Cambiar Contraseña</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <Input type="password" placeholder="Nueva contraseña" />
                  <Input type="password" placeholder="Confirmar contraseña" />
                </div>
                <Button className="mt-2" variant="outline">
                  Actualizar Contraseña
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Configuración del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="currency">Moneda</Label>
                  <Select value={settings.currency} onValueChange={(value) => handleSettingChange('currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COP">Peso Colombiano ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                      <SelectItem value="USD">Dólar ($)</SelectItem>
                      <SelectItem value="GBP">Libra (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="language">Idioma</Label>
                  <Select value={settings.language} onValueChange={(value) => handleSettingChange('language', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="timezone">Zona Horaria</Label>
                  <Select value={settings.timezone} onValueChange={(value) => handleSettingChange('timezone', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Madrid">Madrid</SelectItem>
                      <SelectItem value="Europe/London">Londres</SelectItem>
                      <SelectItem value="America/New_York">Nueva York</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="theme">Tema</Label>
                <Select value={settings.theme} onValueChange={(value) => handleSettingChange('theme', value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Oscuro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificaciones por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Recibir notificaciones por correo electrónico
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(value) => handleSettingChange('emailNotifications', value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alertas de Stock Bajo</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificar cuando el stock sea bajo
                  </p>
                </div>
                <Switch
                  checked={settings.lowStockAlerts}
                  onCheckedChange={(value) => handleSettingChange('lowStockAlerts', value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Reportes de Ventas</Label>
                  <p className="text-sm text-muted-foreground">
                    Recibir reportes semanales de ventas
                  </p>
                </div>
                <Switch
                  checked={settings.salesReports}
                  onCheckedChange={(value) => handleSettingChange('salesReports', value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Inventario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="lowStockThreshold">Umbral de Stock Bajo</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  min="1"
                  value={settings.defaultLowStockThreshold}
                  onChange={(e) => handleSettingChange('defaultLowStockThreshold', parseInt(e.target.value) || 5)}
                  className="w-32"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Cantidad mínima antes de considerar stock bajo
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Reorden Automático</Label>
                  <p className="text-sm text-muted-foreground">
                    Reordenar automáticamente cuando el stock sea bajo
                  </p>
                </div>
                <Switch
                  checked={settings.automaticReorder}
                  onCheckedChange={(value) => handleSettingChange('automaticReorder', value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Datos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Exportar Datos</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Exportar todos los datos del sistema
                  </p>
                  <Button onClick={exportData} variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                </div>
                
                <div>
                  <Label>Importar Datos</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Importar datos desde un archivo
                  </p>
                  <Button onClick={importData} variant="outline" className="w-full">
                    <Upload className="mr-2 h-4 w-4" />
                    Importar
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <Label className="text-destructive">Zona de Peligro</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Estas acciones no se pueden deshacer
                </p>
                <Button variant="destructive" disabled>
                  <Shield className="mr-2 h-4 w-4" />
                  Eliminar Todos los Datos
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={saveSettings} size="lg">
          Guardar Configuración
        </Button>
      </div>
    </div>
  );
}
