import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Recycle, Car, Users, Calendar, Settings, LogOut, Plus, MapPin, Clock, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenantCustomers } from '@/hooks/useTenantCustomers';
import PricingManagement from './PricingManagement';
import UserManagement from '../SuperAdmin/UserManagement';
import SchedulingManagement from './SchedulingManagement';
import { ServiceZoneManagement } from './ServiceZoneManagement';
import { CustomerMessageManagement } from './CustomerMessageManagement';
import { NewCustomerRequestModal } from './NewCustomerRequestModal';

const TenantDashboard = () => {
  const { user, logout } = useAuth();
  const [showPricingManagement, setShowPricingManagement] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showSchedulingManagement, setShowSchedulingManagement] = useState(false);
  const [showServiceZoneManagement, setShowServiceZoneManagement] = useState(false);
  const [showCustomerMessages, setShowCustomerMessages] = useState(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  
  // State for real tenant data
  const [stats, setStats] = useState({
    newRequests: 0,
    inProgress: 0,
    completed: 0,
    activeDrivers: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch tenant-specific data
  useEffect(() => {
    if (user?.tenant_id) {
      fetchTenantData();
    }
  }, [user?.tenant_id]);

  const fetchTenantData = async () => {
    try {
      setLoading(true);
      
      // Fetch customer requests stats for this tenant
      const { data: requestsData, error: requestsError } = await supabase
        .from('customer_requests')
        .select('status, created_at')
        .eq('tenant_id', user?.tenant_id);

      if (requestsError) throw requestsError;

      // Calculate stats from requests
      const today = new Date().toDateString();
      const newRequests = requestsData?.filter(r => r.status === 'pending').length || 0;
      const inProgress = requestsData?.filter(r => ['assigned', 'in_progress'].includes(r.status)).length || 0;
      const completed = requestsData?.filter(r => r.status === 'completed').length || 0;

      // Fetch active drivers count for this tenant
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select('id')
        .eq('tenant_id', user?.tenant_id)
        .eq('is_active', true);

      if (driversError) throw driversError;

      setStats({
        newRequests,
        inProgress,
        completed,
        activeDrivers: driversData?.length || 0
      });

      // Fetch recent orders from tenant's customers with driver info
      const { data: ordersData, error: ordersError } = await supabase
        .from('customer_requests')
        .select(`
          id,
          owner_name,
          contact_phone,
          car_brand,
          car_model,
          car_year,
          car_registration_number,
          pickup_address,
          status,
          quote_amount,
          created_at
        `)
        .eq('tenant_id', user?.tenant_id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (ordersError) throw ordersError;

      // Get driver assignments for recent orders
      if (ordersData && ordersData.length > 0) {
        const orderIds = ordersData.map(order => order.id);
        const { data: orderAssignmentsData } = await supabase
          .from('driver_assignments')
          .select(`
            customer_request_id,
            driver_id,
            drivers(full_name)
          `)
          .in('customer_request_id', orderIds)
          .eq('is_active', true);

        // Combine orders with driver info
        const ordersWithDrivers = ordersData.map(order => {
          const assignment = orderAssignmentsData?.find(a => a.customer_request_id === order.id);
          return {
            ...order,
            driver_name: assignment?.drivers?.full_name || null
          };
        });
        setRecentOrders(ordersWithDrivers);
      } else {
        setRecentOrders([]);
      }

      // Fetch today's scheduled pickup requests from customer_requests table
      const today_start = new Date();
      today_start.setHours(0, 0, 0, 0);
      const today_end = new Date();
      today_end.setHours(23, 59, 59, 999);

      console.log('Today date range:', today_start.toISOString().split('T')[0], 'to', today_end.toISOString().split('T')[0]);

      // First get customer requests for today
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('customer_requests')
        .select(`
          id,
          pickup_date,
          status,
          owner_name,
          car_brand,
          car_model,
          pickup_address,
          contact_phone,
          created_at,
          car_registration_number,
          car_year
        `)
        .eq('tenant_id', user?.tenant_id)
        .or(`pickup_date.gte.${today_start.toISOString().split('T')[0]},pickup_date.lte.${today_end.toISOString().split('T')[0]},created_at.gte.${today_start.toISOString()},created_at.lte.${today_end.toISOString()}`)
        .in('status', ['pending', 'assigned', 'in_progress', 'scheduled', 'confirmed'])
        .order('created_at', { ascending: false });

      console.log('Today schedule data:', scheduleData, 'Error:', scheduleError);

      if (!scheduleError && scheduleData) {
        // Get driver assignments for these requests
        const requestIds = scheduleData.map(item => item.id);
        const { data: assignmentsData } = await supabase
          .from('driver_assignments')
          .select(`
            customer_request_id,
            driver_id,
            drivers(full_name)
          `)
          .in('customer_request_id', requestIds)
          .eq('is_active', true);

        // Combine the data
        const transformedData = scheduleData.map(item => {
          const assignment = assignmentsData?.find(a => a.customer_request_id === item.id);
          return {
            ...item,
            driver_name: assignment?.drivers?.full_name || null
          };
        });
        setTodaySchedule(transformedData);
      }

    } catch (error) {
      console.error('Error fetching tenant data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (showPricingManagement) {
    return <PricingManagement onBack={() => setShowPricingManagement(false)} />;
  }

  if (showUserManagement) {
    return <UserManagement onBack={() => setShowUserManagement(false)} />;
  }

  if (showSchedulingManagement) {
    return <SchedulingManagement onBack={() => setShowSchedulingManagement(false)} />;
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
        return 'bg-blue-500 text-white';
      case 'assigned':
      case 'tilldelad':
        return 'bg-orange-500 text-white';
      case 'in_progress':
      case 'pågående': 
        return 'bg-green-500 text-white';
      case 'scheduled':
      case 'schemalagd':
      case 'hämtas': 
        return 'bg-purple-500 text-white';
      case 'confirmed':
      case 'bekräftad':
        return 'bg-teal-500 text-white';
      case 'completed':
      case 'klar': 
        return 'bg-gray-500 text-white';
      default: 
        return 'bg-muted';
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
                    const isAssigned = ['assigned', 'in_progress', 'scheduled', 'confirmed'].includes(order.status);
                    return (
                      <div key={order.id || index} className={`flex items-center justify-between p-4 border rounded-lg hover:bg-tenant-accent/30 transition-colors ${isAssigned ? 'bg-green-50 border-l-4 border-l-green-500' : ''}`}>
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
                            {isAssigned && order.driver_name && (
                              <p className="text-sm font-medium text-green-700 mt-1">
                                <strong>Förare: {order.driver_name}</strong>
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(order.status)}>
                            {order.status === 'pending' ? 'Ny' : 
                             order.status === 'assigned' ? 'Tilldelad' :
                             order.status === 'in_progress' ? 'Pågående' :
                             order.status === 'completed' ? 'Klar' : 
                             order.status === 'scheduled' ? 'Schemalagd' :
                             order.status === 'confirmed' ? 'Bekräftad' :
                             order.status}
                          </Badge>
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
                    const isAssignedA = ['assigned', 'scheduled', 'confirmed'].includes(a.status);
                    const isAssignedB = ['assigned', 'scheduled', 'confirmed'].includes(b.status);
                    if (isAssignedA && !isAssignedB) return -1;
                    if (!isAssignedA && isAssignedB) return 1;
                    return 0;
                  })
                  .map((schedule, index) => {
                    const formatRegistrationNumber = (regNum: string) => {
                      if (!regNum || regNum.length <= 3) return regNum;
                      return `${regNum.slice(0, 3)} ${regNum.slice(3)}`;
                    };
                    
                    const vehicle = `${schedule.car_brand} ${schedule.car_model}${schedule.car_year ? ` ${schedule.car_year}` : ''} (${formatRegistrationNumber(schedule.car_registration_number) || 'Ingen reg.nr'})`;
                    const location = schedule.pickup_address || 'Ej angivet';
                    const isAssigned = ['assigned', 'scheduled', 'confirmed'].includes(schedule.status);
                    
                    return (
                      <div key={schedule.id || index} className={`flex items-center justify-between p-4 border rounded-lg hover:bg-tenant-accent/30 transition-colors ${isAssigned ? 'bg-green-50 border-l-4 border-l-green-500' : ''}`}>
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
                            {isAssigned && schedule.driver_name && (
                              <p className="text-sm font-medium text-green-700 mt-1">
                                Förare: {schedule.driver_name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(schedule.status)}>
                            {schedule.status === 'pending' ? 'Ny' : 
                             schedule.status === 'assigned' ? 'Tilldelad' :
                             schedule.status === 'in_progress' ? 'Pågående' :
                             schedule.status === 'completed' ? 'Klar' : 
                             schedule.status === 'scheduled' ? 'Schemalagd' :
                             schedule.status === 'confirmed' ? 'Bekräftad' :
                             schedule.status}
                          </Badge>
                          <div className="text-right">
                            {schedule.pickup_date && (
                              <p className="text-sm text-muted-foreground">
                                {new Date(schedule.pickup_date).toLocaleDateString('sv-SE')}
                              </p>
                            )}
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
        onSuccess={fetchTenantData}
      />
    </div>
  );
};

export default TenantDashboard;