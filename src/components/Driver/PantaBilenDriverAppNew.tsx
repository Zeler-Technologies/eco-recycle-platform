import React, { useState, useEffect, useMemo } from 'react';
import { useDriverIntegration } from '@/hooks/useDriverIntegration';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LogOut, 
  CheckCircle, 
  MapPin, 
  Phone, 
  Car,
  Calendar,
  Clock,
  User
} from 'lucide-react';

const PantaBilenDriverAppNew = () => {
  const { user, logout } = useAuth();
  const { 
    pickups,
    driver: currentDriver, 
    loading, 
    error,
    updatePickupStatus,
    handleSelfAssignment
  } = useDriverIntegration();

  const [currentView, setCurrentView] = useState('list');
  const [currentFilter, setCurrentFilter] = useState('all');
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Filter pickups based on current filter
  const filteredPickups = useMemo(() => {
    if (!pickups) return [];
    
    let filtered = pickups;
    
    if (currentFilter !== 'all') {
      filtered = filtered.filter(order => {
        switch (currentFilter) {
          case 'assigned':
            return order.pickup_status === 'assigned';
          case 'in_progress':
            return order.pickup_status === 'in_progress';
          case 'completed':
            return order.pickup_status === 'completed';
          case 'available':
            return order.pickup_status === 'scheduled' && !order.assigned_driver_id;
          default:
            return true;
        }
      });
    }

    return filtered.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [pickups, currentFilter]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'scheduled': return 'Schemalagd';
      case 'assigned': return 'Tilldelad';
      case 'in_progress': return 'Pågående';
      case 'completed': return 'Slutförd';
      case 'cancelled': return 'Avbruten';
      default: return status;
    }
  };

  const getDriverStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-orange-100 text-orange-800';
      case 'break': return 'bg-yellow-100 text-yellow-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDriverStatusText = (status) => {
    switch (status) {
      case 'available': return 'Tillgänglig';
      case 'busy': return 'Upptagen';
      case 'break': return 'Paus';
      case 'offline': return 'Offline';
      default: return status;
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (currentDriver) {
      // TODO: Implement driver status update
      console.log('Driver status change:', newStatus);
      setShowStatusMenu(false);
    }
  };

  const handleStartPickup = async (pickupId) => {
    await updatePickupStatus.startPickup(pickupId, currentDriver?.full_name || 'Driver');
  };

  const handleCompletePickup = async (pickupId) => {
    await updatePickupStatus.completePickup(pickupId, currentDriver?.full_name || 'Driver');
  };

  const handleSelfAssign = async (pickupId) => {
    await handleSelfAssignment(pickupId, '');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laddar...</p>
        </div>
      </div>
    );
  }

  if (error || !currentDriver) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4 font-semibold">⚠️ {error || 'Ingen förare hittades'}</p>
          <p className="text-sm text-muted-foreground">
            {error ? 'Försök igen' : 'Kontakta administratör'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Auth Status Bar */}
      <Card className="m-4 border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-semibold text-green-900">
                  ✅ Inloggad
                </p>
                <p className="text-xs text-green-700">
                  {user?.email} | {currentDriver?.full_name}
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
              Logga ut
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Header */}
      <div className="bg-card border-b px-5 py-4 flex justify-between items-center">
        <h1 className="text-lg font-bold">PantaBilen Förare</h1>
        
        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex rounded-lg border bg-muted p-1">
            <button
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                currentView === 'list' 
                  ? 'bg-background shadow-sm' 
                  : 'text-muted-foreground'
              }`}
              onClick={() => setCurrentView('list')}
            >
              Lista
            </button>
            <button
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                currentView === 'map' 
                  ? 'bg-background shadow-sm' 
                  : 'text-muted-foreground'
              }`}
              onClick={() => setCurrentView('map')}
            >
              Karta
            </button>
          </div>
          
          {/* Status Dropdown */}
          <div className="relative">
            <button
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium"
              onClick={() => setShowStatusMenu(!showStatusMenu)}
            >
              <Badge className={getDriverStatusColor(currentDriver.current_status)}>
                {getDriverStatusText(currentDriver.current_status)}
              </Badge>
              <span>▼</span>
            </button>
            
            {showStatusMenu && (
              <div className="absolute top-full right-0 mt-1 bg-popover border rounded-lg shadow-lg min-w-36 z-50">
                <div className="p-1">
                  {['available', 'busy', 'break', 'offline'].map((status) => (
                    <button
                      key={status}
                      className="w-full text-left px-3 py-2 hover:bg-accent rounded text-sm"
                      onClick={() => handleStatusChange(status)}
                    >
                      <Badge className={getDriverStatusColor(status)}>
                        {getDriverStatusText(status)}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Driver Avatar */}
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
            {currentDriver.full_name?.charAt(0) || 'D'}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-card px-5 py-4 border-b">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-muted-foreground">
            {filteredPickups.length} uppdrag
          </span>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all', label: 'Alla' },
            { key: 'available', label: 'Tillgängliga' },
            { key: 'assigned', label: 'Tilldelade' },
            { key: 'in_progress', label: 'Pågående' },
            { key: 'completed', label: 'Slutförda' }
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`px-4 py-2 border rounded-full text-sm font-medium transition-all ${
                currentFilter === key 
                  ? 'bg-primary border-primary text-primary-foreground' 
                  : 'bg-background border-border text-foreground hover:border-primary/50'
              }`}
              onClick={() => setCurrentFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Pickup List */}
      <div className="p-4">
        {filteredPickups.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Inga uppdrag att visa</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPickups.map((pickup) => (
              <Card key={pickup.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {pickup.car_brand} {pickup.car_model}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {pickup.car_registration_number}
                      </p>
                    </div>
                    <Badge className={getStatusColor(pickup.pickup_status)}>
                      {getStatusText(pickup.pickup_status)}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{pickup.owner_name}</span>
                    </div>
                    
                    {pickup.contact_phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{pickup.contact_phone}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{pickup.pickup_address}</span>
                    </div>
                    
                    {pickup.scheduled_pickup_date && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(pickup.scheduled_pickup_date).toLocaleDateString('sv-SE')}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {pickup.pickup_status === 'scheduled' && !pickup.assigned_driver_id && (
                      <Button
                        onClick={() => handleSelfAssign(pickup.id)}
                        size="sm"
                        className="flex-1"
                      >
                        Ta uppdrag
                      </Button>
                    )}
                    
                    {pickup.pickup_status === 'assigned' && pickup.assigned_driver_id === currentDriver.id && (
                      <Button
                        onClick={() => handleStartPickup(pickup.id)}
                        size="sm"
                        className="flex-1"
                      >
                        Starta uppdrag
                      </Button>
                    )}
                    
                    {pickup.pickup_status === 'in_progress' && pickup.assigned_driver_id === currentDriver.id && (
                      <Button
                        onClick={() => handleCompletePickup(pickup.id)}
                        size="sm"
                        className="flex-1"
                        variant="default"
                      >
                        Slutför uppdrag
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
};

export default PantaBilenDriverAppNew;