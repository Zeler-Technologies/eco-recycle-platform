import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  MessageSquare, 
  Settings, 
  Send, 
  Calendar, 
  Clock, 
  Phone,
  Edit,
  Save,
  RotateCcw,
  Eye,
  TestTube,
  Plus,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CustomerMessageManagementProps {
  onBack: () => void;
}

interface MessageTemplate {
  id: string;
  name: string;
  stage: string;
  content: string;
  enabled: boolean;
  trigger: string;
  variables: string[];
}

interface MessageLog {
  id: string;
  customer: string;
  phone: string;
  message: string;
  timestamp: string;
  status: 'sent' | 'failed' | 'pending';
  template: string;
  pickupId: string;
}

const defaultTemplates: MessageTemplate[] = [
  {
    id: '1',
    name: 'Hämtningsförfrågan mottagen',
    stage: 'request_received',
    content: 'Hej, Tack för att du använder Panta Bilen, vi återkommer när vi konfirmerat upphämtning av din bil med datum och tid.',
    enabled: true,
    trigger: 'Direkt efter att kunden skickat hämtningsförfrågan',
    variables: []
  },
  {
    id: '2',
    name: 'Hämtning bekräftad',
    stage: 'pickup_confirmed',
    content: 'Nu har vi hittat ett datum när vi kan hämta din bil, bilen hämtas (DATE), var vänlig kontrollera att bilen är upphämtningsbar vid hämtningstillfället.',
    enabled: true,
    trigger: 'När admin bekräftar datum och tilldelar förare',
    variables: ['DATE']
  },
  {
    id: '3',
    name: 'Påminnelse (dagen före)',
    stage: 'reminder',
    content: 'Imorgon den (DATE) kommer vi och hämtar din bil.',
    enabled: true,
    trigger: 'Automatiskt en dag före hämtningsdatum',
    variables: ['DATE']
  },
  {
    id: '4',
    name: 'Hämtning omschemalagd/inställd',
    stage: 'rescheduled',
    content: 'Hej, på grund av tekniska problem kan vi inte hämta din bil imorgon, vi återkommer med ny tid.',
    enabled: true,
    trigger: 'Manuellt när admin behöver ställa in/omschema hämtning',
    variables: []
  }
];

const mockMessageLogs: MessageLog[] = [
  {
    id: '1',
    customer: 'Anna Andersson',
    phone: '+46701234567',
    message: 'Hej, Tack för att du använder Panta Bilen...',
    timestamp: '2024-01-15 09:30:00',
    status: 'sent',
    template: 'Hämtningsförfrågan mottagen',
    pickupId: 'ORD001'
  },
  {
    id: '2',
    customer: 'Erik Johansson',
    phone: '+46701234568',
    message: 'Nu har vi hittat ett datum när vi kan hämta din bil...',
    timestamp: '2024-01-15 11:45:00',
    status: 'sent',
    template: 'Hämtning bekräftad',
    pickupId: 'ORD002'
  },
  {
    id: '3',
    customer: 'Maria Nilsson',
    phone: '+46701234569',
    message: 'Imorgon den 16 januari 2024 kommer vi och hämtar din bil.',
    timestamp: '2024-01-15 18:00:00',
    status: 'failed',
    template: 'Påminnelse (dagen före)',
    pickupId: 'ORD003'
  }
];

export const CustomerMessageManagement: React.FC<CustomerMessageManagementProps> = ({ onBack }) => {
  const [templates, setTemplates] = useState<MessageTemplate[]>(defaultTemplates);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [messageLogs] = useState<MessageLog[]>(mockMessageLogs);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [customTemplates, setCustomTemplates] = useState<MessageTemplate[]>([]);
  const [newCustomTemplate, setNewCustomTemplate] = useState({ name: '', content: '', stage: '' });
  const { toast } = useToast();

  const handleSaveTemplate = (template: MessageTemplate) => {
    setTemplates(prev => prev.map(t => t.id === template.id ? template : t));
    setEditingTemplate(null);
    toast({
      title: "Mall sparad",
      description: "SMS-mallen har uppdaterats framgångsrikt.",
    });
  };

  const handleToggleTemplate = (templateId: string, enabled: boolean) => {
    setTemplates(prev => prev.map(t => 
      t.id === templateId ? { ...t, enabled } : t
    ));
    toast({
      title: enabled ? "Mall aktiverad" : "Mall inaktiverad",
      description: `SMS-mallen är nu ${enabled ? 'aktiverad' : 'inaktiverad'}.`,
    });
  };

  const handleTestSend = (template: MessageTemplate) => {
    if (!testPhoneNumber) {
      toast({
        title: "Telefonnummer saknas",
        description: "Ange ett telefonnummer för att skicka testmeddelande.",
        variant: "destructive",
      });
      return;
    }

    // Simulate test send
    toast({
      title: "Testmeddelande skickat",
      description: `Testmeddelande skickat till ${testPhoneNumber}`,
    });
  };

  const handleResetTemplate = (templateId: string) => {
    const defaultTemplate = defaultTemplates.find(t => t.id === templateId);
    if (defaultTemplate) {
      setTemplates(prev => prev.map(t => 
        t.id === templateId ? { ...t, content: defaultTemplate.content } : t
      ));
      toast({
        title: "Mall återställd",
        description: "Mallen har återställts till standardtext.",
      });
    }
  };

  const handleAddCustomTemplate = () => {
    if (!newCustomTemplate.name || !newCustomTemplate.content || !newCustomTemplate.stage) {
      toast({
        title: "Ofullständig information",
        description: "Fyll i alla fält för den nya mallen.",
        variant: "destructive",
      });
      return;
    }

    const customTemplate: MessageTemplate = {
      id: `custom_${Date.now()}`,
      name: newCustomTemplate.name,
      stage: newCustomTemplate.stage,
      content: newCustomTemplate.content,
      enabled: true,
      trigger: 'Anpassad utlösare',
      variables: []
    };

    setCustomTemplates(prev => [...prev, customTemplate]);
    setNewCustomTemplate({ name: '', content: '', stage: '' });
    toast({
      title: "Anpassad mall skapad",
      description: "Den nya mallen har lagts till framgångsrikt.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-status-completed text-white';
      case 'failed': return 'bg-destructive text-white';
      case 'pending': return 'bg-status-processing text-white';
      default: return 'bg-muted';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent': return 'Skickat';
      case 'failed': return 'Misslyckades';
      case 'pending': return 'Väntar';
      default: return status;
    }
  };

  return (
    <div className="theme-tenant min-h-screen bg-tenant-muted">
      {/* Header */}
      <header className="bg-tenant-primary text-tenant-primary-foreground shadow-custom-md">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-tenant-primary-foreground hover:bg-tenant-primary-foreground/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tillbaka
            </Button>
            <div className="flex items-center gap-3">
              <MessageSquare className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Meddelanden till kund</h1>
                <p className="text-tenant-primary-foreground/80">Hantera automatiska SMS-meddelanden</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        <Tabs defaultValue="templates" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="templates">SMS-mallar</TabsTrigger>
            <TabsTrigger value="logs">Meddelandehistorik</TabsTrigger>
            <TabsTrigger value="settings">Inställningar</TabsTrigger>
            <TabsTrigger value="custom">Anpassade mallar</TabsTrigger>
          </TabsList>

          {/* SMS Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <Card className="bg-white shadow-custom-sm">
              <CardHeader>
                <CardTitle className="text-tenant-primary">SMS-mallar</CardTitle>
                <CardDescription>
                  Hantera och anpassa standardmeddelanden som skickas till kunderna
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {templates.map((template) => (
                  <Card key={template.id} className="border">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-tenant-accent rounded-full">
                            <MessageSquare className="h-4 w-4 text-tenant-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                            <CardDescription>{template.trigger}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={template.enabled}
                            onCheckedChange={(enabled) => handleToggleTemplate(template.id, enabled)}
                          />
                          <Badge variant={template.enabled ? "default" : "secondary"}>
                            {template.enabled ? 'Aktiverad' : 'Inaktiverad'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-tenant-accent/20 rounded-lg">
                        <p className="text-sm font-medium mb-2">Nuvarande meddelande:</p>
                        <p className="text-sm">{template.content}</p>
                        {template.variables.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground">Variabler: {template.variables.join(', ')}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setEditingTemplate(template)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Redigera
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Redigera SMS-mall: {template.name}</DialogTitle>
                              <DialogDescription>
                                Anpassa meddelandet som skickas till kunderna
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="template-content">Meddelandetext</Label>
                                <Textarea
                                  id="template-content"
                                  value={editingTemplate?.content || template.content}
                                  onChange={(e) => setEditingTemplate(prev => 
                                    prev ? { ...prev, content: e.target.value } : null
                                  )}
                                  placeholder="Skriv ditt meddelande här..."
                                  className="min-h-32"
                                />
                                {template.variables.length > 0 && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Tillgängliga variabler: {template.variables.join(', ')}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => editingTemplate && handleSaveTemplate(editingTemplate)}
                                  className="bg-tenant-primary hover:bg-tenant-primary/90"
                                >
                                  <Save className="h-4 w-4 mr-2" />
                                  Spara ändringar
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => handleResetTemplate(template.id)}
                                >
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Återställ
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestSend(template)}
                        >
                          <TestTube className="h-4 w-4 mr-2" />
                          Testa
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Message Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <Card className="bg-white shadow-custom-sm">
              <CardHeader>
                <CardTitle className="text-tenant-primary">Meddelandehistorik</CardTitle>
                <CardDescription>Översikt över skickade SMS-meddelanden</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kund</TableHead>
                        <TableHead>Telefon</TableHead>
                        <TableHead>Mall</TableHead>
                        <TableHead>Tidpunkt</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ärende-ID</TableHead>
                        <TableHead className="text-right">Åtgärder</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {messageLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">{log.customer}</TableCell>
                          <TableCell>{log.phone}</TableCell>
                          <TableCell>{log.template}</TableCell>
                          <TableCell className="text-muted-foreground">{log.timestamp}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(log.status)}>
                              {getStatusText(log.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>{log.pickupId}</TableCell>
                          <TableCell className="text-right">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Meddelandedetaljer</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Kund</Label>
                                    <p className="text-sm font-medium">{log.customer}</p>
                                  </div>
                                  <div>
                                    <Label>Telefonnummer</Label>
                                    <p className="text-sm font-medium">{log.phone}</p>
                                  </div>
                                  <div>
                                    <Label>Meddelande</Label>
                                    <div className="p-3 bg-muted rounded-md">
                                      <p className="text-sm">{log.message}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Status</Label>
                                    <Badge className={getStatusColor(log.status)}>
                                      {getStatusText(log.status)}
                                    </Badge>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-white shadow-custom-sm">
              <CardHeader>
                <CardTitle className="text-tenant-primary">SMS-inställningar</CardTitle>
                <CardDescription>Konfigurera SMS-leverans och testfunktioner</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="test-phone">Testtelefonnummer</Label>
                    <Input
                      id="test-phone"
                      placeholder="+46701234567"
                      value={testPhoneNumber}
                      onChange={(e) => setTestPhoneNumber(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Ange telefonnummer för att testa SMS-mallar
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Settings className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800">SMS-leverans kräver konfiguration</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        För att skicka riktiga SMS-meddelanden behöver du integrera med en SMS-leverantör som Twilio. 
                        Detta kräver backend-funktionalitet som kan aktiveras genom att ansluta till Supabase.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Custom Templates Tab */}
          <TabsContent value="custom" className="space-y-6">
            <Card className="bg-white shadow-custom-sm">
              <CardHeader>
                <CardTitle className="text-tenant-primary">Anpassade mallar</CardTitle>
                <CardDescription>Skapa egna SMS-mallar för specifika situationer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle className="text-lg">Skapa ny mall</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="template-name">Mallnamn</Label>
                      <Input
                        id="template-name"
                        placeholder="t.ex. Speciell påminnelse"
                        value={newCustomTemplate.name}
                        onChange={(e) => setNewCustomTemplate(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="template-stage">Utlösarsteg</Label>
                      <Select
                        value={newCustomTemplate.stage}
                        onValueChange={(value) => setNewCustomTemplate(prev => ({ ...prev, stage: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Välj när meddelandet ska skickas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="greeting">Hälsning</SelectItem>
                          <SelectItem value="confirming">Bekräftelse</SelectItem>
                          <SelectItem value="heads_up">Påminnelse</SelectItem>
                          <SelectItem value="pickup_confirmation">Hämtningsbekräftelse</SelectItem>
                          <SelectItem value="followup">Uppföljning</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="template-custom-content">Meddelandetext</Label>
                      <Textarea
                        id="template-custom-content"
                        placeholder="Skriv ditt anpassade meddelande här..."
                        value={newCustomTemplate.content}
                        onChange={(e) => setNewCustomTemplate(prev => ({ ...prev, content: e.target.value }))}
                        className="min-h-24"
                      />
                    </div>
                    <Button
                      onClick={handleAddCustomTemplate}
                      className="bg-tenant-primary hover:bg-tenant-primary/90"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Skapa mall
                    </Button>
                  </CardContent>
                </Card>

                {/* Display Custom Templates */}
                {customTemplates.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Dina anpassade mallar</h3>
                    {customTemplates.map((template) => (
                      <Card key={template.id} className="border">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{template.name}</CardTitle>
                              <CardDescription>Steg: {template.stage}</CardDescription>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCustomTemplates(prev => prev.filter(t => t.id !== template.id))}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="p-3 bg-muted/50 rounded-md">
                            <p className="text-sm">{template.content}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};