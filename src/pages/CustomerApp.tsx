import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Star, Clock, Car, User, LogOut, CalendarIcon, DollarSign, Camera } from 'lucide-react';
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
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-gray-900">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gray-900 rounded-full"></div>
            <span className="font-medium">Biluppgifter</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium">Om bilen</span>
            <span className="font-medium">Transport</span>
            <span className="font-medium">Betalnings info</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">BILUPPGIFTER</h1>
        
        <Card className="bg-white rounded-2xl shadow-lg">
          <CardContent className="p-6 space-y-6">
            {/* Registration Certificate Section */}
            <div>
              <Label className="text-lg font-semibold text-gray-900 mb-4 block">
                Registreringsbevis*
              </Label>
              
              <div className="flex items-center space-x-3 mb-4">
                <Checkbox
                  id="owner-confirmation"
                  checked={carDetails.ownerConfirmation}
                  onCheckedChange={(checked) => 
                    setCarDetails({...carDetails, ownerConfirmation: checked as boolean})
                  }
                  className="border-2 border-gray-400"
                />
                <Label htmlFor="owner-confirmation" className="text-gray-900 font-medium">
                  Jag äger bilen
                </Label>
              </div>
              
              <p className="text-sm text-blue-600 mb-4">
                <span className="underline cursor-pointer">Hitta information här</span> om du inte äger bilen.
              </p>
            </div>

            {/* Registration Number */}
            <div>
              <Label htmlFor="registration" className="text-gray-600 text-sm font-medium">
                Registreringsnummer
              </Label>
              <Input
                id="registration"
                value={carDetails.registrationNumber}
                onChange={(e) => setCarDetails({...carDetails, registrationNumber: e.target.value})}
                placeholder="Ex bilen som ska pantas"
                className="mt-1 border-gray-300 rounded-lg h-12 text-lg"
              />
            </div>

            {/* Control Number */}
            <div>
              <Label htmlFor="control-number" className="text-gray-600 text-sm font-medium">
                Kontrollnummer
              </Label>
              <Input
                id="control-number"
                value={carDetails.controlNumber}
                onChange={(e) => setCarDetails({...carDetails, controlNumber: e.target.value})}
                placeholder="Ange den från Transportstyrlsens registreringsbevis del 2"
                className="mt-1 border-gray-300 rounded-lg h-12 text-lg"
              />
            </div>

            {/* Issue Date */}
            <div>
              <Label htmlFor="issue-date" className="text-gray-600 text-sm font-medium">
                Utfärdande datum
              </Label>
              <div className="relative">
                <Input
                  id="issue-date"
                  type="date"
                  value={carDetails.issueDate}
                  onChange={(e) => setCarDetails({...carDetails, issueDate: e.target.value})}
                  placeholder="På bilen som ska pantas"
                  className="mt-1 border-gray-300 rounded-lg h-12 text-lg pr-10"
                />
                <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>

            {/* Helper Text */}
            <p className="text-xs text-gray-500">
              *Senaste registreringsbevis del 2
            </p>

            {/* Document Image Helper */}
            <div className="bg-gray-50 rounded-lg p-4">
              <img
                src="/lovable-uploads/94fa853a-b5c7-45e5-8e5f-743bf64a045e.png"
                alt="Registreringsbevis guide"
                className="w-full h-auto rounded-lg"
              />
              <p className="text-xs text-blue-600 mt-2">
                Hitta information på <span className="underline cursor-pointer">Pantabilens hemsida</span>.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="mt-6 space-y-3">
          <Button
            onClick={() => setActiveTab('pickup-info')}
            disabled={!carDetails.registrationNumber || !carDetails.controlNumber || !carDetails.ownerConfirmation}
            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-4 rounded-2xl text-lg font-semibold disabled:opacity-50"
          >
            NÄSTA
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="w-full text-gray-700 py-2 text-base underline"
          >
            Backa
          </Button>
        </div>
      </div>
    </div>
  );

  // Pickup Info Form Component (Updated to match Swedish style)
  const PickupInfoForm = () => (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">TRANSPORT</h1>
        
        <Card className="bg-white rounded-2xl shadow-lg">
          <CardContent className="p-6 space-y-6">
            <div>
              <Label htmlFor="car-brand" className="text-gray-600 text-sm font-medium">
                Bilmärke
              </Label>
              <Input
                id="car-brand"
                value={pickupInfo.carBrand}
                onChange={(e) => setPickupInfo({...pickupInfo, carBrand: e.target.value})}
                className="mt-1 border-gray-300 rounded-lg h-12 text-lg"
              />
            </div>

            <div>
              <Label htmlFor="car-model" className="text-gray-600 text-sm font-medium">
                Bilmodell
              </Label>
              <Input
                id="car-model"
                value={pickupInfo.carModel}
                onChange={(e) => setPickupInfo({...pickupInfo, carModel: e.target.value})}
                className="mt-1 border-gray-300 rounded-lg h-12 text-lg"
              />
            </div>

            <div>
              <Label htmlFor="car-year" className="text-gray-600 text-sm font-medium">
                Årsmodell
              </Label>
              <Input
                id="car-year"
                type="number"
                value={pickupInfo.carYear}
                onChange={(e) => setPickupInfo({...pickupInfo, carYear: parseInt(e.target.value)})}
                className="mt-1 border-gray-300 rounded-lg h-12 text-lg"
              />
            </div>

            <div>
              <Label htmlFor="owner-name" className="text-gray-600 text-sm font-medium">
                Ägarens namn
              </Label>
              <Input
                id="owner-name"
                value={pickupInfo.ownerName}
                onChange={(e) => setPickupInfo({...pickupInfo, ownerName: e.target.value})}
                className="mt-1 border-gray-300 rounded-lg h-12 text-lg"
              />
            </div>

            <div>
              <Label htmlFor="pickup-address" className="text-gray-600 text-sm font-medium">
                Hämtningsadress
              </Label>
              <Input
                id="pickup-address"
                value={pickupInfo.pickupAddress}
                onChange={(e) => setPickupInfo({...pickupInfo, pickupAddress: e.target.value})}
                className="mt-1 border-gray-300 rounded-lg h-12 text-lg"
              />
            </div>

            <div>
              <Label htmlFor="pickup-postal" className="text-gray-600 text-sm font-medium">
                Postnummer
              </Label>
              <Input
                id="pickup-postal"
                value={pickupInfo.pickupPostalCode}
                onChange={(e) => setPickupInfo({...pickupInfo, pickupPostalCode: e.target.value})}
                className="mt-1 border-gray-300 rounded-lg h-12 text-lg"
              />
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 space-y-3">
          <Button
            onClick={() => setActiveTab('scrap-yards')}
            className="w-full bg-gray-700 hover:bg-gray-800 text-white py-4 rounded-2xl text-lg font-semibold"
          >
            VISA SKROTAR
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => setActiveTab('car-details')}
            className="w-full text-gray-700 py-2 text-base underline"
          >
            Backa
          </Button>
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