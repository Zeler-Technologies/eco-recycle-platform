import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  LogOut, 
  RefreshCw, 
  Calendar, 
  MapPin, 
  Car, 
  Phone, 
  Navigation,
  CheckCircle,
  Camera,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

interface Pickup {
  id: string;
  customer_request_id: string;
  car_registration_number: string;
  car_brand: string;
  car_model: string;
  owner_name: string;
  phone_number: string;
  pickup_address: string;
  scheduled_pickup_date: string;
  status: string;
  final_price?: number;
  driver_notes?: string;
}

const PantaBilenDriverApp = () => {
  const { user, logout } = useAuth();
  
  const [availablePickups, setAvailablePickups] = useState<Pickup[]>([]);
  const [assignedPickups, setAssignedPickups] = useState<Pickup[]>([]);
  const [completedPickups, setCompletedPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'assigned' | 'completed' | 'verification'>('available');
  const [selectedPickup, setSelectedPickup] = useState<Pickup | null>(null);
  
  // Driver state
  const [driverStatus, setDriverStatus] = useState<'available' | 'busy' | 'offline'>('available');
  const [dailyStats, setDailyStats] = useState({
    completed: 0,
    inProgress: 1,
    pending: 1
  });
  
  const [verificationStep, setVerificationStep] = useState<'checklist' | 'signature'>('checklist');
  const [checklist, setChecklist] = useState({
    reg_nr: false,
    motor: false,
    transmission: false,
    catalytic: false,
    wheels: false,
    battery: false,
    no_waste: false
  });
  const [photos, setPhotos] = useState<Array<{url: string, fileName: string}>>([]);
  const [finalPrice, setFinalPrice] = useState('');
  const [driverNotes, setDriverNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    if (user) {
      loadAllPickups();
      setLoading(false);
    }
  }, [user]);

  const updateDriverStatus = async (newStatus: 'available' | 'busy' | 'offline') => {
    setDriverStatus(newStatus);
    toast.success(`Status ändrad till: ${getDriverStatusText(newStatus)}`);
  };

  const getDriverStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-red-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getDriverStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Tillgänglig';
      case 'busy': return 'Upptagen';
      case 'offline': return 'Offline';
      default: return 'Offline';
    }
  };

  const reschedulePickup = (pickup: Pickup) => {
    toast.info(`Omschemaläggning av ${pickup.car_registration_number} - funktionalitet kommer snart`);
  };

  const rejectPickup = (pickupId: string) => {
    const pickup = assignedPickups.find(p => p.id === pickupId);
    if (pickup) {
      setAssignedPickups(prev => prev.filter(p => p.id !== pickupId));
      setAvailablePickups(prev => [...prev, { ...pickup, status: 'scheduled' }]);
      toast.success('Upphämtning avvisad och återställd till tillgängliga');
    }
  };

  const loadAllPickups = async () => {
    try {
      const availableMockData = [
        {
          id: 'avail1',
          customer_request_id: 'req1',
          car_registration_number: 'XYZ789',
          car_brand: 'BMW',
          car_model: '320i',
          owner_name: 'Maria Karlsson',
          phone_number: '070-345-6789',
          pickup_address: 'Vasagatan 8, Stockholm',
          scheduled_pickup_date: new Date(Date.now() + 86400000).toISOString(),
          status: 'scheduled',
          final_price: 22000
        }
      ];

      const assignedMockData = [
        {
          id: 'assign1',
          customer_request_id: 'req3',
          car_registration_number: 'ABC123',
          car_brand: 'Volvo',
          car_model: 'V70',
          owner_name: 'Anna Andersson',
          phone_number: '070-123-4567',
          pickup_address: 'Storgatan 12, Stockholm',
          scheduled_pickup_date: new Date().toISOString(),
          status: 'assigned',
          final_price: 25000
        }
      ];

      const completedMockData = [
        {
          id: 'comp1',
          customer_request_id: 'req5',
          car_registration_number: 'GHI789',
          car_brand: 'Mercedes',
          car_model: 'C200',
          owner_name: 'Lisa Nordström',
          phone_number: '070-567-8901',
          pickup_address: 'Östermalm 3, Stockholm',
          scheduled_pickup_date: new Date(Date.now() - 86400000).toISOString(),
          status: 'completed',
          final_price: 32000
        }
      ];

      setAvailablePickups(availableMockData);
      setAssignedPickups(assignedMockData);
      setCompletedPickups(completedMockData);

    } catch (error) {
      console.error('Error loading pickups:', error);
      toast.error('Kunde inte ladda upphämtningar');
    }
  };

  const updatePickupStatus = async (pickupId: string, newStatus: string) => {
    try {
      if (newStatus === 'assigned') {
        const pickup = availablePickups.find(p => p.id === pickupId);
        if (pickup) {
          setAvailablePickups(prev => prev.filter(p => p.id !== pickupId));
          setAssignedPickups(prev => [...prev, { ...pickup, status: 'assigned' }]);
          toast.success('Upphämtning accepterad');
        }
      } else if (newStatus === 'in_progress') {
        setAssignedPickups(prev => prev.map(p => 
          p.id === pickupId ? { ...p, status: 'in_progress' } : p
        ));
        toast.success('Upphämtning påbörjad');
      } else if (newStatus === 'completed') {
        const pickup = assignedPickups.find(p => p.id === pickupId);
        if (pickup) {
          setAssignedPickups(prev => prev.filter(p => p.id !== pickupId));
          setCompletedPickups(prev => [...prev, { ...pickup, status: 'completed' }]);
          toast.success('Upphämtning slutförd');
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Kunde inte uppdatera status');
    }
  };

  const startVerification = (pickup: Pickup) => {
    setSelectedPickup(pickup);
    setActiveTab('verification');
    setFinalPrice(pickup.final_price?.toString() || '');
    resetVerificationState();
  };

  const resetVerificationState = () => {
    setVerificationStep('checklist');
    setChecklist({
      reg_nr: false,
      motor: false,
      transmission: false,
      catalytic: false,
      wheels: false,
      battery: false,
      no_waste: false
    });
    setPhotos([]);
    setFinalPrice('');
    setDriverNotes('');
  };

  const completeVerification = async () => {
    if (!selectedPickup) return;
    
    setSigning(true);
    try {
      await updatePickupStatus(selectedPickup.id, 'completed');
      toast.success('Upphämtning slutförd och signerad');
      setActiveTab('assigned');
      setSelectedPickup(null);
      resetVerificationState();
    } catch (error: any) {
      console.error('Verification failed:', error);
      toast.error('Signering misslyckades');
    } finally {
      setSigning(false);
    }
  };

  const getCurrentTime = () => new Date().toLocaleTimeString('sv-SE', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('sv-SE');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Tillgänglig';
      case 'assigned': return 'Tilldelad';
      case 'in_progress': return 'Pågående';
      case 'completed': return 'Slutförd';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Laddar förarpanel...</p>
        </div>
      </div>
    );
  }

  // Verification Tab
  if (activeTab === 'verification' && selectedPickup) {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-gray-900 text-white p-4">
          <div className="flex items-center justify-between">
            <button onClick={() => { setActiveTab('assigned'); setSelectedPickup(null); }} className="text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">{selectedPickup.car_registration_number}</h1>
            <div className="text-sm">{verificationStep === 'checklist' ? 'Kontroll' : 'Signering'}</div>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          {verificationStep === 'checklist' && (
            <div className="p-6">
              <h2 className="text-xl font-bold mb-6">
                Jag intygar härmed att jag har kontrollerat följande:
              </h2>

              <div className="space-y-4 mb-8">
                {[
                  { key: 'reg_nr', label: `Reg.nr: ${selectedPickup.car_registration_number}`, required: true },
                  { key: 'motor', label: 'Motor finns' },
                  { key: 'transmission', label: 'Växellåda finns' },
                  { key: 'catalytic', label: 'Original-katalysator finns' },
                  { key: 'wheels', label: '4 hjul monterat' },
                  { key: 'battery', label: 'Batteri finns' },
                  { key: 'no_waste', label: 'Inga hushållssoppor eller grovskräp finns i bilen' }
                ].map(item => (
                  <label key={item.key} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={checklist[item.key as keyof typeof checklist]}
                      onChange={(e) => setChecklist(prev => ({ 
                        ...prev, 
                        [item.key]: e.target.checked 
                      }))}
                      className="w-5 h-5 text-blue-600"
                    />
                    <span className={item.required ? 'font-semibold' : ''}>{item.label}</span>
                  </label>
                ))}
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-2">Intern kommentar</h3>
                <textarea
                  value={driverNotes}
                  onChange={(e) => setDriverNotes(e.target.value)}
                  placeholder="Skriv eventuella kommentarer här..."
                  className="w-full p-3 border rounded-lg h-24 resize-none"
                  maxLength={240}
                />
                <div className="text-right text-sm text-gray-500 mt-1">{driverNotes.length}/240</div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-2">Bild (Valfri dokumentation)</h3>
                <p className="text-sm text-gray-600 mb-4">Ladda upp foton endast om du behöver dokumentera avvikelser.</p>
                
                <div className="w-full border-2 border-dashed rounded-lg p-8 text-center border-gray-300">
                  <Camera className="w-8 h-8 mb-2 mx-auto text-gray-400" />
                  <span className="text-gray-600">Ta bild för dokumentation</span>
                </div>
              </div>

              <div className="mb-8">
                <label className="block font-semibold mb-2">Slutligt pris</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={finalPrice}
                    onChange={(e) => setFinalPrice(e.target.value)}
                    className="flex-1 p-3 border rounded-lg text-xl font-bold"
                    placeholder="0"
                  />
                  <span className="ml-2 text-xl">kr</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => setVerificationStep('signature')}
                  disabled={!checklist.reg_nr || !finalPrice}
                  className="w-full bg-blue-600 text-white py-3 disabled:bg-gray-400"
                >
                  Fortsätt till signering
                </Button>
                
                <Button
                  onClick={() => { setActiveTab('assigned'); setSelectedPickup(null); }}
                  variant="outline"
                  className="w-full"
                >
                  Avbryt
                </Button>
              </div>
            </div>
          )}

          {verificationStep === 'signature' && (
            <div className="p-6">
              <h2 className="text-xl font-bold mb-6">Signera verifiering med BankID</h2>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold mb-2">Sammanfattning</h3>
                <div className="text-sm space-y-1">
                  <p><strong>Bil:</strong> {selectedPickup.car_registration_number}</p>
                  <p><strong>Slutpris:</strong> {finalPrice} kr</p>
                  <p><strong>Dokumentation:</strong> {photos.length} foton</p>
                  {driverNotes && <p><strong>Kommentarer:</strong> {driverNotes}</p>}
                </div>
              </div>

              <div className="text-center">
                <p className="text-gray-600 mb-6">
                  Genom att signera med BankID bekräftar du att informationen ovan är korrekt 
                  och att upphämtningen är genomförd enligt specifikationerna.
                </p>

                <Button
                  onClick={completeVerification}
                  disabled={signing}
                  className="w-full bg-gray-900 text-white py-4 text-lg font-semibold disabled:bg-gray-400"
                >
                  {signing ? (
                    <div className="flex items-center justify-center space-x-3">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Signerar...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-3">
                      <div className="text-xl font-bold">iD</div>
                      <span>Signera med BankID</span>
                    </div>
                  )}
                </Button>

                <Button
                  onClick={() => setVerificationStep('checklist')}
                  variant="outline"
                  className="w-full mt-4"
                >
                  Tillbaka till kontroll
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main Tabbed Interface
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Förare Panel</h1>
              <p className="text-sm text-gray-600">{user?.email} • Klockan {getCurrentTime()}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={loadAllPickups} variant="ghost" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button onClick={logout} variant="ghost" size="sm">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Driver Status and Stats - Only show on assigned tab */}
        {activeTab === 'assigned' && (
          <>
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getDriverStatusColor(driverStatus)}`} />
                    <div>
                      <p className="font-medium text-gray-900">{getDriverStatusText(driverStatus)}</p>
                      <p className="text-xs text-gray-500">Klicka för att ändra status</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {['available', 'busy', 'offline'].map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={driverStatus === status ? "default" : "outline"}
                      onClick={() => updateDriverStatus(status as any)}
                      className="text-xs px-3"
                    >
                      {getDriverStatusText(status)}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardContent className="p-4">
                <h3 className="font-bold text-gray-900 mb-3">Dagens översikt</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{dailyStats.completed}</div>
                    <div className="text-sm text-gray-600">Klara</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{dailyStats.inProgress}</div>
                    <div className="text-sm text-gray-600">Pågående</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{dailyStats.pending}</div>
                    <div className="text-sm text-gray-600">Väntande</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Tab Navigation */}
        <div className="bg-gray-100 rounded-lg p-1 mb-4 grid grid-cols-3 gap-1">
          <button
            className={`py-2 px-3 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'available' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('available')}
          >
            Tillgängliga
            {availablePickups.length > 0 && (
              <span className="ml-1 bg-blue-100 text-blue-600 text-xs px-1 py-0.5 rounded">
                {availablePickups.length}
              </span>
            )}
          </button>
          <button
            className={`py-2 px-3 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'assigned' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('assigned')}
          >
            Mina upphämtningar
            {assignedPickups.length > 0 && (
              <span className="ml-1 bg-green-100 text-green-600 text-xs px-1 py-0.5 rounded">
                {assignedPickups.length}
              </span>
            )}
          </button>
          <button
            className={`py-2 px-3 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'completed' ? 'bg-white text-gray-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('completed')}
          >
            Gjorda
            {completedPickups.length > 0 && (
              <span className="ml-1 bg-gray-100 text-gray-600 text-xs px-1 py-0.5 rounded">
                {completedPickups.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'available' && (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Tillgängliga upphämtningar</h2>
              <p className="text-sm text-gray-600">Acceptera upphämtningar som passar dig</p>
            </div>
            
            {availablePickups.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Car className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">Inga tillgängliga upphämtningar</p>
                <p className="text-sm">Nya upphämtningar visas här automatiskt</p>
              </div>
            ) : (
              <div>
                {availablePickups.map((pickup) => (
                  <Card key={pickup.id} className="mb-3">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{pickup.owner_name}</h3>
                          <a href={`tel:${pickup.phone_number}`} className="flex items-center text-sm text-blue-600 hover:text-blue-800 mt-1">
                            <Phone className="w-3 h-3 mr-1" />
                            {pickup.phone_number}
                          </a>
                        </div>
                        <Badge className={getStatusColor(pickup.status)}>{getStatusText(pickup.status)}</Badge>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Car className="w-4 h-4 mr-2" />
                          <span>{pickup.car_brand} {pickup.car_model} • {pickup.car_registration_number}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>{pickup.pickup_address}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>{formatDate(pickup.scheduled_pickup_date)}</span>
                        </div>
                        {pickup.final_price && (
                          <div className="flex items-center text-sm text-green-600">
                            <span className="w-4 h-4 mr-2">💰</span>
                            <span>{pickup.final_price.toLocaleString()} kr</span>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => updatePickupStatus(pickup.id, 'assigned')}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        Acceptera upphämtning
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'assigned' && (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Mina upphämtningar</h2>
              <p className="text-sm text-gray-600">Upphämtningar tilldelade till dig</p>
            </div>
            
            {assignedPickups.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">Inga tilldelade upphämtningar</p>
                <p className="text-sm">Gå till "Tillgängliga" för att acceptera upphämtningar</p>
              </div>
            ) : (
              <div>
                {assignedPickups.map((pickup) => (
                  <Card key={pickup.id} className="mb-3">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{pickup.owner_name}</h3>
                          <a href={`tel:${pickup.phone_number}`} className="flex items-center text-sm text-blue-600 hover:text-blue-800 mt-1">
                            <Phone className="w-3 h-3 mr-1" />
                            {pickup.phone_number}
                          </a>
                        </div>
                        <Badge className={getStatusColor(pickup.status)}>{getStatusText(pickup.status)}</Badge>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Car className="w-4 h-4 mr-2" />
                          <span>{pickup.car_brand} {pickup.car_model} • {pickup.car_registration_number}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>{pickup.pickup_address}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>{formatDate(pickup.scheduled_pickup_date)}</span>
                        </div>
                        {pickup.final_price && (
                          <div className="flex items-center text-sm text-green-600">
                            <span className="w-4 h-4 mr-2">💰</span>
                            <span>{pickup.final_price.toLocaleString()} kr</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        {pickup.status === 'assigned' && (
                          <div className="space-y-2">
                            <Button
                              onClick={() => updatePickupStatus(pickup.id, 'in_progress')}
                              className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                              Starta upphämtning
                            </Button>
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                onClick={() => reschedulePickup(pickup)}
                                variant="outline"
                                className="border-orange-300 text-orange-600 hover:bg-orange-50"
                              >
                                Omschemalägg
                              </Button>
                              <Button
                                onClick={() => rejectPickup(pickup.id)}
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50"
                              >
                                Avvisa
                              </Button>
                            </div>
                            <Button
                              onClick={() => {
                                const address = encodeURIComponent(pickup.pickup_address);
                                window.open(`https://www.google.com/maps/dir/?api=1&destination=${address}`, '_blank');
                              }}
                              className="w-full bg-green-600 hover:bg-green-700"
                            >
                              <Navigation className="w-4 h-4 mr-2" />
                              Starta GPS Navigation
                            </Button>
                          </div>
                        )}

                        {pickup.status === 'in_progress' && (
                          <Button
                            onClick={() => startVerification(pickup)}
                            className="w-full bg-orange-600 hover:bg-orange-700"
                          >
                            Verifiera upphämtning
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'completed' && (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Gjorda upphämtningar</h2>
              <p className="text-sm text-gray-600">Dina slutförda upphämtningar</p>
            </div>
            
            {completedPickups.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">Inga slutförda upphämtningar</p>
                <p className="text-sm">Slutförda upphämtningar visas här</p>
              </div>
            ) : (
              <div>
                {completedPickups.map((pickup) => (
                  <Card key={pickup.id} className="mb-3">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{pickup.owner_name}</h3>
                          <a href={`tel:${pickup.phone_number}`} className="flex items-center text-sm text-blue-600 hover:text-blue-800 mt-1">
                            <Phone className="w-3 h-3 mr-1" />
                            {pickup.phone_number}
                          </a>
                        </div>
                        <Badge className={getStatusColor(pickup.status)}>{getStatusText(pickup.status)}</Badge>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Car className="w-4 h-4 mr-2" />
                          <span>{pickup.car_brand} {pickup.car_model} • {pickup.car_registration_number}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>{pickup.pickup_address}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>{formatDate(pickup.scheduled_pickup_date)}</span>
                        </div>
                        {pickup.final_price && (
                          <div className="flex items-center text-sm text-green-600">
                            <span className="w-4 h-4 mr-2">💰</span>
                            <span>{pickup.final_price.toLocaleString()} kr</span>
                          </div>
                        )}
                      </div>

                      <div className="text-center py-2">
                        <span className="text-sm text-gray-500">Slutförd {formatDate(pickup.scheduled_pickup_date)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PantaBilenDriverApp;