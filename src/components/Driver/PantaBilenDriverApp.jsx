import React, { useState, useEffect, useMemo } from 'react';
import { useDriverIntegration } from '@/hooks/useDriverIntegration';
import { useAuth } from '@/contexts/AuthContext';
import { 
  STATUS_TEXTS, 
  STATUS_COLORS, 
  DRIVER_STATUS_TEXTS,
  DRIVER_STATUS_OPTIONS,
  DRIVER_STATUS_MAP,
  FILTER_OPTIONS,
  UI_LABELS,
  ARIA_LABELS
} from '@/constants/driverAppConstants';
import { normalizeDriverStatus } from '@/utils/driverStatus';
import RecentStatusChanges from '@/components/Driver/RecentStatusChanges';
import SimpleMap from '@/components/Common/SimpleMap';
import MapErrorBoundary from '@/components/Common/MapErrorBoundary';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogOut, CheckCircle } from 'lucide-react';
const PantaBilenDriverApp = () => {
  // Use real Supabase authentication
  const { user, logout } = useAuth();
  
  // Use the driver integration hook 
  const { 
    pickups,
    driver: currentDriver, 
    loading, 
    error,
    updateDriverStatus: updateDriverStatusHook, 
    updatePickupStatus: updatePickupStatusHook,
    selfAssignPickup,
    rejectAssignedPickup,
    statusHistory,
    historyLoading,
  } = useDriverIntegration();

  // Local state
  const [currentView, setCurrentView] = useState('list');
  const [currentFilter, setCurrentFilter] = useState('all');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showStatusHistory, setShowStatusHistory] = useState(false);

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

  // Centralized driver status UI components
  const DriverStatusDropdown = ({ currentStatus, disabled, onChange }) => {
    return (
      <div role="listbox" aria-label="Tillgänglighet" className="flex flex-col">
        {DRIVER_STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="option"
            aria-selected={currentStatus === opt.value}
            aria-pressed={currentStatus === opt.value}
            disabled={disabled}
            className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/60 text-sm w-full text-left first:rounded-t-md last:rounded-b-md`}
            onClick={() => onChange(opt.value)}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${opt.dotClass}`} />
            <span className="text-foreground">{opt.label}</span>
          </button>
        ))}
      </div>
    );
  };

  const DriverStatusBadge = ({ status }) => {
    const opt = DRIVER_STATUS_MAP[status] || DRIVER_STATUS_MAP['offline'];
    return (
      <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs ${opt.badgeClass}`}>
        <span className={`h-2 w-2 rounded-full ${opt.dotClass}`} />
        {opt.label}
      </span>
    );
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

  const handleSelfAssign = async (pickupId) => {
    try {
      await selfAssignPickup(pickupId);
      // Success feedback will come from the hook's refresh
    } catch (error) {
      console.error('Failed to self-assign pickup:', error);
      // Could add toast notification here
    }
  };

  const handleRejectPickup = async (pickupId, reason = 'Kan inte utföra detta uppdrag') => {
    try {
      await rejectAssignedPickup(pickupId, reason);
      setShowDetailView(false);
      // Success feedback will come from the hook's refresh
    } catch (error) {
      console.error('Failed to reject pickup:', error);
      // Could add toast notification here
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

  const AuthStatusBar = () => (
    <Card className="m-4 border-green-200 bg-green-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-green-900">
                ✅ Real Supabase Authentication Active
              </p>
              <p className="text-xs text-green-700">
                Logged in as: {user?.email} | Role: {user?.role} | Driver: {currentDriver?.full_name} | Tenant: {user?.tenants?.name || currentDriver?.tenant_id}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="border-green-300 text-green-700 hover:bg-green-100"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </CardContent>
    </Card>
  );

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
        <div className="flex rounded-full p-0.5 border border-white/30 bg-transparent">
          <button
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${
              currentView === 'list' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-white'
            }`}
            onClick={() => setCurrentView('list')}
            aria-label={ARIA_LABELS.listView}
            aria-pressed={currentView === 'list'}
          >
            Lista
          </button>
          <button
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${
              currentView === 'map' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-white'
            }`}
            onClick={() => setCurrentView('map')}
            aria-label={ARIA_LABELS.mapView}
            aria-pressed={currentView === 'map'}
          >
            Karta
          </button>
        </div>
        
        <div className="relative z-50">
          <button
className={"flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all"}
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            aria-label={ARIA_LABELS.statusDropdown}
          >
            <DriverStatusBadge status={currentDriver.driver_status} />
            <span>▼</span>
          </button>
          
          {showStatusMenu && (
<div className="absolute top-full right-0 mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg min-w-36 z-50">
              <DriverStatusDropdown
                currentStatus={currentDriver.driver_status}
                disabled={loading}
                onChange={(v) => handleStatusChange(v)}
              />
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
      <span className="text-sm text-gray-700 tracking-wide capitalize">{filteredPickups.length} {UI_LABELS.tasks}</span>
      <div className="flex items-center gap-3">
        <button
          className="text-gray-700 text-sm flex items-center gap-1 hover:text-gray-900"
          onClick={() => setShowStatusHistory((v) => !v)}
          aria-expanded={showStatusHistory}
          aria-controls="recent-status-changes"
        >
          {showStatusHistory ? 'Dölj senaste statusändringar' : 'Visa senaste statusändringar'}
        </button>
        <button
          className="text-indigo-600 text-sm flex items-center gap-1"
          onClick={() => setFiltersVisible(!filtersVisible)}
          aria-label={ARIA_LABELS.toggleFilters}
        >
          {UI_LABELS.filterAndSort} ⚙️
        </button>
      </div>
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
    // Check if this pickup is assigned to current driver
    const isAssignedToCurrentDriver = pickup.assigned_driver_id === currentDriver?.id;
    const isUnassigned = !pickup.assigned_driver_id;

    return (
      <div className="bg-white rounded-xl mb-4 shadow-lg hover:shadow-xl transition-all overflow-hidden">
        <div 
          className={`p-5 border-l-4 cursor-pointer`} 
          style={{ borderLeftColor: getStatusColor(pickup.status) }}
          onClick={() => openPickupDetail(pickup)}
        >
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
          
          <div className="flex justify-between items-center">
            <div className={`inline-block px-3 py-1 rounded-xl text-xs font-semibold`} 
                 style={{ 
                   backgroundColor: getStatusColor(pickup.status) + '20',
                   color: getStatusColor(pickup.status)
                 }}>
              {getStatusText(pickup.status)}
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              {isUnassigned && (
                <button
                  onClick={() => handleSelfAssign(pickup.id)}
                  className="px-3 py-1 bg-green-600 text-white text-xs rounded-full hover:bg-green-700 transition-colors"
                >
                  Välj uppdrag
                </button>
              )}
              {isAssignedToCurrentDriver && pickup.status === 'assigned' && (
                <button
                  onClick={() => handleRejectPickup(pickup.id)}
                  className="px-3 py-1 bg-red-600 text-white text-xs rounded-full hover:bg-red-700 transition-colors"
                >
                  Avvisa
                </button>
              )}
            </div>
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
          <PickupCard key={pickup.pickup_id || pickup.id} pickup={pickup} />
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
              <div className="text-sm text-gray-700 tracking-wide capitalize">{UI_LABELS.tasks}</div>
            </div>
            {/* TODO: Replace with real route optimization data */}
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">--</div>
              <div className="text-sm text-gray-700 tracking-wide capitalize">{UI_LABELS.estimatedDistance}</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">--</div>
              <div className="text-sm text-gray-700 tracking-wide capitalize">{UI_LABELS.estimatedTime}</div>
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
      
      <MapErrorBoundary>
        <SimpleMap
          center={{ lat: 59.3293, lng: 18.0686 }}
          pickups={filteredPickups}
          onPickupSelect={openPickupDetail}
          className="h-[700px] rounded-xl"
        />
      </MapErrorBoundary>
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
                onClick={() => updatePickupStatusHook(selectedPickup.pickup_id, 'in_progress')}
              >
                {UI_LABELS.startPickup}
              </button>
            )}
            
            {selectedPickup.status === 'in_progress' && (
              <>
                <button 
                  className="w-full bg-green-600 text-white py-4 rounded-xl text-base font-semibold"
                  onClick={() => handleCompletePickup(selectedPickup.pickup_id)}
                >
                  {UI_LABELS.completePickup}
                </button>
                <button 
                  className="w-full bg-red-600 text-white py-4 rounded-xl text-base font-semibold"
                  onClick={() => handleRejectPickup(selectedPickup.pickup_id)}
                >
                  Avvisa uppdrag
                </button>
              </>
            )}
            
            {selectedPickup.status === 'assigned' && selectedPickup.assigned_driver_id === currentDriver?.id && (
              <button 
                className="w-full bg-red-600 text-white py-4 rounded-xl text-base font-semibold"
                onClick={() => handleRejectPickup(selectedPickup.pickup_id)}
              >
                Avvisa uppdrag
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
      <AuthStatusBar />
      <StatusBar />
      <AppHeader />
      <TabBar />
      <FilterHeader />
      <FiltersSection />
      {currentView === 'list' && showStatusHistory && currentDriver?.driver_id && (
        <div id="recent-status-changes" className="px-4 mt-3 mb-2">
          <RecentStatusChanges driverId={currentDriver.driver_id} />
        </div>
      )}
      {currentView === 'list' ? <PickupList /> : <MapView />}
      {/* Navigation Indicator */}
      <div className="fixed bottom-3 left-1/2 transform -translate-x-1/2 w-33 h-1 bg-gray-900 rounded-full opacity-80"></div>
    </div>
  );
};

export default PantaBilenDriverApp;