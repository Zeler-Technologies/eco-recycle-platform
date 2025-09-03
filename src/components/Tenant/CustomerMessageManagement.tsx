import React, { useState, useEffect } from 'react';
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
  Trash2,
  AlertTriangle,
  Smartphone
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatSwedishDateTime, formatSwedishPhone, formatSwedishDate, formatSwedishCurrency } from '@/utils/swedishFormatting';
import { validateSwedishPNR } from '@/utils/swedishValidation';
import { fixSwedishEncoding, fixObjectEncoding, getUTF8Headers } from '@/utils/swedishEncoding';

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
  cost_amount?: number;
}

interface CustomMessageTemplate {
  id: string;
  tenant_id: number;
  template_type: 'initial_owner' | 'initial_non_owner' | 'pickup_confirmed' | 'transport_message';
  template_name: string;
  content: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
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
  const [customTemplates, setCustomTemplates] = useState<CustomMessageTemplate[]>([]);
  const [editingCustomTemplate, setEditingCustomTemplate] = useState<CustomMessageTemplate | null>(null);
  const [newCustomTemplate, setNewCustomTemplate] = useState<Partial<CustomMessageTemplate>>({
    template_type: 'initial_owner',
    template_name: '',
    content: 'Hej [namn]! Vi har mottagit din förfrågan för bil [registreringsnummer] med kontrollnummer [kontrollnummer]. Hämtningsdatum: [datum]. Tack för att du använder Panta Bilen!',
    is_active: true
  });
  const [showPhonePreview, setShowPhonePreview] = useState(false);
  const [phonePreviewMessage, setPhonePreviewMessage] = useState('');
  const [previewData, setPreviewData] = useState({
    namn: 'Anna Andersson',
    registreringsnummer: 'ABC123',
    kontrollnummer: 'CTRL456789',
    datum: '2024-01-25',
    telefon: '+46701234567'
  });
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Use tenant_id directly from user
  const tenantId = user?.tenant_id || null;

  const handleSaveTemplate = async (template: MessageTemplate) => {
    // Save to memory for UI
    setTemplates(prev => prev.map(t => t.id === template.id ? template : t));
    
    // Save to database
    try {
      const { error } = await supabase
        .from('custom_message_templates')
        .upsert({
          tenant_id: tenantId,
          template_type: template.stage,
          template_name: template.name,
          content: template.content,
          is_active: template.enabled,
          estimated_sms_count: Math.ceil(template.content.length / 160),
          estimated_cost_sek: Math.ceil(template.content.length / 160) * 0.35
        });

      if (error) throw error;

      setEditingTemplate(null);
      toast({
        title: "Mall sparad",
        description: "SMS-mallen har uppdaterats i databasen.",
      });
    } catch (error) {
      toast({
        title: "Fel vid sparande",
        description: "Kunde inte spara mallen till databasen.",
        variant: "destructive",
      });
    }
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

  // Load custom templates and message history on component mount
  useEffect(() => {
    if (tenantId) {
      loadCustomTemplates();
      loadMessageHistory();
    }
  }, [tenantId]);

  const loadCustomTemplates = async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from('custom_message_templates')
        .select('*')
        .eq('tenant_id', tenantId);

      if (error) throw error;
      setCustomTemplates((data || []) as CustomMessageTemplate[]);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Fel vid laddning",
        description: "Kunde inte ladda anpassade mallar.",
        variant: "destructive",
      });
    }
  };

  const handleToggleCustomTemplate = async (templateId: string, isActive: boolean) => {
    if (!tenantId) return;
    try {
      const { error } = await supabase
        .from('custom_message_templates')
        .update({ is_active: isActive })
        .eq('id', templateId)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      // Optimistic update
      setCustomTemplates(prev => prev.map(t => t.id === templateId ? { ...t, is_active: isActive } : t));

      toast({
        title: isActive ? 'Mall aktiverad' : 'Mall inaktiverad',
        description: `Mallen är nu ${isActive ? 'aktiv' : 'inaktiv'}.`,
      });
    } catch (err) {
      console.error('Error toggling template status:', err);
      toast({
        title: 'Fel vid uppdatering',
        description: 'Kunde inte ändra mallens status.',
        variant: 'destructive',
      });
    }
  };

  // Load message history from database
  const [messageHistory, setMessageHistory] = useState<MessageLog[]>([]);

  const loadMessageHistory = async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from('sms_logs')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Transform database data to match MessageLog interface with cost
      const transformedData = (data || []).map(record => ({
        id: record.id.toString(),
        customer: record.recipient_name || 'Okänd',
        phone: record.recipient_phone || 'Okänt',
        message: record.message_content,
        timestamp: record.created_at,
        status: (['sent', 'failed', 'pending'].includes(record.status) ? record.status : 'pending') as 'sent' | 'failed' | 'pending',
        template: record.message_type || 'Okänd mall',
        pickupId: record.pickup_order_id || 'N/A',
        cost_amount: record.cost_amount || 0
      }));
      
      setMessageHistory(transformedData);
    } catch (error) {
      console.error('Error loading message history:', error);
      toast({
        title: "Fel vid laddning",
        description: "Kunde inte ladda meddelandehistorik.",
        variant: "destructive",
      });
    }
  };

  const validateRequiredVariables = (content: string): boolean => {
    const requiredVariables = ['[namn]', '[registreringsnummer]', '[kontrollnummer]', '[datum]'];
    const fixedContent = fixSwedishEncoding(content);
    return requiredVariables.every(variable => fixedContent.includes(variable));
  };

  const handleSaveCustomTemplate = async (template: CustomMessageTemplate) => {
    if (!tenantId) return;

    if (!validateRequiredVariables(template.content)) {
      toast({
        title: fixSwedishEncoding("Saknade variabler"),
        description: fixSwedishEncoding("Mallen måste innehålla [namn], [registreringsnummer], [kontrollnummer] och [datum]."),
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('custom_message_templates')
        .upsert({
          id: template.id,
          tenant_id: tenantId,
          template_type: template.template_type,
          template_name: fixSwedishEncoding(template.template_name),
          content: fixSwedishEncoding(template.content),
          is_active: template.is_active
        });

      if (error) throw error;

      await loadCustomTemplates();
      setEditingCustomTemplate(null);
      
      toast({
        title: fixSwedishEncoding("Mall sparad"),
        description: fixSwedishEncoding("Anpassad mall har uppdaterats framgångsrikt."),
      });
    } catch (error) {
      toast({
        title: "Fel vid sparande",
        description: "Kunde inte spara mallen.",
        variant: "destructive",
      });
    }
  };

  const handleCreateNewTemplate = async () => {
    if (!tenantId || !newCustomTemplate.template_name || !newCustomTemplate.content) {
      toast({
        title: "Obligatoriska fält saknas",
        description: "Mallnamn och innehåll är obligatoriska.",
        variant: "destructive",
      });
      return;
    }

    if (!validateRequiredVariables(newCustomTemplate.content)) {
      toast({
        title: "Saknade variabler",
        description: "Mallen måste innehålla [namn], [registreringsnummer], [kontrollnummer] och [datum].",
        variant: "destructive",
      });
      return;
    }

    try {
      const estimatedSMSCount = Math.ceil(newCustomTemplate.content.length / 160);
      const estimatedCost = estimatedSMSCount * 0.35;

      const { error } = await supabase
        .from('custom_message_templates')
        .insert({
          tenant_id: tenantId,
          template_type: newCustomTemplate.template_type!,
          template_name: newCustomTemplate.template_name,
          content: newCustomTemplate.content,
          is_active: newCustomTemplate.is_active ?? true,
          estimated_sms_count: estimatedSMSCount,
          estimated_cost_sek: estimatedCost
        });

      if (error) throw error;

      await loadCustomTemplates();
      setNewCustomTemplate({
        template_type: 'initial_owner',
        template_name: '',
        content: 'Hej [namn]! Vi har mottagit din förfrågan för bil [registreringsnummer] med kontrollnummer [kontrollnummer]. Hämtningsdatum: [datum]. Tack för att du använder Panta Bilen!',
        is_active: true
      });
      
      toast({
        title: "Mall skapad",
        description: "Ny anpassad mall har skapats framgångsrikt.",
      });
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: "Fel vid skapande",
        description: "Kunde inte skapa mallen.",
        variant: "destructive",
      });
    }
  };

  // SMS Cost Calculator Component
  const SMSCostPreview = ({ content }: { content: string }) => {
    const smsCount = Math.ceil(content.length / 160);
    const cost = smsCount * 0.35;
    
    return (
      <div className="flex justify-between items-center text-sm p-2 bg-tenant-accent/10 rounded">
        <span>Tecken: {content.length}/160</span>
        <span>SMS: {smsCount} st</span>
        <span className="font-semibold text-tenant-primary">Kostnad: {cost.toFixed(2)} SEK</span>
      </div>
    );
  };

// Trigger Rules Manager Component
  const TriggerRulesManager = () => {
    const [triggerRules, setTriggerRules] = useState<any[]>([]);
    const [localStates, setLocalStates] = useState<Record<string, boolean>>({});

    const triggerEvents = [
      { key: 'booking_confirmed', label: 'Bokning bekräftad', description: 'Skickas när hämtning bekräftas av admin' },
      { key: 'driver_assigned', label: 'Förare tilldelad', description: 'Skickas när förare tilldelas en hämtning' },
      { key: 'driver_en_route', label: 'Förare på väg', description: 'Skickas när föraren startar resan till kunden' },
      { key: 'pickup_completed', label: 'Hämtning slutförd', description: 'Skickas när bilen har hämtats' }
    ];

    // Function to get template name by ID
    const getTemplateName = (templateId: string | null, templateType?: string) => {
      if (!templateId) return "Ingen mall vald";
      
      // Handle standard templates
      if (templateType === 'standard' || templateId.startsWith('standard_')) {
        const actualId = templateId.replace('standard_', '');
        const standardTemplate = templates.find(t => t.id === actualId);
        if (standardTemplate) {
          return `${standardTemplate.name} (Standard)`;
        }
      }
      
      // Handle custom templates
      const customTemplate = customTemplates.find(t => t.id === templateId);
      if (customTemplate) {
        return `${customTemplate.template_name} (Anpassad)`;
      }
      
      return "Mall ej hittad";
    };

    const loadTriggerRules = async () => {
      if (!tenantId) return;

      console.log('🔄 LOADING TRIGGER RULES...');

      try {
        // Using direct SQL query instead of typed client
        const { data, error } = await supabase
          .from('sms_trigger_rules' as any)
          .select('*')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false }); // Get newest first

        if (error) throw error;
        console.log('🔄 RAW TRIGGER RULES LOADED:', data?.length, 'rules');
        
        // Remove duplicates, keeping the newest rule for each trigger_event
        const uniqueRules = data?.reduce((acc: any[], rule: any) => {
          const existingIndex = acc.findIndex(r => r.trigger_event === rule.trigger_event);
          if (existingIndex === -1) {
            acc.push(rule);
          }
          return acc;
        }, []) || [];
        
        console.log('🔄 UNIQUE TRIGGER RULES AFTER DEDUPLICATION:', uniqueRules.map(r => ({
          event: r.trigger_event,
          enabled: r.is_enabled,
          id: r.id
        })));
        
        setTriggerRules(uniqueRules);
        console.log('🔄 TRIGGER RULES STATE UPDATED');
      } catch (error) {
        console.error('🔴 Error loading trigger rules:', error);
      }
    };

    const saveTriggerRule = async (rule: any) => {
      if (!tenantId) return;

      console.log('🔵 SAVE TRIGGER RULE CALLED:', {
        event: rule.event,
        enabled: rule.enabled,
        timestamp: new Date().toISOString()
      });

      // Log current state of all buttons before save
      console.log('🔵 CURRENT LOCAL STATES BEFORE SAVE:', { ...localStates });
      console.log('🔵 CURRENT TRIGGER RULES BEFORE SAVE:', triggerRules.map(r => ({
        event: r.trigger_event,
        enabled: r.is_enabled,
        id: r.id
      })));

      try {
        const { error } = await supabase
          .from('sms_trigger_rules' as any)
          .upsert({
            tenant_id: tenantId,
            trigger_event: rule.event,
            template_id: rule.templateId,
            delay_minutes: rule.delayMinutes || 0,
            trigger_sequence: rule.sequence || 1,
            is_enabled: rule.enabled,
            description: rule.description
          });

        if (error) throw error;
        
        console.log('🟢 DATABASE SAVE SUCCESSFUL for event:', rule.event);
        
        // Reload trigger rules to get updated data
        await loadTriggerRules();
        
        toast({
          title: "Trigger-regel sparad",
          description: "Automatisk SMS-regel har uppdaterats.",
        });
      } catch (error) {
        console.error('🔴 Error saving trigger rule:', error);
        // Only revert the specific button's local state on error
        setLocalStates(prev => ({ ...prev, [rule.event]: !rule.enabled }));
        toast({
          title: "Fel vid sparande",
          description: "Kunde inte spara trigger-regel.",
          variant: "destructive",
        });
      }
    };

    useEffect(() => {
      if (tenantId) {
        loadTriggerRules();
      }
    }, [tenantId]); // Only reload when tenantId changes, not on every state update

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-tenant-primary">Automatiska meddelanden</h3>
          <Badge variant="outline">Trigger-regler</Badge>
        </div>
        
        {triggerEvents.map(event => {
          const existingRule = triggerRules.find(r => r.trigger_event === event.key);
          console.log('Rendering event:', event.key, 'Found rules:', triggerRules.filter(r => r.trigger_event === event.key), 'Selected rule:', existingRule);
          
          return (
            <Card key={event.key} className="border border-tenant-accent/20">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Switch
                        checked={localStates[event.key] ?? existingRule?.is_enabled ?? false}
                        onCheckedChange={(enabled) => {
                          console.log('🟡 SWITCH TOGGLED START:', { 
                            event: event.key, 
                            enabled, 
                            existingRule: existingRule?.id,
                            currentLocalState: localStates[event.key],
                            allLocalStates: { ...localStates }
                          });
                          
                          // Update local state immediately for visual feedback
                          setLocalStates(prev => {
                            const newState = { ...prev, [event.key]: enabled };
                            console.log('🟡 LOCAL STATE UPDATED:', { 
                              event: event.key, 
                              newEnabled: enabled,
                              allStates: newState 
                            });
                            return newState;
                          });
                          
                          saveTriggerRule({
                            event: event.key,
                            enabled,
                            templateId: existingRule?.template_id || null,
                            delayMinutes: existingRule?.delay_minutes || 0,
                            sequence: 1,
                            description: event.description
                          });
                        }}
                      />
                      <div>
                        <h4 className="font-medium">{event.label}</h4>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      </div>
                    </div>
                    
                      <div className="mt-3 ml-8 space-y-2">
                        <div className="flex gap-3 items-end flex-wrap">
                          <div className="flex flex-col">
                            <label className="text-sm font-medium mb-1">SMS‑mall</label>
                            <Select 
                              value={existingRule?.template_id || ''}
                              onValueChange={(templateId) => {
                                console.log('🔵 Template selection DEBUG:', {
                                  selectedTemplateId: templateId,
                                  currentTemplateId: existingRule?.template_id,
                                  event: event.key,
                                  availableTemplates: templates.map(t => ({ id: t.id, name: t.name })),
                                  availableCustomTemplates: customTemplates.map(t => ({ id: t.id, name: t.template_name })),
                                  existingRule: existingRule
                                });
                                
                                // Only save custom template UUIDs, not default template string IDs
                                const isCustomTemplate = customTemplates.find(t => t.id === templateId);
                                
                                if (isCustomTemplate) {
                                  saveTriggerRule({
                                    ...existingRule,
                                    templateId: templateId, // UUID for custom templates
                                    event: event.key,
                                    enabled: existingRule?.is_enabled || false,
                                    delayMinutes: existingRule?.delay_minutes || 0,
                                    sequence: existingRule?.trigger_sequence || 1,
                                    description: event.description
                                  });
                                } else {
                                  // For default templates, save null since we can't store string IDs in UUID field
                                  saveTriggerRule({
                                    ...existingRule,
                                    templateId: null,
                                    event: event.key,
                                    enabled: existingRule?.is_enabled || false,
                                    delayMinutes: existingRule?.delay_minutes || 0,
                                    sequence: existingRule?.trigger_sequence || 1,
                                    description: event.description
                                  });
                                  
                                  toast({
                                    title: "Observera",
                                    description: "Standardmallar kan inte sparas i trigger-regler ännu. Använd anpassade mallar istället.",
                                    variant: "destructive"
                                  });
                                }
                              }}
                              disabled={!existingRule?.is_enabled}
                            >
                              <SelectTrigger className="w-64">
                                <SelectValue placeholder="Välj SMS-mall" />
                              </SelectTrigger>
                              <SelectContent>
                                {/* Show custom templates only (since only these work with UUID field) */}
                                {customTemplates.filter(t => t.is_active).map(template => (
                                  <SelectItem key={template.id} value={template.id}>
                                    {template.template_name}
                                  </SelectItem>
                                ))}
                                {customTemplates.length === 0 && (
                                  <SelectItem value="" disabled>
                                    Inga anpassade mallar skapade ännu
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            {!existingRule?.is_enabled && (
                              <span className="text-xs text-muted-foreground mt-1">Aktivera regeln för att ändra mall.</span>
                            )}
                          </div>
                          
                          <div className="flex flex-col">
                            <label className="text-sm font-medium mb-1">Fördröjning (minuter)</label>
                            <Input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              placeholder="Fördröjning (min)"
                              value={existingRule?.delay_minutes ?? 0}
                              onChange={(e) => {
                                // Save immediately but keep input responsive
                                const delay = parseInt(e.target.value || '0');
                                saveTriggerRule({
                                  ...existingRule,
                                  delayMinutes: isNaN(delay) ? 0 : delay,
                                  event: event.key
                                });
                              }}
                              aria-label="Fördröjning i minuter"
                              title="Antal minuter att vänta efter händelsen innan SMS skickas"
                              className="w-40"
                              disabled={!existingRule?.is_enabled}
                            />
                            <span className="text-xs text-muted-foreground mt-1">Hur många minuter efter händelsen SMS:et ska skickas.</span>
                          </div>
                        </div>
                      </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  // Monthly SMS Usage Widget
  const MonthlySMSUsage = () => {
    const [monthlyUsage, setMonthlyUsage] = useState({ count: 0, cost: 0 });

    useEffect(() => {
      const loadMonthlyUsage = async () => {
        if (!tenantId) return;

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        try {
          const { data, error } = await supabase
            .from('sms_logs')
            .select('cost_amount')
            .eq('tenant_id', tenantId)
            .gte('created_at', startOfMonth.toISOString());

          if (error) throw error;

          if (data) {
            const totalCost = data.reduce((sum, msg) => sum + (msg.cost_amount || 0), 0);
            setMonthlyUsage({ count: data.length, cost: totalCost });
          }
        } catch (error) {
          console.error('Error loading monthly usage:', error);
        }
      };

      loadMonthlyUsage();
    }, [tenantId]);

    return (
      <Card className="bg-tenant-accent/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-tenant-primary">Månatlig SMS-användning</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Skickade meddelanden:</span>
              <span className="font-semibold">{monthlyUsage.count}</span>
            </div>
            <div className="flex justify-between">
              <span>Total kostnad:</span>
              <span className="font-semibold text-tenant-primary">{monthlyUsage.cost.toFixed(2)} SEK</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Workflow Integration - SMS Automation
  const handlePickupStatusChange = async (pickupOrderId: string, newStatus: string) => {
    if (!tenantId) return;

    const triggerMap: Record<string, string> = {
      'confirmed': 'booking_confirmed',
      'assigned': 'driver_assigned',
      'en_route': 'driver_en_route',
      'completed': 'pickup_completed'
    };

    if (triggerMap[newStatus]) {
      try {
        // Create a mock SMS automation for now - replace with actual function when available
        const automationResult = {
          success: true,
          messages_queued: 1
        };

        if (automationResult.success) {
          toast({
            title: "SMS skickade",
            description: `${automationResult.messages_queued} SMS meddelanden skickades automatiskt`,
          });
          
          // Log the SMS to database
          await supabase
            .from('sms_logs' as any)
            .insert({
              tenant_id: tenantId,
              pickup_order_id: pickupOrderId,
              recipient_phone: '+46701234567', // Would be fetched from pickup order
              recipient_name: 'Kund', // Would be fetched from pickup order
              message_content: `Statusuppdatering: ${newStatus}`,
              message_type: triggerMap[newStatus],
              status: 'sent',
              cost_amount: 0.35,
              created_at: new Date().toISOString()
            });
        }
      } catch (error) {
        console.error('SMS automation failed:', error);
        toast({
          title: "SMS-fel",
          description: "Automatiska SMS kunde inte skickas",
          variant: "destructive",
        });
      }
    }
  };

  const handleTestMessageLook = (message: string) => {
    setPhonePreviewMessage(generatePreview(message));
    setShowPhonePreview(true);
  };

  const generatePreview = (template: string): string => {
    return template
      .replace(/\[namn\]/g, previewData.namn)
      .replace(/\[registreringsnummer\]/g, previewData.registreringsnummer)
      .replace(/\[kontrollnummer\]/g, previewData.kontrollnummer)
      .replace(/\[datum\]/g, formatSwedishDate(previewData.datum))
      .replace(/\[telefon\]/g, formatSwedishPhone(previewData.telefon))
      .replace(/\[basadress\]/g, 'Ekenäsvägen 28, 863 37 Sundsvall')
      .replace(/\[bonusbelopp\]/g, formatSwedishCurrency(50000)); // 500 SEK in öre
  };

  // Add phone number validation
  const validatePhoneNumber = (phone: string): boolean => {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 && (digits.startsWith('07') || digits.startsWith('4607'));
  };

  const getTemplateTypeDisplayName = (type: string): string => {
    switch (type) {
      case 'initial_owner': return 'Initial förfrågan - Bilägare';
      case 'initial_non_owner': return 'Initial förfrågan - Ej bilägare';
      case 'pickup_confirmed': return 'Hämtning bekräftad';
      case 'transport_message': return 'Transportmeddelande';
      default: return type;
    }
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
                               {editingTemplate && <SMSCostPreview content={editingTemplate.content} />}
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
                         <TableHead>Kostnad</TableHead>
                         <TableHead>Ärende-ID</TableHead>
                        <TableHead className="text-right">Åtgärder</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {messageHistory.map((log) => (
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
                           <TableCell className="text-muted-foreground">0.35 SEK</TableCell>
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
             {/* Monthly SMS Usage Widget */}
             <MonthlySMSUsage />
             
             {/* Trigger Rules Manager */}
             <Card className="bg-white shadow-custom-sm">
               <CardHeader>
                 <CardTitle className="text-tenant-primary">Automatisering</CardTitle>
                 <CardDescription>Konfigurera automatiska SMS-meddelanden baserat på händelser</CardDescription>
               </CardHeader>
               <CardContent>
                 <TriggerRulesManager />
               </CardContent>
             </Card>
             
             <Card className="bg-white shadow-custom-sm">
               <CardHeader>
                 <CardTitle className="text-tenant-primary">SMS-inställningar</CardTitle>
                 <CardDescription>Konfigurera SMS-leverans och testfunktioner</CardDescription>
               </CardHeader>
                <CardContent className="space-y-6">
                {user?.role === 'super_admin' ? (
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
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-800">SMS-översikt</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          SMS-inställningar hanteras av systemadministratören. Du kan se användningsstatistik och hantera mallar.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Custom Templates Tab */}
          <TabsContent value="custom" className="space-y-6">
            {/* Information Card */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Obligatoriska variabler</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Alla mallar måste innehålla följande variabler: <strong>[namn]</strong>, <strong>[registreringsnummer]</strong>, <strong>[kontrollnummer]</strong>, <strong>[datum]</strong>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview Data Configuration */}
            <Card className="bg-white shadow-custom-sm">
              <CardHeader>
                <CardTitle className="text-tenant-primary">Förhandsgranskningsdata</CardTitle>
                <CardDescription>Anpassa exempeldata för förhandsgranskning av mallar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="preview-namn">Namn</Label>
                    <Input
                      id="preview-namn"
                      value={previewData.namn}
                      onChange={(e) => setPreviewData(prev => ({ ...prev, namn: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="preview-registreringsnummer">Registreringsnummer</Label>
                    <Input
                      id="preview-registreringsnummer"
                      value={previewData.registreringsnummer}
                      onChange={(e) => setPreviewData(prev => ({ ...prev, registreringsnummer: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="preview-kontrollnummer">Kontrollnummer</Label>
                    <Input
                      id="preview-kontrollnummer"
                      value={previewData.kontrollnummer}
                      onChange={(e) => setPreviewData(prev => ({ ...prev, kontrollnummer: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="preview-datum">Datum</Label>
                    <Input
                      id="preview-datum"
                      value={previewData.datum}
                      onChange={(e) => setPreviewData(prev => ({ ...prev, datum: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => handleTestMessageLook(newCustomTemplate.content || '')}
                    className="flex-1"
                  >
                    <Smartphone className="h-4 w-4 mr-2" />
                    Testa meddelandets utseende
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Create New Template */}
            <Card className="bg-white shadow-custom-sm">
              <CardHeader>
                <CardTitle className="text-tenant-primary">Skapa ny mall</CardTitle>
                <CardDescription>Skapa en ny anpassad meddelandemall</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="new-template-name">Mallnamn</Label>
                    <Input
                      id="new-template-name"
                      value={newCustomTemplate.template_name || ''}
                      onChange={(e) => setNewCustomTemplate(prev => ({ ...prev, template_name: e.target.value }))}
                      placeholder="Ange mallnamn..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-template-type">Malltyp</Label>
                    <Select
                      value={newCustomTemplate.template_type || 'initial_owner'}
                      onValueChange={(value: 'initial_owner' | 'initial_non_owner' | 'pickup_confirmed') => 
                        setNewCustomTemplate(prev => ({ ...prev, template_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Välj malltyp" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="initial_owner">Initial förfrågan - Bilägare</SelectItem>
                        <SelectItem value="initial_non_owner">Initial förfrågan - Ej bilägare</SelectItem>
                        <SelectItem value="pickup_confirmed">Hämtning bekräftad</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="new-template-content">Meddelandetext</Label>
                  <Textarea
                    id="new-template-content"
                    value={newCustomTemplate.content || ''}
                    onChange={(e) => setNewCustomTemplate(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Skriv ditt meddelande här med [namn], [registreringsnummer], [kontrollnummer], [datum]..."
                    className="min-h-32"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Obligatoriska variabler: [namn], [registreringsnummer], [kontrollnummer], [datum]
                  </p>
                 </div>
                 {newCustomTemplate.content && <SMSCostPreview content={newCustomTemplate.content} />}
                 {newCustomTemplate.content && (
                   <div className="p-3 bg-muted/50 rounded-md">
                     <p className="text-sm font-medium mb-2">Förhandsgranskning:</p>
                     <p className="text-sm italic">{generatePreview(newCustomTemplate.content)}</p>
                   </div>
                 )}
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateNewTemplate}
                    className="bg-tenant-primary hover:bg-tenant-primary/90"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Spara mall
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleTestMessageLook(newCustomTemplate.content || '')}
                  >
                    <Smartphone className="h-4 w-4 mr-2" />
                    Testa utseende
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Custom Message Templates */}
            <Card className="bg-white shadow-custom-sm">
              <CardHeader>
                <CardTitle className="text-tenant-primary">Anpassade meddelandemallar</CardTitle>
                <CardDescription>Hantera och anpassa SMS-mallar för olika kundscenarier</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {customTemplates.map((template) => (
                  <Card key={template.id} className="border">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-tenant-accent rounded-full">
                            <MessageSquare className="h-4 w-4 text-tenant-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{template.template_name}</CardTitle>
                            <CardDescription>{getTemplateTypeDisplayName(template.template_type)}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={template.is_active}
                            onCheckedChange={(isActive) => handleToggleCustomTemplate(template.id, isActive)}
                          />
                          <Badge variant={template.is_active ? "default" : "secondary"}>
                            {template.is_active ? 'Aktiv' : 'Inaktiv'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-tenant-accent/20 rounded-lg">
                        <p className="text-sm font-medium mb-2">Mall:</p>
                        <p className="text-sm">{template.content}</p>
                        <div className="mt-3 pt-3 border-t border-tenant-accent/30">
                          <p className="text-sm font-medium mb-2">Förhandsgranskning:</p>
                          <p className="text-sm italic">{generatePreview(template.content)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setEditingCustomTemplate(template)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Redigera
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Redigera anpassad mall: {template.template_name}</DialogTitle>
                              <DialogDescription>
                                Anpassa meddelandemallen. Alla mallar måste innehålla [namn], [registreringsnummer], [kontrollnummer] och [datum].
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="template-name">Mallnamn</Label>
                                <Input
                                  id="template-name"
                                  value={editingCustomTemplate?.template_name || template.template_name}
                                  onChange={(e) => setEditingCustomTemplate(prev => 
                                    prev ? { ...prev, template_name: e.target.value } : null
                                  )}
                                />
                              </div>
                              <div>
                                <Label htmlFor="template-content">Meddelandetext</Label>
                                <Textarea
                                  id="template-content"
                                  value={editingCustomTemplate?.content || template.content}
                                  onChange={(e) => setEditingCustomTemplate(prev => 
                                    prev ? { ...prev, content: e.target.value } : null
                                  )}
                                  placeholder="Skriv ditt meddelande här med [namn], [registreringsnummer], [kontrollnummer], [datum]..."
                                  className="min-h-32"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Obligatoriska variabler: [namn], [registreringsnummer], [kontrollnummer], [datum]
                                </p>
                              </div>
                              {editingCustomTemplate && (
                                <div className="p-3 bg-muted/50 rounded-md">
                                  <p className="text-sm font-medium mb-2">Förhandsgranskning:</p>
                                  <p className="text-sm italic">{generatePreview(editingCustomTemplate.content)}</p>
                                </div>
                              )}
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => editingCustomTemplate && handleSaveCustomTemplate(editingCustomTemplate)}
                                  className="bg-tenant-primary hover:bg-tenant-primary/90"
                                >
                                  <Save className="h-4 w-4 mr-2" />
                                  Spara ändringar
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {customTemplates.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Inga anpassade mallar hittades.</p>
                    <p className="text-sm">Standardmallar är förinstallerade för denna tenant.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Phone Preview Dialog */}
        <Dialog open={showPhonePreview} onOpenChange={setShowPhonePreview}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Meddelandeförhandsgranskning</DialogTitle>
              <DialogDescription>
                Så här kommer meddelandet att se ut på kundens telefon
              </DialogDescription>
            </DialogHeader>
            <div className="mx-auto">
              {/* Phone mockup */}
              <div className="bg-black rounded-3xl p-2 w-72 h-96 shadow-2xl">
                <div className="bg-white rounded-2xl h-full flex flex-col">
                  {/* Phone status bar */}
                  <div className="flex justify-between items-center px-4 py-2 text-xs text-gray-600">
                    <span>09:41</span>
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-black rounded-full"></div>
                      <div className="w-1 h-1 bg-black rounded-full"></div>
                      <div className="w-1 h-1 bg-black rounded-full"></div>
                    </div>
                  </div>
                  {/* SMS header */}
                  <div className="border-b px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                        P
                      </div>
                      <div>
                        <p className="text-sm font-medium">Panta Bilen</p>
                        <p className="text-xs text-gray-500">SMS</p>
                      </div>
                    </div>
                  </div>
                  {/* SMS content */}
                  <div className="flex-1 p-4">
                    <div className="bg-gray-100 rounded-2xl p-3 max-w-64">
                      <p className="text-sm text-gray-800 leading-relaxed">
                        {phonePreviewMessage}
                      </p>
                      <p className="text-xs text-gray-500 mt-2 text-right">
                        {new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};