import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AccessibleInput, AccessibleTextarea } from '@/components/Common/AccessibleForm';
import { validateSwedishPNR, validateSwedishOrgNumber } from '@/utils/swedishValidation';
import { formatSwedishPhone, formatSwedishPostalCode } from '@/utils/swedishFormatting';
import { GDPRConsent } from '@/components/Legal/GDPRConsent';
import { Car, User, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CustomerFormProps {
  onSuccess: (data: any) => void;
  onBack: () => void;
  registrationNumber?: string;
}

interface FormData {
  ownerName: string;
  pnr: string;
  phone: string;
  email: string;
  address: string;
  postalCode: string;
  city: string;
  carBrand: string;
  carModel: string;
  carYear: string;
  registrationNumber: string;
  controlNumber: string;
  notes: string;
}

interface FormErrors {
  [key: string]: string;
}

export const SwedishCustomerForm: React.FC<CustomerFormProps> = ({
  onSuccess,
  onBack,
  registrationNumber = ''
}) => {
  const [currentStep, setCurrentStep] = useState<'form' | 'gdpr' | 'success'>('form');
  const [formData, setFormData] = useState<FormData>({
    ownerName: '',
    pnr: '',
    phone: '',
    email: '',
    address: '',
    postalCode: '',
    city: '',
    carBrand: '',
    carModel: '',
    carYear: '',
    registrationNumber: registrationNumber,
    controlNumber: '',
    notes: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields
    if (!formData.ownerName.trim()) {
      newErrors.ownerName = 'Namn är obligatoriskt';
    }

    // PNR validation
    if (!formData.pnr.trim()) {
      newErrors.pnr = 'Personnummer är obligatoriskt';
    } else {
      const pnrValidation = validateSwedishPNR(formData.pnr);
      if (!pnrValidation.isValid) {
        newErrors.pnr = pnrValidation.error || 'Ogiltigt personnummer';
      }
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefonnummer är obligatoriskt';
    } else {
      const digits = formData.phone.replace(/\D/g, '');
      if (digits.length < 10 || (!digits.startsWith('07') && !digits.startsWith('4607'))) {
        newErrors.phone = 'Ogiltigt svenskt telefonnummer';
      }
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'E-post är obligatoriskt';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ogiltigt e-postformat';
    }

    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = 'Adress är obligatorisk';
    }

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'Postnummer är obligatoriskt';
    } else if (!/^\d{5}$/.test(formData.postalCode.replace(/\s/g, ''))) {
      newErrors.postalCode = 'Postnummer måste vara 5 siffror';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Ort är obligatorisk';
    }

    // Car information
    if (!formData.carBrand.trim()) {
      newErrors.carBrand = 'Bilmärke är obligatoriskt';
    }

    if (!formData.carModel.trim()) {
      newErrors.carModel = 'Bilmodell är obligatorisk';
    }

    if (!formData.registrationNumber.trim()) {
      newErrors.registrationNumber = 'Registreringsnummer är obligatoriskt';
    }

    if (!formData.controlNumber.trim()) {
      newErrors.controlNumber = 'Kontrollnummer är obligatoriskt';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = () => {
    if (validateForm()) {
      setCurrentStep('gdpr');
    }
  };

  const handleGDPRConsent = async (consents: any) => {
    setIsSubmitting(true);
    
    try {
      // Submit customer request with GDPR consent
      const { data, error } = await supabase
        .from('customer_requests')
        .insert({
          owner_name: formData.ownerName,
          pnr_num: formData.pnr,
          car_registration_number: formData.registrationNumber,
          car_brand: formData.carBrand,
          car_model: formData.carModel,
          car_year: parseInt(formData.carYear) || null,
          control_number: formData.controlNumber,
          owner_address: formData.address,
          owner_postal_code: formData.postalCode,
          pickup_address: formData.address,
          pickup_postal_code: formData.postalCode,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Förfrågan skickad!",
        description: "Vi återkommer med information om hämtning.",
      });

      setCurrentStep('success');
      setTimeout(() => onSuccess(data), 2000);

    } catch (error) {
      toast({
        title: "Fel vid skickning",
        description: "Något gick fel. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGDPRDecline = () => {
    setCurrentStep('form');
    toast({
      title: "Samtycke krävs",
      description: "Du måste godkänna behandling av personuppgifter för att fortsätta.",
      variant: "destructive",
    });
  };

  if (currentStep === 'gdpr') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <GDPRConsent
            onAccept={handleGDPRConsent}
            onDecline={handleGDPRDecline}
            companyName="Panta Bilen"
          />
        </div>
      </div>
    );
  }

  if (currentStep === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-8">
            <div className="text-green-600 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold mb-2">Tack för din förfrågan!</h2>
            <p className="text-gray-600">
              Vi kommer att kontakta dig inom kort med information om hämtning av din bil.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bilhämtning</h1>
          <p className="text-gray-600">Fyll i dina uppgifter för att boka hämtning av din bil</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }} className="space-y-8">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personuppgifter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AccessibleInput
                id="owner-name"
                label="Fullständigt namn"
                value={formData.ownerName}
                onChange={(value) => updateField('ownerName', value)}
                error={errors.ownerName}
                required
                placeholder="För- och efternamn"
              />

              <AccessibleInput
                id="pnr"
                label="Personnummer"
                value={formData.pnr}
                onChange={(value) => updateField('pnr', value)}
                error={errors.pnr}
                helpText="Format: YYYYMMDD-XXXX eller YYMMDD-XXXX"
                required
                placeholder="19801225-1234"
              />

              <AccessibleInput
                id="phone"
                label="Telefonnummer"
                type="tel"
                value={formData.phone}
                onChange={(value) => updateField('phone', formatSwedishPhone(value))}
                error={errors.phone}
                required
                placeholder="070-123 45 67"
              />

              <AccessibleInput
                id="email"
                label="E-postadress"
                type="email"
                value={formData.email}
                onChange={(value) => updateField('email', value)}
                error={errors.email}
                required
                placeholder="namn@exempel.se"
              />
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Hämtningsadress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AccessibleInput
                id="address"
                label="Gatuadress"
                value={formData.address}
                onChange={(value) => updateField('address', value)}
                error={errors.address}
                required
                placeholder="Gatunaming 123"
              />

              <div className="grid grid-cols-2 gap-4">
                <AccessibleInput
                  id="postal-code"
                  label="Postnummer"
                  value={formData.postalCode}
                  onChange={(value) => updateField('postalCode', formatSwedishPostalCode(value))}
                  error={errors.postalCode}
                  required
                  placeholder="123 45"
                />

                <AccessibleInput
                  id="city"
                  label="Ort"
                  value={formData.city}
                  onChange={(value) => updateField('city', value)}
                  error={errors.city}
                  required
                  placeholder="Stockholm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Car Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Biluppgifter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AccessibleInput
                id="registration-number"
                label="Registreringsnummer"
                value={formData.registrationNumber}
                onChange={(value) => updateField('registrationNumber', value.toUpperCase())}
                error={errors.registrationNumber}
                required
                placeholder="ABC123"
              />

              <div className="grid grid-cols-2 gap-4">
                <AccessibleInput
                  id="car-brand"
                  label="Märke"
                  value={formData.carBrand}
                  onChange={(value) => updateField('carBrand', value)}
                  error={errors.carBrand}
                  required
                  placeholder="Volvo"
                />

                <AccessibleInput
                  id="car-model"
                  label="Modell"
                  value={formData.carModel}
                  onChange={(value) => updateField('carModel', value)}
                  error={errors.carModel}
                  required
                  placeholder="V70"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <AccessibleInput
                  id="car-year"
                  label="Årsmodell"
                  type="number"
                  value={formData.carYear}
                  onChange={(value) => updateField('carYear', value)}
                  placeholder="2010"
                />

                <AccessibleInput
                  id="control-number"
                  label="Kontrollnummer"
                  value={formData.controlNumber}
                  onChange={(value) => updateField('controlNumber', value)}
                  error={errors.controlNumber}
                  helpText="Finns på registreringsbeviset"
                  required
                  placeholder="CTRL123456"
                />
              </div>

              <AccessibleTextarea
                id="notes"
                label="Övrig information (valfritt)"
                value={formData.notes}
                onChange={(value) => updateField('notes', value)}
                placeholder="Berätta om bilens skick, eventuella skador, eller annan viktig information..."
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="flex-1"
            >
              Tillbaka
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Skickar...' : 'Fortsätt'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};