import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  Car, 
  Filter,
  Search,
  Check,
  X,
  MessageSquare,
  Plus
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  onBack: () => void;
}

interface Request {
  id: string; // This will be pickup_order_id
  pickupOrderId: string;
  customerRequestId: string;
  date: Date;
  time: string;
  customerName: string;
  address: string;
  phone: string;
  carBrand: string;
  carModel: string;
  registrationNumber: string;
  status: 'Förfrågan' | 'Bekräftad' | 'Utförd' | 'Avbokad';
  assignedDriver?: string;
  notes?: string;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  status: 'Tillgänglig' | 'Upptagen';
}

const SchedulingManagement: React.FC<Props> = ({ onBack }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isAddPickupDialogOpen, setIsAddPickupDialogOpen] = useState(false);
  const [selectedRequestForScheduling, setSelectedRequestForScheduling] = useState<Request | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driversLoading, setDriversLoading] = useState(true);
  const [requests, setRequests] = useState<Request[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [rescheduleRequest, setRescheduleRequest] = useState<Request | null>(null);
  const [rescheduleConfirmOpen, setRescheduleConfirmOpen] = useState(false);
  const [rescheduleData, setRescheduleData] = useState<{
    requestId: string;
    newDate: Date;
    newTime: string;
    sendSMS: boolean;
  } | null>(null);

  // Fetch drivers and customer requests for the current tenant
  useEffect(() => {
    if (user?.tenant_id) {
      fetchDrivers();
      fetchCustomerRequests();
    }
  }, [user?.tenant_id]);

  // Refetch data when component becomes visible (when user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.tenant_id) {
        fetchCustomerRequests();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user?.tenant_id]);

  const fetchDrivers = async () => {
    if (!user?.tenant_id) return;
    
    try {
      setDriversLoading(true);
      const { data, error } = await supabase
        .from('drivers')
        .select('id, full_name, phone_number, driver_status')
        .eq('tenant_id', user.tenant_id)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching drivers:', error);
        toast({
          title: "Fel",
          description: "Kunde inte ladda förare",
          variant: "destructive"
        });
        return;
      }

      const formattedDrivers: Driver[] = (data || []).map(driver => ({
        id: driver.id,
        name: driver.full_name,
        phone: driver.phone_number,
        status: driver.driver_status === 'available' || driver.driver_status === 'on_duty' ? 'Tillgänglig' : 'Upptagen'
      }));

      setDrivers(formattedDrivers);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast({
        title: "Fel", 
        description: "Kunde inte ladda förare",
        variant: "destructive"
      });
    } finally {
      setDriversLoading(false);
    }
  };

  const fetchCustomerRequests = async () => {
    if (!user?.tenant_id) return;
    
    try {
      setRequestsLoading(true);
      console.log('🔄 Fetching customer requests for tenant:', user.tenant_id);
      
      // Fetch all customer requests first
      const { data: customerRequestsData, error: customerError } = await supabase
        .from('customer_requests')
        .select(`
          id,
          owner_name,
          contact_phone,
          pickup_address,
          car_brand,
          car_model,
          car_year,
          car_registration_number,
          status,
          pickup_date,
          created_at,
          scrapyard_id
        `)
        .eq('tenant_id', user.tenant_id)
        .order('created_at', { ascending: false });

      if (customerError) {
        console.error('❌ Error fetching customer requests:', customerError);
        toast({
          title: "Fel",
          description: "Kunde inte ladda kundförfrågningar",
          variant: "destructive"
        });
        return;
      }

      // Fetch pickup orders to merge with customer requests
      const { data: pickupData, error: pickupError } = await (supabase as any)
        .from('v_pickup_status_unified')
        .select('*')
        .eq('tenant_id', user.tenant_id);

      if (pickupError) {
        console.warn('⚠️ Warning fetching pickup orders:', pickupError);
      }

      console.log('✅ Customer requests fetched:', customerRequestsData?.length || 0);
      console.log('✅ Pickup orders fetched:', pickupData?.length || 0);
      
      // Create a map of pickup orders by customer_request_id for faster lookup
      const pickupOrderMap = new Map();
      (pickupData || []).forEach((pickup: any) => {
        if (pickup.customer_request_id) {
          pickupOrderMap.set(pickup.customer_request_id, pickup);
        }
      });
      
      // Convert all customer requests to component format, merging with pickup data when available
      const formattedRequests: Request[] = (customerRequestsData || []).map((customerRequest: any) => {
        const pickupOrder = pickupOrderMap.get(customerRequest.id);
        
        // Convert status to Swedish based on pickup order status or customer request status
        let status: 'Förfrågan' | 'Bekräftad' | 'Utförd' | 'Avbokad';
        const sourceStatus = pickupOrder?.pickup_status || customerRequest.status;
        
        switch (sourceStatus) {
          case 'pending':
          case 'customer_request':
            status = 'Förfrågan';
            break;
          case 'assigned':
          case 'pickup_accepted':
          case 'in_progress':
          case 'scheduled':
            status = 'Bekräftad';
            break;
          case 'completed':
            status = 'Utförd';
            break;
          case 'cancelled':
          case 'rejected':
            status = 'Avbokad';
            break;
          default:
            status = 'Förfrågan';
        }

        // Use pickup order's scheduled date if available, otherwise use customer request pickup_date or created_at
        const requestDate = pickupOrder?.scheduled_pickup_date 
          ? new Date(pickupOrder.scheduled_pickup_date + 'T09:00:00')
          : customerRequest.pickup_date
          ? new Date(customerRequest.pickup_date + 'T09:00:00')
          : new Date(customerRequest.created_at);

        return {
          id: pickupOrder?.pickup_order_id || customerRequest.id,
          pickupOrderId: pickupOrder?.pickup_order_id || null,
          customerRequestId: customerRequest.id,
          date: requestDate,
          time: requestDate.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }),
          customerName: pickupOrder?.owner_name || customerRequest.owner_name || 'Okänd kund',
          address: pickupOrder?.pickup_address || customerRequest.pickup_address || 'Ingen adress angiven',
          phone: pickupOrder?.contact_phone || customerRequest.contact_phone || 'Inget telefonnummer',
          carBrand: pickupOrder?.car_brand || customerRequest.car_brand || 'Okänt märke',
          carModel: pickupOrder?.car_model || customerRequest.car_model || 'Okänd modell',
          registrationNumber: pickupOrder?.car_registration_number || customerRequest.car_registration_number || 'Okänt reg.nr',
          status,
          notes: pickupOrder?.driver_notes || null,
          assignedDriver: pickupOrder?.driver_name || null
        };
      });

      setRequests(formattedRequests);
    } catch (error) {
      console.error('Error fetching customer requests:', error);
      toast({
        title: "Fel", 
        description: "Kunde inte ladda kundförfrågningar",
        variant: "destructive"
      });
    } finally {
      setRequestsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Förfrågan': return 'bg-blue-500 text-white';
      case 'Bekräftad': return 'bg-green-500 text-white';
      case 'Utförd': return 'bg-gray-500 text-white';
      case 'Avbokad': return 'bg-red-500 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesLocation = !filterLocation || 
      request.address.toLowerCase().includes(filterLocation.toLowerCase()) ||
      request.address.match(/\d{5}/)?.[0] === filterLocation;
    const matchesStatus = filterStatus === 'all' || !filterStatus || request.status === filterStatus;
    return matchesLocation && matchesStatus;
  });

  const getRequestsForDate = (date: Date) => {
    return filteredRequests.filter(request => isSameDay(request.date, date));
  };

  const handleAssignDriver = async (requestId: string, driverId: string) => {
    try {
      // Check if the same driver is already assigned
      const currentRequest = requests.find(req => req.id === requestId);
      const currentDriverId = currentRequest?.assignedDriver;
      const selectedDriverName = drivers.find(d => d.id === driverId)?.name;
      
      if (currentDriverId === selectedDriverName) {
        toast({
          title: "Föraren redan vald",
          description: "Denna förare är redan tilldelad denna förfrågan",
          variant: "destructive"
        });
        return;
      }

      const pickupOrderId = currentRequest?.pickupOrderId || requestId;

      // Create driver assignment using pickup_order_id
      const { error: assignmentError } = await supabase
        .from('driver_assignments')
        .insert({
          pickup_order_id: pickupOrderId,
          driver_id: driverId,
          status: 'scheduled',
          assigned_at: new Date().toISOString(),
          is_active: true,
          assignment_type: 'pickup',
          role: 'primary'
        });

      if (assignmentError) {
        console.error('Error creating assignment:', assignmentError);
        toast({
          title: "Fel",
          description: "Kunde inte tilldela föraren",
          variant: "destructive"
        });
        return;
      }

      // Update pickup status using CORRECTED unified function
      const { error: statusError } = await (supabase as any).rpc('update_pickup_status_yesterday_workflow', {
        p_pickup_order_id: pickupOrderId,
        p_new_status: 'assigned',
        p_driver_notes: 'Assigned via admin interface',
        p_completion_photos: null,
        p_test_driver_id: null
      });

      if (statusError) {
        console.error('Error updating status:', statusError);
        toast({
          title: "Fel",
          description: "Kunde inte uppdatera status",
          variant: "destructive"
        });
        return;
      }

      // Refresh data to show changes
      await fetchCustomerRequests();

      toast({
        title: "Förare tilldelad",
        description: "Föraren har tilldelats uppdraget"
      });
    } catch (error) {
      console.error('Error assigning driver:', error);
      toast({
        title: "Fel",
        description: "Kunde inte tilldela föraren",
        variant: "destructive"
      });
    }
  };

  const handleConfirmRequest = async (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (!request || !request.assignedDriver) {
      toast({
        title: "Fel",
        description: "Du måste tilldela en förare innan du kan bekräfta hämtningen.",
        variant: "destructive"
      });
      return;
    }

    // Update status
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'Bekräftad' as const } : req
    ));

    // Simulate SMS sending
    try {
      toast({
        title: "Hämtning bekräftad",
        description: `SMS skickat till ${request.customerName} (${request.phone}) om bekräftad hämtning.`
      });
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte skicka SMS bekräftelse.",
        variant: "destructive"
      });
    }

    setIsDetailDialogOpen(false);
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      const currentRequest = requests.find(req => req.id === requestId);
      const pickupOrderId = currentRequest?.pickupOrderId || requestId;

      // Use CORRECTED unified function to cancel pickup
      const { error } = await (supabase as any).rpc('update_pickup_status_yesterday_workflow', {
        p_pickup_order_id: pickupOrderId,
        p_new_status: 'cancelled',
        p_driver_notes: 'Cancelled by admin',
        p_completion_photos: null,
        p_test_driver_id: null
      });

      if (error) {
        console.error('Error cancelling request:', error);
        toast({
          title: "Fel",
          description: "Kunde inte avboka förfrågan",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Förfrågan avbokad",
        description: "Förfrågan har avbokats framgångsrikt",
      });
      
      // Refresh data
      await fetchCustomerRequests();
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast({
        title: "Fel",
        description: "Ett oväntat fel inträffade",
        variant: "destructive"
      });
    }
    
    setIsDetailDialogOpen(false);
  };

  // Get available requests that can be added to schedule (status 'Förfrågan')
  const availableRequests = requests.filter(request => request.status === 'Förfrågan');

  const handleAddRequestToSchedule = async (requestId: string, newDate: Date, newTime: string) => {
    try {
      console.log('🔄 Scheduling pickup:', { requestId, newDate, newTime });
      
      const currentRequest = requests.find(req => req.id === requestId);
      const pickupOrderId = currentRequest?.pickupOrderId || requestId;
      
      // Update pickup date using pickup_order_id
      const pickupDateTime = format(newDate, 'yyyy-MM-dd');
      const { error: dateError } = await supabase
        .from('pickup_orders')
        .update({ 
          scheduled_pickup_date: pickupDateTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', pickupOrderId);

      if (dateError) {
        console.error('❌ Error updating pickup date:', dateError);
        toast({
          title: "Fel",
          description: "Kunde inte uppdatera hämtningsdatum",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Pickup date updated successfully');

      // Use CORRECTED unified function to update status
      const { error } = await (supabase as any).rpc('update_pickup_status_yesterday_workflow', {
        p_pickup_order_id: pickupOrderId,
        p_new_status: 'scheduled',
        p_driver_notes: `Scheduled by admin for ${pickupDateTime}`,
        p_completion_photos: null,
        p_test_driver_id: null
      });

      if (error) {
        console.error('❌ Error updating request status:', error);
        toast({
          title: "Fel",
          description: "Kunde inte uppdatera ärendet",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Status updated successfully');
      
      setIsAddPickupDialogOpen(false);
      setSelectedRequestForScheduling(null);
      
      toast({
        title: "Hämtning schemalagd",
        description: "Förfrågan har bekräftats och lagts till i schemat."
      });
      
      // Refresh data to show updated pickup date
      await fetchCustomerRequests();
    } catch (error) {
      console.error('❌ Error scheduling request:', error);
      toast({
        title: "Fel",
        description: "Kunde inte schemalägga hämtningen",
        variant: "destructive"
      });
    }
  };

  const handleScheduleRequest = (request: Request) => {
    setSelectedRequestForScheduling(request);
    setIsAddPickupDialogOpen(true);
  };

  const handleRescheduleRequest = (request: Request) => {
    console.log('🔥 RESCHEDULE BUTTON CLICKED:', request);
    setRescheduleRequest(request);
    setIsRescheduleDialogOpen(true);
  };

  const handleRescheduleSubmit = (newDate: Date, newTime: string, sendSMS: boolean) => {
    console.log('🔥 RESCHEDULE SUBMIT CALLED:', { 
      rescheduleRequest: rescheduleRequest?.id, 
      newDate, 
      newTime, 
      sendSMS 
    });
    if (!rescheduleRequest) return;

    setRescheduleData({
      requestId: rescheduleRequest.id,
      newDate,
      newTime,
      sendSMS
    });
    console.log('🔥 RESCHEDULE DATA SET:', {
      requestId: rescheduleRequest.id,
      newDate,
      newTime,
      sendSMS
    });
    setIsRescheduleDialogOpen(false);
    setRescheduleConfirmOpen(true);
  };

  const confirmReschedule = async () => {
    console.log('🔥 CONFIRM RESCHEDULE FUNCTION CALLED');
    console.log('🔥 RESCHEDULE DATA:', rescheduleData);
    
    if (!rescheduleData) {
      console.log('❌ NO RESCHEDULE DATA - ABORTING');
      return;
    }

    const originalRequest = requests.find(r => r.id === rescheduleData.requestId);
    const wasAvbokad = originalRequest?.status === 'Avbokad';
    const pickupOrderId = originalRequest?.pickupOrderId || rescheduleData.requestId;

    console.log('🔄 RESCHEDULE DEBUG:', {
      requestId: rescheduleData.requestId,
      pickupOrderId,
      originalRequest: originalRequest,
      originalStatus: originalRequest?.status,
      wasAvbokad,
      newDate: rescheduleData.newDate,
      newTime: rescheduleData.newTime
    });

    try {
      const pickupDateTime = format(rescheduleData.newDate, 'yyyy-MM-dd');
      
      console.log('🔄 UPDATING PICKUP DATE...');
      // Update scheduled pickup date
      const { error: dateError } = await supabase
        .from('pickup_orders')
        .update({
          scheduled_pickup_date: pickupDateTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', pickupOrderId);

      if (dateError) {
        console.error('❌ Error updating pickup date:', dateError);
        toast({
          title: "Fel",
          description: "Kunde inte uppdatera hämtningsdatum",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Pickup date updated successfully');

      // FIXED: Update status using CORRECTED unified function and proper Swedish workflow
      const newStatus = wasAvbokad ? 'scheduled' : 'scheduled'; // "Avbokad" → "Schemalagd"
      const { error: statusError } = await (supabase as any).rpc('update_pickup_status_yesterday_workflow', {
        p_pickup_order_id: pickupOrderId,
        p_new_status: newStatus,
        p_driver_notes: `Rescheduled by admin to ${pickupDateTime}${wasAvbokad ? ' - Reactivated from cancelled' : ''}`,
        p_completion_photos: null,
        p_test_driver_id: null
      });

      if (statusError) {
        console.error('❌ Error updating status:', statusError);
        toast({
          title: "Fel",
          description: "Kunde inte uppdatera status",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Status updated successfully');

      if (rescheduleData.sendSMS) {
        const request = requests.find(r => r.id === rescheduleData.requestId);
        if (request) {
          toast({
            description: `SMS skickat till ${request?.customerName} om den nya tiden: ${format(rescheduleData.newDate, 'dd/MM')} ${rescheduleData.newTime}`
          });
        }
      }

      toast({
        title: wasAvbokad ? "Hämtning återaktiverad och omschemalagd" : "Hämtning omschemalagd",
        description: `Ny tid: ${format(rescheduleData.newDate, 'dd/MM')} ${rescheduleData.newTime}${wasAvbokad ? ' - Status ändrad till Förfrågan' : ''}`
      });

      // Refresh data to show changes
      await fetchCustomerRequests();

    } catch (error) {
      console.error('❌ UNEXPECTED ERROR in confirmReschedule:', error);
      console.error('❌ Error stack:', error.stack);
      toast({
        title: "Fel",
        description: `Unexpected error: ${error.message}`,
        variant: "destructive"
      });
    }

    console.log('🔄 CLEANING UP STATE...');
    setRescheduleConfirmOpen(false);
    setRescheduleData(null);
    setRescheduleRequest(null);
    setIsDetailDialogOpen(false);
    console.log('✅ RESCHEDULE FUNCTION COMPLETED');
  };

  const cancelReschedule = () => {
    setRescheduleConfirmOpen(false);
    setRescheduleData(null);
    setIsRescheduleDialogOpen(true); // Reopen reschedule dialog
  };

  const renderCalendarGrid = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <div className="grid grid-cols-7 gap-2 p-4">
        {/* Header */}
        {['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'].map(day => (
          <div key={day} className="text-center font-medium text-sm text-muted-foreground p-2">
            {day}
          </div>
        ))}
        
        {/* Days */}
        {days.map(day => {
          const dayRequests = getRequestsForDate(day);
          const dayNumber = format(day, 'd');
          const isCurrentDay = isToday(day);
          
          return (
            <div 
              key={day.toString()}
              className={`min-h-[80px] p-2 border rounded-lg cursor-pointer transition-colors ${
                isCurrentDay ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => setSelectedDate(day)}
            >
              <div className={`text-sm font-medium ${isCurrentDay ? 'text-blue-600' : 'text-gray-900'}`}>
                {dayNumber}
              </div>
              <div className="space-y-1 mt-1">
                {dayRequests.slice(0, 2).map(request => (
                  <div 
                    key={request.id}
                    className={`text-xs p-1 rounded cursor-pointer ${getStatusColor(request.status)}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRequest(request);
                      setIsDetailDialogOpen(true);
                    }}
                  >
                    {request.time} - {request.customerName}
                  </div>
                ))}
                {dayRequests.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{dayRequests.length - 2} fler
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="theme-tenant min-h-screen bg-tenant-muted">
      {/* Header */}
      <header className="bg-tenant-primary text-tenant-primary-foreground shadow-custom-md">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="hover:bg-tenant-primary-foreground/10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Schemaläggning</h1>
              <p className="text-tenant-primary-foreground/80">Hantera kundförfrågningar och hämtningar</p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
          <Button
            onClick={() => setIsAddPickupDialogOpen(true)}
            className="bg-tenant-primary hover:bg-tenant-primary/90 text-tenant-primary-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            Lägg till hämtning
          </Button>
          <div className="flex items-center gap-2">
            <Label htmlFor="month-select">Månad:</Label>
            <Select value={format(selectedDate, 'yyyy-MM')} onValueChange={(value) => {
              const [year, month] = value.split('-');
              setSelectedDate(new Date(parseInt(year), parseInt(month) - 1, 1));
            }}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const month = new Date(new Date().getFullYear(), i, 1);
                  const value = format(month, 'yyyy-MM');
                  const monthNames = [
                    'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
                    'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
                  ];
                  const label = `${monthNames[i]} ${new Date().getFullYear()}`;
                  return (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="location-filter">Filtrera ort/postnummer:</Label>
            <Input
              id="location-filter"
              placeholder="Ort eller postnummer"
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="w-48"
            />
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="status-filter">Status:</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Alla statusar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla statusar</SelectItem>
                <SelectItem value="Förfrågan">Förfrågan</SelectItem>
                <SelectItem value="Bekräftad">Bekräftad</SelectItem>
                <SelectItem value="Utförd">Utförd</SelectItem>
                <SelectItem value="Avbokad">Avbokad</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Calendar */}
        <Card className="bg-white shadow-custom-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {(() => {
                const monthNames = [
                  'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
                  'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
                ];
                return `${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
              })()}
            </CardTitle>
            <CardDescription>
              Klicka på en dag för att se detaljer eller på en förfrågan för att hantera den
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderCalendarGrid()}
          </CardContent>
        </Card>

        {/* Today's Requests */}
        <Card className="mt-6 bg-white shadow-custom-sm">
          <CardHeader>
            <CardTitle>Dagens förfrågningar</CardTitle>
            <CardDescription>
              {(() => {
                const monthNames = [
                  'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
                  'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
                ];
                const dayNames = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
                return `${dayNames[selectedDate.getDay()]} ${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
              })()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {getRequestsForDate(selectedDate).length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Inga förfrågningar för denna dag
              </p>
            ) : (
              <div className="space-y-4">
                {getRequestsForDate(selectedDate).map(request => (
                  <div
                    key={request.id}
                    className="p-4 border rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center gap-4 flex-1 cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded"
                        onClick={() => {
                          setSelectedRequest(request);
                          setIsDetailDialogOpen(true);
                        }}
                      >
                        <div className="text-center">
                          <div className="font-bold text-lg">{request.time}</div>
                        </div>
                        <div>
                          <h3 className="font-semibold">{request.customerName}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Car className="h-3 w-3" />
                            {request.carBrand} {request.carModel} ({request.registrationNumber})
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {request.address}
                          </p>
                          {request.assignedDriver && (
                             <p className="text-sm text-destructive flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Förare: {request.assignedDriver}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                        {request.status === 'Förfrågan' && (
                          <Button
                            onClick={() => handleScheduleRequest(request)}
                            size="sm"
                            className="bg-tenant-primary hover:bg-tenant-primary/90 text-tenant-primary-foreground"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Schemalägg
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Request Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Hämtningsförfrågan - {selectedRequest?.id}</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* Status and Basic Info */}
              <div className="flex items-center justify-between">
                <Badge className={getStatusColor(selectedRequest.status)}>
                  {selectedRequest.status}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  {(() => {
                    const monthNames = [
                      'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
                      'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
                    ];
                    const dayNames = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
                    return `${dayNames[selectedRequest.date.getDay()]} ${selectedRequest.date.getDate()} ${monthNames[selectedRequest.date.getMonth()]} ${selectedRequest.date.getFullYear()}`;
                  })()} kl. {selectedRequest.time}
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Kund</Label>
                  <p className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4" />
                    {selectedRequest.customerName}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Telefon</Label>
                  <p className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4" />
                    {selectedRequest.phone}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Adress</Label>
                <p className="flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4" />
                  {selectedRequest.address}
                </p>
              </div>

              {/* Car Info */}
              <div>
                <Label className="text-sm font-medium">Fordon</Label>
                <p className="flex items-center gap-2 mt-1">
                  <Car className="h-4 w-4" />
                  {selectedRequest.carBrand} {selectedRequest.carModel} ({selectedRequest.registrationNumber})
                </p>
              </div>

              {/* Current Driver Assignment Display */}
              {selectedRequest.assignedDriver && (
                <div>
                  <Label className="text-sm font-medium">Förare</Label>
                  <p className="flex items-center gap-2 mt-1 text-green-700 font-medium">
                    <User className="h-4 w-4" />
                    {selectedRequest.assignedDriver}
                  </p>
                </div>
              )}

              {/* Driver Assignment */}
              <div>
                <Label className="text-sm font-medium">Tilldela förare</Label>
                <Select 
                  value={selectedRequest.assignedDriver || ''} 
                  onValueChange={(value) => {
                    handleAssignDriver(selectedRequest.id, value);
                    setSelectedRequest(prev => prev ? { ...prev, assignedDriver: drivers.find(d => d.id === value)?.name } : null);
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Välj förare" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.filter(d => d.status === 'Tillgänglig').map(driver => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.name} ({driver.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              {selectedRequest.notes && (
                <div>
                  <Label className="text-sm font-medium">Anteckningar</Label>
                  <p className="mt-1 p-2 bg-gray-50 rounded">{selectedRequest.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                {selectedRequest.status === 'Förfrågan' && (
                  <Button
                    onClick={() => handleConfirmRequest(selectedRequest.id)}
                    className="flex items-center gap-2"
                    disabled={!selectedRequest.assignedDriver}
                  >
                    <Check className="h-4 w-4" />
                    Bekräfta hämtning
                  </Button>
                )}
                
                {selectedRequest.status !== 'Avbokad' && (
                  <Button
                    variant="destructive"
                    onClick={() => handleCancelRequest(selectedRequest.id)}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Avboka
                  </Button>
                )}

                {(selectedRequest.status === 'Bekräftad' || selectedRequest.status === 'Avbokad') && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleRescheduleRequest(selectedRequest)}
                      className="flex items-center gap-2"
                    >
                      <Clock className="h-4 w-4" />
                      {selectedRequest.status === 'Avbokad' ? 'Återaktivera & Omschemalägg' : 'Omschemalägg'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: "SMS skickat",
                          description: `Påminnelse skickad till ${selectedRequest.customerName}`
                        });
                      }}
                      className="flex items-center gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Skicka påminnelse
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Pickup Dialog */}
      <Dialog open={isAddPickupDialogOpen} onOpenChange={setIsAddPickupDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRequestForScheduling 
                ? `Schemalägg hämtning - ${selectedRequestForScheduling.id}`
                : 'Lägg till hämtning från förfrågningar'
              }
            </DialogTitle>
          </DialogHeader>
          
          {selectedRequestForScheduling ? (
            // Single request scheduling
            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center gap-4 mb-4">
                  <Badge className="bg-blue-500 text-white">
                    {selectedRequestForScheduling.status}
                  </Badge>
                  <span className="font-medium">ID: {selectedRequestForScheduling.id}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {selectedRequestForScheduling.customerName}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {selectedRequestForScheduling.phone}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      {selectedRequestForScheduling.carBrand} {selectedRequestForScheduling.carModel}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedRequestForScheduling.registrationNumber}
                    </p>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground flex items-center gap-2 mb-4">
                  <MapPin className="h-4 w-4" />
                  {selectedRequestForScheduling.address}
                </p>
                
                {selectedRequestForScheduling.notes && (
                  <p className="text-sm bg-gray-50 p-2 rounded mb-4">
                    <strong>Anteckningar:</strong> {selectedRequestForScheduling.notes}
                  </p>
                )}

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="schedule-date">Datum:</Label>
                    <Input
                      type="date"
                      id="schedule-date"
                      defaultValue={format(selectedDate, 'yyyy-MM-dd')}
                      className="w-40"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="schedule-time">Tid:</Label>
                    <Input
                      type="time"
                      id="schedule-time"
                      defaultValue="09:00"
                      className="w-32"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      const dateInput = document.getElementById('schedule-date') as HTMLInputElement;
                      const timeInput = document.getElementById('schedule-time') as HTMLInputElement;
                      const newDate = new Date(dateInput.value);
                      const newTime = timeInput.value;
                      handleAddRequestToSchedule(selectedRequestForScheduling.id, newDate, newTime);
                    }}
                    className="bg-tenant-primary hover:bg-tenant-primary/90 text-tenant-primary-foreground"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Schemalägg
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            // Multiple requests list
            <div className="space-y-4">
              {availableRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Inga tillgängliga förfrågningar att schemalägga
                </p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {availableRequests.map(request => (
                    <Card key={request.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <Badge className="bg-blue-500 text-white">
                              {request.status}
                            </Badge>
                            <span className="font-medium">ID: {request.id}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="font-semibold flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {request.customerName}
                              </p>
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                {request.phone}
                              </p>
                            </div>
                            <div>
                              <p className="font-semibold flex items-center gap-2">
                                <Car className="h-4 w-4" />
                                {request.carBrand} {request.carModel}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {request.registrationNumber}
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground flex items-center gap-2 mb-3">
                            <MapPin className="h-4 w-4" />
                            {request.address}
                          </p>
                          
                          {request.notes && (
                            <p className="text-sm bg-gray-50 p-2 rounded">
                              <strong>Anteckningar:</strong> {request.notes}
                            </p>
                          )}
                        </div>
                        
                        <div className="ml-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              type="date"
                              id={`date-${request.id}`}
                              defaultValue={format(new Date(), 'yyyy-MM-dd')}
                              className="w-36"
                            />
                            <Input
                              type="time"
                              id={`time-${request.id}`}
                              defaultValue="09:00"
                              className="w-24"
                            />
                          </div>
                          <Button
                            onClick={() => {
                              const dateInput = document.getElementById(`date-${request.id}`) as HTMLInputElement;
                              const timeInput = document.getElementById(`time-${request.id}`) as HTMLInputElement;
                              const newDate = new Date(dateInput.value);
                              const newTime = timeInput.value;
                              handleAddRequestToSchedule(request.id, newDate, newTime);
                            }}
                            className="w-full bg-tenant-primary hover:bg-tenant-primary/90 text-tenant-primary-foreground"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Lägg till
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Omschemalägg hämtning</DialogTitle>
          </DialogHeader>
          
          {rescheduleRequest && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-medium">{rescheduleRequest.customerName}</p>
                <p className="text-sm text-muted-foreground">
                  {rescheduleRequest.carBrand} {rescheduleRequest.carModel} ({rescheduleRequest.registrationNumber})
                </p>
                <p className="text-sm text-muted-foreground">Nuvarande tid: {format(rescheduleRequest.date, 'dd/MM')} {rescheduleRequest.time}</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="reschedule-date">Nytt datum:</Label>
                  <Input
                    type="date"
                    id="reschedule-date"
                    defaultValue={format(rescheduleRequest.date, 'yyyy-MM-dd')}
                    className="w-40"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="reschedule-time">Ny tid:</Label>
                  <Input
                    type="time"
                    id="reschedule-time"
                    defaultValue={rescheduleRequest.time}
                    className="w-32"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="send-sms"
                  defaultChecked={true}
                  className="rounded"
                />
                <Label htmlFor="send-sms" className="text-sm">
                  Skicka SMS till kunden om ändringen
                </Label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => {
                    console.log('🔥 SAVE BUTTON CLICKED');
                    const dateInput = document.getElementById('reschedule-date') as HTMLInputElement;
                    const timeInput = document.getElementById('reschedule-time') as HTMLInputElement;
                    const smsCheckbox = document.getElementById('send-sms') as HTMLInputElement;
                    
                    console.log('🔥 FORM VALUES:', {
                      date: dateInput?.value,
                      time: timeInput?.value,
                      sms: smsCheckbox?.checked
                    });

                    if (!dateInput?.value || !timeInput?.value) {
                      console.log('❌ MISSING VALUES - ABORTING');
                      return;
                    }
                    
                    const newDate = new Date(dateInput.value);
                    const newTime = timeInput.value;
                    const sendSMS = smsCheckbox.checked;
                    
                    handleRescheduleSubmit(newDate, newTime, sendSMS);
                  }}
                  className="flex-1"
                >
                  Spara ändringar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsRescheduleDialogOpen(false)}
                  className="flex-1"
                >
                  Avbryt
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reschedule Confirmation Dialog */}
      <Dialog open={rescheduleConfirmOpen} onOpenChange={setRescheduleConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bekräfta omschemaläggning</DialogTitle>
          </DialogHeader>
          
          {rescheduleData && (
            <div className="space-y-4">
              <p className="text-sm">
                Är du säker på att du vill ändra hämtningstiden till:
              </p>
              
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <p className="font-medium">
                  {format(rescheduleData.newDate, 'dd MMMM yyyy')} kl. {rescheduleData.newTime}
                </p>
                {rescheduleData.sendSMS && (
                  <p className="text-sm text-blue-600 mt-1">
                    ✓ SMS kommer att skickas till kunden
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => {
                    console.log('🔥 CONFIRM RESCHEDULE BUTTON CLICKED');
                    confirmReschedule();
                  }}
                  className="flex-1"
                >
                  Ja, bekräfta
                </Button>
                <Button
                  variant="outline"
                  onClick={cancelReschedule}
                  className="flex-1"
                >
                  Ändra igen
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setRescheduleConfirmOpen(false);
                    setRescheduleData(null);
                    setRescheduleRequest(null);
                  }}
                  className="flex-1"
                >
                  Avbryt
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchedulingManagement;