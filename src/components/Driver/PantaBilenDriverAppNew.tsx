import React, { useState, useEffect } from 'react';
import { useDriverIntegration } from '@/hooks/useDriverIntegration';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, RefreshCw, Calendar, MapPin, Car, Phone, Euro } from 'lucide-react';
import { toast } from 'sonner';
import { RescheduleModal } from './RescheduleModal';

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
    refreshAllPickupData,
    updateDriverStatus
  } = useDriverIntegration();

  // Local state
  const [activeTab, setActiveTab] = useState('available');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedPickupForReschedule, setSelectedPickupForReschedule] = useState<any>(null);

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

  // Self-assignment handler
  const handleSelfAssign = async (pickupOrderId: string, customerName: string) => {
    setIsAssigning(true);
    try {
      await handleSelfAssignment(pickupOrderId, customerName);
      toast.success(`Du har tilldelats upphämtning för ${customerName}!`);
      // Switch to "My Assignments" tab to show the newly assigned pickup
      setActiveTab('assigned');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Kunde inte tilldela upphämtning';
      toast.error(errorMessage);
    } finally {
      setIsAssigning(false);
    }
  };

  // Status update handler  
  const handleStatusUpdate = async (pickupOrderId: string, newStatus: string, notes: string) => {
    setIsUpdating(true);
    try {
      // Use the specific method from handleStatusTransition object based on status
      switch (newStatus) {
        case 'in_progress':
          await updatePickupStatus.startPickup(pickupOrderId, currentDriver?.full_name || 'Driver');
          break;
        case 'completed':
          await updatePickupStatus.completePickup(pickupOrderId, currentDriver?.full_name || 'Driver');
          break;
        case 'scheduled':
          await updatePickupStatus.schedulePickup(pickupOrderId, notes);
          break;
        default:
          // For other statuses, use the base updatePickupStatus function
          const { updatePickupStatus: baseUpdateFn } = await import('@/utils/pickupStatusUtils');
          await baseUpdateFn(pickupOrderId, newStatus, notes);
      }
      
      let successMessage = '';
      switch (newStatus) {
        case 'in_progress':
          successMessage = 'Upphämtning påbörjad!';
          break;
        case 'completed':
          successMessage = 'Upphämtning slutförd!';
          break;
        case 'scheduled':
          successMessage = 'Upphämtning avbokad och returnerad till tillgängliga';
          break;
        default:
          successMessage = 'Status uppdaterad!';
      }
      
      toast.success(successMessage);
      
      // Refresh pickup data to reflect status changes
      await refreshAllPickupData();
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
  const AvailablePickupCard = ({ pickup }: { pickup: any }) => (
    <Card className="mb-3">
      <CardContent className="p-4">
        {/* Header with customer info */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-gray-900">{pickup.owner_name}</h3>
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
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-3 h-3 mr-2" />
            <span>{pickup.pickup_address}</span>
          </div>
          {pickup.scheduled_pickup_date && (
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-3 h-3 mr-2" />
              <span>{formatDate(pickup.scheduled_pickup_date)}</span>
            </div>
          )}
          {pickup.final_price && (
            <div className="flex items-center text-sm text-green-600">
              <Euro className="w-3 h-3 mr-2" />
              <span>{pickup.final_price} SEK</span>
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

  // Assigned Pickup Card Component
  const AssignedPickupCard = ({ pickup }: { pickup: any }) => {
    // Debug: Log the pickup data to see what's available
    console.log('🔍 ASSIGNED PICKUP DATA:', pickup);
    
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
                : "bg-green-100 text-green-800"
            }>
              {pickup.pickup_status === 'in_progress' ? 'Pågående upphämtning' : 'Tilldelad till dig'}
            </Badge>
          </div>
          
          {/* Customer and pickup info */}
          <div className="space-y-2 mb-4">
            {/* Customer phone if missing from header */}
            {!pickup.contact_phone && pickup.phone && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-3 h-3 mr-2" />
                <span>{pickup.phone}</span>
              </div>
            )}
            
            {/* Pickup address */}
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-3 h-3 mr-2" />
              <span>{pickup.pickup_address || pickup.address || 'Adress saknas'}</span>
            </div>
            
            {/* Car info */}
            <div className="flex items-center text-sm text-gray-600">
              <Car className="w-3 h-3 mr-2" />
              <span>{pickup.car_brand} {pickup.car_model} ({pickup.car_registration_number})</span>
            </div>
            
            {/* Scheduled date */}
            {pickup.scheduled_pickup_date && (
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-3 h-3 mr-2" />
                <span>{formatDate(pickup.scheduled_pickup_date)}</span>
              </div>
            )}
            
            {/* Price */}
            {pickup.final_price && (
              <div className="flex items-center text-sm text-green-600">
                <Euro className="w-3 h-3 mr-2" />
                <span>{pickup.final_price} SEK</span>
              </div>
            )}
          </div>
          
          {/* Status-based action buttons */}
          <div className="flex flex-col gap-2">
            {(pickup.pickup_status === 'assigned' || (pickup.pickup_status === 'scheduled' && pickup.driver_id)) && (
              <>
                {pickup.pickup_status === 'assigned' && (
                  <Button
                    onClick={() => handleStatusUpdate(pickup.pickup_order_id, 'in_progress', 'Påbörjad av förare')}
                    disabled={isUpdating}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    {isUpdating ? 'Startar...' : '🚀 STARTA'}
                  </Button>
                )}
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
            {pickup.pickup_status === 'in_progress' && (
              <Button
                onClick={() => handleStatusUpdate(pickup.pickup_order_id, 'completed', 'Slutförd av förare')}
                disabled={isUpdating}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {isUpdating ? 'Slutför...' : '✅ SLUTFÖR'}
              </Button>
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
                onClick={refreshAllPickupData}
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