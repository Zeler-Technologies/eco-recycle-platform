
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, MapPin, Clock, User, Car } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Driver {
  id: string;
  full_name: string;
  phone_number: string;
  vehicle_type?: string;
  driver_status: string;
  current_latitude?: number;
  current_longitude?: number;
}

interface CustomerRequest {
  pickup_order_id: string;
  customer_request_id: string;
  owner_name: string;
  pickup_address: string;
  car_brand: string;
  car_model: string;
  status: string;
  quote_amount?: number;
  contact_phone?: string;
  car_registration?: string;
}

interface DriverAssignmentModalProps {
  driver: Driver;
  onClose: () => void;
  onSuccess: () => void;
}

const DriverAssignmentModal: React.FC<DriverAssignmentModalProps> = ({ driver, onClose, onSuccess }) => {
  const [availableRequests, setAvailableRequests] = useState<CustomerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignmentLoading, setAssignmentLoading] = useState<string | null>(null);
  const [assignmentRole, setAssignmentRole] = useState<string>('primary');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailableRequests();
  }, []);

  const fetchAvailableRequests = async () => {
    setLoading(true);
    setErrorMsg(null);
    console.info('Fetching available pickup requests using unified view', { driverId: driver.id });
    try {
      console.log('🟢 FETCHING FROM UNIFIED VIEW FOR DRIVER:', driver.id);
      
      // Use unified view to get available pickups
      const { data, error } = await supabase
        .from('v_pickup_status_unified')
        .select(`
          pickup_order_id,
          customer_request_id,
          car_registration_number,
          car_brand,
          car_model,
          owner_name,
          pickup_address,
          pickup_status,
          status_display_text,
          scheduled_pickup_date,
          driver_id,
          driver_name,
          tenant_id,
          quote_amount,
          contact_phone
        `)
        .eq('pickup_status', 'scheduled')
        .is('driver_id', null)
        .order('scheduled_pickup_date', { ascending: true })
        .limit(50);

      console.log('🟢 UNIFIED VIEW RESULTS:', { data, error });

      if (error) {
        console.error('🔴 UNIFIED VIEW QUERY ERROR:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      const mapped = (data ?? []).map((d: any) => ({
        pickup_order_id: d.pickup_order_id,
        customer_request_id: d.customer_request_id,
        owner_name: d.owner_name || 'Unknown',
        pickup_address: d.pickup_address || 'Unknown',
        car_brand: d.car_brand || 'Unknown',
        car_model: d.car_model || 'Unknown',
        status: d.pickup_status,
        quote_amount: d.quote_amount,
        contact_phone: d.contact_phone,
        car_registration: d.car_registration_number
      }));

      console.log('🟢 MAPPED UNIFIED REQUESTS:', mapped);
      setAvailableRequests(mapped);
    } catch (error) {
      const msg =
        (error as any)?.message ||
        (error as any)?.error?.message ||
        (typeof error === 'string' ? error : 'Unknown error');
      console.error('Failed to load available requests via RPC', {
        driverId: driver.id,
        errorMessage: msg,
        error,
      });
      setErrorMsg('Kunde inte ladda lediga uppdrag. Behörighet eller nätverksfel.');
      toast.error('Failed to load available requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRequest = async (pickupOrderId: string) => {
    setAssignmentLoading(pickupOrderId);
    console.info('Assigning driver using unified approach', { driverId: driver.id, pickupOrderId });
    try {
      // Step 1: Create driver assignment record
      const { error: assignmentError } = await supabase
        .from('driver_assignments')
        .insert({
          driver_id: driver.id,
          pickup_order_id: pickupOrderId,
          status: 'scheduled',
          assigned_at: new Date().toISOString(),
          is_active: true,
          notes: `Assigned via admin interface (role: ${assignmentRole})`
        });
      
      if (assignmentError) {
        console.error('🔴 ASSIGNMENT ERROR:', assignmentError);
        throw assignmentError;
      }

      // Step 2: Update pickup status using unified function
      const { error: statusError } = await supabase.rpc('update_pickup_status_unified', {
        pickup_id: pickupOrderId,
        new_status: 'assigned',
        driver_notes_param: `Assigned to driver ${driver.full_name} via admin interface`,
        completion_photos_param: null
      });
      
      if (statusError) {
        console.error('🔴 STATUS UPDATE ERROR:', statusError);
        throw statusError;
      }

      console.log('🟢 DRIVER ASSIGNMENT SUCCESSFUL');
      toast.success('Driver assigned successfully');
      onSuccess();
    } catch (error) {
      const e: any = error;
      const msg = e?.message || e?.error?.message || (typeof error === 'string' ? error : 'Unknown error');
      console.error('Failed to assign driver using unified approach', {
        driverId: driver.id,
        pickupOrderId,
        code: e?.code,
        details: e?.details,
        hint: e?.hint,
        message: msg,
        error: e,
      });
      toast.error('Failed to assign driver');
    } finally {
      setAssignmentLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-status-pending text-white';
      case 'accepted': return 'bg-status-processing text-white';
      case 'scheduled': return 'bg-status-processing text-white';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-admin-primary">Assign Driver to Request</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Driver: {driver.full_name} ({driver.vehicle_type || 'Unknown vehicle'})
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          {/* Assignment Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Assignment Role</label>
            <select
              value={assignmentRole}
              onChange={(e) => setAssignmentRole(e.target.value)}
              className="w-full max-w-xs px-3 py-2 border rounded-md"
            >
              <option value="primary">Primary Driver</option>
              <option value="backup">Backup Driver</option>
              <option value="helper">Helper</option>
            </select>
          </div>

          {/* Available Requests */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Available Requests</h3>
            
            {loading ? (
              <div className="text-center py-8">Loading available requests...</div>
            ) : errorMsg ? (
              <div className="text-center py-8 text-destructive">
                {errorMsg}
              </div>
            ) : availableRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No unassigned requests available at the moment
              </div>
            ) : (
              <div className="space-y-3">
                {availableRequests.map((request) => (
                  <div key={request.customer_request_id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-admin-accent/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-admin-accent rounded-full">
                        <Car className="h-4 w-4 text-admin-primary" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-semibold">{request.owner_name}</h4>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Car className="h-3 w-3" />
                            {request.car_brand} {request.car_model}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {request.pickup_address}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Est. 15 min away
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => handleAssignRequest(request.pickup_order_id!)}
                        disabled={assignmentLoading === request.pickup_order_id}
                        className="bg-admin-primary hover:bg-admin-primary/90"
                      >
                        {assignmentLoading === request.pickup_order_id ? 'Assigning...' : 'Assign'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="flex justify-end mt-6 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverAssignmentModal;
