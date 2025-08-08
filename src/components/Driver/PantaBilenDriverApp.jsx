import React, { useState, useEffect, useMemo } from 'react';
import { useDriverIntegration } from '@/hooks/useDriverIntegration';
import { 
  STATUS_TEXTS, 
  STATUS_COLORS, 
  DRIVER_STATUS_TEXTS,
  FILTER_OPTIONS,
  UI_LABELS,
  ARIA_LABELS
} from '@/constants/driverAppConstants';
const PantaBilenDriverApp = () => {
  // Use the driver integration hook 
  const { 
    pickups,
    driver: currentDriver, 
    loading, 
    error,
    updateDriverStatus: updateDriverStatusHook, 
    updatePickupStatus: updatePickupStatusHook 
  } = useDriverIntegration();

  // Local state
  const [currentView, setCurrentView] = useState('list');
  const [currentFilter, setCurrentFilter] = useState('all');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Memoized filtered and sorted pickups
  const filteredPickups = useMemo(() => {
    let filtered = pickups;

    // Filter by status
    if (currentFilter !== 'all') {
      filtered = filtered.filter(order => order.status === currentFilter);
    }

    // Sort by date
    return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [pickups, currentFilter]);

  // Helper functions
  const getStatusText = (status) => {
    return STATUS_TEXTS[status] || status;
  };

  const getStatusColor = (status) => {
    return STATUS_COLORS[status] || '#6c757d';
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('sv-SE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleStatusChange = async (newStatus) => {
    if (currentDriver) {
      const success = await updateDriverStatusHook(newStatus);
      if (success) {
        setShowStatusMenu(false);
      }
    }
  };

  const openPickupDetail = (pickup) => {
    setSelectedPickup(pickup);
    setShowDetailView(true);
  };

  const handleCompletePickup = async (pickupId) => {
    const success = await updatePickupStatusHook(pickupId, 'completed');
    if (success) {
      setShowDetailView(false);
      // Hook should automatically refresh the list
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{UI_LABELS.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !currentDriver) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4 font-semibold">⚠️ {error || UI_LABELS.noDriverFound}</p>
          <p className="text-sm text-gray-500">
            {error ? UI_LABELS.tryAgain : UI_LABELS.contactAdmin}
          </p>
        </div>
      </div>
    );
  }

  const StatusBar = () => (
    <div className="bg-gray-900 text-white px-5 py-2 flex justify-between items-center text-base font-semibold">
      <span>{getCurrentTime()}</span>
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
            aria-label={ARIA_LABELS.listView}
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
            aria-label={ARIA_LABELS.mapView}
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
            aria-label={ARIA_LABELS.statusDropdown}
          >
            <div className={`w-3 h-3 rounded-full ${
              currentDriver.driver_status === 'available' ? 'bg-green-500' : 
              currentDriver.driver_status === 'busy' ? 'bg-red-500' : 'bg-gray-500'
            }`}></div>
            <span>
              {currentDriver.driver_status === 'available' ? DRIVER_STATUS_TEXTS.available : 
               currentDriver.driver_status === 'busy' ? DRIVER_STATUS_TEXTS.busy : DRIVER_STATUS_TEXTS.offline}
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
                    {status === 'available' ? DRIVER_STATUS_TEXTS.available : 
                     status === 'busy' ? DRIVER_STATUS_TEXTS.busy : DRIVER_STATUS_TEXTS.offline}
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
        className="flex-1 py-4 text-center font-semibold text-base text-gray-900 border-b-3 border-indigo-500"
        onClick={() => {}} // Single tab, no action needed
      >
        Mina ({filteredPickups.length})
      </button>
    </div>
  );

  const FilterHeader = () => (
    <div className="bg-white px-5 py-4 flex justify-between items-center border-b border-gray-200">
      <span className="text-sm text-gray-600">{filteredPickups.length} {UI_LABELS.tasks}</span>
      <button
        className="text-indigo-600 text-sm flex items-center gap-1"
        onClick={() => setFiltersVisible(!filtersVisible)}
        aria-label={ARIA_LABELS.toggleFilters}
      >
        {UI_LABELS.filterAndSort} ⚙️
      </button>
    </div>
  );

  const FiltersSection = () => (
    filtersVisible && (
      <div className="bg-white mx-4 my-4 p-5 rounded-xl shadow-lg">
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-800 mb-2">{UI_LABELS.filterByStatus}</label>
          <div className="flex gap-2 flex-wrap">
            {FILTER_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                className={`px-4 py-2 border-2 rounded-full text-sm font-semibold transition-all ${
                  currentFilter === key 
                    ? 'bg-gray-800 border-gray-800 text-white shadow-md' 
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
    return (
      <div
        className="bg-white rounded-xl mb-4 shadow-lg hover:shadow-xl transition-all cursor-pointer overflow-hidden"
        onClick={() => openPickupDetail(pickup)}
      >
        <div className={`p-5 border-l-4`} style={{ borderLeftColor: getStatusColor(pickup.status) }}>
          <div className="flex justify-between items-center mb-2">
            <div className="text-lg font-bold text-gray-900">
              {pickup.car_registration_number || 'N/A'}
            </div>
            <div className="flex gap-1">
              <span className="text-base" aria-label={ARIA_LABELS.scrapInfo}>💀</span>
              <span className="text-base" aria-label={ARIA_LABELS.taskInfo}>📋</span>
            </div>
          </div>
          
          <div className="text-sm text-gray-600 mb-2">
            {pickup.car_year} — {pickup.car_brand} {pickup.car_model}
          </div>
          
          <div className="text-base font-semibold text-gray-900 mb-2">
            {UI_LABELS.finalPrice}: {pickup.final_price ? `${pickup.final_price} kr` : UI_LABELS.notDetermined}
          </div>
          
          <div className="text-sm text-gray-600 mb-2">
            {UI_LABELS.address}: {pickup.pickup_address}
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
      {filteredPickups.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <p className="text-gray-600">{UI_LABELS.noTasksToShow}</p>
        </div>
      ) : (
        filteredPickups.map(pickup => (
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
              <div className="text-xl font-bold text-gray-900">{filteredPickups.length}</div>
              <div className="text-xs text-gray-600">{UI_LABELS.tasks}</div>
            </div>
            {/* TODO: Replace with real route optimization data */}
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">--</div>
              <div className="text-xs text-gray-600">{UI_LABELS.estimatedDistance}</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">--</div>
              <div className="text-xs text-gray-600">{UI_LABELS.estimatedTime}</div>
            </div>
          </div>
          <button 
            className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2"
            aria-label={ARIA_LABELS.optimizeRoute}
          >
            🗺️ {UI_LABELS.optimizeRoute}
          </button>
        </div>
      </div>
      
      <div className="bg-gray-200 h-96 rounded-xl flex items-center justify-center">
        <div className="text-gray-600 text-center">
          <div className="text-2xl mb-2">🗺️</div>
          <div>{UI_LABELS.googleMapsIntegration}</div>
          <div className="text-sm mt-1">{UI_LABELS.showOnMap} {filteredPickups.length} {UI_LABELS.tasks}</div>
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
            aria-label={ARIA_LABELS.backToList}
          >
            ←
          </button>
          <span className="font-semibold">{UI_LABELS.backToList}</span>
        </div>
        
        <div className="p-5">
          <div className="text-center mb-8">
            <div className="text-2xl font-bold text-indigo-600 mb-2">
              {selectedPickup.car_registration_number}
            </div>
            <div className="text-gray-600">
              {selectedPickup.car_year} {selectedPickup.car_brand} {selectedPickup.car_model}
            </div>
          </div>

          {/* Customer Info */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">{UI_LABELS.customer}</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-sm text-gray-600">{UI_LABELS.name}</span>
                <span className="text-sm text-gray-900 font-medium">{selectedPickup.owner_name}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-sm text-gray-600">{UI_LABELS.address}</span>
                <span className="text-sm text-gray-900 font-medium">{selectedPickup.pickup_address}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-sm text-gray-600">{UI_LABELS.status}</span>
                <span className="text-sm text-gray-900 font-medium">{getStatusText(selectedPickup.status)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 space-y-3">
            {selectedPickup.status === 'scheduled' && (
              <button 
                className="w-full bg-blue-600 text-white py-4 rounded-xl text-base font-semibold"
                onClick={() => updatePickupStatusHook(selectedPickup.id, 'in_progress')}
              >
                {UI_LABELS.startPickup}
              </button>
            )}
            
            {selectedPickup.status === 'in_progress' && (
              <button 
                className="w-full bg-green-600 text-white py-4 rounded-xl text-base font-semibold"
                onClick={() => handleCompletePickup(selectedPickup.id)}
              >
                {UI_LABELS.completePickup}
              </button>
            )}
            
            <button 
              className="w-full bg-gray-600 text-white py-4 rounded-xl text-base font-semibold"
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
              aria-label={ARIA_LABELS.navigate}
            >
              🗺️ {UI_LABELS.navigate}
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