import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/Common/LoadingSpinner";
import { 
  Car, 
  MapPin, 
  Clock, 
  X, 
  User, 
  Phone, 
  Truck
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PickupOrder {
  pickup_order_id: string;
  customer_request_id: string;
  owner_name: string;
  car_registration_number: string;
  car_brand: string;
  car_model: string;
  car_year: number;
  pickup_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  scheduled_pickup_date: string;
  status: string;
  final_price: number;
  created_at: string;
}

interface Driver {
  driver_id: string;
  full_name: string;
  phone_number: string;
  email: string;
  driver_status: string;
  vehicle_type: string;
  is_active: boolean;
  current_assignments_count: number;
}

interface PickupAssignmentModalProps {
  tenantId: number;
  specificDriverId?: string; // Optional: show only this specific driver
  onClose: () => void;
  onSuccess: () => void;
}

export function PickupAssignmentModal({ tenantId, specificDriverId, onClose, onSuccess }: PickupAssignmentModalProps) {
  const [pickups, setPickups] = useState<PickupOrder[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedPickup, setSelectedPickup] = useState<PickupOrder | null>(null);
  const [loadingPickups, setLoadingPickups] = useState(true);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [assigningDriver, setAssigningDriver] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load unassigned pickups
  useEffect(() => {
    loadPickups();
  }, [tenantId]);

  const loadPickups = async () => {
    try {
      setLoadingPickups(true);
      setError(null);
      
      const { data, error } = await supabase.rpc('get_unassigned_pickup_orders', {
        p_tenant_id: tenantId,
        p_limit: 50
      });

      if (error) throw error;

      setPickups(data || []);
    } catch (err) {
      console.error('Error loading pickups:', err);
      setError('Det gick inte att ladda otilldelade hämtningar');
    } finally {
      setLoadingPickups(false);
    }
  };

  const loadDrivers = async () => {
    try {
      setLoadingDrivers(true);
      
      if (specificDriverId) {
        // Load only the specific driver
        const { data, error } = await supabase
          .from('drivers')
          .select('id, full_name, phone_number, email, driver_status, vehicle_type, is_active')
          .eq('id', specificDriverId)
          .eq('is_active', true)
          .single();

        if (error) throw error;
        
        if (data) {
          // Map the response to match Driver interface
          const mappedDriver: Driver = {
            driver_id: data.id,
            full_name: data.full_name,
            phone_number: data.phone_number,
            email: data.email || '',
            driver_status: data.driver_status,
            vehicle_type: data.vehicle_type || '',
            is_active: data.is_active,
            current_assignments_count: 0
          };
          setDrivers([mappedDriver]);
        } else {
          setDrivers([]);
        }
      } else {
        // Load all available drivers for tenant
        const { data, error } = await supabase.rpc('get_available_drivers_for_tenant', {
          p_tenant_id: tenantId
        });

        if (error) throw error;
        setDrivers(data || []);
      }
    } catch (err) {
      console.error('Error loading drivers:', err);
      setError('Det gick inte att ladda förare');
    } finally {
      setLoadingDrivers(false);
    }
  };

  const handlePickupSelect = (pickup: PickupOrder) => {
    setSelectedPickup(pickup);
    setDrivers([]);
    loadDrivers();
  };

  const handleAssignDriver = async (driverId: string) => {
    if (!selectedPickup) return;

    try {
      setAssigningDriver(driverId);
      
      const { error } = await supabase.rpc('assign_driver_to_pickup', {
        p_driver_id: driverId,
        p_pickup_order_id: selectedPickup.pickup_order_id
      });

      if (error) throw error;

      toast({
        title: "Förare tilldelad framgångsrikt!",
        description: "Hämtningen har tilldelats föraren.",
        variant: "default",
      });

      // Reset selection and reload pickups
      setSelectedPickup(null);
      setDrivers([]);
      await loadPickups();
      
      onSuccess();
    } catch (err) {
      console.error('Error assigning driver:', err);
      toast({
        title: "Fel vid tilldelning",
        description: "Det gick inte att tilldela föraren till hämtningen.",
        variant: "destructive",
      });
    } finally {
      setAssigningDriver(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500 text-white';
      case 'scheduled': return 'bg-blue-500 text-white';
      case 'accepted': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getDriverStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-red-100 text-red-800';
      case 'break': return 'bg-yellow-100 text-yellow-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatRegistrationNumber = (regNumber: string) => {
    if (!regNumber) return 'Saknas reg.nr';
    return regNumber.length > 3 ? 
      `${regNumber.slice(0, 3)} ${regNumber.slice(3)}` : 
      regNumber;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Tilldela Förare till Hämtningar
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[70vh]">
          {/* Left Panel - Pickup Orders */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Car className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-medium">
                Otilldelade Hämtningar ({pickups.length})
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {loadingPickups ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                  <span className="ml-2">Laddar hämtningar...</span>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-600">
                  {error}
                </div>
              ) : pickups.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Car className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Inga otilldelade hämtningar för tillfället</p>
                </div>
              ) : (
                pickups.map((pickup) => (
                  <Card 
                    key={pickup.pickup_order_id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedPickup?.pickup_order_id === pickup.pickup_order_id 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : ''
                    }`}
                    onClick={() => handlePickupSelect(pickup)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">
                          {formatRegistrationNumber(pickup.car_registration_number)}
                        </h4>
                        <Badge className={getStatusColor(pickup.status)}>
                          {pickup.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-gray-600">{pickup.owner_name}</p>
                      <p className="text-sm">
                        {pickup.car_year} {pickup.car_brand} {pickup.car_model}
                      </p>
                      {pickup.pickup_address && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{pickup.pickup_address}</span>
                        </div>
                      )}
                      {pickup.scheduled_pickup_date && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(pickup.scheduled_pickup_date).toLocaleDateString('sv-SE')}</span>
                        </div>
                      )}
                      {pickup.final_price && (
                        <p className="text-sm font-medium text-green-600">
                          {pickup.final_price.toLocaleString('sv-SE')} kr
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Right Panel - Available Drivers */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-medium">
                {selectedPickup 
                  ? (specificDriverId ? 'Vald Förare' : 'Tillgängliga Förare')
                  : 'Välj en hämtning först'}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {!selectedPickup ? (
                <div className="text-center py-8 text-gray-500">
                  <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Välj en hämtning från listan till vänster för att se tillgängliga förare</p>
                </div>
              ) : selectedPickup && (
                <>
                  {/* Selected pickup info */}
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900">Vald hämtning:</h4>
                    <p className="text-sm text-blue-800">
                      {formatRegistrationNumber(selectedPickup.car_registration_number)} - {selectedPickup.owner_name}
                    </p>
                  </div>

                  {loadingDrivers ? (
                    <div className="flex items-center justify-center py-8">
                      <LoadingSpinner />
                      <span className="ml-2">Laddar förare...</span>
                    </div>
                  ) : drivers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>Inga tillgängliga förare för tillfället</p>
                    </div>
                  ) : (
                    drivers.map((driver) => (
                      <Card key={driver.driver_id} className="hover:shadow-md transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">{driver.full_name}</h4>
                            <div className="flex items-center gap-2">
                              <Badge className={getDriverStatusColor(driver.driver_status)}>
                                {driver.driver_status}
                              </Badge>
                              {driver.current_assignments_count > 0 && (
                                <Badge variant="outline">
                                  {driver.current_assignments_count} aktiva uppdrag
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="h-3 w-3" />
                              <span>{driver.phone_number}</span>
                            </div>
                            {driver.vehicle_type && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Truck className="h-3 w-3" />
                                <span>{driver.vehicle_type}</span>
                              </div>
                            )}
                          </div>

                          <Button 
                            onClick={() => handleAssignDriver(driver.driver_id)}
                            disabled={
                              driver.driver_status === 'offline' || 
                              assigningDriver === driver.driver_id
                            }
                            className="w-full"
                          >
                            {assigningDriver === driver.driver_id ? (
                              <>
                                <LoadingSpinner />
                                <span className="ml-2">Tilldelar...</span>
                              </>
                            ) : (
                              'Tilldela'
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}