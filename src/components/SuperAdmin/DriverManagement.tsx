import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Users, Plus, Search, MapPin, Clock, Phone, Car, UserCheck, UserX, Edit, Trash2, Building2 } from 'lucide-react';
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
  scrapyard_id?: number | null;
  max_capacity_kg?: number;
}

interface Scrapyard {
  id: number;
  name: string;
  tenant_id: number;
}

interface DriverManagementProps {
  onBack: () => void;
  embedded?: boolean;
}

const DriverManagement: React.FC<DriverManagementProps> = ({ onBack, embedded = false }) => {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [scrapyards, setScrapyards] = useState<Scrapyard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [scrapyardFilter, setScrapyardFilter] = useState('all');
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<number | null>(null);

  useEffect(() => {
    fetchDrivers();
    fetchScrapyards();
  }, [selectedTenant]);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      let query = supabase.from('drivers' as any).select('*');
      
      // If not super admin, filter by user's tenant
      if (user?.role !== 'super_admin' && user?.tenant_id) {
        query = query.eq('tenant_id', user.tenant_id);
      } else if (user?.role === 'super_admin' && selectedTenant) {
        // Super admin with specific tenant selected
        query = query.eq('tenant_id', selectedTenant);
      }
      // If super admin with no selectedTenant, fetch all drivers from all tenants

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching drivers:', error);
        // Only show error toast for unexpected errors, not when there are no drivers
        if (!error.message.includes('infinite recursion') && !error.message.includes('no rows')) {
          toast.error('Failed to load drivers');
        }
        setDrivers([]);
        return;
      }
      
      setDrivers((data as any) || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      // Set empty array and don't show error for normal cases
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchScrapyards = async () => {
    try {
      console.log('Fetching scrapyards for user:', { role: user?.role, tenant_id: user?.tenant_id });
      
      let query = supabase.from('scrapyards').select('id, name, tenant_id');
      
      // For tenant admins, ONLY show their own tenant's scrapyards
      if (user?.tenant_id) {
        query = query.eq('tenant_id', user.tenant_id);
        console.log('Filtering scrapyards by tenant_id:', user.tenant_id);
      } else {
        // If no tenant_id, return empty (shouldn't happen for tenant/scrapyard admins)
        console.log('No tenant_id found, returning empty scrapyards');
        setScrapyards([]);
        return;
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching scrapyards:', error);
        setScrapyards([]);
        return;
      }

      console.log('Fetched scrapyards:', data);
      const mappedData: Scrapyard[] = (data || []).map((s: any) => ({
        id: Number(s.id),
        name: s.name,
        tenant_id: Number(s.tenant_id),
      }));
      console.log('Mapped scrapyard data:', mappedData);
      setScrapyards(mappedData);
    } catch (error) {
      console.error('Error fetching scrapyards:', error);
      setScrapyards([]);
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
      const newStatus = !driver.is_active;
      
      const { error } = await supabase
        .from('drivers' as any)
        .update({ is_active: newStatus })
        .eq('id', driver.id);

      if (error) throw error;
      
      toast.success(`Driver ${driver.full_name} ${newStatus ? 'activated' : 'deactivated'} successfully`);
      fetchDrivers();
    } catch (error) {
      console.error('Error updating driver status:', error);
      toast.error(`Failed to update driver status: ${error.message || 'Unknown error'}`);
    }
  };

  const getStatusColor = (status: string, isActive: boolean = true) => {
    // If driver is inactive, override status color
    if (!isActive) {
      return 'bg-muted text-muted-foreground';
    }
    
    switch (status) {
      case 'available': return 'bg-status-completed text-white';
      case 'busy': return 'bg-status-processing text-white';
      case 'offline': return 'bg-muted text-muted-foreground';
      case 'break': return 'bg-status-pending text-white';
      default: return 'bg-muted';
    }
  };

  const getDisplayStatus = (driver: Driver) => {
    // If driver is inactive, show "Inactive" instead of their operational status
    if (!driver.is_active) {
      return 'Inactive';
    }
    return driver.driver_status;
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
    const matchesScrapyard = scrapyardFilter === 'all' || (driver.scrapyard_id?.toString() === scrapyardFilter) || (scrapyardFilter === 'unassigned' && !driver.scrapyard_id);
    return matchesSearch && matchesStatus && matchesScrapyard;
  });

  const activeDrivers = drivers.filter(d => d.is_active && d.driver_status !== 'offline').length;
  const availableDrivers = drivers.filter(d => d.driver_status === 'available').length;
  const busyDrivers = drivers.filter(d => d.driver_status === 'busy').length;

  if (showLocationMap) {
    return <DriverLocationMap onBack={() => setShowLocationMap(false)} drivers={filteredDrivers} />;
  }

  if (embedded) {
    return (
      <div className="space-y-6">
        {/* Fleet Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
        <div className="flex flex-col sm:flex-row gap-4">
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

          <select
            value={scrapyardFilter}
            onChange={(e) => setScrapyardFilter(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Scrapyards</option>
            <option value="unassigned">Unassigned</option>
            {scrapyards.map((scrapyard) => (
              <option key={scrapyard.id} value={scrapyard.id.toString()}>
                {scrapyard.name}
              </option>
            ))}
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
                {searchTerm || statusFilter !== 'all' || scrapyardFilter !== 'all' ? 'No drivers match your filters' : 'No drivers found'}
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
                          <Badge className={getStatusColor(driver.driver_status, driver.is_active)}>
                            {getDisplayStatus(driver)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {driver.phone_number}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {scrapyards.find(s => s.id === (driver.scrapyard_id || -1))?.name || 'No scrapyard assigned'}
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
              fetchScrapyards();
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

          <select
            value={scrapyardFilter}
            onChange={(e) => setScrapyardFilter(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Scrapyards</option>
            <option value="unassigned">Unassigned</option>
            {scrapyards.map((scrapyard) => (
              <option key={scrapyard.id} value={scrapyard.id.toString()}>
                {scrapyard.name}
              </option>
            ))}
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
                {searchTerm || statusFilter !== 'all' || scrapyardFilter !== 'all' ? 'No drivers match your filters' : 'No drivers found'}
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
                          <Badge className={getStatusColor(driver.driver_status, driver.is_active)}>
                            {getDisplayStatus(driver)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {driver.phone_number}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {scrapyards.find(s => s.id === (driver.scrapyard_id ?? -1))?.name || 'No scrapyard assigned'}
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
