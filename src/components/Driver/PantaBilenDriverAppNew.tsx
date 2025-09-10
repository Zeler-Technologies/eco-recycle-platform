import React, { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const PantaBilenDriverApp = () => {
  const { user, logout } = useAuth();

  // All constants defined directly in component
  const STATUS_TEXTS = {
    'pending': 'Ny förfrågan',
    'scheduled': 'Väntar på upphämtning',
    'assigned': 'Tilldelad',
    'pickup_accepted': 'Accepterad',
    'in_progress': 'Pågående',
    'completed': 'Slutförd',
    'cancelled': 'Avbruten',
    'rejected': 'Avvisad'
  };

  const STATUS_COLORS = {
    'pending': '#f59e0b',
    'scheduled': '#3b82f6',
    'assigned': '#8b5cf6',
    'pickup_accepted': '#10b981',
    'in_progress': '#f59e0b',
    'completed': '#10b981',
    'cancelled': '#ef4444',
    'rejected': '#6b7280'
  };

  const DRIVER_STATUS_OPTIONS = [
    { 
      value: 'available', 
      label: 'Tillgänglig', 
      dotClass: 'bg-green-500',
      badgeClass: 'bg-green-100 text-green-800'
    },
    { 
      value: 'busy', 
      label: 'Upptagen', 
      dotClass: 'bg-red-500',
      badgeClass: 'bg-red-100 text-red-800'
    },
    { 
      value: 'offline', 
      label: 'Offline', 
      dotClass: 'bg-gray-500',
      badgeClass: 'bg-gray-100 text-gray-800'
    }
  ];

  const DRIVER_STATUS_MAP = {
    'available': { 
      label: 'Tillgänglig', 
      dotClass: 'bg-green-500',
      badgeClass: 'bg-green-100 text-green-800'
    },
    'busy': { 
      label: 'Upptagen', 
      dotClass: 'bg-red-500',
      badgeClass: 'bg-red-100 text-red-800'
    },
    'offline': { 
      label: 'Offline', 
      dotClass: 'bg-gray-500',
      badgeClass: 'bg-gray-100 text-gray-800'
    }
  };

  // State management
  const [pickups, setPickups] = useState([
    {
      pickup_id: '1',
      car_registration_number: 'ABC123',
      car_brand: 'Volvo',
      car_model: 'XC60',
      car_year: '2018',
      owner_name: 'Erik Andersson',
      phone_number: '070-123-4567',
      pickup_address: 'Storgatan 15, Stockholm',
      status: 'assigned',
      final_price: 15000,
      created_at: new Date().toISOString()
    },
    {
      pickup_id: '2', 
      car_registration_number: 'XYZ789',
      car_brand: 'BMW',
      car_model: 'X3',
      car_year: '2019',
      owner_name: 'Anna Svensson',
      phone_number: '070-234-5678',
      pickup_address: 'Kungsgatan 42, Göteborg',
      status: 'in_progress',
      final_price: 18000,
      created_at: new Date().toISOString()
    }
  ]);

  const [currentDriver, setCurrentDriver] = useState({
    driver_id: '1',
    full_name: 'Lars Johansson',
    driver_status: 'available'
  });

  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'list' | 'map'>('list');
  const [currentFilter, setCurrentFilter] = useState('all');
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState<any>(null);
  const [showDetailView, setShowDetailView] = useState(false);

  // Driver verification state
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationData, setVerificationData] = useState({
    reg_nr_verified: false,
    motor_finns: false,
    vaxellada_finns: false,
    katalysator_finns: false,
    hjul_monterat: false,
    batteri_finns: false,
    inga_hushallssoppor: false
  });
  const [internalComments, setInternalComments] = useState('');
  const [verificationPhotos, setVerificationPhotos] = useState<any[]>([]);
  const [finalPrice, setFinalPrice] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Helper functions
  const getStatusText = (status: string) => STATUS_TEXTS[status] || status;
  const getStatusColor = (status: string) => STATUS_COLORS[status] || '#6c757d';
  const getCurrentTime = () => new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('sv-SE');
  };

  // Filter pickups
  const filteredPickups = useMemo(() => {
    let filtered = pickups;
    if (currentFilter !== 'all') {
      filtered = filtered.filter(pickup => pickup.status === currentFilter);
    }
    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [pickups, currentFilter]);

  // Photo upload handler
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error('Endast bildfiler tillåtna');
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error('Bilden är för stor. Max 10MB tillåtet');
        continue;
      }

      setUploading(true);
      try {
        const timestamp = Date.now();
        const sanitizedPickupId = selectedPickup?.pickup_id.replace(/[^a-zA-Z0-9-]/g, '');
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `driver_verification/${sanitizedPickupId}/${timestamp}.${fileExt}`;

        const { data, error: uploadError } = await supabase.storage
          .from('pickup-photos')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('pickup-photos')
          .getPublicUrl(fileName);

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setVerificationPhotos(prev => [...prev, {
            id: Date.now() + Math.random(),
            file,
            preview: e.target?.result,
            url: urlData.publicUrl,
            timestamp: new Date().toISOString()
          }]);
        };
        reader.readAsDataURL(file);
        
        toast.success('Foto uppladdad');
      } catch (error: any) {
        console.error('Photo upload failed:', error);
        toast.error('Uppladdning misslyckades');
      } finally {
        setUploading(false);
      }
    }
  };

  // Start pickup with verification
  const startPickupWithVerification = (pickup: any) => {
    setSelectedPickup(pickup);
    setVerificationData({
      reg_nr_verified: false,
      motor_finns: false,
      vaxellada_finns: false,
      katalysator_finns: false,
      hjul_monterat: false,
      batteri_finns: false,
      inga_hushallssoppor: false
    });
    setInternalComments('');
    setVerificationPhotos([]);
    setFinalPrice(pickup.final_price || 0);
    setShowVerificationModal(true);
    setShowDetailView(false);
  };

  // Complete verification
  const completeVerification = async () => {
    console.log('Verification completed:', {
      pickup: selectedPickup.pickup_id,
      verification: verificationData,
      comments: internalComments,
      photos: verificationPhotos.length,
      finalPrice
    });

    // Update pickup status to completed
    setPickups(prev => prev.map(p => 
      p.pickup_id === selectedPickup.pickup_id 
        ? { ...p, status: 'completed' } 
        : p
    ));

    toast.success('Upphämtning slutförd och signerad');

    setShowVerificationModal(false);
    setSelectedPickup(null);
    setVerificationData({
      reg_nr_verified: false,
      motor_finns: false,
      vaxellada_finns: false,
      katalysator_finns: false,
      hjul_monterat: false,
      batteri_finns: false,
      inga_hushallssoppor: false
    });
    setInternalComments('');
    setVerificationPhotos([]);
  };

  // Status update function
  const updateDriverStatus = async (newStatus: string) => {
    setCurrentDriver(prev => ({ ...prev, driver_status: newStatus }));
    setShowStatusMenu(false);
    
    const messages = {
      'available': 'Du är nu tillgänglig för nya uppdrag',
      'busy': 'Du är nu markerad som upptagen',
      'offline': 'Du är nu offline'
    };
    toast.success(messages[newStatus as keyof typeof messages]);
  };

  // Update pickup status
  const updatePickupStatus = async (pickupId: string, newStatus: string) => {
    setPickups(prev => prev.map(p => 
      p.pickup_id === pickupId ? { ...p, status: newStatus } : p
    ));
    toast.success(`Status uppdaterad till ${getStatusText(newStatus)}`);
  };

  // Component functions
  const DriverStatusBadge = ({ status }: { status: string }) => {
    const statusInfo = DRIVER_STATUS_MAP[status] || DRIVER_STATUS_MAP['offline'];
    return (
      <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs ${statusInfo.badgeClass}`}>
        <span className={`h-2 w-2 rounded-full ${statusInfo.dotClass}`} />
        {statusInfo.label}
      </span>
    );
  };

  const DriverStatusDropdown = ({ currentStatus, onChange }: { currentStatus: string, onChange: (status: string) => void }) => (
    <div className="flex flex-col py-2">
      {DRIVER_STATUS_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          className={`flex items-center gap-4 px-6 py-4 hover:bg-gray-50 text-base w-full text-left transition-colors min-h-[56px] ${
            currentStatus === opt.value ? 'bg-blue-50 border-l-4 border-blue-500' : ''
          }`}
          onClick={() => onChange(opt.value)}
        >
          <span className={`h-4 w-4 rounded-full ${opt.dotClass} flex-shrink-0`} />
          <span className="text-gray-900 font-medium">{opt.label}</span>
          {currentStatus === opt.value && (
            <span className="ml-auto text-blue-500 font-bold">✓</span>
          )}
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar förarpanel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Status Bar */}
      <div className="bg-gray-900 text-white px-3 py-2 flex justify-between items-center text-sm font-medium">
        <span>{getCurrentTime()}</span>
        <div className="flex gap-1 items-center">
          <div className="w-4 h-3 bg-white rounded-sm"></div>
          <div className="w-4 h-3 bg-white rounded-sm"></div>
          <div className="w-4 h-3 bg-white rounded-sm"></div>
        </div>
      </div>

      {/* Mobile App Header */}
      <div className="bg-gray-900 text-white px-3 py-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">PantaBilen</h1>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {currentDriver.full_name?.charAt(0) || 'D'}
            </div>
            <button
              onClick={logout}
              className="text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
              title="Logga ut"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile View Toggle */}
        <div className="flex rounded-full p-1 border border-white/30 bg-black/20 mb-3">
          <button
            className={`flex-1 py-2 px-3 rounded-full text-sm font-semibold transition-all ${
              currentView === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-white'
            }`}
            onClick={() => setCurrentView('list')}
          >
            Lista
          </button>
          <button
            className={`flex-1 py-2 px-3 rounded-full text-sm font-semibold transition-all ${
              currentView === 'map' ? 'bg-white text-gray-900 shadow-sm' : 'text-white'
            }`}
            onClick={() => setCurrentView('map')}
          >
            Karta
          </button>
        </div>
        
        {/* Mobile Status Dropdown */}
        <div className="relative">
          <button
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-white/30 text-sm font-semibold text-white hover:bg-white/10"
            onClick={() => setShowStatusMenu(!showStatusMenu)}
          >
            <DriverStatusBadge status={currentDriver.driver_status} />
            <span className="text-sm">▼</span>
          </button>
          
          {showStatusMenu && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50">
              <DriverStatusDropdown
                currentStatus={currentDriver.driver_status}
                onChange={updateDriverStatus}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile Tab Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-3 py-3">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 border-b-2 border-indigo-500 pb-1 inline-block">
              Mina uppdrag ({filteredPickups.length})
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Filter Header */}
      <div className="bg-white px-3 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <span className="text-base font-semibold text-gray-900">{filteredPickups.length} uppdrag</span>
          <button className="text-indigo-600 text-sm font-medium">Uppdatera</button>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3">
          {[
            { value: 'all', label: 'Alla', count: pickups.length },
            { value: 'assigned', label: 'Tilldelade', count: pickups.filter(p => p.status === 'assigned').length },
            { value: 'in_progress', label: 'Pågående', count: pickups.filter(p => p.status === 'in_progress').length },
            { value: 'completed', label: 'Slutförda', count: pickups.filter(p => p.status === 'completed').length }
          ].map(filter => (
            <button
              key={filter.value}
              className={`flex-shrink-0 px-3 py-2 text-sm font-medium rounded-full border transition-all min-h-[36px] whitespace-nowrap ${
                currentFilter === filter.value
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
              }`}
              onClick={() => setCurrentFilter(filter.value)}
            >
              {filter.label} {filter.count > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                  currentFilter === filter.value 
                    ? 'bg-indigo-500 text-white' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {filter.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Mobile Content Area */}
      {currentView === 'list' ? (
        <div className="px-3 py-4 pb-20">
          {filteredPickups.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-gray-300 text-8xl mb-6">📋</div>
              <div className="text-2xl font-semibold text-gray-600 mb-2">Inga uppdrag</div>
              <p className="text-lg text-gray-500">Inga uppdrag matchar det valda filtret</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPickups.map(pickup => (
                <div 
                  key={pickup.pickup_id}
                  className="bg-white rounded-xl shadow-sm p-4 cursor-pointer border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all active:scale-[0.98]"
                  onClick={() => {
                    setSelectedPickup(pickup);
                    setShowDetailView(true);
                  }}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-lg font-bold text-indigo-600 mb-1">
                          {pickup.car_registration_number}
                        </div>
                        <div className="text-sm text-gray-600 font-medium">
                          {pickup.car_year} {pickup.car_brand} {pickup.car_model}
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <div className="text-lg font-bold text-green-600 mb-1">
                          {pickup.final_price ? `${pickup.final_price.toLocaleString()} kr` : 'Pris ej satt'}
                        </div>
                        <div 
                          className="inline-block px-2 py-1 rounded-full text-xs font-semibold"
                          style={{ 
                            backgroundColor: getStatusColor(pickup.status) + '20',
                            color: getStatusColor(pickup.status)
                          }}
                        >
                          {getStatusText(pickup.status)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 text-sm">👤</span>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 font-medium">Kund</div>
                          <div className="text-sm font-semibold text-gray-900">{pickup.owner_name}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-gray-600 text-sm">📍</span>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 font-medium">Upphämtningsadress</div>
                          <div className="text-sm font-medium text-gray-900 leading-tight">
                            {pickup.pickup_address}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center pt-2 border-t border-gray-100">
                      <div className="text-indigo-600 text-sm font-medium">Tryck för detaljer →</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-3">🗺️</div>
            <p className="text-base">Kartvy kommer snart</p>
          </div>
        </div>
      )}

      {/* Detail View Modal */}
      {showDetailView && selectedPickup && (
        <div className="fixed inset-0 bg-white z-50 overflow-auto">
          <div className="bg-indigo-600 text-white px-3 py-4">
            <div className="flex items-center gap-3">
              <button
                className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-lg font-bold hover:bg-indigo-400 transition-colors"
                onClick={() => setShowDetailView(false)}
              >
                ←
              </button>
              <div className="flex-1">
                <div className="text-sm font-semibold opacity-90">Upphämtningsdetaljer</div>
                <div className="text-lg font-bold">{selectedPickup.car_registration_number}</div>
              </div>
            </div>
          </div>
          
          <div className="px-3 py-4 space-y-4">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600 mb-1">
                  {selectedPickup.car_registration_number}
                </div>
                <div className="text-base text-gray-700 font-medium">
                  {selectedPickup.car_year} {selectedPickup.car_brand} {selectedPickup.car_model}
                </div>
                <div className="mt-3 text-2xl font-bold text-green-600">
                  {selectedPickup.final_price ? `${selectedPickup.final_price.toLocaleString()} kr` : 'Pris ej fastställt'}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Kundinformation</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 text-lg">👤</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 font-medium">Namn</div>
                    <div className="text-base font-semibold text-gray-900">{selectedPickup.owner_name}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 text-lg">📞</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 font-medium">Telefon</div>
                    <a href={`tel:${selectedPickup.phone_number}`} className="text-base font-semibold text-blue-600">
                      {selectedPickup.phone_number}
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-600 text-xl">📍</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 font-medium">Upphämtningsadress</div>
                    <div className="text-lg font-semibold text-gray-900 leading-relaxed">
                      {selectedPickup.pickup_address}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pb-8">
              {selectedPickup.status === 'assigned' && (
                <button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl text-xl font-bold transition-colors shadow-lg active:scale-95"
                  onClick={() => updatePickupStatus(selectedPickup.pickup_id, 'in_progress')}
                >
                  ▶️ Starta upphämtning
                </button>
              )}
              
              {selectedPickup.status === 'in_progress' && (
                <button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-5 rounded-2xl text-xl font-bold transition-colors shadow-lg active:scale-95"
                  onClick={() => startPickupWithVerification(selectedPickup)}
                >
                  ✅ Påbörja verifiering
                </button>
              )}
              
              <button 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl text-xl font-bold transition-colors shadow-lg active:scale-95"
                onClick={() => {
                  const address = selectedPickup.pickup_address;
                  if (address) {
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, 
                      '_blank',
                      'noopener,noreferrer'
                    );
                  }
                }}
              >
                🗺️ Navigera till adressen
              </button>
              
              <button 
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-5 rounded-2xl text-xl font-bold transition-colors shadow-lg active:scale-95"
                onClick={() => window.open(`tel:${selectedPickup.phone_number}`, '_self')}
              >
                📞 Ring kunden
              </button>
              
              <button 
                className="w-full bg-gray-500 hover:bg-gray-600 text-white py-4 rounded-2xl text-lg font-semibold transition-colors active:scale-95"
                onClick={() => setShowDetailView(false)}
              >
                Stäng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Driver Verification Modal */}
      {showVerificationModal && selectedPickup && (
        <div className="fixed inset-0 bg-white z-50 overflow-auto">
          <div className="bg-gray-900 text-white px-4 py-6">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">{selectedPickup.car_registration_number}</div>
              <div className="text-lg opacity-90">Verifiering av fordon</div>
            </div>
          </div>

          <div className="px-4 py-6">
            <div className="bg-blue-50 rounded-2xl p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Jag intygar härmed att jag har kontrollerat följande:
              </h2>
            </div>

            <div className="space-y-4 mb-6">
              {[
                { key: 'reg_nr_verified', label: `Reg.nr: ${selectedPickup.car_registration_number}` },
                { key: 'motor_finns', label: 'Motor finns' },
                { key: 'vaxellada_finns', label: 'Växellåda finns' },
                { key: 'katalysator_finns', label: 'Original-katalysator finns' },
                { key: 'hjul_monterat', label: '4 hjul monterat' },
                { key: 'batteri_finns', label: 'Batteri finns' },
                { key: 'inga_hushallssoppor', label: 'Inga hushållssoppor eller grovskräp finns i bilen' }
              ].map(item => (
                <div key={item.key} className="flex items-center gap-4 p-4 bg-white rounded-xl border-2 border-gray-200">
                  <input
                    type="checkbox"
                    id={item.key}
                    checked={verificationData[item.key as keyof typeof verificationData]}
                    onChange={(e) => setVerificationData(prev => ({
                      ...prev,
                      [item.key]: e.target.checked
                    }))}
                    className="w-6 h-6 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor={item.key} className="text-lg font-medium text-gray-900 flex-1">
                    {item.label}
                  </label>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-xl font-bold text-gray-900 mb-4">Intern kommentar</label>
              <textarea
                value={internalComments}
                onChange={(e) => setInternalComments(e.target.value)}
                placeholder="Skriv eventuella kommentarer här..."
                className="w-full h-32 p-4 text-lg border-2 border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength={240}
              />
              <div className="text-right text-sm text-gray-500 mt-2">
                {internalComments.length}/240
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Bild (Valfri dokumentation)</h3>
              <p className="text-base text-gray-600 mb-4">
                Ladda upp foton endast om du behöver dokumentera avvikelser.
              </p>
              
              <label className="block">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <div className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                  uploading 
                    ? 'border-gray-300 bg-gray-50' 
                    : 'border-gray-300 hover:border-blue-400'
                }`}>
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <div className="text-xl font-semibold text-gray-700">Laddar upp...</div>
                    </>
                  ) : (
                    <>
                      <div className="text-gray-400 text-6xl mb-4">📷</div>
                      <div className="text-xl font-semibold text-gray-700">Ta bild för dokumentation</div>
                      <div className="text-base text-gray-500 mt-2">Tryck för att öppna kamera</div>
                    </>
                  )}
                </div>
              </label>

              {verificationPhotos.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {verificationPhotos.map(photo => (
                    <div key={photo.id} className="relative">
                      <img 
                        src={photo.preview} 
                        alt="Verification photo"
                        className="w-full h-32 object-cover rounded-xl border-2 border-gray-200"
                      />
                      <button
                        onClick={() => setVerificationPhotos(prev => 
                          prev.filter(p => p.id !== photo.id)
                        )}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-8">
              <label className="block text-xl font-bold text-gray-900 mb-4">Slutligt pris</label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={finalPrice}
                  onChange={(e) => setFinalPrice(Number(e.target.value))}
                  className="flex-1 text-2xl font-bold p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
                <span className="text-2xl font-bold text-gray-600">kr</span>
              </div>
            </div>

            <div className="space-y-4 pb-8">
              <button
                onClick={completeVerification}
                disabled={!verificationData.reg_nr_verified || !finalPrice}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-5 rounded-2xl text-xl font-bold transition-colors shadow-lg active:scale-95"
              >
                Fortsätt till signering
              </button>
              
              <button
                onClick={() => setShowVerificationModal(false)}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white py-4 rounded-2xl text-lg font-semibold transition-colors active:scale-95"
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Status menu overlay */}
      {showStatusMenu && (
        <div 
          className="fixed inset-0 bg-black/20 z-40" 
          onClick={() => setShowStatusMenu(false)}
        />
      )}
      
      {/* Bottom safe area */}
      <div className="fixed bottom-0 left-0 right-0">
        <div className="bg-white/80 backdrop-blur-sm h-2"></div>
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-36 h-1.5 bg-gray-900 rounded-full opacity-60"></div>
      </div>
    </div>
  );
};

export default PantaBilenDriverApp;