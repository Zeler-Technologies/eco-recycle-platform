import React, { useState } from 'react';
import { CalendarIcon, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import BankIDScreen from '@/components/BankID/BankIDScreen';
import BankIDLogin from '@/components/BankID/BankIDLogin';

interface CarDetails {
  registrationNumber: string;
  controlNumber: string;
  issueDate: string;
  ownerConfirmation: boolean;
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
  onNext: () => void;
  onBack: () => void;
}

type ViewType = 'login' | 'car-details' | 'bankid' | 'success';

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
    <div className="min-h-screen theme-swedish mobile-container">
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
      <div className="px-4">
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
    </div>
  );
});

const CustomerApp = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<ViewType>('login');

  const [carDetails, setCarDetails] = useState<CarDetails>({
    registrationNumber: '',
    controlNumber: '',
    issueDate: '',
    ownerConfirmation: false
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

  const handleNext = () => {
    const isValid = (
      carDetails.registrationNumber.length >= 3 &&
      carDetails.controlNumber.length >= 3 &&
      carDetails.issueDate &&
      carDetails.ownerConfirmation &&
      Object.keys(validationErrors).length === 0
    );
    
    if (isValid) {
      setCurrentView('bankid');
    }
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
    case 'bankid':
      return <BankIDScreen onComplete={handleBankIDComplete} />;
    case 'success':
      return <SuccessScreen />;
    default:
      return <BankIDLogin onLoginSuccess={handleLoginSuccess} />;
  }
};

export default CustomerApp;