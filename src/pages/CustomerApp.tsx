import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Star, Clock, Car, User, LogOut, CalendarIcon, DollarSign, Camera, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface CarDetails {
  registrationNumber: string;
  controlNumber: string;
  issueDate: string;
  ownerConfirmation: boolean;
}

interface PickupInfo {
  ownerName: string;
  ownerAddress: string;
  ownerPostalCode: string;
  pickupAddress: string;
  pickupPostalCode: string;
  carBrand: string;
  carModel: string;
  carYear: number;
  images: File[];
}

interface ScrapYard {
  id: number;
  name: string;
  address: string;
  distance: number;
  rating: number;
  estimatedPickupTime: string;
  estimatedPrice: string;
  verified: boolean;
}

const mockScrapYards: ScrapYard[] = [
  {
    id: 1,
    name: "Stockholm Bilskrot AB",
    address: "Industrivägen 15, Stockholm",
    distance: 2.3,
    rating: 4.8,
    estimatedPickupTime: "Inom 2 timmar",
    estimatedPrice: "8,500 - 12,000 SEK",
    verified: true
  },
  {
    id: 2,
    name: "EcoMetal Återvinning",
    address: "Recyclingsgatan 8, Stockholm",
    distance: 4.1,
    rating: 4.6,
    estimatedPickupTime: "Inom 4 timmar",
    estimatedPrice: "7,800 - 11,500 SEK",
    verified: true
  },
  {
    id: 3,
    name: "Green Auto Parts",
    address: "Miljövägen 22, Stockholm",
    distance: 6.7,
    rating: 4.4,
    estimatedPickupTime: "Inom 6 timmar",
    estimatedPrice: "7,200 - 10,800 SEK",
    verified: false
  }
];

const CustomerApp = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('car-details');
  const [showPrices, setShowPrices] = useState(false);

  const [carDetails, setCarDetails] = useState<CarDetails>({
    registrationNumber: '',
    controlNumber: '',
    issueDate: '',
    ownerConfirmation: false
  });

  const [validationErrors, setValidationErrors] = useState<{
    registrationNumber?: string;
    issueDate?: string;
  }>({});

  const validateCarDetails = () => {
    const errors: { registrationNumber?: string; issueDate?: string } = {};
    
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

  const handleCarDetailsChange = (field: keyof CarDetails, value: any) => {
    setCarDetails({ ...carDetails, [field]: value });
    // Clear validation error when user starts typing
    if (validationErrors[field as keyof typeof validationErrors]) {
      setValidationErrors({ ...validationErrors, [field]: undefined });
    }
  };

  const [pickupInfo, setPickupInfo] = useState<PickupInfo>({
    ownerName: '',
    ownerAddress: '',
    ownerPostalCode: '',
    pickupAddress: '',
    pickupPostalCode: '',
    carBrand: '',
    carModel: '',
    carYear: new Date().getFullYear(),
    images: []
  });

  // Car Details Form Component
  const CarDetailsForm = () => (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 p-4">
      {/* Header with navigation dots */}
      <div className="flex items-center justify-between text-black text-sm mb-8 pt-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-black rounded-full"></div>
          <span className="font-medium">Biluppgifter</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm opacity-50">Om bilen</span>
          <span className="text-sm opacity-50">Transport</span>
          <span className="text-sm opacity-50">Betalnings info</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-black mb-6">BILUPPGIFTER</h1>
        
        <div className="bg-white rounded-2xl p-6 space-y-6">
          {/* Registration Certificate Section */}
          <div>
            <h2 className="text-xl font-bold text-black mb-4">
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
                className="mt-1 h-4 w-4 border-2 border-gray-400 rounded"
              />
              <label htmlFor="owner-confirmation" className="text-base font-medium text-black">
                Jag äger bilen
              </label>
            </div>
            
            <p className="text-sm mb-6">
              <span className="text-blue-500 underline cursor-pointer">Hitta information här</span>
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
                  onChange={(e) => handleCarDetailsChange('registrationNumber', e.target.value)}
                  onBlur={validateCarDetails}
                  placeholder="På bilen som ska pantas"
                  className={`w-full bg-gray-100 border-0 rounded-lg px-4 py-3 text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.registrationNumber ? 'ring-2 ring-red-500' : ''
                  }`}
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
                onChange={(e) => setCarDetails({...carDetails, controlNumber: e.target.value})}
                placeholder="Ange den från Transportstyrelsen registreringsbevis del 2"
                className="w-full bg-gray-100 border-0 rounded-lg px-4 py-3 text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  onChange={(e) => handleCarDetailsChange('issueDate', e.target.value)}
                  onBlur={validateCarDetails}
                  placeholder="På bilen som ska pantas"
                  className={`w-full bg-gray-100 border-0 rounded-lg px-4 py-3 text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12 ${
                    validationErrors.issueDate ? 'ring-2 ring-red-500' : ''
                  }`}
                />
                <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                {validationErrors.issueDate && (
                  <AlertCircle className="absolute right-10 top-1/2 transform -translate-y-1/2 text-red-500 w-5 h-5" />
                )}
              </div>
              {validationErrors.issueDate && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.issueDate}
                </p>
              )}
            </div>
          </div>

          {/* Helper Text */}
          <p className="text-sm text-gray-600">
            *Senaste registreringsbevis del 2
          </p>

          {/* Registration Document Image */}
          <div className="space-y-4">
            <img
              src="/lovable-uploads/865c762e-e9e8-4e21-a6ab-d4b505f28680.png"
              alt="Registreringsbevis exempel"
              className="w-full rounded-lg"
            />
            
            <p className="text-sm text-gray-600">
              Hitta information på{" "}
              <span className="text-blue-500 underline cursor-pointer">
                Pantablens hemsida.
              </span>
            </p>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-6 space-y-4">
          <button
            onClick={() => setActiveTab('pickup-info')}
            disabled={
              !carDetails.registrationNumber || 
              !carDetails.controlNumber || 
              !carDetails.ownerConfirmation || 
              Object.keys(validationErrors).length > 0
            }
            className={`w-full py-4 text-lg font-semibold rounded-full transition-colors ${
              !carDetails.registrationNumber || 
              !carDetails.controlNumber || 
              !carDetails.ownerConfirmation || 
              Object.keys(validationErrors).length > 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gray-800 text-white hover:bg-gray-700"
            }`}
          >
            NÄSTA
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="w-full text-center text-gray-600 underline text-base py-2"
          >
            Backa
          </button>
        </div>
      </div>
    </div>
  );

  // Pickup Info Form Component (Updated to match Swedish style)
  const PickupInfoForm = () => (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 p-4">
      {/* Header with navigation dots */}
      <div className="flex items-center justify-between text-black text-sm mb-8 pt-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-black rounded-full"></div>
          <span className="font-medium">Transport</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm">✓ Biluppgifter</span>
          <span className="text-sm font-medium">Transport</span>
          <span className="text-sm opacity-50">Betalnings info</span>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-black mb-6">TRANSPORT</h1>
        
        <div className="bg-white rounded-2xl p-6 space-y-6">
          <div>
            <label className="block text-base font-semibold text-black mb-2">
              Bilmärke
            </label>
            <input
              type="text"
              value={pickupInfo.carBrand}
              onChange={(e) => setPickupInfo({...pickupInfo, carBrand: e.target.value})}
              className="w-full bg-gray-100 border-0 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-base font-semibold text-black mb-2">
              Bilmodell
            </label>
            <input
              type="text"
              value={pickupInfo.carModel}
              onChange={(e) => setPickupInfo({...pickupInfo, carModel: e.target.value})}
              className="w-full bg-gray-100 border-0 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-base font-semibold text-black mb-2">
              Årsmodell
            </label>
            <input
              type="number"
              value={pickupInfo.carYear}
              onChange={(e) => setPickupInfo({...pickupInfo, carYear: parseInt(e.target.value)})}
              className="w-full bg-gray-100 border-0 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-base font-semibold text-black mb-2">
              Ägarens namn
            </label>
            <input
              type="text"
              value={pickupInfo.ownerName}
              onChange={(e) => setPickupInfo({...pickupInfo, ownerName: e.target.value})}
              className="w-full bg-gray-100 border-0 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-base font-semibold text-black mb-2">
              Hämtningsadress
            </label>
            <input
              type="text"
              value={pickupInfo.pickupAddress}
              onChange={(e) => setPickupInfo({...pickupInfo, pickupAddress: e.target.value})}
              className="w-full bg-gray-100 border-0 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-base font-semibold text-black mb-2">
              Postnummer
            </label>
            <input
              type="text"
              value={pickupInfo.pickupPostalCode}
              onChange={(e) => setPickupInfo({...pickupInfo, pickupPostalCode: e.target.value})}
              className="w-full bg-gray-100 border-0 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <button
            onClick={() => setActiveTab('scrap-yards')}
            className="w-full py-4 text-lg font-semibold rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          >
            VISA SKROTAR
          </button>
          
          <button
            onClick={() => setActiveTab('car-details')}
            className="w-full text-center text-gray-600 underline text-base py-2"
          >
            Backa
          </button>
        </div>
      </div>
    </div>
  );

  // Scrap Yards List Component
  const ScrapYardsList = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tillgängliga skrotfirmor</CardTitle>
          <div className="mb-4">
            <Button 
              variant={showPrices ? "default" : "outline"}
              onClick={() => setShowPrices(!showPrices)}
              className="flex items-center gap-2"
            >
              <DollarSign className="h-4 w-4" />
              {showPrices ? 'Dölj priser' : 'Visa priser (Premium)'}
            </Button>
            {!showPrices && (
              <p className="text-sm text-muted-foreground mt-2">
                Betala för att se alla skrotfirmors priser
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockScrapYards.map((yard) => (
              <Card key={yard.id} className={yard.verified ? 'ring-2 ring-primary' : ''}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{yard.name}</h3>
                        {yard.verified && (
                          <Badge className="bg-gradient-to-r from-primary to-primary/80">
                            <Star className="h-3 w-3 mr-1" />
                            Verifierad
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {yard.distance} km
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-current text-yellow-500" />
                          {yard.rating}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {yard.estimatedPickupTime}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        {yard.address}
                      </p>

                      {showPrices && (
                        <div className="flex items-center gap-2 mb-3">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-green-600">
                            {yard.estimatedPrice}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button size="sm">
                        Välj denna
                      </Button>
                      <Button variant="outline" size="sm">
                        Detaljer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setActiveTab('pickup-info')}>
          Ändra biluppgifter
        </Button>
        <Button onClick={() => setActiveTab('order-status')}>
          Orderstatus
        </Button>
      </div>
    </div>
  );

  // Order Status Component
  const OrderStatus = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Orderstatus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Inga aktiva beställningar</p>
            <Button 
              className="mt-4" 
              onClick={() => setActiveTab('car-details')}
            >
              Begär ny hämtning
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Show forms based on active tab */}
      {activeTab === 'car-details' && <CarDetailsForm />}
      {activeTab === 'pickup-info' && <PickupInfoForm />}
      
      {/* Show traditional layout for other tabs */}
      {(activeTab === 'scrap-yards' || activeTab === 'order-status') && (
        <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
          <header className="bg-card border-b shadow-sm">
            <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-primary">Bilskrot</h1>
                <p className="text-sm text-muted-foreground">Kundapp</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm">Hej, {user?.name}!</span>
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logga ut
                </Button>
              </div>
            </div>
          </header>

          <nav className="bg-card border-b">
            <div className="max-w-4xl mx-auto px-4">
              <div className="flex space-x-1">
                {[
                  { id: 'car-details', label: 'Biluppgifter', icon: Car },
                  { id: 'scrap-yards', label: 'Skrotfirmor', icon: MapPin },
                  { id: 'order-status', label: 'Orderstatus', icon: Clock }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </nav>

          <main className="max-w-4xl mx-auto px-4 py-6">
            {activeTab === 'scrap-yards' && <ScrapYardsList />}
            {activeTab === 'order-status' && <OrderStatus />}
          </main>
        </div>
      )}
    </div>
  );
};

export default CustomerApp;