import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Custom hook for Supabase data
const useSupabaseData = () => {
  const [pickupOrders, setPickupOrders] = useState([]);
  const [currentDriver, setCurrentDriver] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPickupOrders = async (driverId) => {
    try {
      const { data, error } = await supabase
        .from('pickup_orders')
        .select(`
          *,
          customer_requests (*),
          driver_assignments!inner (
            driver_id,
            role,
            is_active
          ),
          car_metadata (*)
        `)
        .eq('driver_assignments.driver_id', driverId)
        .eq('driver_assignments.is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPickupOrders(data || []);
    } catch (error) {
      console.error('Error fetching pickup orders:', error);
    }
  };

  const fetchCurrentDriver = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch driver info
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (error) throw error;
      setCurrentDriver(data);
      
      // Fetch pickup orders for this driver
      if (data) {
        await fetchPickupOrders(data.id);
      }
    } catch (error) {
      console.error('Error fetching driver:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDriverStatus = async (driverId, newStatus) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ 
          driver_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', driverId);

      if (error) throw error;

      // Log status change
      await supabase
        .from('driver_status_history')
        .insert({
          driver_id: driverId,
          old_status: currentDriver?.driver_status,
          new_status: newStatus,
          changed_at: new Date().toISOString()
        });

      setCurrentDriver(prev => prev ? { ...prev, driver_status: newStatus } : null);
    } catch (error) {
      console.error('Error updating driver status:', error);
    }
  };

  const updatePickupStatus = async (pickupOrderId, newStatus, notes = null, photos = null) => {
    try {
      // Update pickup order
      const { error: orderError } = await supabase
        .from('pickup_orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(notes && { driver_notes: notes }),
          ...(photos && { completion_photos: photos })
        })
        .eq('id', pickupOrderId);

      if (orderError) throw orderError;

      // Log status update
      await supabase
        .from('pickup_status_updates')
        .insert({
          pickup_order_id: pickupOrderId,
          driver_id: currentDriver?.id,
          new_status: newStatus,
          notes,
          photos,
          timestamp: new Date().toISOString()
        });

      // Refresh data
      if (currentDriver) {
        await fetchPickupOrders(currentDriver.id);
      }
    } catch (error) {
      console.error('Error updating pickup status:', error);
    }
  };

  useEffect(() => {
    fetchCurrentDriver();
  }, []);

  return {
    pickupOrders,
    currentDriver,
    loading,
    updateDriverStatus,
    updatePickupStatus,
    refreshData: () => currentDriver && fetchPickupOrders(currentDriver.id)
  };
};

const PantaBilenDriverApp = () => {
  // Use the custom hook
  const { 
    pickupOrders, 
    currentDriver, 
    loading, 
    updateDriverStatus, 
    updatePickupStatus 
  } = useSupabaseData();

  // Local state
  const [currentView, setCurrentView] = useState('list');
  const [currentTab, setCurrentTab] = useState('mina');
  const [currentFilter, setCurrentFilter] = useState('all');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Helper functions
  const getFilteredPickups = () => {
    let filtered = pickupOrders;

    // Filter by status
    if (currentFilter !== 'all') {
      filtered = filtered.filter(order => order.status === currentFilter);
    }

    // Sort by date
    return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  const getStatusText = (status) => {
    const statusMap = {
      'scheduled': 'Väntar på upphämtning',
      'in_progress': 'Pågående',
      'completed': 'Klar',
      'cancelled': 'Avbruten',
      'pending': 'Att hantera'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'scheduled': '#6366f1',
      'in_progress': '#f59e0b', 
      'completed': '#10b981',
      'cancelled': '#ef4444',
      'pending': '#f59e0b'
    };
    return colorMap[status] || '#6c757d';
  };

  const handleStatusChange = async (newStatus) => {
    if (currentDriver) {
      await updateDriverStatus(currentDriver.id, newStatus);
      setShowStatusMenu(false);
    }
  };

  const openPickupDetail = (pickup) => {
    setSelectedPickup(pickup);
    setShowDetailView(true);
  };

  const handleCompletePickup = async (pickupId) => {
    await updatePickupStatus(pickupId, 'completed');
    setShowDetailView(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar...</p>
        </div>
      </div>
    );
  }

  if (!currentDriver) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Ingen förare hittades</p>
          <p className="text-sm text-gray-500">Kontakta administratören för att skapa ditt förarkonto</p>
        </div>
      </div>
    );
  }

  const StatusBar = () => (
    <div className="bg-gray-900 text-white px-5 py-2 flex justify-between items-center text-base font-semibold">
      <span>12:30</span>
      <div className="flex gap-1 items-center">
        <div className="w-4 h-3 bg-white rounded-sm"></div>
        <div className="w-4 h-3 bg-white rounded-sm"></div>
        <div className="w-4 h-3 bg-white rounded-sm"></div>
      </div>
    </div>
  );

  const AppHeader = () => (
    <div className="bg-gray-900 text-white px-5 py-4 flex justify-between items-center">
      <h1 className="text-lg font-bold">PantaBilen</h1>
      <div className="flex items-center gap-4">
        <div className="flex bg-white bg-opacity-10 rounded-full p-0.5 border-2 border-white border-opacity-20">
          <button
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              currentView === 'list' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-white text-opacity-80'
            }`}
            onClick={() => setCurrentView('list')}
          >
            Lista
          </button>
          <button
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              currentView === 'map' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-white text-opacity-80'
            }`}
            onClick={() => setCurrentView('map')}
          >
            Karta
          </button>
        </div>
        
        <div className="relative">
          <button
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 text-xs font-semibold transition-all ${
              currentDriver.driver_status === 'available' 
                ? 'border-green-500 bg-green-50 text-green-800' 
                : currentDriver.driver_status === 'busy'
                ? 'border-red-500 bg-red-50 text-red-800'
                : 'border-gray-500 bg-gray-50 text-gray-700'
            }`}
            onClick={() => setShowStatusMenu(!showStatusMenu)}
          >
            <div className={`w-3 h-3 rounded-full ${
              currentDriver.driver_status === 'available' ? 'bg-green-500' : 
              currentDriver.driver_status === 'busy' ? 'bg-red-500' : 'bg-gray-500'
            }`}></div>
            <span>
              {currentDriver.driver_status === 'available' ? 'Tillgänglig' : 
               currentDriver.driver_status === 'busy' ? 'Upptagen' : 'Offline'}
            </span>
            <span>▼</span>
          </button>
          
          {showStatusMenu && (
            <div className="absolute top-full right-0 mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg min-w-36 z-50">
              {['available', 'offline', 'busy'].map((status) => (
                <button
                  key={status}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm w-full text-left first:rounded-t-md last:rounded-b-md"
                  onClick={() => handleStatusChange(status)}
                >
                  <div className={`w-3 h-3 rounded-full ${
                    status === 'available' ? 'bg-green-500' : 
                    status === 'busy' ? 'bg-red-500' : 'bg-gray-500'
                  }`}></div>
                  <span className="text-gray-900">
                    {status === 'available' ? 'Tillgänglig' : 
                     status === 'busy' ? 'Upptagen' : 'Offline'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
          {currentDriver.full_name?.charAt(0) || 'D'}
        </div>
      </div>
    </div>
  );

  const TabBar = () => (
    <div className="bg-white flex border-b border-gray-200">
      <button
        className={`flex-1 py-4 text-center font-semibold text-base ${
          currentTab === 'mina' 
            ? 'text-gray-900 border-b-3 border-indigo-500' 
            : 'text-gray-600 hover:text-gray-900'
        }`}
        onClick={() => setCurrentTab('mina')}
      >
        Mina ({getFilteredPickups().length})
      </button>
    </div>
  );

  const FilterHeader = () => (
    <div className="bg-white px-5 py-4 flex justify-between items-center border-b border-gray-200">
      <span className="text-sm text-gray-600">{getFilteredPickups().length} uppdrag</span>
      <button
        className="text-indigo-600 text-sm flex items-center gap-1"
        onClick={() => setFiltersVisible(!filtersVisible)}
      >
        Filtrera och sortera ⚙️
      </button>
    </div>
  );

  const FiltersSection = () => (
    filtersVisible && (
      <div className="bg-white mx-4 my-4 p-5 rounded-xl shadow-lg">
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-800 mb-2">Filtrera efter status:</label>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'Alla' },
              { key: 'scheduled', label: 'Schemalagd' },
              { key: 'in_progress', label: 'Pågående' },
              { key: 'completed', label: 'Klar' },
              { key: 'pending', label: 'Väntar' },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`px-4 py-2 border-2 rounded-full text-sm font-semibold transition-all ${
                  currentFilter === key 
                    ? 'bg-indigo-600 border-indigo-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-700 hover:border-indigo-300'
                }`}
                onClick={() => setCurrentFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  );

  const PickupCard = ({ pickup }) => {
    const customerRequest = pickup.customer_requests;
    const carMetadata = pickup.car_metadata;
    
    return (
      <div
        className="bg-white rounded-xl mb-4 shadow-lg hover:shadow-xl transition-all cursor-pointer overflow-hidden"
        onClick={() => openPickupDetail(pickup)}
      >
        <div className={`p-5 border-l-4`} style={{ borderLeftColor: getStatusColor(pickup.status) }}>
          <div className="flex justify-between items-center mb-2">
            <div className="text-lg font-bold text-gray-900">
              {customerRequest?.car_registration_number || 'N/A'}
            </div>
            <div className="flex gap-1">
              <span className="text-base">💀</span>
              <span className="text-base">📋</span>
            </div>
          </div>
          
          <div className="text-sm text-gray-600 mb-2">
            {customerRequest?.car_year} — {customerRequest?.car_brand} {customerRequest?.car_model}
          </div>
          
          <div className="text-base font-semibold text-gray-900 mb-2">
            Slutpris: {pickup.final_price ? `${pickup.final_price} kr` : 'Ej bestämt'}
          </div>
          
          <div className="text-sm text-gray-600 mb-2">
            Adress: {customerRequest?.pickup_address}
          </div>
          
          <div className={`inline-block px-3 py-1 rounded-xl text-xs font-semibold`} 
               style={{ 
                 backgroundColor: getStatusColor(pickup.status) + '20',
                 color: getStatusColor(pickup.status)
               }}>
            {getStatusText(pickup.status)}
          </div>
        </div>
      </div>
    );
  };

  const PickupList = () => (
    <div className={`p-4 ${currentView === 'map' ? 'hidden' : 'block'}`}>
      {getFilteredPickups().length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <p className="text-gray-600">Inga uppdrag att visa</p>
        </div>
      ) : (
        getFilteredPickups().map(pickup => (
          <PickupCard key={pickup.id} pickup={pickup} />
        ))
      )}
    </div>
  );

  const MapView = () => (
    <div className={`p-4 ${currentView === 'list' ? 'hidden' : 'block'}`}>
      <div className="bg-white p-4 rounded-xl mb-4 shadow-lg">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div className="flex gap-5 flex-wrap">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{getFilteredPickups().length}</div>
              <div className="text-xs text-gray-600">Uppdrag</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{getFilteredPickups().length * 8} km</div>
              <div className="text-xs text-gray-600">Uppskattad sträcka</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{getFilteredPickups().length * 25} min</div>
              <div className="text-xs text-gray-600">Uppskattad tid</div>
            </div>
          </div>
          <button className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
            🗺️ Optimera rutt
          </button>
        </div>
      </div>
      
      <div className="bg-gray-200 h-96 rounded-xl flex items-center justify-center">
        <div className="text-gray-600 text-center">
          <div className="text-2xl mb-2">🗺️</div>
          <div>Google Maps Integration</div>
          <div className="text-sm mt-1">Visa {getFilteredPickups().length} uppdrag på kartan</div>
        </div>
      </div>
    </div>
  );

  const DetailView = () => (
    showDetailView && selectedPickup && (
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
        <div className="bg-indigo-600 text-white px-5 py-4 flex items-center gap-4">
          <button
            className="text-xl font-bold"
            onClick={() => setShowDetailView(false)}
          >
            ←
          </button>
          <span className="font-semibold">Tillbaka till listan</span>
        </div>
        
        <div className="p-5">
          <div className="text-center mb-8">
            <div className="text-2xl font-bold text-indigo-600 mb-2">
              {selectedPickup.customer_requests?.car_registration_number}
            </div>
            <div className="text-gray-600">
              {selectedPickup.customer_requests?.car_year} {selectedPickup.customer_requests?.car_brand} {selectedPickup.customer_requests?.car_model}
            </div>
          </div>

          {/* Customer Info */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Kund</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-sm text-gray-600">Namn</span>
                <span className="text-sm text-gray-900 font-medium">{selectedPickup.customer_requests?.owner_name}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-sm text-gray-600">Adress</span>
                <span className="text-sm text-gray-900 font-medium">{selectedPickup.customer_requests?.pickup_address}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-sm text-gray-600">Status</span>
                <span className="text-sm text-gray-900 font-medium">{getStatusText(selectedPickup.status)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 space-y-3">
            {selectedPickup.status === 'scheduled' && (
              <button 
                className="w-full bg-blue-600 text-white py-4 rounded-xl text-base font-semibold"
                onClick={() => updatePickupStatus(selectedPickup.id, 'in_progress')}
              >
                Starta upphämtning
              </button>
            )}
            
            {selectedPickup.status === 'in_progress' && (
              <button 
                className="w-full bg-green-600 text-white py-4 rounded-xl text-base font-semibold"
                onClick={() => handleCompletePickup(selectedPickup.id)}
              >
                Slutför upphämtning
              </button>
            )}
            
            <button 
              className="w-full bg-gray-600 text-white py-4 rounded-xl text-base font-semibold"
              onClick={() => {
                const address = selectedPickup.customer_requests?.pickup_address;
                if (address) {
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank');
                }
              }}
            >
              🗺️ Navigera
            </button>
          </div>
        </div>
      </div>
    )
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <StatusBar />
      <AppHeader />
      <TabBar />
      <FilterHeader />
      <FiltersSection />
      {currentView === 'list' ? <PickupList /> : <MapView />}
      <DetailView />
      
      {/* Navigation Indicator */}
      <div className="fixed bottom-3 left-1/2 transform -translate-x-1/2 w-33 h-1 bg-gray-900 rounded-full opacity-80"></div>
    </div>
  );
};

export default PantaBilenDriverApp;