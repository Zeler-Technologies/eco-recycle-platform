// hooks/useDriverIntegration.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VehiclePricingCalculator, VehicleInfo, PricingResult } from '@/utils/pricingCalculator';

// Export types for use in other components
export type DriverStatus = 'available' | 'busy' | 'offline';
export type PickupStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
export type FuelType = 'gasoline' | 'ethanol' | 'electric' | 'other';

export interface PickupOrder {
  id: string;
  customer_name?: string;
  vehicle_year?: number;
  vehicle_make?: string;
  vehicle_model?: string;
  fuel_type?: FuelType;
  pickup_distance?: number;
  pickup_location?: string;
  dropoff_location?: string;
  status?: PickupStatus;
  assigned_driver_id?: string;
  base_price?: number;
  estimated_price?: number;
  pricing_breakdown?: any[];
  created_at?: string;
  updated_at?: string;
  pickup_notes?: string;
  priority?: number;
  scheduled_pickup_time?: string;
}

export interface Driver {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  vehicle_type?: string;
  current_location?: string;
  status?: DriverStatus;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StatusHistoryItem {
  id: string;
  pickup_order_id: string;
  driver_id: string;
  old_status: string;
  new_status: string;
  notes?: string;
  created_at: string;
}

interface UseDriverIntegrationReturn {
  // Core data
  pickups: PickupOrder[];
  driver: Driver | null;
  loading: boolean;
  error: string | null;
  
  // Status management
  updateDriverStatus: (driverId: string, status: DriverStatus) => Promise<void>;
  updatePickupStatus: (pickupId: string, status: PickupStatus, notes?: string) => Promise<void>;
  
  // Status history
  statusHistory: StatusHistoryItem[];
  historyLoading: boolean;
  
  // Driver assignment
  assignDriver: (orderId: string, driverId: string) => Promise<void>;
  unassignDriver: (orderId: string) => Promise<void>;
  
  // Pricing functions
  calculateOrderPrice: (order: PickupOrder) => Promise<PricingResult | null>;
  updateOrderPricing: (orderId: string, vehicleInfo: VehicleInfo, basePrice?: number) => Promise<void>;
  bulkCalculatePricing: (orders: PickupOrder[]) => Promise<PickupOrder[]>;
  
  // Pricing state
  isCalculatingPrice: boolean;
  pricingError: string | null;
  
  // Data refresh
  refreshData: () => Promise<void>;
}

export const useDriverIntegration = (
  tenantId: string | number = '1',
  driverId?: string
): UseDriverIntegrationReturn => {
  // Core state
  const [pickups, setPickups] = useState<PickupOrder[]>([]);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Status history state
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // Pricing state
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);

  // Fetch pickup orders
  const fetchPickups = useCallback(async () => {
    try {
      setError(null);
      
      // Use direct query to avoid TypeScript issues
      const { data, error: fetchError } = await (supabase as any)
        .from('pickup_orders')
        .select('*')
        .eq('tenant_id', String(tenantId))
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching pickups:', fetchError);
        setError('Failed to load pickup orders');
        return;
      }

      setPickups(data || []);
    } catch (err) {
      console.error('Error in fetchPickups:', err);
      setError('Failed to load pickup orders');
      setPickups([]); // Set empty array as fallback
    }
  }, [tenantId]);

  // Fetch driver information
  const fetchDriver = useCallback(async () => {
    if (!driverId) return;
    
    try {
      const { data, error: fetchError } = await (supabase as any)
        .from('drivers')
        .select('*')
        .eq('id', driverId)
        .eq('tenant_id', String(tenantId))
        .single();

      if (fetchError) {
        console.error('Error fetching driver:', fetchError);
        setError('Failed to load driver information');
        return;
      }

      setDriver(data);
    } catch (err) {
      console.error('Error in fetchDriver:', err);
      setError('Failed to load driver information');
    }
  }, [driverId, tenantId]);

  // Fetch status history
  const fetchStatusHistory = useCallback(async () => {
    if (!driverId) return;
    
    try {
      setHistoryLoading(true);
      
      const { data, error: fetchError } = await (supabase as any)
        .from('driver_status_history')
        .select('*')
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) {
        console.error('Error fetching status history:', fetchError);
        return;
      }

      setStatusHistory(data || []);
    } catch (err) {
      console.error('Error in fetchStatusHistory:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [driverId]);

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchPickups(),
          fetchDriver(),
          fetchStatusHistory()
        ]);
      } catch (err) {
        console.error('Error loading initial data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchPickups, fetchDriver, fetchStatusHistory]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchPickups(),
      fetchDriver(),
      fetchStatusHistory()
    ]);
  }, [fetchPickups, fetchDriver, fetchStatusHistory]);

  // Update driver status
  const updateDriverStatus = useCallback(async (driverId: string, status: DriverStatus) => {
    try {
      setError(null);
      
      const { error: updateError } = await (supabase as any)
        .from('drivers')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', driverId);

      if (updateError) {
        throw new Error(`Failed to update driver status: ${updateError.message}`);
      }

      // Update local driver state
      if (driver && driver.id === driverId) {
        setDriver(prev => prev ? { ...prev, status } : null);
      }

      // Refresh status history
      await fetchStatusHistory();
      
    } catch (err) {
      console.error('Error updating driver status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update driver status');
    }
  }, [driver, fetchStatusHistory]);

  // Update pickup status
  const updatePickupStatus = useCallback(async (pickupId: string, status: PickupStatus, notes?: string) => {
    try {
      setError(null);
      
      const { error: updateError } = await (supabase as any)
        .from('pickup_orders')
        .update({ 
          status, 
          pickup_notes: notes,
          updated_at: new Date().toISOString() 
        })
        .eq('id', pickupId);

      if (updateError) {
        throw new Error(`Failed to update pickup status: ${updateError.message}`);
      }

      // Update local pickups state
      setPickups(prev => 
        prev.map(pickup => 
          pickup.id === pickupId 
            ? { ...pickup, status, pickup_notes: notes }
            : pickup
        )
      );

      // Add to status history if driver is involved
      if (driverId) {
        const { error: historyError } = await (supabase as any)
          .from('driver_status_history')
          .insert({
            pickup_order_id: pickupId,
            driver_id: driverId,
            new_status: status,
            notes: notes,
            created_at: new Date().toISOString()
          });

        if (!historyError) {
          await fetchStatusHistory();
        }
      }
      
    } catch (err) {
      console.error('Error updating pickup status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update pickup status');
    }
  }, [driverId, fetchStatusHistory]);

  // Driver assignment functions
  const assignDriver = useCallback(async (orderId: string, driverId: string) => {
    try {
      setError(null);
      
      const { error: assignError } = await (supabase as any)
        .from('pickup_orders')
        .update({ 
          assigned_driver_id: driverId,
          status: 'assigned' as PickupStatus,
          updated_at: new Date().toISOString() 
        })
        .eq('id', orderId);

      if (assignError) {
        throw new Error(`Failed to assign driver: ${assignError.message}`);
      }

      await refreshData();
      
    } catch (err) {
      console.error('Error assigning driver:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign driver');
    }
  }, [refreshData]);

  const unassignDriver = useCallback(async (orderId: string) => {
    try {
      setError(null);
      
      const { error: unassignError } = await (supabase as any)
        .from('pickup_orders')
        .update({ 
          assigned_driver_id: null,
          status: 'pending' as PickupStatus,
          updated_at: new Date().toISOString() 
        })
        .eq('id', orderId);

      if (unassignError) {
        throw new Error(`Failed to unassign driver: ${unassignError.message}`);
      }

      await refreshData();
      
    } catch (err) {
      console.error('Error unassigning driver:', err);
      setError(err instanceof Error ? err.message : 'Failed to unassign driver');
    }
  }, [refreshData]);

  // Pricing functions (from previous implementation)
  const calculateOrderPrice = useCallback(async (order: PickupOrder): Promise<PricingResult | null> => {
    try {
      setIsCalculatingPrice(true);
      setPricingError(null);

      const vehicleInfo: VehicleInfo = {
        year: order.vehicle_year || new Date().getFullYear(),
        fuelType: (order.fuel_type || 'gasoline') as FuelType,
        pickupDistance: order.pickup_distance || 0,
        isDropoffComplete: order.pickup_distance === 0,
        hasEngine: true,
        hasFourWheels: true,
      };

      const basePrice = order.base_price || 3000;
      const result = await VehiclePricingCalculator.getPriceBreakdown(tenantId, vehicleInfo, basePrice);
      
      return result;
    } catch (error) {
      console.error('Error calculating order price:', error);
      setPricingError(error instanceof Error ? error.message : 'Pricing calculation failed');
      return null;
    } finally {
      setIsCalculatingPrice(false);
    }
  }, [tenantId]);

  const updateOrderPricing = useCallback(async (orderId: string, vehicleInfo: VehicleInfo, basePrice: number = 3000) => {
    try {
      setIsCalculatingPrice(true);
      
      const pricingResult = await VehiclePricingCalculator.getPriceBreakdown(tenantId, vehicleInfo, basePrice);
      
      const { error: updateError } = await (supabase as any)
        .from('pickup_orders')
        .update({
          estimated_price: pricingResult.totalPrice,
          pricing_breakdown: pricingResult.breakdown,
          base_price: basePrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      if (updateError) {
        throw new Error(`Failed to update pricing: ${updateError.message}`);
      }

      // Update local state
      setPickups(prev => 
        prev.map(pickup => 
          pickup.id === orderId 
            ? { 
                ...pickup, 
                estimated_price: pricingResult.totalPrice,
                pricing_breakdown: pricingResult.breakdown,
                base_price: basePrice
              }
            : pickup
        )
      );
      
    } catch (error) {
      console.error('Error updating order pricing:', error);
      setPricingError(error instanceof Error ? error.message : 'Failed to update pricing');
    } finally {
      setIsCalculatingPrice(false);
    }
  }, [tenantId]);

  const bulkCalculatePricing = useCallback(async (orders: PickupOrder[]): Promise<PickupOrder[]> => {
    try {
      setIsCalculatingPrice(true);
      
      const updatedOrders = await Promise.all(
        orders.map(async (order) => {
          const pricingResult = await calculateOrderPrice(order);
          
          if (pricingResult) {
            return {
              ...order,
              estimated_price: pricingResult.totalPrice,
              pricing_breakdown: pricingResult.breakdown
            };
          }
          
          return order;
        })
      );
      
      return updatedOrders;
    } catch (error) {
      console.error('Error in bulk pricing calculation:', error);
      setPricingError('Bulk pricing calculation failed');
      return orders;
    } finally {
      setIsCalculatingPrice(false);
    }
  }, [calculateOrderPrice]);

  return {
    // Core data
    pickups,
    driver,
    loading,
    error,
    
    // Status management
    updateDriverStatus,
    updatePickupStatus,
    
    // Status history
    statusHistory,
    historyLoading,
    
    // Driver assignment
    assignDriver,
    unassignDriver,
    
    // Pricing functions
    calculateOrderPrice,
    updateOrderPricing,
    bulkCalculatePricing,
    
    // Pricing state
    isCalculatingPrice,
    pricingError,
    
    // Data refresh
    refreshData
  };
};