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
  // 🚨 EMERGENCY DEBUG - VERSION VERIFICATION
  console.log('🔴 EMERGENCY: Component loaded at', new Date().toISOString());
  console.log('🔴 EMERGENCY: Version check - LATEST-FIX-APPLIED');
  console.log('🔴 EMERGENCY: PantaBilenDriverApp rendering started');
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
  const [showPickupActions, setShowPickupActions] = useState(null); // For pickup action dropdown
  
  // 🚨 ULTRA SIMPLE TEST - Emergency bypass
  const [simpleTest, setSimpleTest] = useState(false);

  // Add debug function after useState declarations
  const debugDriverAssignment = (pickup) => {
    console.log('🔍 DRIVER ASSIGNMENT DEBUG:', pickup.car_registration_number, {
      pickup_order_id: pickup.pickup_order_id,
      pickup_status: pickup.pickup_status,
      status_display_text: pickup.status_display_text,
      driver_id: pickup.driver_id,
      current_driver_id: currentDriver?.driver_id,
      should_show_buttons: pickup.pickup_status === 'assigned' && pickup.driver_id === currentDriver?.driver_id
    });
  };

  // 🔴 CRITICAL DEBUG LOGGING (after state declarations)
  console.log('🔴 DRIVER APP RENDER:');
  console.log('🔴 User:', user);
  console.log('🔴 Current Driver:', currentDriver);
  console.log('🔴 Pickups:', pickups);
  console.log('🔴 Pickups count:', pickups?.length);
  console.log('🔴 Loading:', loading);
  console.log('🔴 Error:', error);
  console.log('🔴 Show pickup actions:', showPickupActions);

  // 🔴 COMPONENT MOUNT DEBUG
  useEffect(() => {
    console.log('🔴 DRIVER APP MOUNTED');
    console.log('🔴 Initial props:', { currentDriver, pickups, user });
  }, []);

  // 🔴 SIMPLIFIED BUTTON HANDLER
  const handleActionToggle = (pickupId) => {
    console.log('🔴 Simple toggle for:', pickupId, typeof pickupId);
    setShowPickupActions(current => {
      const newState = current === pickupId ? null : pickupId;
      console.log('🔴 State change:', current, '→', newState);
      return newState;
    });
  };

  // 🔴 TRACK STATE CHANGES
  useEffect(() => {
    console.log('🔴 STATE CHANGED - showPickupActions:', showPickupActions);
  }, [showPickupActions]);

  // Memoized filtered and sorted pickups
  const filteredPickups = useMemo(() => {
    let filtered = pickups;

    // Filter by status
    if (currentFilter !== 'all') {
      filtered = filtered.filter(order => order.pickup_status === currentFilter);
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

  // Debug: explicit handler for Start Pickup with detailed logs
  const handleStartPickup = async (pickupId) => {
    try {
      console.log('🔴 BUTTON CLICKED - Start Pickup');
      console.log('🔴 Pickup ID:', pickupId);
      console.log('🔴 Selected pickup:', selectedPickup);

      const result = await updatePickupStatusHook(pickupId, 'in_progress');
      console.log('🟢 SUCCESS: updatePickupStatusHook resolved', result);
      
      if (result?.success) {
        setShowDetailView(false);
        // Hook should automatically refresh the list
      }
    } catch (error) {
      console.error('🔴 ERROR from updatePickupStatusHook:', error);
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

  const handleAcceptPickup = async (pickupId) => {
    try {
      console.log('🔴 Driver accepting pickup:', pickupId);
      
      // Use unified function to update status to accepted
      const result = await updatePickupStatusHook(pickupId, 'pickup_accepted');
      
      if (result?.success) {
        console.log('✅ Pickup accepted successfully');
        setShowPickupActions(null);
        setShowDetailView(false);
      }
    } catch (error) {
      console.error('❌ Failed to accept pickup:', error);
    }
  };

  const handleRejectPickup = async (pickupId, reason = 'Kan inte utföra detta uppdrag') => {
    console.log('🔴 BUTTON CLICKED - Avvisa uppdrag');
    console.log('🔴 Pickup ID:', pickupId);
    console.log('🔴 Selected pickup:', selectedPickup);
    console.log('🔴 Reason:', reason);
    try {
      const result = await rejectAssignedPickup(pickupId, reason);
      console.log('🟢 SUCCESS: rejectAssignedPickup resolved', result);
      setShowDetailView(false);
      setShowPickupActions(null);
    } catch (error) {
      console.error('🔴 ERROR from rejectAssignedPickup:', error);
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
    // Ensure we use the correct pickup ID from unified view
    const pickupId = pickup.pickup_order_id || pickup.id;
    
    // Check if this pickup is assigned to current driver
    const isAssignedToCurrentDriver = pickup.assigned_driver_id === currentDriver?.id;
    const isUnassigned = pickup.assigned_driver_id === null || pickup.assigned_driver_id === undefined;

    return (
      <div className="bg-white rounded-xl mb-4 shadow-lg hover:shadow-xl transition-all overflow-hidden">
        <div 
          className={`p-5 border-l-4`} 
          style={{ borderLeftColor: getStatusColor(pickup.pickup_status) }}
        >
          <div className="flex justify-between items-center mb-2">
            <div className="text-lg font-bold text-gray-900">
              {pickup.car_registration_number ? 
                `${pickup.car_registration_number.slice(0, 3)} ${pickup.car_registration_number.slice(3)}` : 
                'N/A'
              }
            </div>
            <div className="flex gap-2 items-center">
              {(pickup.contact_phone && pickup.contact_phone !== 'undefined' && 
                (!pickup.contact_phone._type || pickup.contact_phone._type !== 'undefined')) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const phoneNumber = pickup.contact_phone.value || pickup.contact_phone;
                    window.open(`tel:${phoneNumber}`, '_self');
                  }}
                  className="text-green-600 hover:text-green-800 p-1 rounded"
                  aria-label="Ring kund"
                  title={`Ring ${pickup.contact_phone.value || pickup.contact_phone}`}
                >
                  📞
                </button>
              )}
              <button
                onClick={() => openPickupDetail(pickup)}
                className="text-indigo-600 text-sm hover:text-indigo-800 font-medium px-2 py-1 rounded"
              >
                Visa detaljer
              </button>
              {/* Debug logging for assigned pickups */}
              {pickup.pickup_status === 'assigned' && debugDriverAssignment(pickup)}
              {/* Action button for assigned status */}
              {pickup.pickup_status === 'assigned' && isAssignedToCurrentDriver && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActionToggle(pickupId);
                    }}
                    className="text-purple-600 text-sm hover:text-purple-800 font-medium px-2 py-1 rounded border border-purple-200 hover:bg-purple-50"
                  >
                    Acceptera/Avvisa
                  </button>
                  
                  {showPickupActions === pickupId && (
                    <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcceptPickup(pickupId);
                        }}
                        className="w-full px-4 py-3 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 first:rounded-t-lg flex items-center justify-center gap-2"
                      >
                        ✓ Acceptera uppdrag
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRejectPickup(pickupId);
                        }}
                        className="w-full px-4 py-3 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 last:rounded-b-lg flex items-center justify-center gap-2"
                      >
                        ✗ Avvisa uppdrag
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex gap-1">
                <span className="text-base" aria-label={ARIA_LABELS.scrapInfo}>💀</span>
                <span className="text-base" aria-label={ARIA_LABELS.taskInfo}>📋</span>
              </div>
            </div>
          </div>
          
          <div className="text-sm text-gray-600 mb-2">
            {pickup.car_year} — {pickup.car_brand} {pickup.car_model}
          </div>
          
          {/* Customer Information */}
          <div className="mb-2">
            <div className="text-sm font-medium text-gray-800">
              👤 {pickup.owner_name || pickup.customer_name || 'Okänd kund'}
            </div>
            {(pickup.contact_phone && pickup.contact_phone !== 'undefined' && 
              (!pickup.contact_phone._type || pickup.contact_phone._type !== 'undefined')) && (
              <div className="text-sm text-gray-600">
                📞 {pickup.contact_phone.value || pickup.contact_phone}
              </div>
            )}
            {pickup.pnr_num && (
              <div className="text-xs text-gray-500">
                🆔 {pickup.pnr_num}
              </div>
            )}
          </div>
          
          <div className="text-base font-semibold text-gray-900 mb-2">
            {UI_LABELS.finalPrice}: {pickup.final_price ? `${pickup.final_price} kr` : UI_LABELS.notDetermined}
          </div>
          
          <div className="text-sm text-gray-600 mb-3">
            {UI_LABELS.address}: {pickup.pickup_address}
          </div>
          
          <div className="flex justify-between items-center">
            <div className={`inline-block px-3 py-1 rounded-xl text-xs font-semibold`} 
                 style={{ 
                   backgroundColor: getStatusColor(pickup.pickup_status) + '20',
                   color: getStatusColor(pickup.pickup_status)
                 }}>
              {getStatusText(pickup.pickup_status)}
            </div>
            
            {/* Action Button - Opens Modal */}
            <div className="relative">
              {(isUnassigned || isAssignedToCurrentDriver) && (
                <button
                  onClick={() => openPickupDetail(pickup)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                    isUnassigned 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-orange-600 hover:bg-orange-700 text-white'
                  }`}
                >
                  {isUnassigned ? 'Hantera uppdrag' : 'Hantera tilldelat'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PickupList = () => {
    // Debug logging for pickup data
     console.log('🔴 PICKUP CARD DEBUG:', {
      totalPickups: pickups.length,
      filteredPickups: filteredPickups.length,
      currentFilter,
      currentDriverId: currentDriver?.id,
       pickupsData: pickups.map(p => ({
         id: p.id,
         pickup_status: p.pickup_status,
         assigned_driver_id: p.assigned_driver_id,
         car_registration: p.car_registration_number,
         contact_phone: p.contact_phone,
         owner_name: p.owner_name
       }))
    });

    return (
      <div className={`p-4 ${currentView === 'map' ? 'hidden' : 'block'}`}>
        {filteredPickups.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <p className="text-gray-600">{UI_LABELS.noTasksToShow}</p>
            <p className="text-xs text-gray-500 mt-2">
              Total pickups: {pickups.length} | Filter: {currentFilter}
            </p>
          </div>
        ) : (
          filteredPickups.map(pickup => (
            <PickupCard key={pickup.pickup_order_id || pickup.id} pickup={pickup} />
          ))
        )}
      </div>
    );
  };

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
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={() => setShowDetailView(false)}
      >
        <div 
          className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between rounded-t-xl">
          <h2 className="font-semibold text-lg">Uppdragsdetaljer</h2>
          <button
            className="text-white hover:text-gray-200 text-2xl font-bold"
            onClick={() => setShowDetailView(false)}
            aria-label={ARIA_LABELS.backToList}
          >
            ×
          </button>
        </div>
        
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="text-2xl font-bold text-indigo-600 mb-2">
              {selectedPickup.car_registration_number}
            </div>
            <div className="text-gray-600">
              {selectedPickup.car_year} {selectedPickup.car_brand} {selectedPickup.car_model}
            </div>
          </div>

          {/* Customer Info */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 text-center">{UI_LABELS.customer}</h3>
            <div className="space-y-3">
              <div className="flex flex-col py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600 font-medium mb-1">{UI_LABELS.name}</span>
                <span className="text-sm text-gray-900 font-medium">{selectedPickup.owner_name}</span>
              </div>
              <div className="flex flex-col py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600 font-medium mb-1">Telefon</span>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-900 font-medium">
                    {selectedPickup.contact_phone || 'Ej angivet'}
                  </span>
                  {selectedPickup.contact_phone && (
                    <button
                      onClick={() => {
                        window.open(`tel:${selectedPickup.contact_phone}`, '_self');
                      }}
                      className="ml-2 px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                      aria-label="Ring kund"
                    >
                      📞 Ring
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-col py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600 font-medium mb-1">{UI_LABELS.address}</span>
                <span className="text-sm text-gray-900 font-medium">{selectedPickup.pickup_address}</span>
              </div>
              <div className="flex flex-col py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600 font-medium mb-1">{UI_LABELS.status}</span>
                <span className="text-sm text-gray-900 font-medium">{getStatusText(selectedPickup.pickup_status)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Assigned status - needs acceptance */}
            {selectedPickup.pickup_status === 'assigned' && selectedPickup.assigned_driver_id === currentDriver?.id && (
              <div className="flex gap-3 items-center">
                <button 
                  className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
                  onClick={() => handleAcceptPickup(selectedPickup.pickup_order_id || selectedPickup.id)}
                >
                  ✓ Acceptera uppdrag
                </button>
                <button 
                  className="flex-1 px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
                  onClick={() => handleRejectPickup(selectedPickup.pickup_order_id || selectedPickup.id)}
                >
                  ✗ Avvisa uppdrag
                </button>
              </div>
            )}

            {/* Accepted status - can start pickup */}
            {selectedPickup.pickup_status === 'pickup_accepted' && selectedPickup.assigned_driver_id === currentDriver?.id && (
              <div className="flex gap-3 items-center">
                <button 
                  className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                  onClick={() => handleStartPickup(selectedPickup.pickup_order_id || selectedPickup.id)}
                >
                  🚀 {UI_LABELS.startPickup}
                </button>
                <button 
                  className="flex-1 px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
                  onClick={() => handleRejectPickup(selectedPickup.pickup_order_id || selectedPickup.id)}
                >
                  Avvisa uppdrag
                </button>
              </div>
            )}

            {/* Scheduled status - can start directly */}
            {(selectedPickup.pickup_status === 'pending' || selectedPickup.pickup_status === 'scheduled') && selectedPickup.assigned_driver_id === currentDriver?.id && (
              <div className="flex gap-3 items-center">
                <button 
                  className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                  onClick={() => handleStartPickup(selectedPickup.pickup_order_id || selectedPickup.id)}
                >
                  {UI_LABELS.startPickup}
                </button>
                <button 
                  className="flex-1 px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
                  onClick={() => handleRejectPickup(selectedPickup.pickup_order_id || selectedPickup.id)}
                >
                  Avvisa uppdrag
                </button>
              </div>
            )}
            
            {/* In progress status - can complete */}
            {selectedPickup.pickup_status === 'in_progress' && (
              <div className="flex flex-col gap-2 items-center">
                <button 
                  className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
                  onClick={() => handleCompletePickup(selectedPickup.pickup_order_id || selectedPickup.id)}
                >
                  {UI_LABELS.completePickup}
                </button>
                <button 
                  className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
                  onClick={() => handleRejectPickup(selectedPickup.pickup_order_id || selectedPickup.id)}
                >
                  Avvisa uppdrag
                </button>
              </div>
            )}
            
            <div className="flex justify-center pt-2">
              <button 
                className="px-8 py-3 bg-gray-600 text-white rounded-lg text-base font-semibold hover:bg-gray-700 transition-colors flex items-center gap-2 shadow-lg"
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
      <DetailView />
      {/* Navigation Indicator */}
      <div className="fixed bottom-3 left-1/2 transform -translate-x-1/2 w-33 h-1 bg-gray-900 rounded-full opacity-80"></div>
    </div>
  );
};

export default PantaBilenDriverApp;