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
import PostalCodeSelector from "./PostalCodeSelector";
import PricingManagement from "./PricingManagement";
import { parseAddress } from "@/utils/addressTestUtils";

interface ServiceZoneManagementProps {
  onBack: () => void;
}


export const ServiceZoneManagement: React.FC<ServiceZoneManagementProps> = ({ onBack }) => {
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [addressLoading, setAddressLoading] = useState(false);
  const [currentScrapyard, setCurrentScrapyard] = useState<any>(null);
  const [allScrapyards, setAllScrapyards] = useState<any[]>([]);
  const [selectedScrapyardId, setSelectedScrapyardId] = useState<string>('');
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
        // Set individual fields from scrapyard data
        setAddress(selectedScrapyard.address || '');
        setPostalCode(selectedScrapyard.postal_code || '');
        setCity(selectedScrapyard.city || '');
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
        
        // Set individual fields from primary scrapyard data
        // Always parse the combined address to separate fields for consistent display
        const parsedAddress = parseAddress(primaryScrapyard.address);
        setAddress(parsedAddress.streetAddress || '');
        setPostalCode(parsedAddress.postalCode || '');
        setCity(parsedAddress.city || '');
        
        console.log('🏠 Setting address fields:', { 
          address: primaryScrapyard.address, 
          postalCode: primaryScrapyard.postal_code, 
          city: primaryScrapyard.city 
        });
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
            // Set individual fields from new scrapyard data
            setAddress(newScrapyard.address || '');
            setPostalCode('');
            setCity('');
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
      
      // Use the separate field values directly
      const fullAddress = [address, postalCode, city].filter(Boolean).join(', ');
      
      console.log('Saving address:', { 
        scrapyardId: currentScrapyard.id, 
        tenantId, 
        address, 
        postalCode, 
        city, 
        fullAddress 
      });
      
      // Update the primary scrapyard with separate fields
      const { error: scrapyardError } = await supabase
        .from('scrapyards')
        .update({
          address,           // Store street address only
          postal_code: postalCode,
          city,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentScrapyard.id);
      
      if (scrapyardError) throw scrapyardError;
      
      // Also update tenant with separate address fields AND base_address for backward compatibility
      const { error: tenantError } = await supabase
        .from('tenants')
        .update({
          street_address: address,
          postal_code: postalCode,
          city: city,
          base_address: fullAddress  // Keep for backward compatibility
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="zones">Postnummer & Täckning</TabsTrigger>
          <TabsTrigger value="address">Basadress</TabsTrigger>
          <TabsTrigger value="statistics">Statistik</TabsTrigger>
        </TabsList>

        {/* Postnummer & Täckning Tab - Now uses new PostalCodeSelector */}
        <TabsContent value="zones" className="space-y-6">
          <PostalCodeSelector />
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="address">Gatuadress</Label>
                      <Input 
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Gatunavn 123"
                      />
                    </div>
                    <div>
                      <Label htmlFor="postal-code">Postnummer</Label>
                      <Input 
                        id="postal-code"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="12345"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">Stad</Label>
                      <Input 
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Stockholm"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Denna adress används för att beräkna avstånd till hämtningsplatser.
                  </p>
                  
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
                    <Button onClick={saveBaseAddress} disabled={addressLoading || !address.trim()}>
                      {addressLoading ? 'Sparar...' : 'Spara adress'}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      const fullAddress = [address, postalCode, city].filter(Boolean).join(', ');
                      console.log('DEBUG: Verifiera på karta clicked, setting showMapModal to true');
                      console.log('DEBUG: Current fullAddress:', fullAddress);
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

      </Tabs>

      {/* Map Verification Modal */}
      <MapVerificationModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        address={[address, postalCode, city].filter(Boolean).join(', ')}
      />

    </div>
  );
};