import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/Common/StatusBadge';
import { Recycle, Car, Users, Calendar, Settings, LogOut, Plus, MapPin, Clock, MessageSquare, Truck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenantCustomers } from '@/hooks/useTenantCustomers';
import { useUnifiedPickupStatus } from '@/hooks/useUnifiedPickupStatus';
import PricingManagement from './PricingManagement';
import UserManagement from '../SuperAdmin/UserManagement';
import SchedulingManagement from './SchedulingManagement';
import { ServiceZoneManagement } from './ServiceZoneManagement';
import { CustomerMessageManagement } from './CustomerMessageManagement';
import { NewCustomerRequestModal } from './NewCustomerRequestModal';
import { PickupEditModal } from './PickupEditModal';
import { PickupAssignmentModal } from './PickupAssignmentModal';

const TenantDashboard = () => {
  const { user, logout } = useAuth();
  const { pickups, loading: pickupsLoading, fetchPickups } = useUnifiedPickupStatus();
  const [showPricingManagement, setShowPricingManagement] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showSchedulingManagement, setShowSchedulingManagement] = useState(false);
  const [showServiceZoneManagement, setShowServiceZoneManagement] = useState(false);
  const [showCustomerMessages, setShowCustomerMessages] = useState(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [showPickupAssignment, setShowPickupAssignment] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  
  // State for real tenant data
  const stats = useMemo(() => {
    if (pickupsLoading) return { newRequests: 0, inProgress: 0, completed: 0, activeDrivers: drivers.length };
    return {
      newRequests: pickups.filter(p => p.current_status === 'pending').length,
      inProgress: pickups.filter(p => ['assigned', 'in_progress'].includes(p.current_status)).length,
      completed: pickups.filter(p => p.current_status === 'completed').length,
      activeDrivers: drivers.length
    };
  }, [pickups, pickupsLoading, drivers]);
  const [loading, setLoading] = useState(false);

  // Derived data from unified pickups
  const recentOrders = pickups.slice(0, 5); // Recent 5 orders
  const todaySchedule = pickups.filter(pickup => {
    const today = new Date().toISOString().split('T')[0];
    const pickupDate = pickup.scheduled_pickup_date || pickup.request_created_at?.split('T')[0];
    return pickupDate === today;
  });

  // Fetch tenant-specific data
  useEffect(() => {
    if (user?.tenant_id) {
      fetchTenantData();
      fetchDrivers();
    }
  }, [user?.tenant_id]);

  const fetchTenantData = async () => {
    try {
      setLoading(true);
      fetchDrivers();
    } catch (error) {
      console.error('Error fetching tenant data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('id, full_name')
        .eq('tenant_id', user?.tenant_id)
        .eq('is_active', true);

      if (error) throw error;
      setDrivers(data || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };
  const formatDriverName = (order) => {
  if (order.driver_name) return order.driver_name;
  if (order.assigned_driver_id && drivers.length > 0) {
    const driver = drivers.find(d => d.id === order.assigned_driver_id);
    return driver?.full_name || 'Okänd förare';
  }
  return null;
};

  if (showPricingManagement) {
    return <PricingManagement onBack={() => setShowPricingManagement(false)} />;
  }

  if (showUserManagement) {
    return <UserManagement onBack={() => setShowUserManagement(false)} />;
  }

  if (showSchedulingManagement) {
    return <SchedulingManagement onBack={() => {
      setShowSchedulingManagement(false);
      fetchTenantData(); // Refresh data when returning from scheduling management
    }} />;
  }

  if (showServiceZoneManagement) {
    return <ServiceZoneManagement onBack={() => setShowServiceZoneManagement(false)} />;
  }

  if (showCustomerMessages) {
    return <CustomerMessageManagement onBack={() => setShowCustomerMessages(false)} />;
  }

  // Create display stats array from fetched data
  const statsDisplay = [
    {
      title: 'Nya ärenden',
      value: loading ? '...' : stats.newRequests.toString(),
      change: loading ? 'Laddar...' : `${stats.newRequests > 0 ? '+' : ''}${stats.newRequests} totalt`,
      icon: Car,
      color: 'bg-status-new'
    },
    {
      title: 'Pågående',
      value: loading ? '...' : stats.inProgress.toString(),
      change: loading ? 'Laddar...' : `${stats.inProgress > 0 ? '+' : ''}${stats.inProgress} aktiva`,
      icon: Clock,
      color: 'bg-status-processing'
    },
    {
      title: 'Klara',
      value: loading ? '...' : stats.completed.toString(),
      change: loading ? 'Laddar...' : `${stats.completed > 0 ? '+' : ''}${stats.completed} avslutade`,
      icon: Recycle,
      color: 'bg-status-completed'
    },
    {
      title: 'Aktiva förare',
      value: loading ? '...' : stats.activeDrivers.toString(),
      change: loading ? 'Laddar...' : `${stats.activeDrivers} tillgängliga`,
      icon: Users,
      color: 'bg-tenant-primary'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'ny': 
        return 'bg-status-new text-white border-status-new';
      case 'assigned':
      case 'tilldelad':
        return 'bg-status-processing text-white border-status-processing';
      case 'in_progress':
      case 'pågående': 
        return 'bg-status-processing text-white border-status-processing';
      case 'scheduled':
      case 'schemalagd':
      case 'hämtas': 
        return 'bg-status-pending text-white border-status-pending';
      case 'confirmed':
      case 'bekräftad':
        return 'bg-status-pending text-white border-status-pending';
      case 'completed':
      case 'klar': 
        return 'bg-status-completed text-white border-status-completed';
      case 'cancelled':
      case 'avbruten':
        return 'bg-status-cancelled text-white border-status-cancelled';
      default: 
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const formatPrice = (amount: number | null) => {
    return amount ? `${amount.toLocaleString('sv-SE')} kr` : 'Ej värderad';
  };

  const formatOrderDisplay = (order: any) => {
    const formatRegistrationNumber = (regNum: string) => {
      if (!regNum || regNum.length <= 3) return regNum;
      return `${regNum.slice(0, 3)} ${regNum.slice(3)}`;
    };
    const vehicle = `${order.car_brand} ${order.car_model}${order.car_year ? ` ${order.car_year}` : ''} (${formatRegistrationNumber(order.car_registration_number) || 'Ingen reg.nr'})`;
    const location = order.pickup_address || 'Ej angivet';
    return { vehicle, location };
  };

  return (
    <div className="theme-tenant min-h-screen bg-tenant-muted">
      {/* Header */}
      <header className="bg-tenant-primary text-tenant-primary-foreground shadow-custom-md">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Recycle className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Panta Bilen</h1>
                <p className="text-tenant-primary-foreground/80">{user?.tenant_name || 'Skrotbil hantering'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold">{user?.name}</p>
                <p className="text-sm text-tenant-primary-foreground/80">{user?.email}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="bg-white/10 border-white text-white hover:bg-white/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logga ut
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsDisplay.map((stat, index) => (
            <Card key={index} className="bg-white shadow-custom-sm hover:shadow-custom-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.color} text-white`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Management */}
          <Card className="lg:col-span-2 bg-white shadow-custom-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-tenant-primary">Ärendehantering</CardTitle>
                  <CardDescription>Hantera bilhämtningar och värderingar</CardDescription>
                </div>
                <Button 
                  className="bg-tenant-primary hover:bg-tenant-primary/90"
                  onClick={() => setShowNewCustomerModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nytt ärende
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">Laddar ärenden...</p>
                  </div>
                ) : recentOrders.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">Inga ärenden hittade för denna tenant</p>
                  </div>
                ) : (
                  recentOrders.map((order, index) => {
                    const { vehicle, location } = formatOrderDisplay(order);
                    const driverName = formatDriverName(order);
                    const hasDriver = driverName !== null;
                    //const hasDriver = order.driver_name || (order.assigned_driver_id && drivers.find(d => d.id === order.assigned_driver_id));
                     //const driverName = order.driver_name || drivers.find(d => d.id === order.assigned_driver_id)?.full_name;
                     const isAssigned = ['assigned', 'in_progress', 'scheduled', 'confirmed'].includes(order.current_status) || hasDriver;
                    return (
                      <div 
                        key={order.customer_request_id || index} 
                        className={`flex items-center justify-between p-4 border rounded-lg hover:bg-tenant-accent/30 transition-colors cursor-pointer ${hasDriver ? 'bg-green-50 border-l-4 border-l-green-500' : ''}`}
                        onClick={() => {
                          console.log('🔴 OPENING MODAL WITH ORDER:', order);
                          console.log('🔴 HAS DRIVER_ID:', !!order?.assigned_driver_id);
                          setSelectedPickup(order);
                          setShowEditModal(true);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-tenant-accent rounded-full">
                            <Car className="h-4 w-4 text-tenant-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{order.owner_name} - {order.contact_phone || 'Inget telefonnummer'}</h4>
                            <p className="text-sm text-muted-foreground">{vehicle}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {location}
                            </p>
                             {hasDriver && !['rejected', 'cancelled'].includes(order.current_status) && (
                               <p className="text-sm font-medium text-red-700 mt-1">
                                 <strong>Förare: {driverName}</strong>
                               </p>
                             )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={order.current_status} />
                          <div className="text-right">
                            <p className="font-semibold">{formatPrice(order.quote_amount)}</p>
                            <p className="text-sm text-muted-foreground">Uppskattad</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white shadow-custom-sm">
            <CardHeader>
              <CardTitle className="text-tenant-primary">Snabbåtgärder</CardTitle>
              <CardDescription>Vanliga uppgifter</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setShowSchedulingManagement(true)}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schemaläggning
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setShowUserManagement(true)}
              >
                <Users className="h-4 w-4 mr-2" />
                Hantera förare
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setShowPricingManagement(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Prishantering
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setShowServiceZoneManagement(true)}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Servicezoner
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setShowCustomerMessages(true)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Meddelanden till kund
              </Button>
              <Button
                onClick={() => setShowPickupAssignment(true)}
                className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Truck className="h-4 w-4 mr-2" />
                Tilldela Förare till Hämtningar
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule */}
        <Card className="mt-6 bg-white shadow-custom-sm">
          <CardHeader>
            <CardTitle className="text-tenant-primary">Dagens schema</CardTitle>
            <CardDescription>Planerade hämtningar och aktiviteter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Laddar schema...</p>
                </div>
              ) : todaySchedule.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Inga schemalagda aktiviteter för idag</p>
                </div>
              ) : (
                // Sort items - assigned/scheduled first
                todaySchedule
                  .sort((a, b) => {
                    const hasDriverA = a.driver_name && a.driver_name.trim() !== '';
                    const hasDriverB = b.driver_name && b.driver_name.trim() !== '';
                    if (hasDriverA && !hasDriverB) return -1;
                    if (!hasDriverA && hasDriverB) return 1;
                    return 0;
                  })
                  .map((schedule, index) => {
                    const formatRegistrationNumber = (regNum: string) => {
                      if (!regNum || regNum.length <= 3) return regNum;
                      return `${regNum.slice(0, 3)} ${regNum.slice(3)}`;
                    };
                    
                    const vehicle = `${schedule.car_brand} ${schedule.car_model}${schedule.car_year ? ` ${schedule.car_year}` : ''} (${formatRegistrationNumber(schedule.car_registration_number) || 'Ingen reg.nr'})`;
                     const location = schedule.pickup_address || 'Ej angivet';
                    const driverName = formatDriverName(schedule);
                    const hasDriver = driverName !== null;
                    // const hasDriver = schedule.driver_name || (schedule.assigned_driver_id && drivers.find(d => d.id === schedule.assigned_driver_id));
                     //const driverName = schedule.driver_name || drivers.find(d => d.id === schedule.assigned_driver_id)?.full_name;
                    
                    return (
                      <div key={schedule.customer_request_id || index} className={`flex items-center justify-between p-4 border rounded-lg hover:bg-tenant-accent/30 transition-colors ${hasDriver ? 'bg-green-50 border-l-4 border-l-green-500' : ''}`}>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-tenant-accent rounded-full">
                            <Car className="h-4 w-4 text-tenant-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{schedule.owner_name} - {schedule.contact_phone || 'Inget telefonnummer'}</h4>
                            <p className="text-sm text-muted-foreground">{vehicle}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {location}
                            </p>
                             {hasDriver && (
                               <p className="text-sm font-medium text-red-700 mt-1">
                                 <strong>Förare: {driverName}</strong>
                               </p>
                             )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <StatusBadge status={schedule.current_status} />
                           <div className="text-right">
                             {(schedule.current_status === 'assigned' || schedule.current_status === 'in_progress' || hasDriver) && schedule.scheduled_pickup_date ? (
                               <div className="text-sm text-muted-foreground">
                                 <p>Hämtning: {new Date(schedule.scheduled_pickup_date).toLocaleDateString('sv-SE')}</p>
                                 <p>Tid: 09:00</p>
                               </div>
                              ) : schedule.scheduled_pickup_date ? (
                                <p className="text-sm text-muted-foreground">
                                  {new Date(schedule.scheduled_pickup_date).toLocaleDateString('sv-SE')}
                               </p>
                             ) : null}
                           </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Customer Request Modal */}
      <NewCustomerRequestModal
        open={showNewCustomerModal}
        onOpenChange={setShowNewCustomerModal}
        //onSuccess={fetchTenantData}
          onSuccess={fetchPickups}
        />

      {/* Pickup Edit Modal */}
      <PickupEditModal
        pickup={selectedPickup}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPickup(null);
        }}
       onSuccess={fetchPickups}
      />

      {/* Pickup Assignment Modal */}
      {showPickupAssignment && (
        <PickupAssignmentModal
          tenantId={user?.tenant_id!}
          onClose={() => setShowPickupAssignment(false)}
          onSuccess={() => {
            setShowPickupAssignment(false);
            fetchPickups();
           // fetchTenantData(); // Refresh dashboard data
          }}
        />
      )}
    </div>
  );
};

export default TenantDashboard;