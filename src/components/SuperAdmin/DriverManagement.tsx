
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Users, Plus, Search, MapPin, Clock, Phone, Car, UserCheck, UserX, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import DriverFormModal from './DriverFormModal';
import DriverAssignmentModal from './DriverAssignmentModal';
import DriverLocationMap from './DriverLocationMap';

interface Driver {
  id: string;
  full_name: string;
  phone_number: string;
  email?: string;
  vehicle_registration?: string;
  vehicle_type?: string;
  driver_status: string;
  last_location_update?: string;
  current_latitude?: number;
  current_longitude?: number;
  is_active: boolean;
  tenant_id: number;
  max_capacity_kg?: number;
}

interface DriverManagementProps {
  onBack: () => void;
}

const DriverManagement: React.FC<DriverManagementProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<number | null>(null);

  useEffect(() => {
    fetchDrivers();
  }, [selectedTenant]);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      let query = supabase.from('drivers' as any).select('*');
      
      // If not super admin, filter by user's tenant
      if (user?.role !== 'super_admin' && user?.tenant_id) {
        query = query.eq('tenant_id', user.tenant_id);
      } else if (selectedTenant) {
        query = query.eq('tenant_id', selectedTenant);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setDrivers((data as any) || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast.error('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDriver = async (driverId: string) => {
    if (!confirm('Are you sure you want to delete this driver?')) return;

    try {
      const { error } = await supabase
        .from('drivers' as any)
        .delete()
        .eq('id', driverId);

      if (error) throw error;
      
      toast.success('Driver deleted successfully');
      fetchDrivers();
    } catch (error) {
      console.error('Error deleting driver:', error);
      toast.error('Failed to delete driver');
    }
  };

  const handleToggleActiveStatus = async (driver: Driver) => {
    try {
      const { error } = await supabase
        .from('drivers' as any)
        .update({ is_active: !driver.is_active })
        .eq('id', driver.id);

      if (error) throw error;
      
      toast.success(`Driver ${!driver.is_active ? 'activated' : 'deactivated'} successfully`);
      fetchDrivers();
    } catch (error) {
      console.error('Error updating driver status:', error);
      toast.error('Failed to update driver status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-status-completed text-white';
      case 'busy': return 'bg-status-processing text-white';
      case 'offline': return 'bg-muted text-muted-foreground';
      case 'break': return 'bg-status-pending text-white';
      default: return 'bg-muted';
    }
  };

  const formatLastSeen = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.phone_number.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || driver.driver_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeDrivers = drivers.filter(d => d.is_active && d.driver_status !== 'offline').length;
  const availableDrivers = drivers.filter(d => d.driver_status === 'available').length;
  const busyDrivers = drivers.filter(d => d.driver_status === 'busy').length;

  if (showLocationMap) {
    return <DriverLocationMap onBack={() => setShowLocationMap(false)} drivers={filteredDrivers} />;
  }

  return (
    <div className="theme-admin min-h-screen bg-admin-muted">
      {/* Header */}
      <header className="bg-admin-primary text-admin-primary-foreground shadow-custom-md">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-admin-primary-foreground hover:text-admin-primary-foreground/80 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>← Back to Dashboard</span>
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold">{user?.name}</p>
                <p className="text-sm text-admin-primary-foreground/80">{user?.email}</p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <h1 className="text-2xl font-bold">Fleet Management</h1>
            <p className="text-admin-primary-foreground/80">Manage drivers and vehicle assignments</p>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Fleet Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-custom-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Drivers</CardTitle>
              <Users className="h-4 w-4 text-admin-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{drivers.length}</div>
              <p className="text-xs text-muted-foreground">{activeDrivers} active</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-custom-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Available</CardTitle>
              <UserCheck className="h-4 w-4 text-status-completed" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{availableDrivers}</div>
              <p className="text-xs text-muted-foreground">Ready for assignments</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-custom-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Busy</CardTitle>
              <Clock className="h-4 w-4 text-status-processing" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{busyDrivers}</div>
              <p className="text-xs text-muted-foreground">On assignments</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-custom-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Response</CardTitle>
              <MapPin className="h-4 w-4 text-admin-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12m</div>
              <p className="text-xs text-muted-foreground">Average response time</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search drivers by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="offline">Offline</option>
            <option value="break">On Break</option>
          </select>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowLocationMap(true)}
              className="flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              Live Map
            </Button>
            
            <Button 
              onClick={() => setShowDriverForm(true)}
              className="bg-admin-primary hover:bg-admin-primary/90 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Driver
            </Button>
          </div>
        </div>

        {/* Driver List */}
        <Card className="bg-white shadow-custom-sm">
          <CardHeader>
            <CardTitle className="text-admin-primary">Drivers ({filteredDrivers.length})</CardTitle>
            <CardDescription>Manage your fleet drivers and assignments</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading drivers...</div>
            ) : filteredDrivers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || statusFilter !== 'all' ? 'No drivers match your filters' : 'No drivers found'}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDrivers.map((driver) => (
                  <div key={driver.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-admin-accent/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-admin-accent rounded-full">
                        <Users className="h-4 w-4 text-admin-primary" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold">{driver.full_name}</h4>
                          <Badge className={getStatusColor(driver.driver_status)}>
                            {driver.driver_status}
                          </Badge>
                          {!driver.is_active && (
                            <Badge variant="outline" className="text-muted-foreground">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {driver.phone_number}
                          </span>
                          {driver.vehicle_registration && (
                            <span className="flex items-center gap-1">
                              <Car className="h-3 w-3" />
                              {driver.vehicle_registration} ({driver.vehicle_type})
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last seen: {formatLastSeen(driver.last_location_update)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDriver(driver);
                          setShowAssignmentModal(true);
                        }}
                        disabled={!driver.is_active || driver.driver_status === 'offline'}
                      >
                        Assign
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDriver(driver);
                          setShowDriverForm(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActiveStatus(driver)}
                        className={driver.is_active ? "text-red-600" : "text-green-600"}
                      >
                        {driver.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDriver(driver.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {showDriverForm && (
        <DriverFormModal
          driver={selectedDriver}
          onClose={() => {
            setShowDriverForm(false);
            setSelectedDriver(null);
          }}
          onSuccess={() => {
            fetchDrivers();
            setShowDriverForm(false);
            setSelectedDriver(null);
          }}
        />
      )}

      {showAssignmentModal && selectedDriver && (
        <DriverAssignmentModal
          driver={selectedDriver}
          onClose={() => {
            setShowAssignmentModal(false);
            setSelectedDriver(null);
          }}
          onSuccess={() => {
            setShowAssignmentModal(false);
            setSelectedDriver(null);
          }}
        />
      )}
    </div>
  );
};

export default DriverManagement;
