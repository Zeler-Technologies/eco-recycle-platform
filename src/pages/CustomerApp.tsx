import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Car, Clock, DollarSign, Camera, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const CustomerApp = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('request');

  const mockScrapYards = [
    {
      id: 1,
      name: 'Sundsvall Bilskrot AB',
      address: 'Industrivägen 15, 857 53 Sundsvall',
      distance: '2.3 km',
      rating: 4.8,
      estimatedPrice: '2,500 - 4,200 SEK',
      isPremium: true,
      pickupTime: '1-2 dagar'
    },
    {
      id: 2,
      name: 'Nord Återvinning',
      address: 'Bangatan 22, 856 41 Sundsvall',
      distance: '4.1 km',
      rating: 4.5,
      estimatedPrice: '2,200 - 3,800 SEK',
      isPremium: false,
      pickupTime: '2-3 dagar'
    },
    {
      id: 3,
      name: 'Mittskrot Sundsvall',
      address: 'Storgatan 45, 852 30 Sundsvall',
      distance: '5.7 km',
      rating: 4.3,
      estimatedPrice: '2,100 - 3,600 SEK',
      isPremium: false,
      pickupTime: '3-4 dagar'
    }
  ];

  const RequestPickupForm = () => {
    const [formData, setFormData] = useState({
      ownerName: '',
      carRegistration: '',
      carBrand: '',
      carModel: '',
      carYear: '',
      controlNumber: '',
      pickupAddress: '',
      pickupPostalCode: '',
      notes: ''
    });

    const handleInputChange = (field: string, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Biluppgifter
            </CardTitle>
            <CardDescription>
              Fyll i uppgifterna om din bil som ska skrotas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="registration">Registreringsnummer *</Label>
                <Input
                  id="registration"
                  placeholder="ABC123"
                  value={formData.carRegistration}
                  onChange={(e) => handleInputChange('carRegistration', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="control">Kontrollnummer</Label>
                <Input
                  id="control"
                  placeholder="12345"
                  value={formData.controlNumber}
                  onChange={(e) => handleInputChange('controlNumber', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="brand">Bilmärke *</Label>
                <Input
                  id="brand"
                  placeholder="Volvo"
                  value={formData.carBrand}
                  onChange={(e) => handleInputChange('carBrand', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="model">Modell *</Label>
                <Input
                  id="model"
                  placeholder="V70"
                  value={formData.carModel}
                  onChange={(e) => handleInputChange('carModel', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="year">Årsmodell</Label>
                <Input
                  id="year"
                  placeholder="2018"
                  type="number"
                  value={formData.carYear}
                  onChange={(e) => handleInputChange('carYear', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="owner">Ägarens namn *</Label>
              <Input
                id="owner"
                placeholder="Anna Larsson"
                value={formData.ownerName}
                onChange={(e) => handleInputChange('ownerName', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Hämtningsadress
            </CardTitle>
            <CardDescription>
              Var ska vi hämta bilen?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address">Adress *</Label>
              <Input
                id="address"
                placeholder="Storgatan 15"
                value={formData.pickupAddress}
                onChange={(e) => handleInputChange('pickupAddress', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="postal">Postnummer *</Label>
              <Input
                id="postal"
                placeholder="852 30"
                value={formData.pickupPostalCode}
                onChange={(e) => handleInputChange('pickupPostalCode', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="notes">Anteckningar</Label>
              <Textarea
                id="notes"
                placeholder="T.ex. specifika instruktioner för hämtning..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Bilder av bilen (valfritt)
            </CardTitle>
            <CardDescription>
              Ladda upp bilder för bättre prisuppskattning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">Klicka för att ladda upp bilder</p>
              <Button variant="outline">Välj bilder</Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setActiveTab('yards')}>
            Tillbaka
          </Button>
          <Button onClick={() => setActiveTab('yards')}>
            Visa skrotfirmor
          </Button>
        </div>
      </div>
    );
  };

  const ScrapYardsList = () => {
    const [showPrices, setShowPrices] = useState(false);

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Tillgängliga skrotfirmor i Sundsvall</CardTitle>
            <CardDescription>
              Baserat på din plats och bilens uppgifter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Button 
                variant={showPrices ? "default" : "outline"}
                onClick={() => setShowPrices(!showPrices)}
                className="flex items-center gap-2"
              >
                <DollarSign className="h-4 w-4" />
                {showPrices ? 'Dölj priser' : 'Visa bästa pris (49 SEK)'}
              </Button>
              {!showPrices && (
                <p className="text-sm text-muted-foreground mt-2">
                  Betala en liten avgift för att se alla skrotfirmors priser
                </p>
              )}
            </div>

            <div className="space-y-4">
              {mockScrapYards.map((yard) => (
                <Card key={yard.id} className={yard.isPremium ? 'ring-2 ring-primary' : ''}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{yard.name}</h3>
                          {yard.isPremium && (
                            <Badge className="bg-gradient-to-r from-primary to-primary/80">
                              <Star className="h-3 w-3 mr-1" />
                              Premium
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {yard.distance}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-current text-yellow-500" />
                            {yard.rating}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {yard.pickupTime}
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
          <Button variant="outline" onClick={() => setActiveTab('request')}>
            Ändra biluppgifter
          </Button>
          <Button onClick={() => setActiveTab('status')}>
            Mina beställningar
          </Button>
        </div>
      </div>
    );
  };

  const OrderStatus = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Mina beställningar</CardTitle>
            <CardDescription>
              Följ status på dina skrotbeställningar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Inga aktiva beställningar</p>
              <Button 
                className="mt-4" 
                onClick={() => setActiveTab('request')}
              >
                Begär ny hämtning
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
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
              Logga ut
            </Button>
          </div>
        </div>
      </header>

      <nav className="bg-card border-b">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex space-x-1">
            {[
              { id: 'request', label: 'Begär hämtning', icon: Car },
              { id: 'yards', label: 'Skrotfirmor', icon: MapPin },
              { id: 'status', label: 'Mina beställningar', icon: Clock }
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
        {activeTab === 'request' && <RequestPickupForm />}
        {activeTab === 'yards' && <ScrapYardsList />}
        {activeTab === 'status' && <OrderStatus />}
      </main>
    </div>
  );
};

export default CustomerApp;