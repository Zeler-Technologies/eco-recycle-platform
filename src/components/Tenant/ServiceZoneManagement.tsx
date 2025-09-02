import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, ArrowLeft, CheckCircle, Download, Edit, FileUp, MapPin, Plus, Search, Settings, Trash2, Upload, Calculator } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AddressTestComponent } from "@/components/Common/AddressTestComponent";
import { MapVerificationModal } from "./MapVerificationModal";

interface ServiceZoneManagementProps {
  onBack: () => void;
}

// Mock data för svenska postnummer
const mockPostalCodes = [
  { code: '11120', city: 'Stockholm', address: 'Drottninggatan 45', lat: 59.3293, lng: 18.0686, active: true },
  { code: '41118', city: 'Göteborg', address: 'Avenyn 12', lat: 57.7089, lng: 11.9746, active: true },
  { code: '21147', city: 'Malmö', address: 'Stortorget 8', lat: 55.6050, lng: 13.0038, active: false },
  { code: '41314', city: 'Göteborg', address: 'Nordstan 1', lat: 57.7089, lng: 11.9746, active: true },
  { code: '11634', city: 'Stockholm', address: 'Östermalm 23', lat: 59.3293, lng: 18.0686, active: false },
];

const mockPickupRequests = [
  { id: 1, address: 'Storgatan 15, 11120 Stockholm', distance: 12, deduction: -250, bonus: 0, total: -250, status: 'completed' },
  { id: 2, address: 'Kungsgatan 30, 41118 Göteborg', distance: 35, deduction: -750, bonus: 500, total: -250, status: 'confirmed' },
  { id: 3, address: 'Malmögatan 5, 21147 Malmö', distance: 85, deduction: -1500, bonus: 1000, total: -500, status: 'requested' },
];

const distanceTiers = [
  { range: '0-20 km', deduction: -250 },
  { range: '21-50 km', deduction: -750 },
  { range: '51-100 km', deduction: -1500 },
  { range: '100+ km', deduction: -2500 },
];

export const ServiceZoneManagement: React.FC<ServiceZoneManagementProps> = ({ onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [baseAddress, setBaseAddress] = useState('');
  const [addressLoading, setAddressLoading] = useState(false);
  const [currentScrapyard, setCurrentScrapyard] = useState<any>(null);
  const [allScrapyards, setAllScrapyards] = useState<any[]>([]);
  const [selectedScrapyardId, setSelectedScrapyardId] = useState<string>('');
  const [isAddingPostal, setIsAddingPostal] = useState(false);
  const [newPostalCode, setNewPostalCode] = useState('');
  const [selectedTab, setSelectedTab] = useState('zones');
  
  // Distance rules management
  const [distanceRules, setDistanceRules] = useState<any[]>([]);
  const [isAddingDistanceRule, setIsAddingDistanceRule] = useState(false);
  const [editingDistanceRule, setEditingDistanceRule] = useState<any>(null);
  const [newDistanceRule, setNewDistanceRule] = useState({
    min_distance_km: '',
    max_distance_km: '',
    deduction_sek: ''
  });
  
  // Bonus offers management
  const [bonusOffers, setBonusOffers] = useState<any[]>([]);
  const [isAddingBonus, setIsAddingBonus] = useState(false);
  const [editingBonus, setEditingBonus] = useState<any>(null);
  const [newBonusOffer, setNewBonusOffer] = useState({
    bonus_name: '',
    bonus_amount_sek: '',
    start_date: '',
    end_date: '',
    conditions: ''
  });
  
  // Preview calculator
  const [testDistance, setTestDistance] = useState('');
  const [calculatedDeduction, setCalculatedDeduction] = useState(0);
  const [applicableBonuses, setApplicableBonuses] = useState<any[]>([]);
  
  // Map verification modal
  const [showMapModal, setShowMapModal] = useState(false);
  
  // Edit postal code modal
  const [isEditingPostal, setIsEditingPostal] = useState(false);
  const [editingPostalData, setEditingPostalData] = useState<any>(null);

  // Import postal codes modal and file handling
  const [isImportingPostal, setIsImportingPostal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Use tenant_id directly from user
  const tenantId = user?.tenant_id || null;

  // Load data on component mount
  useEffect(() => {
    loadDistanceRules();
    loadBonusOffers();
    loadAllScrapyards();
  }, [tenantId]);

  // Update base address when scrapyard selection changes
  useEffect(() => {
    if (selectedScrapyardId && allScrapyards.length > 0) {
      const selectedScrapyard = allScrapyards.find(s => s.id.toString() === selectedScrapyardId);
      if (selectedScrapyard) {
        setCurrentScrapyard(selectedScrapyard);
        const fullAddress = [selectedScrapyard.address, selectedScrapyard.postal_code, selectedScrapyard.city]
          .filter(Boolean)
          .join(', ');
        setBaseAddress(fullAddress || '');
      }
    }
  }, [selectedScrapyardId, allScrapyards]);

  const loadDistanceRules = async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase
        .from('distance_rules')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('min_distance_km');
      
      if (error) throw error;
      setDistanceRules(data || []);
    } catch (error) {
      console.error('Error loading distance rules:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda distansregler",
        variant: "destructive"
      });
    }
  };

  const loadBonusOffers = async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase
        .from('bonus_offers')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setBonusOffers(data || []);
    } catch (error) {
      console.error('Error loading bonus offers:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda bonuserbjudanden",
        variant: "destructive"
      });
    }
  };

  const loadAllScrapyards = async () => {
    console.log('🏗️ loadAllScrapyards called with tenantId:', tenantId);
    
    if (!tenantId) {
      console.log('❌ No tenantId, setting loading to false');
      setAddressLoading(false);
      return;
    }
    
    try {
      console.log('🔄 Starting scrapyard loading...');
      setAddressLoading(true);
      
      const { data, error } = await supabase
        .from('scrapyards')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('is_primary', { ascending: false }) // Primary scrapyards first
        .order('created_at', { ascending: true })
        .order('id', { ascending: true });
      
      console.log('📊 Scrapyard query result:', { data, error, dataLength: data?.length });
      
      if (error) {
        console.error('❌ Scrapyard query error:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        console.log('✅ Found scrapyards:', data);
        setAllScrapyards(data);
        
        // Find primary scrapyard or use first one
        const primaryScrapyard = data.find((s: any) => s.is_primary) || data[0];
        console.log('🏆 Primary scrapyard selected:', primaryScrapyard);
        
        setSelectedScrapyardId(primaryScrapyard.id.toString());
        setCurrentScrapyard(primaryScrapyard);
        
        const fullAddress = [primaryScrapyard.address, primaryScrapyard.postal_code, primaryScrapyard.city]
          .filter(Boolean)
          .join(', ');
        
        console.log('🏠 Setting base address:', fullAddress);
        setBaseAddress(fullAddress || '');
      } else {
        // Create default scrapyard if none exists
        console.log('🏗️ No scrapyards found, creating default...');
        const { data: tenantData } = await supabase
          .from('tenants')
          .select('name, base_address')
          .eq('tenants_id', tenantId)
          .maybeSingle();
        
        console.log('👤 Tenant data for default scrapyard:', tenantData);
        
        if (tenantData) {
          const { data: newScrapyard, error: createError } = await supabase
            .from('scrapyards')
            .insert({
              name: tenantData.name,
              address: tenantData.base_address || '',
              tenant_id: tenantId,
              is_active: true,
              is_primary: true
            })
            .select()
            .maybeSingle();
          
          console.log('🆕 Created new scrapyard:', { newScrapyard, createError });
          
          if (!createError && newScrapyard) {
            setAllScrapyards([newScrapyard]);
            setSelectedScrapyardId(newScrapyard.id.toString());
            setCurrentScrapyard(newScrapyard);
            setBaseAddress(newScrapyard.address || '');
          }
        }
      }
    } catch (error) {
      console.error('❌ Error loading scrapyards:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda skrotgårdar",
        variant: "destructive"
      });
    } finally {
      console.log('🏁 Setting addressLoading to false');
      setAddressLoading(false);
    }
  };

  const saveBaseAddress = async () => {
    if (!tenantId || !currentScrapyard) return;
    
    try {
      setAddressLoading(true);
      
      // Parse the address into components
      const addressParts = baseAddress.split(',').map(part => part.trim());
      const address = addressParts[0] || '';
      const postalCode = addressParts[1] || '';
      const city = addressParts[2] || '';
      
      console.log('Saving address:', { 
        scrapyardId: currentScrapyard.id, 
        tenantId, 
        address, 
        postalCode, 
        city, 
        fullAddress: baseAddress 
      });
      
      // Update the primary scrapyard (first created)
      const { error: scrapyardError } = await supabase
        .from('scrapyards')
        .update({
          address,
          postal_code: postalCode,
          city
        })
        .eq('id', currentScrapyard.id);
      
      if (scrapyardError) throw scrapyardError;
      
      // Also update tenant base_address for consistency
      const { error: tenantError } = await supabase
        .from('tenants')
        .update({
          base_address: baseAddress
        })
        .eq('tenants_id', tenantId);
      
      if (tenantError) {
        console.warn('Failed to update tenant base_address:', tenantError);
      }
      
      toast({
        title: "Framgång",
        description: "Basadress uppdaterad i både skrotgård och tenant"
      });
      
      // Reload to ensure consistency
      await loadAllScrapyards();
    } catch (error) {
      console.error('Error saving base address:', error);
      toast({
        title: "Fel",
        description: "Kunde inte spara basadress",
        variant: "destructive"
      });
    } finally {
      setAddressLoading(false);
    }
  };

  const saveDistanceRule = async () => {
    try {
      if (!tenantId) {
        throw new Error('No tenant ID available');
      }

      const ruleData = {
        tenant_id: tenantId,
        min_distance_km: parseInt(newDistanceRule.min_distance_km),
        max_distance_km: newDistanceRule.max_distance_km ? parseInt(newDistanceRule.max_distance_km) : null,
        deduction_sek: parseInt(newDistanceRule.deduction_sek)
      };

      let result;
      if (editingDistanceRule) {
        result = await supabase
          .from('distance_rules')
          .update(ruleData)
          .eq('id', editingDistanceRule.id);
      } else {
        result = await supabase
          .from('distance_rules')
          .insert([ruleData]);
      }

      if (result.error) throw result.error;

      await loadDistanceRules();
      setIsAddingDistanceRule(false);
      setEditingDistanceRule(null);
      setNewDistanceRule({ min_distance_km: '', max_distance_km: '', deduction_sek: '' });
      
      toast({
        title: "Framgång",
        description: editingDistanceRule ? "Distansregel uppdaterad" : "Ny distansregel skapad"
      });
    } catch (error) {
      console.error('Error saving distance rule:', error);
      toast({
        title: "Fel",
        description: "Kunde inte spara distansregel",
        variant: "destructive"
      });
    }
  };

  const deleteDistanceRule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('distance_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadDistanceRules();
      toast({
        title: "Framgång",
        description: "Distansregel borttagen"
      });
    } catch (error) {
      console.error('Error deleting distance rule:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort distansregel",
        variant: "destructive"
      });
    }
  };

  const saveBonusOffer = async () => {
    try {
      if (!tenantId) {
        throw new Error('No tenant ID available');
      }

      const bonusData = {
        tenant_id: tenantId,
        bonus_name: newBonusOffer.bonus_name,
        bonus_amount_sek: parseInt(newBonusOffer.bonus_amount_sek),
        start_date: newBonusOffer.start_date,
        end_date: newBonusOffer.end_date,
        conditions: newBonusOffer.conditions ? JSON.parse(newBonusOffer.conditions) : null
      };

      let result;
      if (editingBonus) {
        result = await supabase
          .from('bonus_offers')
          .update(bonusData)
          .eq('id', editingBonus.id);
      } else {
        result = await supabase
          .from('bonus_offers')
          .insert([bonusData]);
      }

      if (result.error) throw result.error;

      await loadBonusOffers();
      setIsAddingBonus(false);
      setEditingBonus(null);
      setNewBonusOffer({ bonus_name: '', bonus_amount_sek: '', start_date: '', end_date: '', conditions: '' });
      
      toast({
        title: "Framgång",
        description: editingBonus ? "Bonuserbjudande uppdaterat" : "Nytt bonuserbjudande skapat"
      });
    } catch (error) {
      console.error('Error saving bonus offer:', error);
      toast({
        title: "Fel",
        description: "Kunde inte spara bonuserbjudande",
        variant: "destructive"
      });
    }
  };

  const deleteBonusOffer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bonus_offers')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      await loadBonusOffers();
      toast({
        title: "Framgång",
        description: "Bonuserbjudande inaktiverat"
      });
    } catch (error) {
      console.error('Error deactivating bonus offer:', error);
      toast({
        title: "Fel",
        description: "Kunde inte inaktivera bonuserbjudande",
        variant: "destructive"
      });
    }
  };

  const calculatePreview = () => {
    if (!testDistance) return;
    
    const distance = parseInt(testDistance);
    let deduction = 0;
    
    // Find applicable distance rule
    for (const rule of distanceRules) {
      if (distance >= rule.min_distance_km && 
          (rule.max_distance_km === null || distance <= rule.max_distance_km)) {
        deduction = rule.deduction_sek;
        break;
      }
    }
    
    setCalculatedDeduction(deduction);
    
    // Find applicable bonuses (active bonuses for current date)
    const today = new Date().toISOString().split('T')[0];
    const applicable = bonusOffers.filter(bonus => 
      bonus.start_date <= today && bonus.end_date >= today
    );
    setApplicableBonuses(applicable);
  };

  // File import functions
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImportPostalCodes = async () => {
    if (!selectedFile) {
      toast({
        title: "Fel",
        description: "Välj en fil att importera",
        variant: "destructive"
      });
      return;
    }

    try {
      const text = await selectedFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      // Parse SE.txt format: Country Code, Postal Code, Place Name, Admin Name1, Admin Code1, Admin Name2, Admin Code2, Admin Name3, Admin Code3, Latitude, Longitude, Accuracy
      const postalCodes = [];
      
      for (const line of lines) {
        const parts = line.split('\t');
        if (parts.length >= 3 && parts[0] === 'SE') {
          postalCodes.push({
            postal_code: parts[1],
            city: parts[2],
            address: '', // Will be filled later if needed
            is_active: true
          });
        }
      }

      if (postalCodes.length === 0) {
        toast({
          title: "Fel",
          description: "Inga giltiga postnummer hittades i filen",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Framgång",
        description: `${postalCodes.length} postnummer importerade från fil`,
      });

      setIsImportingPostal(false);
      setSelectedFile(null);
      
    } catch (error) {
      console.error('Error importing postal codes:', error);
      toast({
        title: "Fel",
        description: "Kunde inte importera postnummer från fil",
        variant: "destructive"
      });
    }
  };

  const startEditingDistanceRule = (rule: any) => {
    setEditingDistanceRule(rule);
    setNewDistanceRule({
      min_distance_km: rule.min_distance_km.toString(),
      max_distance_km: rule.max_distance_km ? rule.max_distance_km.toString() : '',
      deduction_sek: rule.deduction_sek.toString()
    });
    setIsAddingDistanceRule(true);
  };

  const startEditingBonus = (bonus: any) => {
    setEditingBonus(bonus);
    setNewBonusOffer({
      bonus_name: bonus.bonus_name,
      bonus_amount_sek: bonus.bonus_amount_sek.toString(),
      start_date: bonus.start_date,
      end_date: bonus.end_date,
      conditions: bonus.conditions ? JSON.stringify(bonus.conditions) : ''
    });
    setIsAddingBonus(true);
  };

  const handleEditPostal = (postal: any) => {
    setEditingPostalData({
      code: postal.code,
      city: postal.city,
      address: postal.address,
      active: postal.active
    });
    setIsEditingPostal(true);
  };

  const handleSavePostalEdit = () => {
    // Here you would update the postal code in your data source
    // For now, we'll just close the modal
    setIsEditingPostal(false);
    setEditingPostalData(null);
    // In a real implementation, you would update the mockPostalCodes or make an API call
  };

  const filteredPostalCodes = mockPostalCodes.filter(code => 
    code.code.includes(searchTerm) || 
    code.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Tillbaka
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-primary">Servicezoner</h1>
          <p className="text-muted-foreground">Hantera geografiska områden för hämtningar</p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="zones">Hämtningszoner</TabsTrigger>
          <TabsTrigger value="address">Basadress</TabsTrigger>
          <TabsTrigger value="statistics">Statistik</TabsTrigger>
          <TabsTrigger value="test">Test</TabsTrigger>
        </TabsList>

        {/* Hämtningszoner Tab */}
        <TabsContent value="zones" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Postnummerdatabas & Täckningsområden</CardTitle>
                  <CardDescription>Konfigurera vilka postnummer som omfattas av era hämtningstjänster</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Dialog open={isImportingPostal} onOpenChange={setIsImportingPostal}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <Upload className="h-4 w-4" />
                        Importera postnummer
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Importera postnummerdatabas</DialogTitle>
                        <DialogDescription>
                          Ladda upp en CSV-fil med svenska postnummer (SE.txt format)
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Om SE.txt filen</AlertTitle>
                          <AlertDescription>
                            SE.txt filen kan laddas ner från GeoNames.org gratis. Alternativt kan du manuellt lägga till postnummer nedan.
                          </AlertDescription>
                        </Alert>
                        <Input 
                          type="file" 
                          accept=".csv,.txt" 
                          onChange={handleFileSelect}
                        />
                        {selectedFile && (
                          <div className="text-sm text-muted-foreground">
                            Vald fil: {selectedFile.name}
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsImportingPostal(false);
                            setSelectedFile(null);
                          }}
                        >
                          Avbryt
                        </Button>
                        <Button 
                          onClick={handleImportPostalCodes}
                          disabled={!selectedFile}
                        >
                          Importera
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={isAddingPostal} onOpenChange={setIsAddingPostal}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Lägg till postnummer
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Lägg till nytt postnummer</DialogTitle>
                        <DialogDescription>Aktivera ett nytt postnummer för hämtningstjänster</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="postal">Postnummer</Label>
                          <Input 
                            id="postal" 
                            placeholder="12345" 
                            value={newPostalCode}
                            onChange={(e) => setNewPostalCode(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="city">Ort</Label>
                          <Input id="city" placeholder="Stockholm" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddingPostal(false)}>Avbryt</Button>
                        <Button onClick={() => setIsAddingPostal(false)}>Lägg till</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Sök postnummer eller ort..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrera status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla</SelectItem>
                    <SelectItem value="active">Aktiva</SelectItem>
                    <SelectItem value="inactive">Inaktiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Postnummer</TableHead>
                        <TableHead>Ort</TableHead>
                        <TableHead>Adress</TableHead>
                        <TableHead>Koordinater</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Åtgärder</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {filteredPostalCodes.map((postal, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{postal.code}</TableCell>
                        <TableCell>{postal.city}</TableCell>
                        <TableCell>{postal.address}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {postal.lat.toFixed(4)}, {postal.lng.toFixed(4)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={postal.active ? "default" : "secondary"}>
                            {postal.active ? "Aktiv" : "Inaktiv"}
                          </Badge>
                        </TableCell>
                         <TableCell className="text-right">
                           <div className="flex justify-end gap-2">
                             <Button variant="ghost" size="sm" onClick={() => handleEditPostal(postal)}>
                               <Edit className="h-4 w-4" />
                             </Button>
                             <Button variant="ghost" size="sm" className="text-destructive">
                               <Trash2 className="h-4 w-4" />
                             </Button>
                           </div>
                         </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Basadress Tab */}
        <TabsContent value="address" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Skrotfirmans Basadress</CardTitle>
              <CardDescription>Den fysiska adress varifrån alla hämtningar utgår</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Scrapyard Filter Dropdown */}
              {allScrapyards.length > 1 && (
                <div>
                  <Label htmlFor="scrapyard-select">Välj skrotgård</Label>
                  <Select 
                    value={selectedScrapyardId} 
                    onValueChange={setSelectedScrapyardId}
                  >
                    <SelectTrigger className="w-fit min-w-0">
                      <SelectValue placeholder="Välj skrotgård" />
                    </SelectTrigger>
                    <SelectContent>
                      {allScrapyards.map((scrapyard: any) => (
                        <SelectItem key={scrapyard.id} value={scrapyard.id.toString()}>
                          <div className="flex items-center gap-2">
                            <span>{scrapyard.name}</span>
                            {scrapyard.is_primary && (
                              <Badge variant="secondary" className="text-xs">Primär</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    Välj vilken skrotgård som ska vara aktiv basadress för beräkningar
                  </p>
                </div>
              )}
              {addressLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Laddar adressinformation...</p>
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="base-address">Basadress</Label>
                    <Textarea 
                      id="base-address"
                      value={baseAddress}
                      onChange={(e) => setBaseAddress(e.target.value)}
                      className="mt-2"
                      rows={3}
                      placeholder="Ange fullständig adress: Gatunavn 123, 12345 Stad"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Denna adress används för att beräkna avstånd till hämtningsplatser. Format: Gata, Postnummer, Stad
                    </p>
                  </div>
                  
                  {currentScrapyard && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertTitle>Adress sparad i systemet</AlertTitle>
                      <AlertDescription>
                        Adressen är kopplad till skrotgård: {currentScrapyard.name}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={saveBaseAddress} disabled={addressLoading || !baseAddress.trim()}>
                      {addressLoading ? 'Sparar...' : 'Spara adress'}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      console.log('DEBUG: Verifiera på karta clicked, setting showMapModal to true');
                      console.log('DEBUG: Current baseAddress:', baseAddress);
                      console.log('DEBUG: Google Maps available:', !!window.google?.maps);
                      setShowMapModal(true);
                    }}>Verifiera på karta</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Aktiva Zoner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">247</div>
                <p className="text-xs text-muted-foreground">postnummer täckta</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Genomsnittlig Distans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">42 km</div>
                <p className="text-xs text-muted-foreground">senaste 30 dagarna</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avvisade Förfrågningar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">18</div>
                <p className="text-xs text-muted-foreground">utanför täckningsområde</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Veckostatistik</CardTitle>
              <CardDescription>Accepterade vs avvisade adresser</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Accepterade förfrågningar</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-secondary rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '84%' }}></div>
                    </div>
                    <span className="text-sm font-medium">84%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Avvisade förfrågningar</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-secondary rounded-full h-2">
                      <div className="bg-destructive h-2 rounded-full" style={{ width: '16%' }}></div>
                    </div>
                    <span className="text-sm font-medium">16%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rekommendationer</CardTitle>
              <CardDescription>Förslag för att optimera täckningsområden</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Utvidgningsmöjlighet</AlertTitle>
                <AlertDescription>
                  12 förfrågningar från postnummer 41527 senaste veckan. Överväg att lägga till detta område.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Tab */}
        <TabsContent value="test" className="space-y-6">
          {tenantId && <AddressTestComponent tenantId={tenantId} />}
        </TabsContent>
      </Tabs>

      {/* Map Verification Modal */}
      <MapVerificationModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        address={baseAddress}
      />

      {/* Edit Postal Code Modal */}
      <Dialog open={isEditingPostal} onOpenChange={setIsEditingPostal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redigera postnummer</DialogTitle>
            <DialogDescription>Uppdatera postnummer, ort, adress och status</DialogDescription>
          </DialogHeader>
          {editingPostalData && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-postal">Postnummer</Label>
                <Input
                  id="edit-postal"
                  value={editingPostalData.code}
                  onChange={(e) => setEditingPostalData({
                    ...editingPostalData,
                    code: e.target.value
                  })}
                />
              </div>
              <div>
                <Label htmlFor="edit-city">Ort</Label>
                <Input
                  id="edit-city"
                  value={editingPostalData.city}
                  onChange={(e) => setEditingPostalData({
                    ...editingPostalData,
                    city: e.target.value
                  })}
                />
              </div>
              <div>
                <Label htmlFor="edit-address">Adress</Label>
                <Input
                  id="edit-address"
                  value={editingPostalData.address}
                  onChange={(e) => setEditingPostalData({
                    ...editingPostalData,
                    address: e.target.value
                  })}
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={editingPostalData.active ? "active" : "inactive"}
                  onValueChange={(value) => setEditingPostalData({
                    ...editingPostalData,
                    active: value === "active"
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktiv</SelectItem>
                    <SelectItem value="inactive">Inaktiv</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingPostal(false)}>
              Avbryt
            </Button>
            <Button onClick={handleSavePostalEdit}>
              Spara ändringar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};