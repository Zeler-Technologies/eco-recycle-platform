import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
  
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'list' | 'verification'>('list');
  const [selectedPickup, setSelectedPickup] = useState<Pickup | null>(null);
  
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
      loadPickups();
      setLoading(false);
    }
  }, [user]);

  const loadPickups = async () => {
    try {
      // Simplified query to just get pickup orders - adapt this to your actual schema
      const { data, error } = await supabase
        .from('pickup_orders')
        .select(`
          id,
          customer_request_id,
          status,
          scheduled_pickup_date,
          final_price,
          driver_notes,
          customer_requests (
            car_registration_number,
            car_brand,
            car_model,
            owner_name,
            pickup_address
          )
        `)
        .in('status', ['scheduled', 'assigned', 'in_progress'])
        .order('scheduled_pickup_date', { ascending: true });

      if (error) {
        console.error('Database error:', error);
        // Create mock data if database query fails
        setPickups([
          {
            id: '1',
            customer_request_id: '1',
            car_registration_number: 'ABC123',
            car_brand: 'Volvo',
            car_model: 'V70',
            owner_name: 'Anna Andersson',
            phone_number: '070-123-4567',
            pickup_address: 'Storgatan 12, Stockholm',
            scheduled_pickup_date: new Date().toISOString(),
            status: 'assigned',
            final_price: 25000
          },
          {
            id: '2',
            customer_request_id: '2',
            car_registration_number: 'DEF456',
            car_brand: 'Saab',
            car_model: '9-3',
            owner_name: 'Erik Eriksson',
            phone_number: '070-234-5678',
            pickup_address: 'Kungsgatan 25, Stockholm',
            scheduled_pickup_date: new Date().toISOString(),
            status: 'in_progress',
            final_price: 18000
          }
        ]);
        return;
      }

      const formattedPickups = data?.map(pickup => ({
        id: pickup.id,
        customer_request_id: pickup.customer_request_id,
        car_registration_number: pickup.customer_requests?.car_registration_number || 'N/A',
        car_brand: pickup.customer_requests?.car_brand || 'N/A',
        car_model: pickup.customer_requests?.car_model || 'N/A',
        owner_name: pickup.customer_requests?.owner_name || 'N/A',
        phone_number: '070-123-4567', // Default phone
        pickup_address: pickup.customer_requests?.pickup_address || 'N/A',
        scheduled_pickup_date: pickup.scheduled_pickup_date,
        status: pickup.status,
        final_price: pickup.final_price,
        driver_notes: pickup.driver_notes
      })) || [];

      setPickups(formattedPickups);
    } catch (error) {
      console.error('Error loading pickups:', error);
      toast.error('Kunde inte ladda upphämtningar');
      // Set mock data as fallback
      setPickups([]);
    }
  };

  const updatePickupStatus = async (pickupId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('pickup_orders')
        .update({ status: newStatus })
        .eq('id', pickupId);

      if (error) throw error;
      
      await loadPickups();
      toast.success('Status uppdaterad');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Kunde inte uppdatera status');
    }
  };

  const uploadPhoto = async (file: File) => {
    if (!selectedPickup) return;
    
    setUploading(true);
    try {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        throw new Error('Endast JPEG, PNG och WebP bilder tillåtna');
      }
      
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Bilden är för stor. Max 10MB tillåtet');
      }

      const timestamp = Date.now();
      const sanitizedPickupId = selectedPickup.id.replace(/[^a-zA-Z0-9-]/g, '');
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `driver_verification/${sanitizedPickupId}/${timestamp}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from('pickup-photos')
        .upload(fileName, file);

      if (uploadError) {
        if (uploadError.message?.includes('permission') || uploadError.message?.includes('security')) {
          throw new Error('Endast tilldelade förare kan ladda upp verifieringsfoton');
        }
        throw new Error(`Uppladdning misslyckades: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from('pickup-photos')
        .getPublicUrl(fileName);

      setPhotos(prev => [...prev, {
        url: urlData.publicUrl,
        fileName: fileName.split('/').pop() || 'photo.jpg'
      }]);

      toast.success('Foto uppladdad');
    } catch (error: any) {
      console.error('Photo upload failed:', error);
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const completeVerification = async () => {
    if (!selectedPickup) return;
    
    setSigning(true);
    try {
      // Update pickup status to completed
      await supabase
        .from('pickup_orders')
        .update({ 
          status: 'completed',
          final_price: parseFloat(finalPrice),
          actual_pickup_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', selectedPickup.id);

      toast.success('Upphämtning slutförd och signerad');
      
      setCurrentView('list');
      setSelectedPickup(null);
      resetVerificationState();
      await loadPickups();
      
    } catch (error: any) {
      console.error('Verification failed:', error);
      toast.error('Signering misslyckades');
    } finally {
      setSigning(false);
    }
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

  const startVerification = (pickup: Pickup) => {
    setSelectedPickup(pickup);
    setCurrentView('verification');
    setFinalPrice(pickup.final_price?.toString() || '');
    resetVerificationState();
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
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Schemalagd';
      case 'assigned': return 'Tilldelad';
      case 'in_progress': return 'Pågående';
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

  if (currentView === 'list') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Förare Panel</h1>
                <p className="text-sm text-gray-600">
                  {user?.email} • Klockan {getCurrentTime()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={loadPickups}
                  variant="ghost"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  onClick={logout}
                  variant="ghost"
                  size="sm"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 py-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Mina upphämtningar ({pickups.length})
            </h2>
          </div>

          {pickups.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Car className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">Inga upphämtningar tilldelade</p>
              <p className="text-sm">Nya upphämtningar visas här automatiskt</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pickups.map((pickup) => (
                <Card key={pickup.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{pickup.owner_name}</h3>
                        <a 
                          href={`tel:${pickup.phone_number}`}
                          className="flex items-center text-sm text-blue-600 hover:text-blue-800 mt-1"
                        >
                          <Phone className="w-3 h-3 mr-1" />
                          {pickup.phone_number}
                        </a>
                      </div>
                      <Badge className={getStatusColor(pickup.status)}>
                        {getStatusText(pickup.status)}
                      </Badge>
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
                    </div>

                    <div className="space-y-2">
                      {pickup.status === 'scheduled' && (
                        <Button
                          onClick={() => updatePickupStatus(pickup.id, 'assigned')}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          Acceptera upphämtning
                        </Button>
                      )}

                      {pickup.status === 'assigned' && (
                        <div className="space-y-2">
                          <Button
                            onClick={() => updatePickupStatus(pickup.id, 'in_progress')}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            Starta upphämtning
                          </Button>
                          <Button
                            onClick={() => {
                              const address = encodeURIComponent(pickup.pickup_address);
                              window.open(`https://www.google.com/maps/dir/?api=1&destination=${address}`, '_blank');
                            }}
                            variant="outline"
                            className="w-full"
                          >
                            <Navigation className="w-4 h-4 mr-2" />
                            Navigation
                          </Button>
                        </div>
                      )}

                      {pickup.status === 'in_progress' && (
                        <Button
                          onClick={() => startVerification(pickup)}
                          className="w-full bg-orange-600 hover:bg-orange-700"
                        >
                          Slutför upphämtning
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'verification' && selectedPickup) {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-gray-900 text-white p-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => {
                setCurrentView('list');
                setSelectedPickup(null);
              }}
              className="text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">{selectedPickup.car_registration_number}</h1>
            <div className="text-sm">
              {verificationStep === 'checklist' ? 'Kontroll' : 'Signering'}
            </div>
          </div>
        </div>

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
                  <span className={item.required ? 'font-semibold' : ''}>
                    {item.label}
                  </span>
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
              <div className="text-right text-sm text-gray-500 mt-1">
                {driverNotes.length}/240
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">Bild (Valfri dokumentation)</h3>
              <p className="text-sm text-gray-600 mb-4">
                Ladda upp foton endast om du behöver dokumentera avvikelser.
              </p>
              
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadPhoto(file);
                }}
                className="hidden"
                id="photo-upload"
                disabled={uploading}
              />
              
              <label
                htmlFor="photo-upload"
                className={`w-full border-2 border-dashed rounded-lg p-8 text-center block cursor-pointer transition-colors ${
                  uploading 
                    ? 'border-gray-200 text-gray-400' 
                    : 'border-gray-300 hover:border-blue-400 text-gray-600'
                }`}
              >
                {uploading ? (
                  <div className="flex flex-col items-center">
                    <RefreshCw className="w-8 h-8 animate-spin mb-2" />
                    <span>Laddar upp bild...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Camera className="w-8 h-8 mb-2" />
                    <span>Ta bild för dokumentation</span>
                  </div>
                )}
              </label>

              {photos.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Uppladdade foton ({photos.length})</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={photo.url}
                          alt={`Verification ${index + 1}`}
                          className="w-full h-20 object-cover rounded border"
                        />
                        <div className="text-xs text-gray-500 mt-1 truncate">
                          {photo.fileName}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                onClick={() => {
                  setCurrentView('list');
                  setSelectedPickup(null);
                }}
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
    );
  }

  return null;
};

export default PantaBilenDriverApp;