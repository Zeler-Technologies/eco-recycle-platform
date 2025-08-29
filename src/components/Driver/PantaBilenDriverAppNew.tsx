import React, { useState, useEffect } from 'react';
import { useDriverIntegration } from '@/hooks/useDriverIntegration';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, RefreshCw, Calendar, MapPin, Car, Phone, Euro, Camera, Navigation, Clock, CheckCircle, TrendingUp, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { RescheduleModal } from './RescheduleModal';
import { supabase } from '@/integrations/supabase/client';

const PantaBilenDriverAppNew = () => {
  const { user, logout } = useAuth();
  
  const { 
    availablePickups,
    assignedPickups,
    driver: currentDriver, 
    loading, 
    loadingAvailable,
    loadingAssigned,
    error,
    handleSelfAssignment,
    updatePickupStatus,
    refreshAllPickupData
  } = useDriverIntegration();

  // Local state
  const [activeTab, setActiveTab] = useState('available');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedPickupForReschedule, setSelectedPickupForReschedule] = useState<any>(null);
  const [driverStats, setDriverStats] = useState({
    todayCompleted: 0,
    todayEarnings: 0,
    activePickup: null as any
  });
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Helper functions
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
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDriverStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-orange-500';
      case 'offline': return 'bg-red-500';
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

  // Distance calculation helper
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 10) / 10; // Round to 1 decimal
  };

  // Driver status update handler
  const updateDriverStatus = async (newStatus: string) => {
    if (!currentDriver?.id) return;
    
    setIsUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ 
          current_status: newStatus,
          driver_status: newStatus,
          last_activity_update: new Date().toISOString()
        })
        .eq('id', currentDriver.id);

      if (error) throw error;
      
      toast.success(`Status ändrad till: ${getDriverStatusText(newStatus)}`);
      // Refresh driver data
      await refreshAllPickupData();
    } catch (error) {
      toast.error('Kunde inte uppdatera status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Load driver stats
  const loadDriverStats = async () => {
    if (!currentDriver?.id) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's completed pickups
      const { data: completedPickups, error: completedError } = await supabase
        .from('pickup_orders')
        .select('final_price')
        .eq('driver_id', currentDriver.id)
        .eq('status', 'completed')
        .gte('actual_pickup_date', today);

      if (completedError) throw completedError;

      // Get current active pickup
      const { data: activePickup, error: activeError } = await supabase
        .from('pickup_orders')
        .select(`
          *,
          customer_requests!inner(owner_name, pickup_address)
        `)
        .eq('assigned_driver_id', currentDriver.id)
        .in('status', ['assigned', 'in_progress'])
        .limit(1)
        .single();

      setDriverStats({
        todayCompleted: completedPickups?.length || 0,
        todayEarnings: completedPickups?.reduce((sum, p) => sum + (p.final_price || 0), 0) || 0,
        activePickup: activePickup || null
      });
    } catch (error) {
      console.error('Error loading driver stats:', error);
    }
  };

  // Photo upload handler
  const handlePhotoUpload = async (pickupOrderId: string, file: File) => {
    setUploadingPhoto(true);
    try {
      const fileName = `pickup-${pickupOrderId}-${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('pickup-photos')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = await supabase.storage
        .from('pickup-photos')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      toast.error('Kunde inte ladda upp foto');
      throw error;
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Self-assignment handler
  const handleSelfAssign = async (pickupOrderId: string, customerName: string) => {
    setIsAssigning(true);
    try {
      await handleSelfAssignment(pickupOrderId, customerName);
      toast.success(`Du har tilldelats upphämtning för ${customerName}!`);
      // Switch to "My Assignments" tab to show the newly assigned pickup
      setActiveTab('assigned');
      loadDriverStats(); // Refresh stats
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Kunde inte tilldela upphämtning';
      toast.error(errorMessage);
    } finally {
      setIsAssigning(false);
    }
  };

  // Enhanced status update handler  
  const handleStatusUpdate = async (pickupOrderId: string, newStatus: string, notes: string, photos?: string[]) => {
    setIsUpdating(true);
    try {
      // Use the specific method from handleStatusTransition object based on status
      switch (newStatus) {
        case 'in_transit':
          await updatePickupStatus.startPickup(pickupOrderId, currentDriver?.full_name || 'Driver');
          break;
        case 'in_progress':
          await updatePickupStatus.startPickup(pickupOrderId, currentDriver?.full_name || 'Driver');
          break;
        case 'completed':
          await updatePickupStatus.completePickup(pickupOrderId, currentDriver?.full_name || 'Driver', photos);
          break;
        case 'assigned':
          await updatePickupStatus.assignToDriver(pickupOrderId, currentDriver?.full_name || 'Driver');
          break;
        case 'scheduled':
          await updatePickupStatus.schedulePickup(pickupOrderId, notes);
          break;
        default:
          // For other statuses, use the base updatePickupStatus function
          const { updatePickupStatus: baseUpdateFn } = await import('@/utils/pickupStatusUtils');
          await baseUpdateFn(pickupOrderId, newStatus, notes, photos);
      }
      
      let successMessage = '';
      switch (newStatus) {
        case 'in_transit':
          successMessage = 'På väg till upphämtning!';
          break;
        case 'in_progress':
          successMessage = 'Upphämtning påbörjad!';
          break;
        case 'completed':
          successMessage = 'Upphämtning slutförd!';
          break;
        case 'assigned':
          successMessage = 'Upphämtning ångrad - status återställd till tilldelad';
          break;
        case 'scheduled':
          successMessage = 'Upphämtning avbokad och returnerad till tillgängliga';
          break;
        default:
          successMessage = 'Status uppdaterad!';
      }
      
      toast.success(successMessage);
      
      // Refresh pickup data and stats to reflect status changes
      await refreshAllPickupData();
      loadDriverStats();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Kunde inte uppdatera status';
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  // Reschedule handlers
  const handleOpenReschedule = (pickup: any) => {
    setSelectedPickupForReschedule(pickup);
    setRescheduleModalOpen(true);
  };

  const handleRescheduleConfirm = async (newDate: string, notes: string) => {
    if (!selectedPickupForReschedule) return;
    
    try {
      // Update the pickup with new scheduled date and status
      await updatePickupStatus.schedulePickup(selectedPickupForReschedule.pickup_order_id, `${notes} - Rescheduled to: ${newDate}`);
      toast.success('Upphämtning omschemalagd!');
      setRescheduleModalOpen(false);
      setSelectedPickupForReschedule(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Kunde inte omschemalägg upphämtning';
      toast.error(errorMessage);
    }
  };

  // Driver Status Toggle Component
  const DriverStatusToggle = () => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${getDriverStatusColor(currentDriver?.current_status || 'offline')}`} />
            <div>
              <p className="font-medium text-gray-900">
                {getDriverStatusText(currentDriver?.current_status || 'offline')}
              </p>
              <p className="text-xs text-gray-500">Klicka för att ändra status</p>
            </div>
          </div>
          <div className="flex gap-2">
            {['available', 'busy', 'offline'].map((status) => (
              <Button
                key={status}
                size="sm"
                variant={currentDriver?.current_status === status ? "default" : "outline"}
                onClick={() => updateDriverStatus(status)}
                disabled={isUpdatingStatus}
                className="text-xs px-3"
              >
                {getDriverStatusText(status)}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Driver Stats Component
  const DriverStats = () => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Dagens statistik</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-lg font-bold text-green-600">{driverStats.todayCompleted}</p>
            <p className="text-xs text-gray-500">Klara</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Euro className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-lg font-bold text-blue-600">{driverStats.todayEarnings}</p>
            <p className="text-xs text-gray-500">SEK</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Activity className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-lg font-bold text-orange-600">
              {driverStats.activePickup ? '1' : '0'}
            </p>
            <p className="text-xs text-gray-500">Aktiv</p>
          </div>
        </div>
        {driverStats.activePickup && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm font-medium text-gray-900">Aktiv upphämtning:</p>
            <p className="text-sm text-gray-600">
              {driverStats.activePickup.customer_requests?.owner_name} - {driverStats.activePickup.customer_requests?.pickup_address}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Tab Navigation Component
  const TabNavigation = () => (
    <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
      <button
        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
          activeTab === 'available'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }`}
        onClick={() => setActiveTab('available')}
      >
        📋 Tillgängliga upphämtningar
        {availablePickups.length > 0 && (
          <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
            {availablePickups.length}
          </span>
        )}
      </button>
      <button
        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
          activeTab === 'assigned'
            ? 'bg-white text-green-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }`}
        onClick={() => setActiveTab('assigned')}
      >
        ✅ Mina upphämtningar
        {assignedPickups.length > 0 && (
          <span className="ml-2 bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">
            {assignedPickups.length}
          </span>
        )}
      </button>
    </div>
  );

  // Available Pickup Card Component
  const AvailablePickupCard = ({ pickup }: { pickup: any }) => {
    const distance = currentDriver?.current_latitude && currentDriver?.current_longitude && 
                    pickup.pickup_latitude && pickup.pickup_longitude
      ? calculateDistance(
          currentDriver.current_latitude,
          currentDriver.current_longitude,
          pickup.pickup_latitude,
          pickup.pickup_longitude
        )
      : null;

    return (
      <Card className="mb-3">
        <CardContent className="p-4">
          {/* Header with customer info */}
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-gray-900">{pickup.owner_name || 'Namn saknas'}</h3>
              {pickup.contact_phone && (
                <a 
                  href={`tel:${pickup.contact_phone}`}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800 mt-1"
                >
                  <Phone className="w-3 h-3 mr-1" />
                  {pickup.contact_phone}
                </a>
              )}
            </div>
            <Badge className="bg-blue-100 text-blue-800">
              Tillgänglig
            </Badge>
          </div>
          
          {/* Car and location info */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <Car className="w-3 h-3 mr-2" />
              <span>{pickup.car_brand} {pickup.car_model} ({pickup.car_registration_number})</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-3 h-3 mr-2" />
                <span className="flex-1">{pickup.pickup_address}</span>
              </div>
              {pickup.pickup_address && (
                <a 
                  href={`https://maps.google.com/?q=${encodeURIComponent(pickup.pickup_address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <Navigation className="w-4 h-4" />
                </a>
              )}
            </div>
            
            {distance && (
              <div className="flex items-center text-sm text-purple-600">
                <MapPin className="w-3 h-3 mr-2" />
                <span>Avstånd: {distance} km</span>
              </div>
            )}
            
            {pickup.scheduled_pickup_date && (
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-3 h-3 mr-2" />
                <span>{formatDate(pickup.scheduled_pickup_date)}</span>
              </div>
            )}
            
            {pickup.quote_amount && (
              <div className="flex items-center text-sm text-green-600">
                <Euro className="w-3 h-3 mr-2" />
                <span>{pickup.quote_amount} SEK</span>
              </div>
            )}

            {pickup.special_instructions && (
              <div className="bg-yellow-50 p-2 rounded text-sm">
                <p className="font-medium text-yellow-800">Special instruktioner:</p>
                <p className="text-yellow-700">{pickup.special_instructions}</p>
              </div>
            )}
          </div>
          
          {/* Action button */}
          <Button
            onClick={() => handleSelfAssign(pickup.pickup_order_id, pickup.owner_name)}
            disabled={isAssigning}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {isAssigning ? 'Tilldelar...' : '✋ TA UPPHÄMTNING'}
          </Button>
        </CardContent>
      </Card>
    );
  };

  // Assigned Pickup Card Component
  const AssignedPickupCard = ({ pickup }: { pickup: any }) => {
    const distance = currentDriver?.current_latitude && currentDriver?.current_longitude && 
                    pickup.pickup_latitude && pickup.pickup_longitude
      ? calculateDistance(
          currentDriver.current_latitude,
          currentDriver.current_longitude,
          pickup.pickup_latitude,
          pickup.pickup_longitude
        )
      : null;

    const handlePhotoUploadClick = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          try {
            const photoUrl = await handlePhotoUpload(pickup.pickup_order_id, file);
            await handleStatusUpdate(pickup.pickup_order_id, 'completed', 'Slutförd av förare med foto', [photoUrl]);
          } catch (error) {
            console.error('Photo upload failed:', error);
          }
        }
      };
      input.click();
    };
    
    return (
      <Card className="mb-3">
        <CardContent className="p-4">
          {/* Header with customer info */}
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-gray-900">
                {pickup.owner_name || 'Namn saknas'}
              </h3>
              {pickup.contact_phone && (
                <a 
                  href={`tel:${pickup.contact_phone}`}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800 mt-1"
                >
                  <Phone className="w-3 h-3 mr-1" />
                  {pickup.contact_phone}
                </a>
              )}
            </div>
            <Badge className={
              pickup.pickup_status === 'in_progress' 
                ? "bg-orange-100 text-orange-800" 
                : pickup.pickup_status === 'in_transit'
                ? "bg-blue-100 text-blue-800"
                : "bg-green-100 text-green-800"
            }>
              {pickup.pickup_status === 'in_progress' ? 'Pågående upphämtning' : 
               pickup.pickup_status === 'in_transit' ? 'På väg' :
               'Tilldelad till dig'}
            </Badge>
          </div>
          
          {/* Customer and pickup info */}
          <div className="space-y-2 mb-4">
            {/* Pickup address with navigation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-3 h-3 mr-2" />
                <span className="flex-1">{pickup.pickup_address || 'Adress saknas'}</span>
              </div>
              {pickup.pickup_address && (
                <a 
                  href={`https://maps.google.com/?q=${encodeURIComponent(pickup.pickup_address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <Navigation className="w-4 h-4" />
                </a>
              )}
            </div>
            
            {distance && (
              <div className="flex items-center text-sm text-purple-600">
                <MapPin className="w-3 h-3 mr-2" />
                <span>Avstånd: {distance} km</span>
              </div>
            )}
            
            {/* Car info */}
            <div className="flex items-center text-sm text-gray-600">
              <Car className="w-3 h-3 mr-2" />
              <span>{pickup.car_brand} {pickup.car_model} ({pickup.car_registration_number})</span>
            </div>
            
            {/* Scheduled date with time */}
            {pickup.scheduled_pickup_date && (
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-3 h-3 mr-2" />
                <span>{formatDate(pickup.scheduled_pickup_date)}</span>
                {pickup.scheduled_pickup_date.includes('T') && (
                  <span className="ml-2 text-xs">
                    {new Date(pickup.scheduled_pickup_date).toLocaleTimeString('sv-SE', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                )}
              </div>
            )}
            
            {/* Price */}
            {(pickup.quote_amount || pickup.final_price) && (
              <div className="flex items-center text-sm text-green-600">
                <Euro className="w-3 h-3 mr-2" />
                <span>{pickup.quote_amount || pickup.final_price} SEK</span>
              </div>
            )}

            {/* Special instructions */}
            {pickup.special_instructions && (
              <div className="bg-yellow-50 p-2 rounded text-sm">
                <p className="font-medium text-yellow-800">Special instruktioner:</p>
                <p className="text-yellow-700">{pickup.special_instructions}</p>
              </div>
            )}
          </div>
          
          {/* Enhanced Status-based action buttons */}
          <div className="flex flex-col gap-2">
            {pickup.pickup_status === 'assigned' && (
              <>
                <Button
                  onClick={() => handleStatusUpdate(pickup.pickup_order_id, 'in_transit', 'På väg till kund')}
                  disabled={isUpdating}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isUpdating ? 'Startar...' : '🚗 PÅ VÄG'}
                </Button>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleOpenReschedule(pickup)}
                    disabled={isUpdating}
                    variant="outline"
                    className="flex-1 border-orange-300 text-orange-600 hover:bg-orange-50"
                  >
                    📅 OMSCHEMALÄGG
                  </Button>
                  <Button
                    onClick={() => handleStatusUpdate(pickup.pickup_order_id, 'scheduled', 'Avvisad av förare - tillbaka till tillgängliga')}
                    disabled={isUpdating}
                    variant="outline"
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                  >
                    ❌ AVVISA
                  </Button>
                </div>
              </>
            )}

            {pickup.pickup_status === 'in_transit' && (
              <>
                <Button
                  onClick={() => handleStatusUpdate(pickup.pickup_order_id, 'in_progress', 'Framme hos kund, lastar fordon')}
                  disabled={isUpdating}
                  className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
                >
                  {isUpdating ? 'Uppdaterar...' : '📍 FRAMME'}
                </Button>
                <Button
                  onClick={() => handleStatusUpdate(pickup.pickup_order_id, 'assigned', 'Tillbaka till tilldelad status')}
                  disabled={isUpdating}
                  variant="outline"
                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  ↩️ TILLBAKA
                </Button>
              </>
            )}

            {pickup.pickup_status === 'in_progress' && (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleStatusUpdate(pickup.pickup_order_id, 'completed', 'Slutförd av förare')}
                    disabled={isUpdating}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    {isUpdating ? 'Slutför...' : '✅ KLAR'}
                  </Button>
                  <Button
                    onClick={handlePhotoUploadClick}
                    disabled={uploadingPhoto}
                    variant="outline"
                    className="border-green-300 text-green-600 hover:bg-green-50"
                  >
                    {uploadingPhoto ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Camera className="w-4 h-4 mr-1" />
                        FOTO
                      </>
                    )}
                  </Button>
                </div>
                <Button
                  onClick={() => handleStatusUpdate(pickup.pickup_order_id, 'in_transit', 'Tillbaka till på väg')}
                  disabled={isUpdating}
                  variant="outline"
                  className="border-orange-300 text-orange-600 hover:bg-orange-50"
                >
                  ↩️ TILLBAKA TILL PÅ VÄG
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Loading and error states
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

  if (error && !currentDriver) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-600 mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ingen förare hittades</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()}
            className="mr-2"
          >
            Försök igen
          </Button>
          <Button 
            onClick={logout}
            variant="outline"
          >
            Logga ut
          </Button>
        </div>
      </div>
    );
  }

  // Load stats on component mount and driver change
  useEffect(() => {
    if (currentDriver?.id) {
      loadDriverStats();
    }
  }, [currentDriver?.id]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Förare Panel</h1>
              <p className="text-sm text-gray-600">
                {currentDriver?.full_name} • Klockan {getCurrentTime()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  refreshAllPickupData();
                  loadDriverStats();
                }}
                disabled={loadingAvailable || loadingAssigned}
                variant="ghost"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 ${(loadingAvailable || loadingAssigned) ? 'animate-spin' : ''}`} />
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

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Driver Status Toggle */}
        <DriverStatusToggle />
        
        {/* Driver Stats */}
        <DriverStats />
        
        {/* Tab Navigation */}
        <TabNavigation />

        {/* Tab Content */}
        {activeTab === 'available' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Tillgängliga upphämtningar
              </h2>
              {loadingAvailable && (
                <div className="text-sm text-gray-500">Laddar...</div>
              )}
            </div>
            
            {availablePickups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📭</div>
                <p className="font-medium">Inga tillgängliga upphämtningar just nu</p>
                <p className="text-sm">Nya upphämtningar dyker upp här automatiskt</p>
              </div>
            ) : (
              <div>
                {availablePickups.map((pickup) => (
                  <AvailablePickupCard
                    key={pickup.pickup_order_id}
                    pickup={pickup}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'assigned' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Mina upphämtningar
              </h2>
              {loadingAssigned && (
                <div className="text-sm text-gray-500">Laddar...</div>
              )}
            </div>
            
            {assignedPickups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">✋</div>
                <p className="font-medium">Du har inga tilldelade upphämtningar</p>
                <p className="text-sm">Gå till "Tillgängliga" för att välja upphämtningar</p>
              </div>
            ) : (
              <div>
                {assignedPickups.map((pickup) => (
                  <AssignedPickupCard
                    key={pickup.pickup_order_id}
                    pickup={pickup}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      <RescheduleModal
        isOpen={rescheduleModalOpen}
        onClose={() => {
          setRescheduleModalOpen(false);
          setSelectedPickupForReschedule(null);
        }}
        onConfirm={handleRescheduleConfirm}
        pickup={selectedPickupForReschedule}
        isLoading={isUpdating}
      />
    </div>
  );
};

export default PantaBilenDriverAppNew;