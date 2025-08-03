
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
  id: string;
  owner_name: string;
  pickup_address: string;
  car_brand: string;
  car_model: string;
  status: string;
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

  useEffect(() => {
    fetchAvailableRequests();
  }, []);

  const fetchAvailableRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_requests')
        .select('*')
        .in('status', ['pending', 'accepted'])
        .is('scrapyard_id', null)
        .limit(10);

      if (error) throw error;
      setAvailableRequests(data || []);
    } catch (error) {
      console.error('Error fetching available requests:', error);
      toast.error('Failed to load available requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRequest = async (requestId: string) => {
    setAssignmentLoading(requestId);
    
    try {
      // Create driver assignment
      const { error: assignmentError } = await supabase
        .from('driver_assignments')
        .insert([{
          driver_id: driver.id,
          customer_request_id: requestId,
          assignment_type: 'pickup',
          role: assignmentRole,
          is_active: true
        }]);

      if (assignmentError) throw assignmentError;

      // Update customer request status
      const { error: requestError } = await supabase
        .from('customer_requests')
        .update({ status: 'assigned' })
        .eq('id', requestId);

      if (requestError) throw requestError;

      toast.success('Driver assigned successfully');
      onSuccess();
    } catch (error) {
      console.error('Error assigning driver:', error);
      toast.error('Failed to assign driver');
    } finally {
      setAssignmentLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-status-pending text-white';
      case 'accepted': return 'bg-status-processing text-white';
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
            ) : availableRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No unassigned requests available at the moment
              </div>
            ) : (
              <div className="space-y-3">
                {availableRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-admin-accent/20 transition-colors">
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
                        onClick={() => handleAssignRequest(request.id)}
                        disabled={assignmentLoading === request.id}
                        className="bg-admin-primary hover:bg-admin-primary/90"
                      >
                        {assignmentLoading === request.id ? 'Assigning...' : 'Assign'}
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
