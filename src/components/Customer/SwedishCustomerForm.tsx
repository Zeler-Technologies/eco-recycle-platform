import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AccessibleInput, AccessibleTextarea } from '@/components/Common/AccessibleForm';
import { SwedishAddressAutocomplete } from './SwedishAddressAutocomplete';
import { validateSwedishPNR, validateSwedishOrgNumber } from '@/utils/swedishValidation';
import { formatSwedishPhone, formatSwedishPostalCode, formatSwedishCurrency } from '@/utils/swedishFormatting';
import { GDPRConsent } from '@/components/Legal/GDPRConsent';
import { ProgressIndicator } from './ProgressIndicator';
import { EnhancedQuoteDisplay } from './EnhancedQuoteDisplay';
import { Car, User, MapPin, Calendar, Settings2 } from 'lucide-react';
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
  pickupAddress: string;
  pickupPostalCode: string;
  pickupCity: string;
  preferredPickupDate: string;
  contactMethod: 'phone' | 'email' | 'sms';
}

interface AddressData {
  address: string;
  postalCode: string;
  city: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface QuoteDisplay {
  baseValue: number;
  memberBonus?: number;
  transportFee: number;
  finalQuote: number;
  pickupDate: string;
  estimatedDistance: number;
  carInfo: {
    brand: string;
    model: string;
    year: number;
    registration: string;
  };
}

type FormStep = 'form' | 'quote' | 'gdpr' | 'success';

interface FormErrors {
  [key: string]: string;
}

export const SwedishCustomerForm: React.FC<CustomerFormProps> = ({
  onSuccess,
  onBack,
  registrationNumber = ''
}) => {
  const [currentStep, setCurrentStep] = useState<FormStep>('form');
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
    notes: '',
    pickupAddress: '',
    pickupPostalCode: '',
    pickupCity: '',
    preferredPickupDate: '',
    contactMethod: 'phone'
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quote, setQuote] = useState<QuoteDisplay | null>(null);
  const [formProgress, setFormProgress] = useState(10);
  const [ownerAddressData, setOwnerAddressData] = useState<AddressData | null>(null);
  const [pickupAddressData, setPickupAddressData] = useState<AddressData | null>(null);
  const [useOwnerAddressForPickup, setUseOwnerAddressForPickup] = useState(true);
  const { toast } = useToast();

  // Enhanced field formatters
  const formatRegistrationNumber = useCallback((value: string): string => {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
  }, []);

  const validateRegistrationNumber = useCallback((regNr: string): boolean => {
    const patterns = [
      /^[A-Z]{3}[0-9]{3}$/, // ABC123
      /^[A-Z]{3}[0-9]{2}[A-Z]$/, // ABC12D
      /^[0-9]{3}[A-Z]{3}$/, // 123ABC
    ];
    return patterns.some(pattern => pattern.test(regNr));
  }, []);

  const updateField = useCallback((field: keyof FormData, value: string) => {
    let processedValue = value;
    
    // Real-time formatting
    if (field === 'registrationNumber') {
      processedValue = formatRegistrationNumber(value);
    } else if (field === 'phone') {
      processedValue = formatSwedishPhone(value);
    } else if (field === 'postalCode' || field === 'pickupPostalCode') {
      processedValue = formatSwedishPostalCode(value);
    }

    setFormData(prev => ({ ...prev, [field]: processedValue }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Update progress
    const requiredFields = ['ownerName', 'pnr', 'phone', 'email', 'address', 'carBrand', 'carModel', 'registrationNumber'];
    const updatedData = { ...formData, [field]: processedValue };
    const filledFields = requiredFields.filter(f => updatedData[f as keyof FormData]?.toString().trim());
    setFormProgress((filledFields.length / requiredFields.length) * 100);
  }, [formatRegistrationNumber, errors, formData]);

  // Handle owner address selection from autocomplete
  const handleOwnerAddressSelect = useCallback((suggestion: any) => {
    const addressData: AddressData = {
      address: suggestion.formatted_address || suggestion.description,
      postalCode: suggestion.postal_code || '',
      city: suggestion.city || '',
      coordinates: suggestion.coordinates
    };

    setOwnerAddressData(addressData);
    
    // Update form fields
    updateField('address', addressData.address);
    if (suggestion.postal_code) {
      updateField('postalCode', suggestion.postal_code);
    }
    if (suggestion.city) {
      updateField('city', suggestion.city);
    }

    // If using owner address for pickup, update pickup fields too
    if (useOwnerAddressForPickup) {
      setPickupAddressData(addressData);
      updateField('pickupAddress', addressData.address);
      if (suggestion.postal_code) {
        updateField('pickupPostalCode', suggestion.postal_code);
      }
      if (suggestion.city) {
        updateField('pickupCity', suggestion.city);
      }
    }

    toast({
      title: "Adress vald",
      description: `${addressData.address} har valts som din adress.`,
    });
  }, [updateField, useOwnerAddressForPickup, toast]);

  // Handle pickup address selection from autocomplete
  const handlePickupAddressSelect = useCallback((suggestion: any) => {
    const addressData: AddressData = {
      address: suggestion.formatted_address || suggestion.description,
      postalCode: suggestion.postal_code || '',
      city: suggestion.city || '',
      coordinates: suggestion.coordinates
    };

    setPickupAddressData(addressData);
    
    // Update pickup form fields
    updateField('pickupAddress', addressData.address);
    if (suggestion.postal_code) {
      updateField('pickupPostalCode', suggestion.postal_code);
    }
    if (suggestion.city) {
      updateField('pickupCity', suggestion.city);
    }

    toast({
      title: "Hämtningsadress vald",
      description: `${addressData.address} har valts som hämtningsadress.`,
    });
  }, [updateField, toast]);

  // Toggle using owner address for pickup
  const handleUseOwnerAddressToggle = useCallback(() => {
    setUseOwnerAddressForPickup(prev => {
      const newValue = !prev;
      
      if (newValue && ownerAddressData) {
        // Copy owner address to pickup address
        setPickupAddressData(ownerAddressData);
        updateField('pickupAddress', ownerAddressData.address);
        updateField('pickupPostalCode', ownerAddressData.postalCode);
        updateField('pickupCity', ownerAddressData.city);
      } else if (!newValue) {
        // Clear pickup address fields
        setPickupAddressData(null);
        updateField('pickupAddress', '');
        updateField('pickupPostalCode', '');
        updateField('pickupCity', '');
      }
      
      return newValue;
    });
  }, [ownerAddressData, updateField]);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Enhanced validations
    if (!formData.ownerName.trim()) {
      newErrors.ownerName = 'Namn är obligatoriskt';
    }

    // Enhanced PNR validation
    if (!formData.pnr.trim()) {
      newErrors.pnr = 'Personnummer är obligatoriskt';
    } else {
      const pnrValidation = validateSwedishPNR(formData.pnr);
      if (!pnrValidation.isValid) {
        newErrors.pnr = pnrValidation.error || 'Ogiltigt personnummer';
      }
    }

    // Enhanced registration number validation
    if (!formData.registrationNumber.trim()) {
      newErrors.registrationNumber = 'Registreringsnummer är obligatoriskt';
    } else if (!validateRegistrationNumber(formData.registrationNumber)) {
      newErrors.registrationNumber = 'Ogiltigt registreringsnummer format (ABC123, ABC12D eller 123ABC)';
    }

    // Enhanced phone validation
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
    } else if (!/^\d{3}\s?\d{2}$/.test(formData.postalCode)) {
      newErrors.postalCode = 'Postnummer måste vara i format 123 45';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Ort är obligatorisk';
    }

    // Car information with enhanced validation
    if (!formData.carBrand.trim()) {
      newErrors.carBrand = 'Bilmärke är obligatoriskt';
    }

    if (!formData.carModel.trim()) {
      newErrors.carModel = 'Bilmodell är obligatorisk';
    }

    if (!formData.controlNumber.trim()) {
      newErrors.controlNumber = 'Kontrollnummer är obligatoriskt';
    } else if (!/^\d{8}$/.test(formData.controlNumber)) {
      newErrors.controlNumber = 'Kontrollnummer måste vara 8 siffror';
    }

    // Year validation
    if (formData.carYear) {
      const year = parseInt(formData.carYear);
      const currentYear = new Date().getFullYear();
      if (year < 1950 || year > currentYear) {
        newErrors.carYear = `Årsmodell måste vara mellan 1950 och ${currentYear}`;
      }
    }

    // Pickup address validation
    if (!useOwnerAddressForPickup) {
      if (!formData.pickupAddress.trim()) {
        newErrors.pickupAddress = 'Hämtningsadress är obligatorisk';
      }
      if (!formData.pickupPostalCode.trim()) {
        newErrors.pickupPostalCode = 'Postnummer för hämtning är obligatoriskt';
      }
      if (!formData.pickupCity.trim()) {
        newErrors.pickupCity = 'Ort för hämtning är obligatorisk';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateRegistrationNumber, useOwnerAddressForPickup]);

  const generateQuote = async () => {
    setIsSubmitting(true);
    
    try {
      // Use pickup address data for distance calculation
      const addressForQuote = useOwnerAddressForPickup ? ownerAddressData : pickupAddressData;
      
      // First, create the customer request
      const { data: requestData, error: requestError } = await supabase
        .from('customer_requests')
        .insert({
          owner_name: formData.ownerName,
          pnr_num: formData.pnr,
          car_registration_number: formData.registrationNumber,
          car_brand: formData.carBrand,
          car_model: formData.carModel,
          car_year: parseInt(formData.carYear) || null,
          control_number: formData.controlNumber,
          scrapyard_id: 1, // Default scrapyard for anonymous users
          owner_address: formData.address,
          owner_postal_code: formData.postalCode,
          pickup_address: useOwnerAddressForPickup ? formData.address : formData.pickupAddress,
          pickup_postal_code: useOwnerAddressForPickup ? formData.postalCode : formData.pickupPostalCode,
          contact_phone: formData.phone,
          special_instructions: formData.notes,
          preferred_contact_method: formData.contactMethod,
          status: 'pending',
          // Include coordinates if available
          pickup_latitude: addressForQuote?.coordinates?.lat || null,
          pickup_longitude: addressForQuote?.coordinates?.lng || null
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Add car metadata
      await supabase
        .from('car_metadata')
        .insert({
          customer_request_id: requestData.id,
          kontrollsiffror: formData.controlNumber,
          car_year: parseInt(formData.carYear) || null,
          control_number: formData.controlNumber
        });

      // Generate enhanced quote with location data
      const { data: quoteData, error: quoteError } = await supabase.functions.invoke(
        'generate-comprehensive-quote',
        { body: { requestId: requestData.id } }
      );

      if (quoteError) throw quoteError;

      if (quoteData?.success) {
        setQuote(quoteData);
        setCurrentStep('quote');
      } else {
        throw new Error(quoteData?.error || 'Failed to generate quote');
      }

    } catch (error: any) {
      console.error('Quote generation error:', error);
      toast({
        title: "Fel vid offertberäkning",
        description: error.message || "Något gick fel. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = () => {
    if (validateForm()) {
      generateQuote();
    }
  };

  const handleQuoteAccept = () => {
    setCurrentStep('gdpr');
  };

  const handleQuoteBack = () => {
    setCurrentStep('form');
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
          scrapyard_id: 1, // Default scrapyard for anonymous users
          owner_address: formData.address,
          owner_postal_code: formData.postalCode,
          pickup_address: useOwnerAddressForPickup ? formData.address : formData.pickupAddress,
          pickup_postal_code: useOwnerAddressForPickup ? formData.postalCode : formData.pickupPostalCode,
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

  if (currentStep === 'quote' && quote) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <ProgressIndicator currentStep={currentStep} progress={formProgress} />
          <div className="mt-8">
            <EnhancedQuoteDisplay
              quote={quote}
              onAccept={handleQuoteAccept}
              onBack={handleQuoteBack}
              isLoading={isSubmitting}
            />
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'gdpr') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <ProgressIndicator currentStep={currentStep} progress={100} />
          <div className="mt-8">
            <GDPRConsent
              onAccept={handleGDPRConsent}
              onDecline={handleGDPRDecline}
              companyName="Panta Bilen"
            />
          </div>
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
        {/* Progress Indicator */}
        <div className="mb-8">
          <ProgressIndicator currentStep={currentStep} progress={formProgress} />
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bilhämtning</h1>
          <p className="text-gray-600">Fyll i dina uppgifter för att få en offert på din bil</p>
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

          {/* Address Information with Autocomplete */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Adressuppgifter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SwedishAddressAutocomplete
                label="Adress"
                placeholder="Börja skriv din adress..."
                value={formData.address}
                onChange={(value) => updateField('address', value)}
                onAddressSelect={handleOwnerAddressSelect}
                onPostalCodeChange={(postalCode) => updateField('postalCode', postalCode)}
                onCityChange={(city) => updateField('city', city)}
                error={errors.address}
                required
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

          {/* Pickup Address Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Hämtningsadress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  id="use-owner-address"
                  type="checkbox"
                  checked={useOwnerAddressForPickup}
                  onChange={handleUseOwnerAddressToggle}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="use-owner-address" className="text-sm text-gray-700">
                  Använd samma adress som ovan för hämtning
                </label>
              </div>

              {!useOwnerAddressForPickup && (
                <>
                  <SwedishAddressAutocomplete
                    label="Hämtningsadress"
                    placeholder="Ange hämtningsadress..."
                    value={formData.pickupAddress}
                    onChange={(value) => updateField('pickupAddress', value)}
                    onAddressSelect={handlePickupAddressSelect}
                    onPostalCodeChange={(postalCode) => updateField('pickupPostalCode', postalCode)}
                    onCityChange={(city) => updateField('pickupCity', city)}
                    error={errors.pickupAddress}
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <AccessibleInput
                      id="pickup-postal-code"
                      label="Postnummer"
                      value={formData.pickupPostalCode}
                      onChange={(value) => updateField('pickupPostalCode', formatSwedishPostalCode(value))}
                      error={errors.pickupPostalCode}
                      required
                      placeholder="123 45"
                    />

                    <AccessibleInput
                      id="pickup-city"
                      label="Ort"
                      value={formData.pickupCity}
                      onChange={(value) => updateField('pickupCity', value)}
                      error={errors.pickupCity}
                      required
                      placeholder="Stockholm"
                    />
                  </div>
                </>
              )}
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
                  error={errors.carYear}
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
                  placeholder="12345678"
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
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Beräknar offert...
                </>
              ) : (
                'Få offert'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};