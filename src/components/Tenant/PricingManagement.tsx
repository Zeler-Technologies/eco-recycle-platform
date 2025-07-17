import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Save, RotateCcw, AlertCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PricingManagementProps {
  onBack?: () => void;
}

interface PricingSettings {
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

const defaultSettings: PricingSettings = {
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

const PricingManagement: React.FC<PricingManagementProps> = ({ onBack }) => {
  const [settings, setSettings] = useState<PricingSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { toast } = useToast();

  const validateValue = (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max;
  };

  const handleInputChange = (
    section: keyof PricingSettings,
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

  const handleSave = () => {
    // Validate all fields
    const isValid = 
      // Age bonuses validation (0-20000)
      validateValue(settings.ageBonuses.age0to5, 0, 20000) &&
      validateValue(settings.ageBonuses.age5to10, 0, 20000) &&
      validateValue(settings.ageBonuses.age10to15, 0, 20000) &&
      validateValue(settings.ageBonuses.age15to20, 0, 20000) &&
      validateValue(settings.ageBonuses.age20plus, 0, 20000) &&
      // Old car deduction validation (-5000 to 0)
      validateValue(settings.oldCarDeduction.before1990, -5000, 0) &&
      // Distance adjustments validation
      validateValue(settings.distanceAdjustments.dropoffComplete, 0, 5000) &&
      validateValue(settings.distanceAdjustments.dropoffIncomplete, 0, 5000) &&
      validateValue(settings.distanceAdjustments.pickup0to20, -5000, 0) &&
      validateValue(settings.distanceAdjustments.pickup20to50, -5000, 0) &&
      validateValue(settings.distanceAdjustments.pickup50to75, -5000, 0) &&
      validateValue(settings.distanceAdjustments.pickup75to100, -5000, 0) &&
      validateValue(settings.distanceAdjustments.pickup100plus, -5000, 0) &&
      // Parts bonuses validation (0-5000)
      validateValue(settings.partsBonuses.engineTransmissionCatalyst, 0, 5000) &&
      validateValue(settings.partsBonuses.batteryWheelsOther, 0, 5000) &&
      // Fuel adjustments validation
      validateValue(settings.fuelAdjustments.other, -1000, 0);

    if (!isValid) {
      toast({
        title: "Valideringsfel",
        description: "Kontrollera att alla värden är inom tillåtna intervall.",
        variant: "destructive"
      });
      return;
    }

    // Show confirmation dialog
    if (window.confirm("Är du säker på att du vill spara dessa prisändringar?")) {
      // Simulate saving to database
      setTimeout(() => {
        setHasChanges(false);
        setLastSaved(new Date());
        toast({
          title: "Inställningarna har sparats",
          description: "Prisändringarna är nu aktiva.",
        });
      }, 500);
    }
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setHasChanges(false);
    toast({
      title: "Återställt till standard",
      description: "Alla värden har återställts till grundinställningar.",
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
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-32 ${!isValid ? 'border-destructive' : ''}`}
            min={min}
            max={max}
            disabled={disabled}
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

  return (
    <div className="theme-tenant min-h-screen bg-tenant-muted">
      {/* Header */}
      <header className="bg-tenant-primary text-tenant-primary-foreground shadow-custom-md">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="border border-white/30 bg-transparent text-white hover:bg-white/20 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tillbaka till Dashboard
              </Button>
              <h1 className="text-2xl font-bold">Prishantering</h1>
            </div>
            {lastSaved && (
              <p className="text-sm text-tenant-primary-foreground/80">
                Senast sparat: {lastSaved.toLocaleString('sv-SE')}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="space-y-6 p-6">

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Justera ersättningar och avdrag som påverkar bilens värdering. Alla ändringar måste sparas för att träda i kraft.
        </AlertDescription>
      </Alert>

      {/* Age Bonuses Section */}
      <Card>
        <CardHeader>
          <CardTitle>Åldersbonus för Bil</CardTitle>
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

      {/* Old Car Deduction Section */}
      <Card>
        <CardHeader>
          <CardTitle>Avdrag för gamla årsmodeller</CardTitle>
        </CardHeader>
        <CardContent>
          <InputField
            label="Före 1990"
            value={settings.oldCarDeduction.before1990}
            onChange={(value) => handleInputChange('oldCarDeduction', 'before1990', value)}
            min={-5000}
            max={0}
          />
        </CardContent>
      </Card>

      {/* Distance Adjustments Section */}
      <Card>
        <CardHeader>
          <CardTitle>Avståndsjusteringar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold mb-3">Avlämning (Drop-off)</h4>
            <div className="space-y-4">
              <InputField
                label="0 km avlämning (komplett bil)"
                value={settings.distanceAdjustments.dropoffComplete}
                onChange={(value) => handleInputChange('distanceAdjustments', 'dropoffComplete', value)}
                min={0}
                max={5000}
              />
              <InputField
                label="0 km avlämning (ofullständig bil)"
                value={settings.distanceAdjustments.dropoffIncomplete}
                onChange={(value) => handleInputChange('distanceAdjustments', 'dropoffIncomplete', value)}
                min={0}
                max={5000}
              />
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-semibold mb-3">Hämtning (Pickup)</h4>
            <div className="space-y-4">
              <InputField
                label="0–20 km"
                value={settings.distanceAdjustments.pickup0to20}
                onChange={(value) => handleInputChange('distanceAdjustments', 'pickup0to20', value)}
                min={-5000}
                max={0}
              />
              <InputField
                label="20–50 km"
                value={settings.distanceAdjustments.pickup20to50}
                onChange={(value) => handleInputChange('distanceAdjustments', 'pickup20to50', value)}
                min={-5000}
                max={0}
              />
              <InputField
                label="50–75 km"
                value={settings.distanceAdjustments.pickup50to75}
                onChange={(value) => handleInputChange('distanceAdjustments', 'pickup50to75', value)}
                min={-5000}
                max={0}
              />
              <InputField
                label="75–100 km"
                value={settings.distanceAdjustments.pickup75to100}
                onChange={(value) => handleInputChange('distanceAdjustments', 'pickup75to100', value)}
                min={-5000}
                max={0}
              />
              <InputField
                label="100+ km"
                value={settings.distanceAdjustments.pickup100plus}
                onChange={(value) => handleInputChange('distanceAdjustments', 'pickup100plus', value)}
                min={-5000}
                max={0}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parts Bonuses Section */}
      <Card>
        <CardHeader>
          <CardTitle>Bonus för värdefulla delar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InputField
            label="Motor / Växellåda / Katalysator"
            value={settings.partsBonuses.engineTransmissionCatalyst}
            onChange={(value) => handleInputChange('partsBonuses', 'engineTransmissionCatalyst', value)}
            min={0}
            max={5000}
          />
          <InputField
            label="Batteri / Fyra hjul / Övrigt komplett"
            value={settings.partsBonuses.batteryWheelsOther}
            onChange={(value) => handleInputChange('partsBonuses', 'batteryWheelsOther', value)}
            min={0}
            max={5000}
          />
        </CardContent>
      </Card>

      {/* Fuel Adjustments Section */}
      <Card>
        <CardHeader>
          <CardTitle>Bränslejustering</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InputField
            label="Bensin"
            value={settings.fuelAdjustments.gasoline}
            onChange={() => {}} // Read-only
            min={0}
            max={0}
            disabled={true}
          />
          <InputField
            label="Etanol"
            value={settings.fuelAdjustments.ethanol}
            onChange={() => {}} // Read-only
            min={0}
            max={0}
            disabled={true}
          />
          <InputField
            label="El (Electric)"
            value={settings.fuelAdjustments.electric}
            onChange={() => {}} // Read-only
            min={0}
            max={0}
            disabled={true}
          />
          <InputField
            label="Annat bränsle"
            value={settings.fuelAdjustments.other}
            onChange={(value) => handleInputChange('fuelAdjustments', 'other', value)}
            min={-1000}
            max={0}
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {hasChanges && (
        <div className="flex space-x-4 pt-6">
          <Button onClick={handleSave} className="flex items-center space-x-2">
            <Save className="h-4 w-4" />
            <span>Spara inställningar</span>
          </Button>
          <Button variant="outline" onClick={handleReset} className="flex items-center space-x-2">
            <RotateCcw className="h-4 w-4" />
            <span>Återställ till standard</span>
          </Button>
        </div>
      )}
      </div>
    </div>
  );
};

export default PricingManagement;