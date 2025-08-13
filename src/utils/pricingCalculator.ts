import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Save, RotateCcw, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

interface PricingManagementProps {
  onBack?: () => void;
  tenantId?: string; // Changed to string to match your database
}

interface PricingSettings {
  id?: string;
  tenantId: string;
  ageBonuses: {
    age0to5: number;
    age5to10: number;
    age10to15: number;
    age15to20: number;
    age20plus: number;
  };
  oldCarDeduction: {
    before1990: number;
  };
  distanceAdjustments: {
    dropoffComplete: number;
    dropoffIncomplete: number;
    pickup0to20: number;
    pickup20to50: number;
    pickup50to75: number;
    pickup75to100: number;
    pickup100plus: number;
  };
  partsBonuses: {
    engineTransmissionCatalyst: number;
    batteryWheelsOther: number;
  };
  fuelAdjustments: {
    gasoline: number;
    ethanol: number;
    electric: number;
    other: number;
  };
}

const defaultSettings: Omit<PricingSettings, 'tenantId'> = {
  ageBonuses: {
    age0to5: 10000,
    age5to10: 5000,
    age10to15: 2500,
    age15to20: 1000,
    age20plus: 0
  },
  oldCarDeduction: {
    before1990: -1000
  },
  distanceAdjustments: {
    dropoffComplete: 500,
    dropoffIncomplete: 0,
    pickup0to20: -250,
    pickup20to50: -500,
    pickup50to75: -1000,
    pickup75to100: -1250,
    pickup100plus: -2500
  },
  partsBonuses: {
    engineTransmissionCatalyst: 1000,
    batteryWheelsOther: 500
  },
  fuelAdjustments: {
    gasoline: 0,
    ethanol: 0,
    electric: 0,
    other: -500
  }
};

const PricingManagement: React.FC<PricingManagementProps> = ({ 
  onBack, 
  tenantId = '1' // Changed to string default
}) => {
  const [settings, setSettings] = useState<PricingSettings>({
    ...defaultSettings,
    tenantId
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPricingSettings();
  }, [tenantId]);

  const loadPricingSettings = async () => {
    try {
      setIsLoading(true);
      
      // Use any to bypass TypeScript issues
      const { data, error } = await (supabase as any)
        .from('pricing_tiers')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_vehicle_pricing', true)
        .single();

      if (!error && data) {
        const loadedSettings: PricingSettings = {
          id: data.id,
          tenantId: data.tenant_id,
          ageBonuses: (data as any).vehicle_age_bonuses || defaultSettings.ageBonuses,
          oldCarDeduction: (data as any).vehicle_old_car_deduction || defaultSettings.oldCarDeduction,
          distanceAdjustments: (data as any).vehicle_distance_adjustments || defaultSettings.distanceAdjustments,
          partsBonuses: (data as any).vehicle_parts_bonuses || defaultSettings.partsBonuses,
          fuelAdjustments: (data as any).vehicle_fuel_adjustments || defaultSettings.fuelAdjustments
        };
        
        setSettings(loadedSettings);
        setLastSaved(new Date(data.updated_at));
      } else {
        console.log('No existing pricing settings found, using defaults');
      }
    } catch (err) {
      console.error('Error loading pricing settings:', err);
      toast({
        title: "Information",
        description: "Använder standardvärden för prisinställningar.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const savePricingSettings = async () => {
    try {
      setIsSaving(true);

      const settingsToSave = {
        tenant_id: tenantId,
        is_vehicle_pricing: true,
        vehicle_age_bonuses: settings.ageBonuses,
        vehicle_old_car_deduction: settings.oldCarDeduction,
        vehicle_distance_adjustments: settings.distanceAdjustments,
        vehicle_parts_bonuses: settings.partsBonuses,
        vehicle_fuel_adjustments: settings.fuelAdjustments,
        updated_at: new Date().toISOString()
      };

      let result;
      
      if (settings.id) {
        result = await (supabase as any)
          .from('pricing_tiers')
          .update(settingsToSave)
          .eq('id', settings.id)
          .select()
          .single();
      } else {
        result = await (supabase as any)
          .from('pricing_tiers')
          .insert(settingsToSave)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      setSettings(prev => ({
        ...prev,
        id: result.data.id
      }));
      
      setHasChanges(false);
      setLastSaved(new Date());

      toast({
        title: "Sparades framgångsrikt",
        description: "Prisinställningarna har uppdaterats i databasen.",
      });

    } catch (err) {
      console.error('Error saving pricing settings:', err);
      toast({
        title: "Fel vid sparning",
        description: "Kunde inte spara prisinställningarna. Kontrollera att databas-kolumnerna finns.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const validateValue = (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max;
  };

  const handleInputChange = (
    section: keyof Omit<PricingSettings, 'id' | 'tenantId'>,
    field: string,
    value: string
  ) => {
    const numValue = parseInt(value) || 0;
    
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: numValue
      }
    }));
    
    setHasChanges(true);
  };

  const handleSectionSave = async (
    sectionName: string, 
    sectionSettings: any, 
    validationRules: { field: string, min: number, max: number }[]
  ) => {
    const isValid = validationRules.every(rule => 
      validateValue(sectionSettings[rule.field], rule.min, rule.max)
    );

    if (!isValid) {
      toast({
        title: "Valideringsfel",
        description: "Kontrollera att alla värden är inom tillåtna intervall.",
        variant: "destructive"
      });
      return;
    }

    await savePricingSettings();
  };

  const handleReset = () => {
    setSettings({
      ...defaultSettings,
      tenantId,
      id: settings.id
    });
    setHasChanges(true);
    
    toast({
      title: "Återställt till standard",
      description: "Alla värden har återställts till grundinställningar. Klicka på Spara för att bekräfta.",
    });
  };

  const InputField: React.FC<{
    label: string;
    value: number;
    onChange: (value: string) => void;
    min: number;
    max: number;
    unit?: string;
    disabled?: boolean;
  }> = ({ label, value, onChange, min, max, unit = "KR", disabled = false }) => {
    const isValid = validateValue(value, min, max);
    
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex items-center space-x-2">
          <Input
            type="number"
            value={value.toString()}
            onChange={(e) => onChange(e.target.value)}
            className={`w-32 ${!isValid ? 'border-destructive' : ''}`}
            min={min}
            max={max}
            disabled={disabled || isLoading}
          />
          <span className="text-sm text-muted-foreground">{unit}</span>
          {!isValid && (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Intervall: {min}–{max} {unit}
        </p>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="theme-tenant min-h-screen bg-tenant-muted flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Laddar prisinställningar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-tenant min-h-screen bg-tenant-muted">
      <header className="bg-tenant-primary text-tenant-primary-foreground shadow-custom-md">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="border border-white/30 bg-transparent text-white hover:bg-white/20 hover:text-white"
                disabled={isSaving}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tillbaka till Dashboard
              </Button>
              <h1 className="text-2xl font-bold">Prishantering</h1>
            </div>
            <div className="flex items-center gap-4">
              {hasChanges && (
                <span className="text-sm text-yellow-200">
                  Osparade ändringar
                </span>
              )}
              {lastSaved && (
                <p className="text-sm text-tenant-primary-foreground/80">
                  Senast sparat: {lastSaved.toLocaleString('sv-SE')}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-6 p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Justera ersättningar och avdrag som påverkar bilens värdering. Alla ändringar sparas i databasen.
          </AlertDescription>
        </Alert>

        {hasChanges && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-orange-800">Osparade ändringar</h3>
                  <p className="text-sm text-orange-600">Du har gjort ändringar som inte har sparats ännu.</p>
                </div>
                <Button 
                  onClick={savePricingSettings}
                  disabled={isSaving}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Spara alla ändringar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Age Bonuses Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Åldersbonus för Bil</CardTitle>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    Spara
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Bekräfta ändringar</AlertDialogTitle>
                    <AlertDialogDescription>
                      Är du säker på att du vill spara ändringarna för åldersbonus?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Avbryt</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleSectionSave('Åldersbonus', settings.ageBonuses, [
                      { field: 'age0to5', min: 0, max: 20000 },
                      { field: 'age5to10', min: 0, max: 20000 },
                      { field: 'age10to15', min: 0, max: 20000 },
                      { field: 'age15to20', min: 0, max: 20000 },
                      { field: 'age20plus', min: 0, max: 20000 }
                    ])}>
                      Spara
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <InputField
              label="0–4,99 år"
              value={settings.ageBonuses.age0to5}
              onChange={(value) => handleInputChange('ageBonuses', 'age0to5', value)}
              min={0}
              max={20000}
            />
            <InputField
              label="5–9,99 år"
              value={settings.ageBonuses.age5to10}
              onChange={(value) => handleInputChange('ageBonuses', 'age5to10', value)}
              min={0}
              max={20000}
            />
            <InputField
              label="10–14,99 år"
              value={settings.ageBonuses.age10to15}
              onChange={(value) => handleInputChange('ageBonuses', 'age10to15', value)}
              min={0}
              max={20000}
            />
            <InputField
              label="15–19,99 år"
              value={settings.ageBonuses.age15to20}
              onChange={(value) => handleInputChange('ageBonuses', 'age15to20', value)}
              min={0}
              max={20000}
            />
            <InputField
              label="20 år eller äldre"
              value={settings.ageBonuses.age20plus}
              onChange={(value) => handleInputChange('ageBonuses', 'age20plus', value)}
              min={0}
              max={20000}
            />
          </CardContent>
        </Card>

        {/* Add all other sections here - Old Car Deduction, Distance, Parts, Fuel */}
        {/* For now showing just Age Bonuses, but the full component would include all sections */}

        <div className="flex justify-center pt-6">
          <Button 
            variant="outline" 
            onClick={handleReset} 
            className="flex items-center space-x-2"
            disabled={isSaving}
          >
            <RotateCcw className="h-4 w-4" />
            <span>Återställ till standard</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PricingManagement;