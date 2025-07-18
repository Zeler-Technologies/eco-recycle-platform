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
  const [baseAddress, setBaseAddress] = useState('Industrivägen 12, 41234 Göteborg');
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
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Convert string tenant_id from mock auth to number for database
  const tenantId = user?.tenant_id ? parseInt(user.tenant_id.replace('tenant_', '')) : null;

  // Load data on component mount
  useEffect(() => {
    loadDistanceRules();
    loadBonusOffers();
  }, []);

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
          <h1 className="text-2xl font-bold text-primary">Servicezoner & Prisberäkning</h1>
          <p className="text-muted-foreground">Hantera geografiska områden och prislogik för hämtningar</p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="zones">Hämtningszoner</TabsTrigger>
          <TabsTrigger value="address">Basadress</TabsTrigger>
          <TabsTrigger value="pricing">Prislogik</TabsTrigger>
          <TabsTrigger value="statistics">Statistik</TabsTrigger>
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
                  <Dialog>
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
                        <Input type="file" accept=".csv,.txt" />
                      </div>
                      <DialogFooter>
                        <Button variant="outline">Avbryt</Button>
                        <Button>Importera</Button>
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
                            <Button variant="ghost" size="sm">
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
              <div>
                <Label htmlFor="base-address">Basadress</Label>
                <Textarea 
                  id="base-address"
                  value={baseAddress}
                  onChange={(e) => setBaseAddress(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Denna adress används för att beräkna avstånd till hämtningsplatser
                </p>
              </div>
              
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Adress verifierad</AlertTitle>
                <AlertDescription>
                  Adressen har geokodats till koordinater: 57.7089, 11.9746
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button>Uppdatera adress</Button>
                <Button variant="outline">Verifiera på karta</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prislogik Tab */}
        <TabsContent value="pricing" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Distance Rules Management */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Distansbaserade Avdrag</CardTitle>
                    <CardDescription>Hantera automatiska avdrag baserat på körsträcka</CardDescription>
                  </div>
                  <Dialog open={isAddingDistanceRule} onOpenChange={setIsAddingDistanceRule}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Lägg till ny regel
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingDistanceRule ? 'Redigera Distansregel' : 'Lägg till Ny Distansregel'}
                        </DialogTitle>
                        <DialogDescription>
                          Definiera avståndsspann och motsvarande avdrag för hämtningar
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="min-distance">Min-avstånd (km)</Label>
                            <Input
                              id="min-distance"
                              type="number"
                              placeholder="0"
                              value={newDistanceRule.min_distance_km}
                              onChange={(e) => setNewDistanceRule({
                                ...newDistanceRule,
                                min_distance_km: e.target.value
                              })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="max-distance">Max-avstånd (km)</Label>
                            <Input
                              id="max-distance"
                              type="number"
                              placeholder="Lämna tom för obegränsat"
                              value={newDistanceRule.max_distance_km}
                              onChange={(e) => setNewDistanceRule({
                                ...newDistanceRule,
                                max_distance_km: e.target.value
                              })}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="deduction">Avdrag (SEK)</Label>
                          <Input
                            id="deduction"
                            type="number"
                            placeholder="250"
                            value={newDistanceRule.deduction_sek}
                            onChange={(e) => setNewDistanceRule({
                              ...newDistanceRule,
                              deduction_sek: e.target.value
                            })}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => {
                          setIsAddingDistanceRule(false);
                          setEditingDistanceRule(null);
                          setNewDistanceRule({ min_distance_km: '', max_distance_km: '', deduction_sek: '' });
                        }}>
                          Avbryt
                        </Button>
                        <Button onClick={saveDistanceRule}>
                          {editingDistanceRule ? 'Uppdatera' : 'Lägg till'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {distanceRules.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Inga distansregler definierade ännu
                    </div>
                  ) : (
                    distanceRules.map((rule) => (
                      <div key={rule.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <span className="font-medium">
                            {rule.min_distance_km} - {rule.max_distance_km || '∞'} km
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-destructive font-bold">{rule.deduction_sek} SEK</span>
                          <Button variant="ghost" size="sm" onClick={() => startEditingDistanceRule(rule)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteDistanceRule(rule.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Preview Calculator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Priskalkylator
                </CardTitle>
                <CardDescription>Testa prisberäkning</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="test-distance">Avstånd (km)</Label>
                  <Input
                    id="test-distance"
                    type="number"
                    placeholder="35"
                    value={testDistance}
                    onChange={(e) => setTestDistance(e.target.value)}
                  />
                </div>
                <Button onClick={calculatePreview} className="w-full">
                  Beräkna
                </Button>
                {calculatedDeduction !== 0 && (
                  <div className="space-y-2 p-3 bg-muted rounded-lg">
                    <div className="flex justify-between">
                      <span>Avdrag:</span>
                      <span className="text-destructive font-bold">{calculatedDeduction} SEK</span>
                    </div>
                    {applicableBonuses.map((bonus) => (
                      <div key={bonus.id} className="flex justify-between">
                        <span>{bonus.bonus_name}:</span>
                        <span className="text-green-600 font-bold">+{bonus.bonus_amount_sek} SEK</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Total effekt:</span>
                      <span>{calculatedDeduction + applicableBonuses.reduce((sum, b) => sum + b.bonus_amount_sek, 0)} SEK</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bonus Offers Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Bonuserbjudanden</CardTitle>
                  <CardDescription>Hantera kampanjer och tillfälliga bonusar</CardDescription>
                </div>
                <Dialog open={isAddingBonus} onOpenChange={setIsAddingBonus}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Lägg till bonus
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingBonus ? 'Redigera Bonuserbjudande' : 'Lägg till Nytt Bonuserbjudande'}
                      </DialogTitle>
                      <DialogDescription>
                        Skapa kampanjer och bonusar för specifika tidsperioder
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="bonus-name">Bonusnamn</Label>
                        <Input
                          id="bonus-name"
                          placeholder="Vinterbonus 2024"
                          value={newBonusOffer.bonus_name}
                          onChange={(e) => setNewBonusOffer({
                            ...newBonusOffer,
                            bonus_name: e.target.value
                          })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="bonus-amount">Bonusbelopp (SEK)</Label>
                        <Input
                          id="bonus-amount"
                          type="number"
                          placeholder="500"
                          value={newBonusOffer.bonus_amount_sek}
                          onChange={(e) => setNewBonusOffer({
                            ...newBonusOffer,
                            bonus_amount_sek: e.target.value
                          })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="start-date">Startdatum</Label>
                          <Input
                            id="start-date"
                            type="date"
                            value={newBonusOffer.start_date}
                            onChange={(e) => setNewBonusOffer({
                              ...newBonusOffer,
                              start_date: e.target.value
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="end-date">Slutdatum</Label>
                          <Input
                            id="end-date"
                            type="date"
                            value={newBonusOffer.end_date}
                            onChange={(e) => setNewBonusOffer({
                              ...newBonusOffer,
                              end_date: e.target.value
                            })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="conditions">Villkor (JSON, valfritt)</Label>
                        <Textarea
                          id="conditions"
                          placeholder='{"min_age": 10, "vehicle_types": ["personbil"]}'
                          value={newBonusOffer.conditions}
                          onChange={(e) => setNewBonusOffer({
                            ...newBonusOffer,
                            conditions: e.target.value
                          })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setIsAddingBonus(false);
                        setEditingBonus(null);
                        setNewBonusOffer({ bonus_name: '', bonus_amount_sek: '', start_date: '', end_date: '', conditions: '' });
                      }}>
                        Avbryt
                      </Button>
                      <Button onClick={saveBonusOffer}>
                        {editingBonus ? 'Uppdatera' : 'Lägg till'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bonusOffers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Inga aktiva bonuserbjudanden
                  </div>
                ) : (
                  bonusOffers.map((bonus) => (
                    <div key={bonus.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{bonus.bonus_name}</h4>
                          <p className="text-sm text-green-600">+{bonus.bonus_amount_sek} SEK</p>
                          <p className="text-xs text-muted-foreground">
                            {bonus.start_date} - {bonus.end_date}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => startEditingBonus(bonus)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteBonusOffer(bonus.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Pickup Requests */}
          <Card>
            <CardHeader>
              <CardTitle>Senaste Hämtningsförfrågningar</CardTitle>
              <CardDescription>Översikt av prisberäkningar med aktuella regler</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Adress</TableHead>
                    <TableHead>Avstånd</TableHead>
                    <TableHead>Avdrag</TableHead>
                    <TableHead>Bonus</TableHead>
                    <TableHead>Total ersättning</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPickupRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.address}</TableCell>
                      <TableCell>{request.distance} km</TableCell>
                      <TableCell className="text-destructive">{request.deduction} SEK</TableCell>
                      <TableCell className="text-green-600">+{request.bonus} SEK</TableCell>
                      <TableCell className="font-bold">{request.total} SEK</TableCell>
                      <TableCell>
                        <Badge variant={
                          request.status === 'completed' ? 'default' : 
                          request.status === 'confirmed' ? 'secondary' : 'outline'
                        }>
                          {request.status === 'completed' ? 'Genomförd' : 
                           request.status === 'confirmed' ? 'Bekräftad' : 'Förfrågan'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistik Tab */}
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
      </Tabs>
    </div>
  );
};