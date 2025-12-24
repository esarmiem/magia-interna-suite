import { useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Megaphone, 
  Mail, 
  Copy, 
  Check, 
  Users, 
  Filter, 
  Send,
  ExternalLink,
  Code
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { emailTemplates } from '@/data/emailTemplates';

// Interfaces
interface Customer {
  id: string;
  name: string;
  email: string;
  total_purchases: number;
  last_purchase_date: string | null;
}

export function Promotions() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [promoLink, setPromoLink] = useState('https://wa.link/i5fg5k');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [filterType, setFilterType] = useState('all'); // all, top, recent, manual
  const [manualEmails, setManualEmails] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Constants
  const LOGO_URL = window.location.origin + '/magiainternalogo.webp';

  // Fetch Customers
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers-with-email'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, email, total_purchases, last_purchase_date')
        .not('email', 'is', null)
        .neq('email', '');
      
      if (error) throw error;
      return data as Customer[];
    },
  });

  // Filter Logic
  const filteredCustomers = useMemo(() => {
    switch (filterType) {
      case 'top':
        return customers.filter(c => (c.total_purchases || 0) > 100000).sort((a, b) => (b.total_purchases || 0) - (a.total_purchases || 0));
      case 'recent': {
        // Last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return customers.filter(c => c.last_purchase_date && new Date(c.last_purchase_date) > thirtyDaysAgo);
      }
      default:
        return customers;
    }
  }, [customers, filterType]);

  // Handle Template Selection
  const handleTemplateChange = (templateId: string) => {
    const template = emailTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setSubject(template.subject);
      setBody(template.body);
    }
  };

  // Selection Handlers
  const toggleCustomer = (id: string) => {
    setSelectedCustomers(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c.id));
    }
  };

  // Get final email list
  const getRecipientEmails = () => {
    const dbEmails = customers
      .filter(c => selectedCustomers.includes(c.id))
      .map(c => c.email);
    
    const manualList = manualEmails
      .split(/[\n,;]/)
      .map(e => e.trim())
      .filter(e => e.includes('@')); // Basic validation
      
    return [...new Set([...dbEmails, ...manualList])]; // Remove duplicates
  };

  // Actions
  const handleCopyEmails = () => {
    const emails = getRecipientEmails();
    if (emails.length === 0) {
      toast.error('No hay destinatarios seleccionados');
      return;
    }
    navigator.clipboard.writeText(emails.join(', '));
    toast.success(`${emails.length} correos copiados al portapapeles`);
  };

  const handleCopyFormatted = async () => {
    if (!previewRef.current) return;

    try {
      // Get the HTML content
      const htmlContent = previewRef.current.innerHTML;
      
      // We need to create a ClipboardItem with text/html
      // Also provide text/plain for fallback
      const textContent = previewRef.current.innerText;

      const blobHtml = new Blob([htmlContent], { type: 'text/html' });
      const blobText = new Blob([textContent], { type: 'text/plain' });

      const data = [new ClipboardItem({
        'text/html': blobHtml,
        'text/plain': blobText,
      })];

      await navigator.clipboard.write(data);
      toast.success('Diseño copiado. ¡Listo para pegar en Gmail/Outlook!');
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      toast.error('No se pudo copiar el formato. Intenta seleccionar y copiar manualmente.');
    }
  };

  const handleOpenMailClient = () => {
    const emails = getRecipientEmails();
    if (emails.length === 0) {
      toast.error('No hay destinatarios seleccionados');
      return;
    }
    
    // Mailto has limits, usually around 2000 chars. 
    // We warn if list is too long, but try anyway.
    const bcc = emails.join(',');
    const mailtoLink = `mailto:?bcc=${bcc}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body + (promoLink ? `\n\nVisita: ${promoLink}` : ''))}`;
    
    if (mailtoLink.length > 2000) {
      toast.warning('La lista es muy larga para abrir directamente. Mejor usa "Copiar Correos".');
    }
    
    window.open(mailtoLink, '_blank');
  };

  return (
    <div className="space-y-6 p-6 pb-20 md:pb-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Megaphone className="h-8 w-8 text-primary" />
            Promociones
          </h1>
          <p className="text-muted-foreground mt-1">
            Envía correos masivos y gestiona campañas promocionales.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Contenido</CardTitle>
              <CardDescription>Redacta y visualiza tu correo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="editor" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="editor">Editor</TabsTrigger>
                  <TabsTrigger value="preview">Vista Previa (Diseño)</TabsTrigger>
                </TabsList>

                <TabsContent value="editor" className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Plantilla</label>
                    <Select onValueChange={handleTemplateChange} value={selectedTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar plantilla..." />
                      </SelectTrigger>
                      <SelectContent>
                        {emailTemplates.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Asunto</label>
                    <Input 
                      placeholder="Ej: ¡Ofertas de Verano!" 
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mensaje</label>
                    <Textarea 
                      placeholder="Escribe tu mensaje aquí..." 
                      className="min-h-[200px]"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Enlace de Promoción (Opcional)</label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="https://magiainterna.com/ofertas" 
                        value={promoLink}
                        onChange={(e) => setPromoLink(e.target.value)}
                      />
                      {promoLink && (
                        <Button variant="outline" size="icon" asChild>
                          <a href={promoLink} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="space-y-4">
                  <div className="border rounded-lg p-4 bg-white min-h-[400px] overflow-auto">
                    {/* Preview Area - This structure is what gets copied */}
                    <div 
                      ref={previewRef} 
                      style={{ 
                        fontFamily: 'Arial, sans-serif', 
                        color: '#333', 
                        maxWidth: '600px', 
                        margin: '0 auto', 
                        textAlign: 'left' 
                      }}
                    >
                      {/* Body */}
                      <div style={{ padding: '20px 0', fontSize: '18px', lineHeight: '1.6' }}>
                        {body ? (
                          body.split('\n').map((line, i) => (
                            <p key={i} style={{ margin: '0 0 15px 0' }}>{line}</p>
                          ))
                        ) : (
                          <p style={{ color: '#999', fontStyle: 'italic' }}>Escribe un mensaje para ver la vista previa...</p>
                        )}
                        
                        {promoLink && (
                          <div style={{ margin: '30px 0', textAlign: 'center' }}>
                            <a 
                              href={promoLink} 
                              style={{ 
                                backgroundColor: '#572364', 
                                color: '#fff', 
                                padding: '12px 24px', 
                                textDecoration: 'none', 
                                borderRadius: '4px', 
                                fontWeight: 'bold',
                                display: 'inline-block'
                              }}
                            >
                              Pregúntame en Whatsapp
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div style={{ 
                        marginTop: '40px', 
                        paddingTop: '20px', 
                        borderTop: '1px solid #eee', 
                        fontSize: '12px', 
                        color: '#888',
                        textAlign: 'center'
                      }}>
                        <div style={{ marginBottom: '15px' }}>
                           <img 
                            src={LOGO_URL} 
                            alt="Magia Interna" 
                            width="50" 
                            height="50"
                            style={{ display: 'inline-block', marginBottom: '10px' }} 
                           />
                        </div>
                        <p style={{ margin: '5px 0' }}>Este email fue enviado por: <strong>Magia Interna</strong>.</p>
                        <p style={{ margin: '5px 0' }}>Por favor, no respondas a este email.</p>
                        <p style={{ margin: '5px 0' }}>Medellín, Colombia, CO.</p>
                        <p style={{ margin: '5px 0' }}>&copy; 2026 Magia Interna. Todos los derechos reservados.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 p-4 bg-muted/30 rounded-lg">
                     <Button onClick={handleCopyFormatted} className="w-full">
                       <Code className="mr-2 h-4 w-4" />
                       Copiar Diseño para Email
                     </Button>
                     <p className="text-xs text-muted-foreground text-center">
                       Copia este diseño y pégalo directamente en el cuerpo de tu correo (Gmail, Outlook) para mantener el formato, las imágenes y el estilo centrado.
                     </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Recipients */}
        <div className="space-y-6">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Destinatarios</CardTitle>
              <CardDescription>
                {getRecipientEmails().length} correos seleccionados
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
              <Tabs defaultValue="db" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="db">Clientes ERP</TabsTrigger>
                  <TabsTrigger value="manual">Manual</TabsTrigger>
                </TabsList>
                
                <TabsContent value="db" className="space-y-4 mt-4">
                  <div className="flex gap-2">
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filtrar por..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los clientes</SelectItem>
                        <SelectItem value="top">Mejores Compradores ({'>'}$100k)</SelectItem>
                        <SelectItem value="recent">Recientes (30 días)</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Users className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                        <DialogHeader>
                          <DialogTitle>Seleccionar Clientes Específicos</DialogTitle>
                          <DialogDescription>
                            Elige manualmente a quién enviar el correo.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 overflow-auto py-4">
                          <div className="space-y-2">
                             <div className="flex items-center space-x-2 pb-4 border-b">
                                <Checkbox 
                                  checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                                  onCheckedChange={selectAllFiltered}
                                />
                                <span className="text-sm font-medium">Seleccionar Todos los listados ({filteredCustomers.length})</span>
                             </div>
                             {isLoading ? (
                               <div className="text-center py-4">Cargando clientes...</div>
                             ) : filteredCustomers.length === 0 ? (
                               <div className="text-center py-4 text-muted-foreground">No hay clientes con email en este filtro.</div>
                             ) : (
                               filteredCustomers.map(customer => (
                                 <div key={customer.id} className="flex items-center justify-between p-2 hover:bg-accent rounded-md">
                                   <div className="flex items-center space-x-3">
                                     <Checkbox 
                                       checked={selectedCustomers.includes(customer.id)}
                                       onCheckedChange={() => toggleCustomer(customer.id)}
                                     />
                                     <div>
                                       <p className="font-medium text-sm">{customer.name}</p>
                                       <p className="text-xs text-muted-foreground">{customer.email}</p>
                                     </div>
                                   </div>
                                   <Badge variant="secondary" className="text-xs">
                                      ${(customer.total_purchases || 0).toLocaleString()}
                                   </Badge>
                                 </div>
                               ))
                             )}
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4 border-t">
                          <Button variant="secondary" onClick={() => setSelectedCustomers([])}>Limpiar</Button>
                          <Button onClick={() => setIsDialogOpen(false)}>Listo</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                    <p>
                      {filterType === 'all' && 'Mostrando todos los clientes con email.'}
                      {filterType === 'top' && 'Mostrando clientes con compras > $100,000.'}
                      {filterType === 'recent' && 'Mostrando clientes con compras en los últimos 30 días.'}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-medium text-foreground">{filteredCustomers.length} disponibles</span>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="h-auto p-0"
                        onClick={() => setIsDialogOpen(true)}
                      >
                        Ver / Editar selección
                      </Button>
                    </div>
                  </div>
                  
                  {selectedCustomers.length > 0 && (
                     <div className="bg-primary/10 text-primary rounded-lg p-3 text-sm font-medium flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        {selectedCustomers.length} clientes seleccionados
                     </div>
                  )}
                </TabsContent>

                <TabsContent value="manual" className="mt-4">
                  <Textarea 
                    placeholder="Ingresa correos separados por coma o salto de línea..."
                    className="min-h-[150px]"
                    value={manualEmails}
                    onChange={(e) => setManualEmails(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Útil para enviar a personas que no están en tu base de datos.
                  </p>
                </TabsContent>
              </Tabs>

              <div className="mt-auto space-y-3 pt-6 border-t">
                <Button className="w-full" onClick={handleOpenMailClient} disabled={getRecipientEmails().length === 0}>
                  <Mail className="mr-2 h-4 w-4" />
                  Abrir en App de Correo
                </Button>
                <Button variant="secondary" className="w-full" onClick={handleCopyEmails} disabled={getRecipientEmails().length === 0}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar Lista de Correos
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  * Al hacer clic en "Abrir", se intentará abrir tu cliente de correo predeterminado con los destinatarios en CCO (Copia Oculta).
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
