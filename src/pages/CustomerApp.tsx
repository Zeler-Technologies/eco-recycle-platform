import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CalendarIcon, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import BankIDScreen from '@/components/BankID/BankIDScreen';
import BankIDLogin from '@/components/BankID/BankIDLogin';
import BankIDSuccess from '@/components/BankID/BankIDSuccess';

import AddressPickerSimple from '@/components/Common/AddressPickerSimple';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface CarDetails {
  registrationNumber: string;
  controlNumber: string;
  issueDate: string;
  ownerConfirmation: boolean;
}

interface PartsInfo {
  hasEngine: boolean;
  hasGearbox: boolean;
  hasCatalyticConverter: boolean;
  hasFourWheels: boolean;
  hasBattery: boolean;
  additionalInfo: string;
}

interface ValidationErrors {
  registrationNumber?: string;
  controlNumber?: string;
  issueDate?: string;
}

interface CarDetailsFormProps {
  carDetails: CarDetails;
  setCarDetails: (details: CarDetails | ((prev: CarDetails) => CarDetails)) => void;
  validationErrors: ValidationErrors;
  setValidationErrors: (errors: ValidationErrors | ((prev: ValidationErrors) => ValidationErrors)) => void;
  validateCarDetails: () => boolean;
  onNext: () => void | Promise<void>;
  onBack: () => void;
}

interface PartsInfoScreenProps {
  partsInfo: PartsInfo;
  setPartsInfo: (info: PartsInfo | ((prev: PartsInfo) => PartsInfo)) => void;
  onNext: () => void;
  onBack: () => void;
}

interface TransportScreenProps {
  transportMethod: string;
  setTransportMethod: (method: string) => void;
  onNext: () => void;
  onBack: () => void;
}

interface PriceValueScreenProps {
  onNext: () => void;
  onBack: () => void;
}

interface PaymentInfoScreenProps {
  onNext: () => void;
  onBack: () => void;
}

type ViewType = 'login' | 'car-details' | 'parts-info' | 'transport' | 'price-value' | 'payment-info' | 'bankid' | 'success';

// Store the customer request ID globally to use in parts saving
let currentCustomerRequestId: string | null = null;

// Function to save car registration data to Supabase
const saveCarRegistrationData = async (carDetails: CarDetails) => {
  try {
    // First, ensure we have an anonymous session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Sign in anonymously
      const { error: authError } = await supabase.auth.signInAnonymously();
      if (authError) {
        console.error('Error signing in anonymously:', authError);
        throw new Error('Authentication failed');
      }
    }

    // Save to customer_requests table without customer_id for anonymous users
    const { data: customerRequestData, error: customerRequestError } = await supabase
      .from('customer_requests')
      .insert({
        car_registration_number: carDetails.registrationNumber,
        control_number: carDetails.controlNumber,
        car_brand: 'TBD', // Required field - will be filled later
        car_model: 'TBD', // Required field - will be filled later
        owner_name: 'Customer',
        owner_address: 'Address TBD',
        owner_postal_code: '00000',
        pickup_address: 'Pickup TBD',
        pickup_postal_code: '00000'
      })
      .select()
      .single();

    if (customerRequestError) {
      console.error('Error saving customer request:', customerRequestError);
      throw customerRequestError;
    }

    // Store the customer request ID for later use
    currentCustomerRequestId = customerRequestData.id;

    // Also save control number and issue date to car_metadata if we have a customer request
    if (customerRequestData) {
      const { error: metadataError } = await supabase
        .from('car_metadata')
        .insert({
          customer_request_id: customerRequestData.id, // Using the customer request ID as car reference
          kontrollsiffror: carDetails.controlNumber,
          // The issue date can be stored in a custom field or we can add it to the schema
        });

      if (metadataError) {
        console.error('Error saving car metadata:', metadataError);
        // Don't throw here as customer request was saved successfully
      }
    }

    toast.success('Biluppgifter sparade framgångsrikt!');
    return customerRequestData;
  } catch (error) {
    console.error('Error saving car registration data:', error);
    toast.error('Fel vid sparning av biluppgifter. Försök igen.');
    throw error;
  }
};

// Function to save parts info to Supabase
const savePartsInfo = async (partsInfo: PartsInfo) => {
  try {
    if (!currentCustomerRequestId) {
      throw new Error('No customer request ID found. Please fill car details first.');
    }

    // Create parts list based on checkbox selections
    const partsList = {
      motor: partsInfo.hasEngine,
      vaxellada: partsInfo.hasGearbox,
      katalysator: partsInfo.hasCatalyticConverter,
      fyra_hjul: partsInfo.hasFourWheels,
      batteri: partsInfo.hasBattery,
      annan_info: partsInfo.additionalInfo
    };

    // Update the existing car_metadata record with parts information
    const { error: updateError } = await supabase
      .from('car_metadata')
      .update({
        part_list: partsList
      })
      .eq('customer_request_id', currentCustomerRequestId);

    if (updateError) {
      console.error('Error updating car metadata with parts info:', updateError);
      throw updateError;
    }

    toast.success('Delinformation sparad framgångsrikt!');
    return true;
  } catch (error) {
    console.error('Error saving parts info:', error);
    toast.error('Fel vid sparning av delinformation. Försök igen.');
    throw error;
  }
};

// Car Details Form Component - Moved outside to prevent re-renders
const CarDetailsForm = React.memo<CarDetailsFormProps>(({ 
  carDetails, 
  setCarDetails, 
  validationErrors, 
  setValidationErrors, 
  validateCarDetails, 
  onNext,
  onBack
}) => {
  const isFormValid = () => {
    return (
      carDetails.registrationNumber.length >= 3 &&
      carDetails.controlNumber.length >= 3 &&
      carDetails.issueDate &&
      carDetails.ownerConfirmation &&
      Object.keys(validationErrors).length === 0
    );
  };

  return (
    <div className="min-h-screen bg-yellow-400 flex flex-col relative overflow-hidden">
      {/* Status Bar */}
      <div className="flex justify-between items-center text-black text-sm pt-2 px-4">
        <span className="font-medium">12:30</span>
        <div className="flex items-center space-x-1">
          <div className="flex space-x-1">
            <div className="w-1 h-3 bg-black rounded-full"></div>
            <div className="w-1 h-3 bg-black rounded-full"></div>
            <div className="w-1 h-3 bg-black rounded-full opacity-50"></div>
            <div className="w-1 h-3 bg-black rounded-full opacity-30"></div>
          </div>
          <svg className="w-6 h-4 ml-2" fill="black" viewBox="0 0 24 16">
            <path d="M2 4v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2z"/>
            <path d="M18 2v12h2V2h-2z"/>
          </svg>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between text-black text-xs px-4 py-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-black rounded-full"></div>
          <span className="font-medium">Biluppgifter</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="opacity-50">Om bilen</span>
          <span className="opacity-50">Transport</span>
          <span className="opacity-50">Betalnings Info</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 mobile-container mx-auto">
        <h1 className="text-2xl font-bold text-black mb-6">BILUPPGIFTER</h1>
        
        {/* White Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
          {/* Registration Certificate Section */}
          <div>
            <h2 className="text-lg font-bold text-black mb-4">
              Registreringsbevis*
            </h2>
            
            <div className="flex items-start space-x-3 mb-4">
              <input
                type="checkbox"
                id="owner-confirmation"
                checked={carDetails.ownerConfirmation}
                onChange={(e) => 
                  setCarDetails({...carDetails, ownerConfirmation: e.target.checked})
                }
                className="swedish-checkbox mt-1"
              />
              <label htmlFor="owner-confirmation" className="text-base font-medium text-black leading-tight">
                Jag ägar bilen
              </label>
            </div>
            
            <p className="text-sm mb-6">
              <span className="text-blue-600 underline cursor-pointer">Hitta information här</span>
              <span className="text-gray-600"> om du inte äger bilen.</span>
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Registration Number */}
            <div>
              <label className="block text-base font-semibold text-black mb-2">
                Registreringsnummer
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={carDetails.registrationNumber}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCarDetails(prev => ({ ...prev, registrationNumber: value }));
                    
                    if (value.length > 0 && value.length < 3) {
                      setValidationErrors(prev => ({ 
                        ...prev, 
                        registrationNumber: 'Registreringsnummer måste vara minst 3 tecken' 
                      }));
                    } else {
                      setValidationErrors(prev => {
                        const { registrationNumber, ...rest } = prev;
                        return rest;
                      });
                    }
                  }}
                  onBlur={validateCarDetails}
                  placeholder="På bilen som ska pantas"
                  className={`w-full bg-gray-100 border-0 rounded-lg px-4 py-3 text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.registrationNumber ? 'ring-2 ring-red-500' : ''
                  }`}
                  autoComplete="off"
                />
                {validationErrors.registrationNumber && (
                  <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 w-5 h-5" />
                )}
              </div>
              {validationErrors.registrationNumber && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.registrationNumber}
                </p>
              )}
            </div>

            {/* Control Number */}
            <div>
              <label className="block text-base font-semibold text-black mb-2">
                Kontrollnummer
              </label>
              <input
                type="text"
                value={carDetails.controlNumber}
                onChange={(e) => {
                  const value = e.target.value;
                  setCarDetails(prev => ({ ...prev, controlNumber: value }));
                  
                  if (value.length > 0 && value.length < 3) {
                    setValidationErrors(prev => ({ 
                      ...prev, 
                      controlNumber: 'Kontrollnummer måste vara minst 3 tecken' 
                    }));
                  } else {
                    setValidationErrors(prev => {
                      const { controlNumber, ...rest } = prev;
                      return rest;
                    });
                  }
                }}
                placeholder="Ange den från Transportstyrelsen registreringsbevis del 2"
                className="w-full bg-gray-100 border-0 rounded-lg px-4 py-3 text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="off"
              />
            </div>

            {/* Issue Date */}
            <div>
              <label className="block text-base font-semibold text-black mb-2">
                Utfärdande datum
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={carDetails.issueDate}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCarDetails(prev => ({ ...prev, issueDate: value }));
                    // Clear validation error when user starts typing
                    if (validationErrors.issueDate) {
                      setValidationErrors(prev => {
                        const { issueDate, ...rest } = prev;
                        return rest;
                      });
                    }
                  }}
                  onBlur={validateCarDetails}
                  placeholder="På bilen som ska pantas"
                  className={`w-full bg-gray-100 border-0 rounded-lg px-4 py-3 text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.issueDate ? 'ring-2 ring-red-500' : ''
                  }`}
                  autoComplete="off"
                />
                {validationErrors.issueDate && (
                  <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 w-5 h-5" />
                )}
              </div>
              {validationErrors.issueDate && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.issueDate}
                </p>
              )}
            </div>
          </div>

          {/* Document Image */}
          <div className="mt-6 mb-6 flex justify-center">
            <div className="w-48 h-64 overflow-hidden rounded-lg shadow-sm flex items-center justify-center">
              <img
                src="/lovable-uploads/72928b26-68a0-4a8e-857b-083b92eb9bda.png"
                alt="Swedish Registration Document"
                className="h-48 w-auto transform rotate-90"
                style={{ transformOrigin: 'center' }}
              />
            </div>
          </div>

          {/* Helper Text */}
          <p className="text-sm text-gray-600">
            *Senaste registreringsbevis del 2
          </p>
          
          <p className="text-sm">
            <span className="text-blue-600 underline cursor-pointer">Hitta information på Pantablens hemsida</span>
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-6 space-y-4 pb-8">
          <button
            onClick={onNext}
            disabled={!isFormValid()}
            className={`w-full py-4 text-lg font-semibold rounded-full transition-colors ${
              isFormValid()
                ? "bg-gray-800 text-white hover:bg-gray-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            NÄSTA
          </button>
          
          <button
            onClick={onBack}
            className="w-full text-center text-gray-600 underline text-base py-2"
          >
            Backa
          </button>
        </div>
      </div>

      {/* Bottom Navigation Indicator */}
      <div className="pb-8 flex justify-center">
        <div className="w-32 h-1 bg-black rounded-full opacity-60"></div>
      </div>
    </div>
  );
});

// Parts Info Screen (Om bilen) - Moved outside to prevent re-renders
const PartsInfoScreen = React.memo<PartsInfoScreenProps>(({ partsInfo, setPartsInfo, onNext, onBack }) => {
  const isNextEnabled = partsInfo.hasEngine || partsInfo.hasGearbox || partsInfo.hasCatalyticConverter || partsInfo.hasFourWheels || partsInfo.hasBattery;
  
  return (
    <div className="min-h-screen bg-yellow-400 flex flex-col relative overflow-hidden">
      {/* Status Bar */}
      <div className="flex justify-between items-center text-black text-sm pt-2 px-4">
        <span className="font-medium">12:30</span>
        <div className="flex items-center space-x-1">
          <div className="flex space-x-1">
            <div className="w-1 h-3 bg-black rounded-full"></div>
            <div className="w-1 h-3 bg-black rounded-full"></div>
            <div className="w-1 h-3 bg-black rounded-full opacity-50"></div>
            <div className="w-1 h-3 bg-black rounded-full opacity-30"></div>
          </div>
          <svg className="w-6 h-4 ml-2" fill="black" viewBox="0 0 24 16">
            <path d="M2 4v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2z"/>
            <path d="M18 2v12h2V2h-2z"/>
          </svg>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between text-black text-xs px-4 py-4">
        <div className="flex items-center space-x-2">
          <span className="opacity-50">Biluppgifter</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-black rounded-full"></div>
          <span className="font-medium">Om bilen</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="opacity-50">Transport</span>
          <span className="opacity-50">Betalnings info</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 mobile-container mx-auto">
        <h1 className="text-2xl font-bold text-black mb-6">OM BILEN</h1>
        
        {/* White Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-black mb-4">
              Hur komplett är bilen?
            </h2>
            
            <div className="space-y-4">
              {/* Motor finns */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="has-engine"
                  checked={partsInfo.hasEngine}
                  onChange={(e) => 
                    setPartsInfo(prev => ({...prev, hasEngine: e.target.checked}))
                  }
                  className="swedish-checkbox"
                />
                <label htmlFor="has-engine" className="text-base text-black">
                  Motor finns
                </label>
              </div>

              {/* Växellåda finns */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="has-gearbox"
                  checked={partsInfo.hasGearbox}
                  onChange={(e) => 
                    setPartsInfo(prev => ({...prev, hasGearbox: e.target.checked}))
                  }
                  className="swedish-checkbox"
                />
                <label htmlFor="has-gearbox" className="text-base text-black">
                  Växellåda finns
                </label>
              </div>

              {/* Original-katalysator finns */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="has-catalytic-converter"
                  checked={partsInfo.hasCatalyticConverter}
                  onChange={(e) => 
                    setPartsInfo(prev => ({...prev, hasCatalyticConverter: e.target.checked}))
                  }
                  className="swedish-checkbox"
                />
                <label htmlFor="has-catalytic-converter" className="text-base text-black">
                  Original-katalysator finns
                </label>
              </div>

              {/* 4 hjul monterat */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="has-four-wheels"
                  checked={partsInfo.hasFourWheels}
                  onChange={(e) => 
                    setPartsInfo(prev => ({...prev, hasFourWheels: e.target.checked}))
                  }
                  className="swedish-checkbox"
                />
                <label htmlFor="has-four-wheels" className="text-base text-black">
                  4 hjul monterat
                </label>
              </div>

              {/* Batteri finns */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="has-battery"
                  checked={partsInfo.hasBattery}
                  onChange={(e) => 
                    setPartsInfo(prev => ({...prev, hasBattery: e.target.checked}))
                  }
                  className="swedish-checkbox"
                />
                <label htmlFor="has-battery" className="text-base text-black">
                  Batteri finns
                </label>
              </div>
            </div>

            <p className="text-sm text-gray-600 mt-4">
              Osäker på vad som finns eller hur det påverkar priset?{' '}
              <span className="text-blue-600 underline cursor-pointer">Läs mer här.</span>
            </p>
          </div>

          {/* Additional Info */}
          <div>
            <label className="block text-base font-semibold text-black mb-2">
              Annan info
            </label>
            <div className="relative">
              <textarea
                value={partsInfo.additionalInfo}
                onChange={(e) => {
                  const value = e.target.value;
                  console.log('Textarea onChange:', value, 'length:', value.length);
                  if (value.length <= 240) {
                    setPartsInfo(prev => ({ ...prev, additionalInfo: value }));
                  }
                }}
                placeholder=""
                className="w-full bg-gray-100 border-0 rounded-lg px-4 py-3 text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-none"
                maxLength={240}
              />
              <div className="absolute bottom-3 right-3 text-sm text-gray-500">
                {partsInfo.additionalInfo.length}/240
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-6 space-y-4 pb-8">
          <button
            onClick={onNext}
            disabled={!isNextEnabled}
            className={`w-full py-4 text-lg font-semibold rounded-full transition-colors ${
              isNextEnabled
                ? "bg-gray-800 text-white hover:bg-gray-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            NÄSTA
          </button>
          
          <button
            onClick={onBack}
            className="w-full text-center text-gray-600 underline text-base py-2"
          >
            Backa
          </button>
        </div>
      </div>

      {/* Bottom Navigation Indicator */}
      <div className="pb-8 flex justify-center">
        <div className="w-32 h-1 bg-black rounded-full opacity-60"></div>
      </div>
    </div>
  );
});

// Transport Screen - Moved outside to prevent re-renders
const TransportScreen = React.memo<TransportScreenProps>(({ transportMethod, setTransportMethod, onNext, onBack }) => {
  const [address, setAddress] = React.useState<string>("Vallenrenen 1, Sörberge");
  const [additionalInfo, setAdditionalInfo] = React.useState<string>("");
  
  const isNextEnabled = transportMethod !== '';

  
  return (
    <div className="min-h-screen bg-yellow-400 flex flex-col relative overflow-hidden">
      {/* Status Bar */}
      <div className="flex justify-between items-center text-black text-sm pt-2 px-4">
        <span className="font-medium">12:30</span>
        <div className="flex items-center space-x-1">
          <div className="flex space-x-1">
            <div className="w-1 h-3 bg-black rounded-full"></div>
            <div className="w-1 h-3 bg-black rounded-full"></div>
            <div className="w-1 h-3 bg-black rounded-full opacity-50"></div>
            <div className="w-1 h-3 bg-black rounded-full opacity-30"></div>
          </div>
          <svg className="w-6 h-4 ml-2" fill="black" viewBox="0 0 24 16">
            <path d="M2 4v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2z"/>
            <path d="M18 2v12h2V2h-2z"/>
          </svg>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between text-black text-xs px-4 py-4">
        <div className="flex items-center space-x-2">
          <span className="opacity-50">Biluppgifter</span>
          <span className="opacity-50">Om bilen</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-black rounded-full"></div>
          <span className="font-medium">Transport</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="opacity-50">Betalnings Info</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 mobile-container mx-auto">
        <h1 className="text-2xl font-bold text-black mb-6">TRANSPORT</h1>
        
        {/* White Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-black mb-4">
              Vad passar bäst?
            </h2>
            
            <p className="text-sm text-gray-600 mb-6">
              Lämna bilen på Ekenäsvägen 28, 863 37 Sundsvall och få{' '}
              <span className="font-semibold text-black">500 kr extra.</span>{' '}
              (Är inkluderat i det pris du får. Gäller endast om bilen är komplett.)
            </p>
            
            <div className="space-y-4 mb-6">
              {/* Ni hämtar bilen */}
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="pickup"
                  name="transport"
                  value="pickup"
                  checked={transportMethod === 'pickup'}
                  onChange={(e) => setTransportMethod(e.target.value)}
                  className="w-5 h-5 text-blue-600"
                />
                <label htmlFor="pickup" className="text-base text-black">
                  Ni hämtar bilen åt mig
                </label>
              </div>

              {/* Lämna bilen själv */}
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="dropoff"
                  name="transport"
                  value="dropoff"
                  checked={transportMethod === 'dropoff'}
                  onChange={(e) => setTransportMethod(e.target.value)}
                  className="w-5 h-5 text-blue-600"
                />
                <label htmlFor="dropoff" className="text-base text-black">
                  Jag lämnar bilen själv
                </label>
              </div>
            </div>

            {/* Address and Additional Info - shown only when "Ni hämtar bilen" is selected */}
            {transportMethod === 'pickup' && (
              <div className="space-y-4">
                <AddressPickerSimple
                  onAddressSelect={(address, coordinates) => {
                    setAddress(address);
                  }}
                  className="w-full"
                />
                
                <p className="text-sm text-gray-600">
                  Hittar du inte adress? Välj närmaste och beskriv nedan.
                </p>

                {/* Additional Info */}
                <div>
                  <label className="block text-base font-semibold text-black mb-2">
                    Annan info
                  </label>
                  <div className="relative">
                    <textarea
                      value={additionalInfo}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length <= 240) {
                          setAdditionalInfo(value);
                        }
                      }}
                      maxLength={240}
                      rows={4}
                      className="w-full bg-gray-100 border-0 rounded-lg px-4 py-3 text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Vid behov, ange mer info (exakt plats, hinder, framkomlighet)"
                    />
                    <div className="absolute bottom-3 right-3 text-sm text-gray-500">
                      {additionalInfo.length}/240
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-6 space-y-4 pb-8">
          <button
            onClick={onNext}
            disabled={!isNextEnabled}
            className={`w-full py-4 text-lg font-semibold rounded-full transition-colors ${
              isNextEnabled
                ? "bg-gray-800 text-white hover:bg-gray-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            NÄSTA
          </button>
          
          <button
            onClick={onBack}
            className="w-full text-center text-gray-600 underline text-base py-2"
          >
            Backa
          </button>
        </div>
      </div>

      {/* Bottom Navigation Indicator */}
      <div className="pb-8 flex justify-center">
        <div className="w-32 h-1 bg-black rounded-full opacity-60"></div>
      </div>
    </div>
  );
});

// Payment Info Screen - New screen for payment details
const PaymentInfoScreen = React.memo<PaymentInfoScreenProps>(({ onNext, onBack }) => {
  const [mobileNumber, setMobileNumber] = React.useState<string>("");
  const [email, setEmail] = React.useState<string>("");
  
  const isNextEnabled = mobileNumber.length >= 10 && email.includes('@');
  
  return (
    <div className="min-h-screen bg-yellow-400 flex flex-col relative overflow-hidden">
      {/* Status Bar */}
      <div className="flex justify-between items-center text-black text-sm pt-2 px-4">
        <span className="font-medium">12:30</span>
        <div className="flex items-center space-x-1">
          <div className="flex space-x-1">
            <div className="w-1 h-3 bg-black rounded-full"></div>
            <div className="w-1 h-3 bg-black rounded-full"></div>
            <div className="w-1 h-3 bg-black rounded-full opacity-50"></div>
            <div className="w-1 h-3 bg-black rounded-full opacity-30"></div>
          </div>
          <svg className="w-6 h-4 ml-2" fill="black" viewBox="0 0 24 16">
            <path d="M2 4v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2z"/>
            <path d="M18 2v12h2V2h-2z"/>
          </svg>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between text-black text-xs px-4 py-4">
        <div className="flex items-center space-x-2">
          <span className="opacity-50">Biluppgifter</span>
          <span className="opacity-50">Om bilen</span>
          <span className="opacity-50">Transport</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-black rounded-full"></div>
          <span className="font-medium">Betalnings Info</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 mobile-container mx-auto">
        <h1 className="text-2xl font-bold text-black mb-6">BETALNINGS INFO</h1>
        
        {/* White Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-black mb-4">
              Vart kan vi skicka info?
            </h2>
            
            <p className="text-sm text-gray-600 mb-6">
              Ange ditt Swish telefonnummer kopplat till ditt personnummer 19910903444
            </p>
            
            <div className="space-y-4">
              {/* Mobile Number Field */}
              <div>
                <label className="block text-base font-semibold text-black mb-2">
                  Mobilnummer till ditt Swish
                </label>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full bg-gray-100 border-0 rounded-lg px-4 py-3 text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="070-123 45 67"
                />
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-base font-semibold text-black mb-2">
                  E-postadress
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-100 border-0 rounded-lg px-4 py-3 text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="din@email.se"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-6 space-y-4 pb-8">
          <button
            onClick={onNext}
            disabled={!isNextEnabled}
            className={`w-full py-4 text-lg font-semibold rounded-full transition-colors ${
              isNextEnabled
                ? "bg-gray-800 text-white hover:bg-gray-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            NÄSTA
          </button>
          
          <button
            onClick={onBack}
            className="w-full text-center text-gray-600 underline text-base py-2"
          >
            Backa
          </button>
        </div>
      </div>

      {/* Bottom Navigation Indicator */}
      <div className="pb-8 flex justify-center">
        <div className="w-32 h-1 bg-black rounded-full opacity-60"></div>
      </div>
    </div>
  );
});

// Price Value Screen - New screen for price value and terms
const PriceValueScreen = React.memo<PriceValueScreenProps>(({ onNext, onBack }) => {
  const [agreements, setAgreements] = React.useState({
    noTrash: false,
    priceAccepted: false,
    termsAccepted: false,
    finalAgreement: false
  });
  
  const handleAgreementChange = (key: keyof typeof agreements) => {
    setAgreements(prev => ({ ...prev, [key]: !prev[key] }));
  };
  
  const allAgreementsChecked = Object.values(agreements).every(Boolean);
  
  return (
    <div className="min-h-screen bg-yellow-400 flex flex-col relative overflow-hidden">
      {/* Status Bar */}
      <div className="flex justify-between items-center text-black text-sm pt-2 px-4">
        <span className="font-medium">12:30</span>
        <div className="flex items-center space-x-1">
          <div className="flex space-x-1">
            <div className="w-1 h-3 bg-black rounded-full"></div>
            <div className="w-1 h-3 bg-black rounded-full"></div>
            <div className="w-1 h-3 bg-black rounded-full opacity-50"></div>
            <div className="w-1 h-3 bg-black rounded-full opacity-30"></div>
          </div>
          <svg className="w-6 h-4 ml-2" fill="black" viewBox="0 0 24 16">
            <path d="M2 4v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2z"/>
            <path d="M18 2v12h2V2h-2z"/>
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 pt-8 mobile-container mx-auto">
        <h1 className="text-2xl font-bold text-black mb-8">ERBJUDANDE</h1>
        
        {/* White Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
          {/* Price Display */}
          <div className="text-center mb-6">
            <div className="text-5xl font-bold text-black mb-2">500 kr</div>
          </div>
          
          {/* Payment Info */}
          <div className="text-sm text-gray-600 mb-6">
            <p>
              Sundsvalls Bildemontering betalar <strong>(amount)</strong> kr för din bil, 
              inklusive hämtning på <strong>(address)</strong>. Utbetalningen sker via 
              Swish till <strong>(phone_number)</strong>. Kopplat till ditt 
              personnummer <strong>(personal_number)</strong>, vill du veta mer?{' '}
              <span className="text-blue-600 underline cursor-pointer">Klicka här.</span>
            </p>
          </div>

          {/* Agreement Checkboxes */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="no-trash"
                checked={agreements.noTrash}
                onCheckedChange={() => handleAgreementChange('noTrash')}
                className="mt-1"
              />
              <label htmlFor="no-trash" className="text-base text-black leading-tight">
                Bilen är fri från sopor och grovavfall.
              </label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="price-accepted"
                checked={agreements.priceAccepted}
                onCheckedChange={() => handleAgreementChange('priceAccepted')}
                className="mt-1"
              />
              <label htmlFor="price-accepted" className="text-base text-black leading-tight">
                Jag godkänner att priset är baserat på de uppgifter jag lämnat.
              </label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms-accepted"
                checked={agreements.termsAccepted}
                onCheckedChange={() => handleAgreementChange('termsAccepted')}
                className="mt-1"
              />
              <label htmlFor="terms-accepted" className="text-base text-black leading-tight">
                Jag accepterar avtalet{' '}
                <span className="text-blue-600 underline cursor-pointer">
                  sundsvalls.com/allmännavillkor
                </span>
              </label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="final-agreement"
                checked={agreements.finalAgreement}
                onCheckedChange={() => handleAgreementChange('finalAgreement')}
                className="mt-1"
              />
              <label htmlFor="final-agreement" className="text-base text-black leading-tight">
                Jag förstår att avtalet inte kan ändras efter signering.
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-4 pb-8">
          <button
            onClick={onNext}
            disabled={!allAgreementsChecked}
            className={`w-full py-4 text-lg font-semibold rounded-full transition-colors ${
              allAgreementsChecked
                ? "bg-gray-800 text-white hover:bg-gray-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Signera med BankID
          </button>
          
          <button
            disabled={!allAgreementsChecked}
            className={`w-full py-4 text-lg font-semibold rounded-full border transition-colors ${
              allAgreementsChecked
                ? "border-gray-800 text-gray-800 hover:bg-gray-50"
                : "border-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Signera med BankID på annan enhet
          </button>
          
          <button
            onClick={onBack}
            className="w-full text-center text-gray-600 underline text-base py-2"
          >
            Avbryta
          </button>
        </div>
      </div>

      {/* Bottom Navigation Indicator */}
      <div className="pb-8 flex justify-center">
        <div className="w-32 h-1 bg-black rounded-full opacity-60"></div>
      </div>
    </div>
  );
});

const CustomerApp = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<ViewType>('login');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [transportMethod, setTransportMethod] = useState('');

  const [carDetails, setCarDetails] = useState<CarDetails>({
    registrationNumber: '',
    controlNumber: '',
    issueDate: '',
    ownerConfirmation: false
  });

  const [partsInfo, setPartsInfo] = useState<PartsInfo>({
    hasEngine: false,
    hasGearbox: false,
    hasCatalyticConverter: false,
    hasFourWheels: false,
    hasBattery: false,
    additionalInfo: ''
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const validateCarDetails = () => {
    const errors: ValidationErrors = {};
    
    // Mock validation - in real app this would be API calls
    if (carDetails.registrationNumber === 'IIR387') {
      errors.registrationNumber = 'Du är inte registrerad ägare. Kontrollera registreringsnumret och försök igen';
    }
    
    if (carDetails.issueDate === '2005-10-07') {
      errors.issueDate = 'Kontrollera utfärdandedatum och att du har det senaste registreringsbeviset.';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = async () => {
    const isValid = (
      carDetails.registrationNumber.length >= 3 &&
      carDetails.controlNumber.length >= 3 &&
      carDetails.issueDate &&
      carDetails.ownerConfirmation &&
      Object.keys(validationErrors).length === 0
    );
    
    if (isValid) {
      try {
        await saveCarRegistrationData(carDetails);
        setCurrentView('parts-info');
      } catch (error) {
        // Error handling is already done in saveCarRegistrationData function
        console.error('Failed to save car registration data:', error);
      }
    }
  };

  const handlePartsNext = async () => {
    try {
      await savePartsInfo(partsInfo);
      setShowConfirmDialog(true);
    } catch (error) {
      // Error handling is already done in savePartsInfo function
      console.error('Failed to save parts info:', error);
    }
  };

  const handleConfirmPartsNext = () => {
    setShowConfirmDialog(false);
    setCurrentView('transport');
  };

  const handlePartsBack = () => {
    setCurrentView('car-details');
  };

  const handleTransportNext = () => {
    setCurrentView('payment-info');
  };

  const handleTransportBack = () => {
    setCurrentView('parts-info');
  };

  const handlePaymentNext = () => {
    setCurrentView('price-value');
  };

  const handlePaymentBack = () => {
    setCurrentView('transport');
  };

  const handlePriceValueNext = () => {
    setCurrentView('bankid');
  };

  const handlePriceValueBack = () => {
    setCurrentView('payment-info');
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleBankIDComplete = () => {
    setCurrentView('success');
  };

  const handleLoginSuccess = () => {
    setCurrentView('car-details');
  };

  const handleSuccessBackToHome = () => {
    setCurrentView('car-details');
  };

  // Success Screen
  const SuccessScreen = () => (
    <div className="min-h-screen theme-swedish mobile-container flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-xl p-8 text-center max-w-sm">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-black mb-2">Autentisering klar!</h2>
        <p className="text-gray-600 mb-6">Din bil har registrerats framgångsrikt.</p>
        <button
          onClick={() => navigate('/')}
          className="w-full py-3 bg-gray-800 text-white rounded-full font-semibold"
        >
          Tillbaka till huvudmenyn
        </button>
      </div>
    </div>
  );

  // Render based on current view
  return (
    <>
      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-black">Bekräfta</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Är du säker på att allt är korrekt?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-black">Nej</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPartsNext} className="bg-gray-800 text-white">
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Main Content */}
      {(() => {
        switch (currentView) {
          case 'login':
            return <BankIDLogin onLoginSuccess={handleLoginSuccess} />;
          case 'car-details':
            return (
              <CarDetailsForm
                carDetails={carDetails}
                setCarDetails={setCarDetails}
                validationErrors={validationErrors}
                setValidationErrors={setValidationErrors}
                validateCarDetails={validateCarDetails}
                onNext={handleNext}
                onBack={handleBack}
              />
            );
          case 'parts-info':
            return (
              <PartsInfoScreen
                partsInfo={partsInfo}
                setPartsInfo={setPartsInfo}
                onNext={handlePartsNext}
                onBack={handlePartsBack}
              />
            );
          case 'transport':
            return (
              <TransportScreen
                transportMethod={transportMethod}
                setTransportMethod={setTransportMethod}
                onNext={handleTransportNext}
                onBack={handleTransportBack}
              />
            );
          case 'price-value':
            return (
              <PriceValueScreen
                onNext={handlePriceValueNext}
                onBack={handlePriceValueBack}
              />
            );
          case 'payment-info':
            return (
              <PaymentInfoScreen
                onNext={handlePaymentNext}
                onBack={handlePaymentBack}
              />
            );
          case 'bankid':
            return <BankIDScreen onComplete={handleBankIDComplete} />;
          case 'success':
            return <BankIDSuccess onContinue={handleSuccessBackToHome} />;
          default:
            return <BankIDLogin onLoginSuccess={handleLoginSuccess} />;
        }
      })()}
    </>
  );
};

export default CustomerApp;