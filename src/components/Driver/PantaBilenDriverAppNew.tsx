import React, { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import DriverMapView from './DriverMapView';

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
    try {
      if (!currentDriver?.driver_id) {
        toast.error('Driver ID saknas');
        return;
      }

      // Update database via edge function
      const { data, error } = await supabase.functions.invoke('update-driver-status', {
        body: {
          driverId: currentDriver.driver_id,
          newStatus: newStatus,
          reason: 'Driver status change from mobile app'
        }
      });

      if (error) {
        console.error('Error updating driver status:', error);
        toast.error('Kunde inte uppdatera status');
        return;
      }

      // Update local state
      setCurrentDriver(prev => ({ ...prev, driver_status: newStatus }));
      setShowStatusMenu(false);
      
      const messages = {
        'available': 'Du är nu tillgänglig för nya uppdrag',
        'busy': 'Du är nu markerad som upptagen',
        'offline': 'Du är nu offline',
        'break': 'Du är nu på paus'
      };
      toast.success(messages[newStatus as keyof typeof messages] || 'Status uppdaterad');
    } catch (error) {
      console.error('Error updating driver status:', error);
      toast.error('Kunde inte uppdatera status');
    }
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
      <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${statusInfo.badgeClass}`}>
        <span className={`h-2.5 w-2.5 rounded-full ${statusInfo.dotClass}`} />
        {statusInfo.label}
      </span>
    );
  };

  const DriverStatusDropdown = ({ currentStatus, onChange }: { currentStatus: string, onChange: (status: string) => void }) => (
    <div className="flex flex-col py-1">
      {DRIVER_STATUS_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          className={`flex items-center gap-4 px-6 py-4 hover:bg-gray-50 active:bg-gray-100 text-base w-full text-left transition-colors min-h-[60px] ${
            currentStatus === opt.value ? 'bg-blue-50 border-l-4 border-blue-500' : ''
          }`}
          onClick={() => onChange(opt.value)}
        >
          <span className={`h-5 w-5 rounded-full ${opt.dotClass} flex-shrink-0`} />
          <span className="text-gray-900 font-medium text-lg">{opt.label}</span>
          {currentStatus === opt.value && (
            <span className="ml-auto text-blue-500 text-2xl">✓</span>
          )}
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg">Laddar förarpanel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Status Bar - Mobile optimized */}
      <div className="bg-gray-900 text-white px-4 py-2 flex justify-between items-center text-base font-semibold safe-top">
        <span className="text-lg">{getCurrentTime()}</span>
        <div className="flex gap-1.5 items-center">
          <div className="w-5 h-4 bg-white rounded-sm"></div>
          <div className="w-5 h-4 bg-white rounded-sm"></div>
          <div className="w-5 h-4 bg-white rounded-sm"></div>
        </div>
      </div>

      {/* App Header - Touch optimized */}
      <div className="bg-gray-900 text-white px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">PantaBilen</h1>
        <div className="flex items-center gap-2">
          {/* View toggle - Larger touch targets */}
          <div className="flex rounded-full p-0.5 border border-white/30 bg-black/20">
            <button
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all min-w-[80px] ${
                currentView === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-white active:bg-white/20'
              }`}
              onClick={() => setCurrentView('list')}
            >
              Lista
            </button>
            <button
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all min-w-[80px] ${
                currentView === 'map' ? 'bg-white text-gray-900 shadow-sm' : 'text-white active:bg-white/20'
              }`}
              onClick={() => setCurrentView('map')}
            >
              Karta
            </button>
          </div>
          
          {/* Status menu - Larger touch target */}
          <div className="relative">
            <button
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border-2 border-white/30 text-sm font-semibold text-white hover:bg-white/10 active:bg-white/20 min-h-[48px] min-w-[48px]"
              onClick={() => setShowStatusMenu(!showStatusMenu)}
            >
              <DriverStatusBadge status={currentDriver.driver_status} />
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showStatusMenu && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl min-w-[240px] z-50">
                <DriverStatusDropdown
                  currentStatus={currentDriver.driver_status}
                  onChange={updateDriverStatus}
                />
              </div>
            )}
          </div>
          
          {/* Profile & Logout - Touch optimized */}
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {currentDriver.full_name?.charAt(0) || 'D'}
            </div>
            <button
              onClick={logout}
              className="text-white p-3 hover:bg-white/10 active:bg-white/20 rounded-lg transition-colors"
              title="Logga ut"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Tab bar - Mobile optimized */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex">
            <div className="flex-1 py-3 text-center">
              <div className="text-2xl font-bold text-gray-900 border-b-4 border-indigo-500 pb-3">
                Mina uppdrag ({filteredPickups.length})
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filter Header - Touch optimized */}
      <div className="bg-white px-4 py-4 border-b border-gray-200 sticky top-[88px] z-10">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold text-gray-900">{filteredPickups.length} uppdrag</span>
          <button className="text-indigo-600 text-lg font-medium p-2 -m-2 active:bg-indigo-50 rounded-lg">
            Uppdatera
          </button>
        </div>
        
        {/* Horizontal scroll with snap points */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
          {[
            { value: 'all', label: 'Alla', count: pickups.length },
            { value: 'assigned', label: 'Tilldelade', count: pickups.filter(p => p.status === 'assigned').length },
            { value: 'in_progress', label: 'Pågående', count: pickups.filter(p => p.status === 'in_progress').length },
            { value: 'completed', label: 'Slutförda', count: pickups.filter(p => p.status === 'completed').length }
          ].map(filter => (
            <button
              key={filter.value}
              className={`flex-shrink-0 px-6 py-3.5 text-base font-medium rounded-full border-2 transition-all min-h-[56px] snap-center ${
                currentFilter === filter.value
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-105'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300 active:scale-95'
              }`}
              onClick={() => setCurrentFilter(filter.value)}
            >
              {filter.label} {filter.count > 0 && (
                <span className={`ml-2 px-2.5 py-1 rounded-full text-sm font-bold ${
                  currentFilter === filter.value 
                    ? 'bg-indigo-700 text-white' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {filter.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Content area - Mobile optimized */}
      {currentView === 'list' ? (
        <div className="px-4 py-4 pb-24">
          {filteredPickups.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-gray-300 text-8xl mb-6">📋</div>
              <div className="text-2xl font-semibold text-gray-600 mb-3">Inga uppdrag</div>
              <p className="text-lg text-gray-500">Inga uppdrag matchar det valda filtret</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPickups.map(pickup => (
                <button 
                  key={pickup.pickup_id}
                  className="w-full bg-white rounded-2xl shadow-sm p-5 text-left border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  onClick={() => {
                    setSelectedPickup(pickup);
                    setShowDetailView(true);
                  }}
                >
                  <div className="space-y-4">
                    {/* Header with registration and status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-2xl font-bold text-indigo-600 mb-1 tracking-tight">
                          {pickup.car_registration_number}
                        </div>
                        <div className="text-base text-gray-600 font-medium">
                          {pickup.car_year} {pickup.car_brand} {pickup.car_model}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-2xl font-bold text-green-600 mb-2">
                          {pickup.final_price ? `${pickup.final_price.toLocaleString()} kr` : 'Pris ej satt'}
                        </div>
                        <div 
                          className="inline-block px-4 py-2.5 rounded-full text-sm font-bold"
                          style={{ 
                            backgroundColor: getStatusColor(pickup.status) + '20',
                            color: getStatusColor(pickup.status)
                          }}
                        >
                          {getStatusText(pickup.status)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Customer and address info */}
                    <div className="space-y-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">👤</span>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-500 font-medium">Kund</div>
                          <div className="text-lg font-semibold text-gray-900">{pickup.owner_name}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-2xl">📍</span>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-500 font-medium">Upphämtningsadress</div>
                          <div className="text-base font-medium text-gray-900 leading-relaxed">
                            {pickup.pickup_address}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Call to action */}
                    <div className="flex items-center justify-center pt-3 border-t border-gray-100">
                      <div className="text-indigo-600 text-base font-semibold flex items-center gap-2">
                        Tryck för detaljer 
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="h-[calc(100vh-200px)]">
          <DriverMapView 
            pickups={filteredPickups}
            onPickupSelect={(pickup) => {
              setSelectedPickup(pickup);
              setShowDetailView(true);
            }}
          />
        </div>
      )}

      {/* Detail View Modal - Full screen mobile */}
      {showDetailView && selectedPickup && (
        <div className="fixed inset-0 bg-white z-50 overflow-auto">
          {/* Header */}
          <div className="bg-indigo-600 text-white px-4 py-5 sticky top-0 z-10 shadow-lg">
            <div className="flex items-center gap-4">
              <button
                className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold hover:bg-white/30 active:bg-white/40 transition-colors"
                onClick={() => setShowDetailView(false)}
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex-1">
                <div className="text-base font-medium opacity-90">Upphämtningsdetaljer</div>
                <div className="text-2xl font-bold">{selectedPickup.car_registration_number}</div>
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="px-4 py-6 space-y-5">
            {/* Car info card */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-2">
                {selectedPickup.car_registration_number}
              </div>
              <div className="text-xl text-gray-700 font-medium mb-4">
                {selectedPickup.car_year} {selectedPickup.car_brand} {selectedPickup.car_model}
              </div>
              <div className="text-3xl font-bold text-green-600">
                {selectedPickup.final_price ? `${selectedPickup.final_price.toLocaleString()} kr` : 'Pris ej fastställt'}
              </div>
            </div>

            {/* Customer info card */}
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-5">Kundinformation</h3>
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">👤</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 font-medium">Namn</div>
                    <div className="text-lg font-semibold text-gray-900">{selectedPickup.owner_name}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">📞</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 font-medium">Telefon</div>
                    <a href={`tel:${selectedPickup.phone_number}`} className="text-lg font-semibold text-blue-600 active:text-blue-800">
                      {selectedPickup.phone_number}
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">📍</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 font-medium mb-1">Upphämtningsadress</div>
                    <div className="text-lg font-semibold text-gray-900 leading-relaxed">
                      {selectedPickup.pickup_address}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons - Mobile optimized */}
            <div className="space-y-3 pb-8">
              {selectedPickup.status === 'assigned' && (
                <>
                  <button 
                    className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-5 rounded-2xl text-xl font-bold transition-colors shadow-lg active:scale-[0.98]"
                    onClick={() => updatePickupStatus(selectedPickup.pickup_id, 'in_progress')}
                  >
                    <span className="flex items-center justify-center gap-3">
                      <span className="text-2xl">▶️</span>
                      Starta upphämtning
                    </span>
                  </button>
                  
                  <button 
                    className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white py-5 rounded-2xl text-xl font-bold transition-colors shadow-lg active:scale-[0.98]"
                    onClick={() => updatePickupStatus(selectedPickup.pickup_id, 'rejected')}
                  >
                    <span className="flex items-center justify-center gap-3">
                      <span className="text-2xl">❌</span>
                      Avvisa uppdrag
                    </span>
                  </button>
                  
                  <button 
                    className="w-full bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white py-5 rounded-2xl text-xl font-bold transition-colors shadow-lg active:scale-[0.98]"
                    onClick={() => updatePickupStatus(selectedPickup.pickup_id, 'scheduled')}
                  >
                    <span className="flex items-center justify-center gap-3">
                      <span className="text-2xl">📅</span>
                      Schemalägg om
                    </span>
                  </button>
                </>
              )}
              
              {selectedPickup.status === 'in_progress' && (
                <>
                  <button 
                    className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white py-5 rounded-2xl text-xl font-bold transition-colors shadow-lg active:scale-[0.98]"
                    onClick={() => startPickupWithVerification(selectedPickup)}
                  >
                    <span className="flex items-center justify-center gap-3">
                      <span className="text-2xl">✅</span>
                      Påbörja verifiering
                    </span>
                  </button>
                  
                  <button 
                    className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white py-5 rounded-2xl text-xl font-bold transition-colors shadow-lg active:scale-[0.98]"
                    onClick={() => updatePickupStatus(selectedPickup.pickup_id, 'rejected')}
                  >
                    <span className="flex items-center justify-center gap-3">
                      <span className="text-2xl">❌</span>
                      Avvisa uppdrag
                    </span>
                  </button>
                  
                  <button 
                    className="w-full bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white py-5 rounded-2xl text-xl font-bold transition-colors shadow-lg active:scale-[0.98]"
                    onClick={() => updatePickupStatus(selectedPickup.pickup_id, 'scheduled')}
                  >
                    <span className="flex items-center justify-center gap-3">
                      <span className="text-2xl">📅</span>
                      Schemalägg om
                    </span>
                  </button>
                </>
              )}
              
              <button 
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white py-5 rounded-2xl text-xl font-bold transition-colors shadow-lg active:scale-[0.98]"
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
                <span className="flex items-center justify-center gap-3">
                  <span className="text-2xl">🗺️</span>
                  Navigera till adressen
                </span>
              </button>
              
              <button 
                className="w-full bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-white py-5 rounded-2xl text-xl font-bold transition-colors shadow-lg active:scale-[0.98]"
                onClick={() => window.open(`tel:${selectedPickup.phone_number}`, '_self')}
              >
                <span className="flex items-center justify-center gap-3">
                  <span className="text-2xl">📞</span>
                  Ring kunden
                </span>
              </button>
              
              <button 
                className="w-full bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-700 py-4 rounded-2xl text-lg font-semibold transition-colors active:scale-[0.98] mt-6"
                onClick={() => setShowDetailView(false)}
              >
                Stäng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Driver Verification Modal - Mobile optimized */}
      {showVerificationModal && selectedPickup && (
        <div className="fixed inset-0 bg-white z-50 overflow-auto">
          {/* Header */}
          <div className="bg-gray-900 text-white px-4 py-5 sticky top-0 z-10 shadow-lg">
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">{selectedPickup.car_registration_number}</div>
              <div className="text-lg opacity-90">Verifiering av fordon</div>
            </div>
          </div>

          <div className="px-4 py-6 pb-safe">
            <div className="bg-blue-50 rounded-2xl p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Jag intygar härmed att jag har kontrollerat följande:
              </h2>
            </div>

            {/* Checklist - Touch optimized */}
            <div className="space-y-3 mb-6">
              {[
                { key: 'reg_nr_verified', label: `Reg.nr: ${selectedPickup.car_registration_number}`, required: true },
                { key: 'motor_finns', label: 'Motor finns' },
                { key: 'vaxellada_finns', label: 'Växellåda finns' },
                { key: 'katalysator_finns', label: 'Original-katalysator finns' },
                { key: 'hjul_monterat', label: '4 hjul monterat' },
                { key: 'batteri_finns', label: 'Batteri finns' },
                { key: 'inga_hushallssoppor', label: 'Inga hushållssoppor eller grovskräp finns i bilen' }
              ].map(item => (
                <label key={item.key} className="flex items-center gap-4 p-4 bg-white rounded-xl border-2 border-gray-200 active:bg-gray-50 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    id={item.key}
                    checked={verificationData[item.key as keyof typeof verificationData]}
                    onChange={(e) => setVerificationData(prev => ({
                      ...prev,
                      [item.key]: e.target.checked
                    }))}
                    className="w-6 h-6 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-offset-2"
                  />
                  <span className={`text-lg font-medium text-gray-900 flex-1 select-none ${item.required ? 'font-semibold' : ''}`}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>

            {/* Comments */}
            <div className="mb-6">
              <label className="block text-xl font-bold text-gray-900 mb-3">Intern kommentar</label>
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

            {/* Photo upload - Mobile optimized */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Bild (Valfri dokumentation)</h3>
              <p className="text-base text-gray-600 mb-4">
                Ladda upp foton endast om du behöver dokumentera avvikelser.
              </p>
              
              <label className="block">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <div className={`border-3 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                  uploading 
                    ? 'border-gray-300 bg-gray-50' 
                    : 'border-gray-300 hover:border-blue-400 active:border-blue-500 active:bg-blue-50'
                }`}>
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                      <div className="text-xl font-semibold text-gray-700">Laddar upp...</div>
                    </>
                  ) : (
                    <>
                      <div className="text-6xl mb-4">📷</div>
                      <div className="text-xl font-semibold text-gray-700">Ta bild för dokumentation</div>
                      <div className="text-base text-gray-500 mt-2">Tryck för att öppna kamera</div>
                    </>
                  )}
                </div>
              </label>

              {/* Photo grid */}
              {verificationPhotos.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3">
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
                        className="absolute -top-2 -right-2 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg active:scale-95"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Price input - Mobile optimized */}
            <div className="mb-8">
              <label className="block text-xl font-bold text-gray-900 mb-3">Slutligt pris</label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={finalPrice}
                  onChange={(e) => setFinalPrice(Number(e.target.value))}
                  className="flex-1 text-2xl font-bold p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                  inputMode="numeric"
                />
                <span className="text-2xl font-bold text-gray-600">kr</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3 pb-8">
              <button
                onClick={completeVerification}
                disabled={!verificationData.reg_nr_verified || !finalPrice}
                className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-5 rounded-2xl text-xl font-bold transition-colors shadow-lg active:scale-[0.98]"
              >
                <span className="flex items-center justify-center gap-3">
                  <span className="text-2xl">✍️</span>
                  Fortsätt till signering
                </span>
              </button>
              
              <button
                onClick={() => setShowVerificationModal(false)}
                className="w-full bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-700 py-4 rounded-2xl text-lg font-semibold transition-colors active:scale-[0.98]"
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
      
      {/* Bottom safe area with home indicator */}
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none">
        <div className="bg-gradient-to-t from-white via-white/80 to-transparent h-20"></div>
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-36 h-1.5 bg-gray-900 rounded-full opacity-60"></div>
      </div>
    </div>
  );
};

export default PantaBilenDriverApp;