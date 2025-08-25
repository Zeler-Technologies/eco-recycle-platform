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
  status: 'Förfrågan' | 'Bekräftad' | 'Klar' | 'Avbokad';
  assignedDriver?: string;
  notes?: string;
  // Raw backend status for precise logic (e.g., rejected vs cancelled)
  rawPickupStatus?: string;
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
  const [isDayOverviewOpen, setIsDayOverviewOpen] = useState(false);
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
  const [isConfirmingReschedule, setIsConfirmingReschedule] = useState(false);

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

  // Set up real-time subscription for status changes
  useEffect(() => {
    if (!user?.tenant_id) return;

    const channel = supabase.channel('scheduling-status-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pickup_orders',
        filter: `tenant_id=eq.${user.tenant_id}`
      }, () => {
        fetchCustomerRequests();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public', 
        table: 'customer_requests',
        filter: `tenant_id=eq.${user.tenant_id}`
      }, () => {
        fetchCustomerRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  // Set up real-time subscription for status changes (unified approach)
  useEffect(() => {
    if (!user?.tenant_id) return;

    const channel = supabase.channel('scheduling-status-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pickup_orders',
        filter: `tenant_id=eq.${user.tenant_id}`
      }, () => {
        console.log('🔄 Pickup order status changed, refreshing data...');
        fetchCustomerRequests();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public', 
        table: 'customer_requests',
        filter: `tenant_id=eq.${user.tenant_id}`
      }, () => {
        console.log('🔄 Customer request changed, refreshing data...');
        fetchCustomerRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.tenant_id]);

  const fetchCustomerRequests = async () => {
    if (!user?.tenant_id) return;
    
    try {
      setRequestsLoading(true);
      console.log('🔄 Fetching unified pickup data for tenant:', user.tenant_id);

      // Fetch unified pickup data using new view
      const { data: unifiedData, error: unifiedError } = await supabase
        .from('v_unified_pickup_status')
        .select('*')
        .eq('tenant_id', user.tenant_id);

      if (unifiedError) {
        console.error('❌ Error fetching unified pickup data:', unifiedError);
        toast({
          title: "Fel",
          description: "Kunde inte ladda upphämtningsdata",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Unified pickup data fetched:', unifiedData?.length || 0);
      
      // Convert unified data to component format
      const formattedRequests: Request[] = (unifiedData || []).map((unified: any) => {
        
        // Get the most current status from pickup_orders table (single source of truth)
        let status: 'Förfrågan' | 'Bekräftad' | 'Klar' | 'Avbokad';
        const actualStatus = unified.current_status;
        
        switch (actualStatus) {
          case 'pending':
            status = 'Förfrågan';
            break;
          case 'scheduled':
          case 'assigned':
            status = 'Bekräftad';
            break;
          case 'in_progress':
            status = 'Bekräftad';
            break;
          case 'completed':
            status = 'Klar';
            break;
          case 'cancelled':
          case 'rejected':
            status = 'Avbokad';
            break;
          default:
            status = 'Förfrågan';
        }

        // Use pickup order's scheduled date if available, otherwise use request created date
        const requestDate = unified.scheduled_pickup_date 
          ? new Date(unified.scheduled_pickup_date + 'T09:00:00')
          : new Date(unified.request_created_at);

        return {
          id: unified.pickup_order_id,
          pickupOrderId: unified.pickup_order_id,
          customerRequestId: unified.customer_request_id,
          date: requestDate,
          time: requestDate.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }),
          customerName: unified.owner_name || 'Okänd kund',
          address: unified.pickup_address || 'Ingen adress angiven',
          phone: unified.contact_phone || 'Inget telefonnummer',
          carBrand: unified.car_brand || 'Okänt märke',
          carModel: unified.car_model || 'Okänd modell',
          registrationNumber: unified.car_registration_number || 'Okänt reg.nr',
          status,
          notes: unified.driver_notes || null,
          assignedDriver: unified.assigned_driver_id ? 
            drivers.find(d => d.id === unified.assigned_driver_id)?.name || 'Tilldelad förare' : 
            null,
          rawPickupStatus: actualStatus
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
      case 'Klar': return 'bg-gray-500 text-white';
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

      // Use pickupOrderId if it exists, otherwise use the customerRequestId
      const pickupOrderId = currentRequest?.pickupOrderId;
      const customerRequestId = currentRequest?.customerRequestId || requestId;

      console.log('🔧 ASSIGN DEBUG:', {
        requestId,
        pickupOrderId,
        customerRequestId,
        hasPickupOrder: !!pickupOrderId
      });

      if (pickupOrderId) {
        // CASE 1: Pickup order exists - use driver_assignments table
        console.log('🔧 Using driver_assignments for existing pickup order');
        
        // First, deactivate any existing assignments for this pickup
        const { error: deactivateError } = await supabase
          .from('driver_assignments')
          .update({ is_active: false })
          .eq('pickup_order_id', pickupOrderId)
          .eq('is_active', true);

        if (deactivateError) {
          console.error('Error deactivating existing assignments:', deactivateError);
        }

        // Create driver assignment
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
            description: `Kunde inte tilldela föraren: ${assignmentError.message}`,
            variant: "destructive"
          });
          return;
        }

        // Update pickup status via edge function (avoids enum casting issues)
        const { data: statusResp, error: statusError } = await supabase.functions.invoke('update-pickup-status', {
          body: {
            p_pickup_order_id: pickupOrderId,
            p_new_status: 'assigned',
            p_driver_notes: `Assigned to ${selectedDriverName} via admin interface`,
            p_completion_photos: null
          }
        });

        if (statusError) {
          console.error('Error updating status:', statusError);
          toast({
            title: "Fel",
            description: `Kunde inte uppdatera status: ${statusError.message}`,
            variant: "destructive"
          });
          return;
        }
      } else {
        // CASE 2: No pickup order - create one first, then assign
        console.log('🔧 Creating pickup order for customer request');
        
        const { data: newPickupOrder, error: createError } = await supabase
          .from('pickup_orders')
          .insert({
            customer_request_id: customerRequestId,
            scheduled_pickup_date: format(new Date(), 'yyyy-MM-dd'),
            status: 'assigned',
            tenant_id: user?.tenant_id || 1,
            driver_id: driverId,
            assigned_driver_id: driverId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating pickup order:', createError);
          toast({
            title: "Fel",
            description: `Kunde inte skapa hämtningsorder: ${createError.message}`,
            variant: "destructive"
          });
          return;
        }

        // Create driver assignment for the new pickup order
        const { error: assignmentError } = await supabase
          .from('driver_assignments')
          .insert({
            pickup_order_id: newPickupOrder.id,
            customer_request_id: customerRequestId,
            driver_id: driverId,
            status: 'scheduled',
            assigned_at: new Date().toISOString(),
            is_active: true,
            assignment_type: 'pickup',
            role: 'primary'
          });

        if (assignmentError) {
          console.error('Error creating assignment for new pickup:', assignmentError);
          toast({
            title: "Fel",
            description: `Kunde inte tilldela föraren: ${assignmentError.message}`,
            variant: "destructive"
          });
          return;
        }
      }

      // Refresh data to show changes
      await fetchCustomerRequests();

      toast({
        title: "Framgång",
        description: `${selectedDriverName} har tilldelats förfrågan`,
        variant: "default"
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
      const pickupOrderId = currentRequest?.pickupOrderId;
      const customerRequestId = currentRequest?.customerRequestId || requestId;

      console.log('🚫 CANCEL REQUEST DEBUG:', {
        requestId,
        pickupOrderId,
        customerRequestId,
        currentRequest
      });

      // For unassigned requests, update customer_requests directly
      if (!pickupOrderId || !currentRequest?.assignedDriver) {
        console.log('🚫 Cancelling unassigned request directly...');
        
        // Update customer request status to cancelled
        const { error: customerError } = await supabase
          .from('customer_requests')
          .update({ 
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', customerRequestId);

        if (customerError) {
          console.error('Error cancelling customer request:', customerError);
          toast({
            title: "Fel",
            description: "Kunde inte avboka förfrågan",
            variant: "destructive"
          });
          return;
        }

        // If pickup order exists, update it too
        if (pickupOrderId) {
          const { error: pickupError } = await supabase
            .from('pickup_orders')
            .update({
              status: 'cancelled',
              driver_notes: 'Cancelled by admin',
              updated_at: new Date().toISOString()
            })
            .eq('id', pickupOrderId);

          if (pickupError) {
            console.warn('Warning updating pickup order:', pickupError);
            // Don't fail the whole operation for this
          }
        }

      } else {
        // For assigned requests, use the RPC function
        console.log('🚫 Cancelling assigned request via RPC...');
        
        const { error } = await supabase.rpc('update_pickup_status_unified', {
          p_pickup_order_id: pickupOrderId,
          p_new_status: 'cancelled',
          p_driver_notes: 'Cancelled by admin',
          p_completion_photos: null
        });

        if (error) {
          console.error('Error cancelling assigned request:', error);
          toast({
            title: "Fel",
            description: "Kunde inte avboka förfrågan",
            variant: "destructive"
          });
          return;
        }
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
      const { error } = await supabase.rpc('update_pickup_status_unified', {
        p_pickup_order_id: pickupOrderId,
        p_new_status: 'scheduled',
        p_driver_notes: `Scheduled by admin for ${pickupDateTime}`,
        p_completion_photos: null
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
    if (isConfirmingReschedule || !rescheduleData) {
      return;
    }
    
    setIsConfirmingReschedule(true);
    console.log('🔥 CONFIRM RESCHEDULE FUNCTION CALLED');
    console.log('🔥 RESCHEDULE DATA:', rescheduleData);

    const originalRequest = requests.find(r => r.id === rescheduleData.requestId);
    const wasAvbokad = originalRequest?.status === 'Avbokad';
    const wasRejected = originalRequest?.rawPickupStatus === 'rejected';
    const pickupOrderId = originalRequest?.pickupOrderId || rescheduleData.requestId;

    console.log('🔄 RESCHEDULE DEBUG:', {
      requestId: rescheduleData.requestId,
      pickupOrderId,
      originalRequest: originalRequest,
      originalStatus: originalRequest?.status,
      rawPickupStatus: originalRequest?.rawPickupStatus,
      wasAvbokad,
      wasRejected,
      newDate: rescheduleData.newDate,
      newTime: rescheduleData.newTime
    });

    try {
      const pickupDateTime = format(rescheduleData.newDate, 'yyyy-MM-dd');
      
      console.log('🔄 UPDATING PICKUP DATE...');

      // If the original was explicitly rejected, deactivate any active driver assignments
      if (wasRejected) {
        console.log('🔧 Clearing driver assignments for rejected pickup before reschedule...');
        const { error: deactivateError } = await supabase
          .from('driver_assignments')
          .update({
            is_active: false,
            completed_at: new Date().toISOString(),
            notes: 'Assignment cleared due to reschedule after rejection'
          })
          .eq('customer_request_id', rescheduleData.requestId)
          .eq('is_active', true);
        
        if (deactivateError) {
          console.error('Error deactivating driver assignments:', deactivateError);
        } else {
          console.log('✅ Driver assignments deactivated for rejected pickup');
        }
      }
      
      // First ensure pickup order exists - create if it doesn't exist
      let actualPickupOrderId = pickupOrderId;
      
      // Check if pickup order exists
      const { data: existingOrder, error: checkError } = await supabase
        .from('pickup_orders')
        .select('id')
        .eq('id', pickupOrderId)
        .maybeSingle();
      
      if (checkError && checkError.code === 'PGRST116') {
        // Pickup order doesn't exist, create it
        console.log('🔄 Creating pickup order...');
        const { data: newOrder, error: createError } = await supabase
          .from('pickup_orders')
          .insert({
            customer_request_id: rescheduleData.requestId,
            scheduled_pickup_date: pickupDateTime,
            status: 'scheduled',
            tenant_id: user?.tenant_id || 1, // Use dynamic tenant_id
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            driver_id: null,
            assigned_driver_id: null
          })
          .select('id')
          .single();
          
        if (createError) {
          console.error('❌ Error creating pickup order:', createError);
          toast({
            title: "Fel",
            description: "Kunde inte skapa hämtningsorder",
            variant: "destructive"
          });
          return;
        }
        
        actualPickupOrderId = newOrder.id;
        console.log('✅ Pickup order created successfully');
      } else if (checkError) {
        console.error('❌ Error checking pickup order:', checkError);
        toast({
          title: "Fel",
          description: "Kunde inte kontrollera hämtningsorder",
          variant: "destructive"
        });
        return;
      } else {
        // Update existing pickup order - clear driver assignments if rejected
        const updateData: any = {
          scheduled_pickup_date: pickupDateTime,
          updated_at: new Date().toISOString()
        };

        // If this was a rejected pickup, clear driver assignments and reset to scheduled
        if (wasRejected) {
          updateData.status = 'scheduled';
          updateData.driver_id = null;
          updateData.assigned_driver_id = null;
          updateData.driver_notes = 'Omschemalagd efter avvisning - ny tilldelning krävs';
          console.log('🔧 Clearing driver assignment from pickup order for rejected reschedule');
        }

        const { error: dateError } = await supabase
          .from('pickup_orders')
          .update(updateData)
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
      }

      console.log('✅ Pickup date updated successfully');

      // Update customer request status directly instead of using the problematic function
      const newStatus = wasAvbokad ? 'scheduled' : 'scheduled';
      const { error: statusError } = await supabase
        .from('customer_requests')
        .update({
          status: newStatus,
          pickup_date: pickupDateTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', rescheduleData.requestId);

      // Also update pickup order status to ensure consistency
      if (actualPickupOrderId) {
        const { error: pickupStatusError } = await supabase
          .from('pickup_orders')
          .update({
            status: 'scheduled',
            updated_at: new Date().toISOString()
          })
          .eq('id', actualPickupOrderId);

        if (pickupStatusError) {
          console.warn('Warning updating pickup order status:', pickupStatusError);
          // Don't fail the whole operation for this
        }
      }

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
        description: `Ny tid: ${format(rescheduleData.newDate, 'dd/MM')} ${rescheduleData.newTime}${wasAvbokad ? ' - Status ändrad till Schemalagd' : ''}`
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
    } finally {
      setIsConfirmingReschedule(false);
    }

    console.log('🔄 CLEANING UP STATE...');
    setRescheduleConfirmOpen(false);
    setRescheduleData(null);
    setRescheduleRequest(null);
    setIsDetailDialogOpen(false);
    setIsConfirmingReschedule(false);
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
          const isSelectedDay = isSameDay(day, selectedDate);
          
          return (
            <div 
              key={day.toString()}
              className={`min-h-[80px] p-2 border rounded-lg cursor-pointer transition-colors ${
                isSelectedDay ? 'bg-gray-100 border-gray-400' : 
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
                  <div 
                    className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDate(day);
                      setIsDayOverviewOpen(true);
                    }}
                  >
                    +{dayRequests.length - 2} fler - Klicka för att se alla
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
                <SelectItem value="Klar">Klar</SelectItem>
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
                           {(request.assignedDriver || request.rawPickupStatus === 'assigned' || request.rawPickupStatus === 'in_progress') && (
                              <p className="text-sm text-destructive flex items-center gap-1">
                               <User className="h-3 w-3" />
                               Förare: {request.assignedDriver || 'Tilldelad förare'}
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
                {/* OK Button - Green color at far left */}
                <Button
                  onClick={() => setIsDetailDialogOpen(false)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  OK
                </Button>
                
                {selectedRequest.status === 'Förfrågan' && (
                  <>
                    {/* Check if pickup date is today or in the future */}
                    {selectedRequest.date >= new Date(new Date().setHours(0,0,0,0)) ? (
                      <Button
                        onClick={() => handleConfirmRequest(selectedRequest.id)}
                        className="flex items-center gap-2"
                        disabled={!selectedRequest.assignedDriver}
                      >
                        <Check className="h-4 w-4" />
                        Bekräfta hämtning
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => handleRescheduleRequest(selectedRequest)}
                        className="flex items-center gap-2"
                      >
                        <Clock className="h-4 w-4" />
                        Omschemalägg (försenad)
                      </Button>
                    )}
                  </>
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
                
                {/* Avboka button at far right - hidden for cancelled and completed pickups */}
                {selectedRequest.status !== 'Avbokad' && selectedRequest.status !== 'Klar' && (
                  <Button
                    variant="destructive"
                    onClick={() => handleCancelRequest(selectedRequest.id)}
                    className="flex items-center gap-2 ml-auto"
                  >
                    <X className="h-4 w-4" />
                    Avboka
                  </Button>
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
                  disabled={isConfirmingReschedule}
                  className="flex-1"
                >
                  {isConfirmingReschedule ? 'Bekräftar...' : 'Ja, bekräfta'}
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

      {/* Day Overview Dialog - Shows all pickups and drivers for selected day */}
      <Dialog open={isDayOverviewOpen} onOpenChange={setIsDayOverviewOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Översikt för {format(selectedDate, 'EEEE d MMMM yyyy')}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left side - All pickups for the day */}
            <div>
              <h3 className="text-lg font-medium mb-4">Upphämtningar denna dag ({getRequestsForDate(selectedDate).length})</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {getRequestsForDate(selectedDate).length === 0 ? (
                  <p className="text-gray-500 italic">Inga upphämtningar planerade för denna dag</p>
                ) : (
                  getRequestsForDate(selectedDate).map(request => (
                    <Card key={request.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" 
                          onClick={() => {
                            setSelectedRequest(request);
                            setIsDayOverviewOpen(false);
                            setIsDetailDialogOpen(true);
                          }}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{request.customerName}</h4>
                            <Badge className={getStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              <span>{request.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Car className="h-3 w-3" />
                              <span>{request.carBrand} {request.carModel} ({request.registrationNumber})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3" />
                              <span>{request.address}</span>
                            </div>
                            {request.assignedDriver && (
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3" />
                                <span>Tilldelad: {request.assignedDriver}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Right side - All available drivers */}
            <div>
              <h3 className="text-lg font-medium mb-4">Tillgängliga förare ({drivers.length})</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {driversLoading ? (
                  <p className="text-gray-500">Laddar förare...</p>
                ) : drivers.length === 0 ? (
                  <p className="text-gray-500 italic">Inga förare tillgängliga</p>
                ) : (
                  drivers.map(driver => (
                    <Card key={driver.id} className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{driver.name}</h4>
                          <div className="text-sm text-gray-600 flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            <span>{driver.phone}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            driver.status === 'Tillgänglig' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }>
                            {driver.status}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Quick assign buttons for unassigned pickups */}
                      <div className="mt-3 space-y-2">
                        {getRequestsForDate(selectedDate)
                          .filter(req => !req.assignedDriver && req.status === 'Förfrågan')
                          .slice(0, 3)
                          .map(request => (
                            <Button
                              key={request.id}
                              variant="outline"
                              size="sm"
                              className="w-full text-xs"
                              onClick={() => handleAssignDriver(request.id, driver.id)}
                            >
                              Tilldela till {request.customerName} ({request.time})
                            </Button>
                          ))}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setIsDayOverviewOpen(false)}>
              Stäng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchedulingManagement;