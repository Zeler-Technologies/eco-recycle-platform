// hooks/useDriverIntegration.ts
import { useState, useEffect, useCallback } from 'react';
import { VehiclePricingCalculator, VehicleInfo, PricingResult } from '@/utils/pricingCalculator';

interface PickupOrder {
  id: string;
  vehicle_year?: number;
  vehicle_make?: string;
  vehicle_model?: string;
  fuel_type?: 'gasoline' | 'ethanol' | 'electric' | 'other';
  pickup_distance?: number;
  base_price?: number;
  estimated_price?: number;
  pricing_breakdown?: any[];
  // ... other existing fields
}

interface UseDriverIntegrationReturn {
  // Existing functions
  assignDriver: (orderId: string, driverId: string) => Promise<void>;
  unassignDriver: (orderId: string) => Promise<void>;
  
  // New pricing functions
  calculateOrderPrice: (order: PickupOrder) => Promise<PricingResult | null>;
  updateOrderPricing: (orderId: string, vehicleInfo: VehicleInfo, basePrice?: number) => Promise<void>;
  bulkCalculatePricing: (orders: PickupOrder[]) => Promise<PickupOrder[]>;
  
  // State
  isCalculatingPrice: boolean;
  pricingError: string | null;
}

export const useDriverIntegration = (tenantId: string | number = '1'): UseDriverIntegrationReturn => {
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);

  // Calculate price for a specific pickup order
  const calculateOrderPrice = useCallback(async (order: PickupOrder): Promise<PricingResult | null> => {
    try {
      setIsCalculatingPrice(true);
      setPricingError(null);

      // Extract vehicle info from pickup order
      const vehicleInfo: VehicleInfo = {
        year: order.vehicle_year || new Date().getFullYear(),
        fuelType: order.fuel_type || 'gasoline',
        pickupDistance: order.pickup_distance || 0,
        isDropoffComplete: order.pickup_distance === 0,
        // Add more fields based on your order structure
        hasEngine: true, // You might want to get this from order data
        hasFourWheels: true, // You might want to get this from order data
      };

      const basePrice = order.base_price || 3000; // Default base price
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

  // Update pricing for a specific order and save to database
  const updateOrderPricing = useCallback(async (orderId: string, vehicleInfo: VehicleInfo, basePrice: number = 3000) => {
    try {
      setIsCalculatingPrice(true);
      
      // Calculate new pricing
      const pricingResult = await VehiclePricingCalculator.getPriceBreakdown(tenantId, vehicleInfo, basePrice);
      
      // Here you would update your database - replace with your actual Supabase call
      // const { error } = await supabase
      //   .from('pickup_orders')
      //   .update({
      //     estimated_price: pricingResult.totalPrice,
      //     pricing_breakdown: pricingResult.breakdown,
      //     base_price: basePrice,
      //     updated_at: new Date().toISOString()
      //   })
      //   .eq('id', orderId);
      
      console.log(`Updated pricing for order ${orderId}:`, pricingResult);
      
    } catch (error) {
      console.error('Error updating order pricing:', error);
      setPricingError(error instanceof Error ? error.message : 'Failed to update pricing');
    } finally {
      setIsCalculatingPrice(false);
    }
  }, [tenantId]);

  // Calculate pricing for multiple orders (bulk operation)
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

  // Existing driver assignment functions would go here
  const assignDriver = useCallback(async (orderId: string, driverId: string) => {
    // Your existing assignment logic
    console.log(`Assigning driver ${driverId} to order ${orderId}`);
  }, []);

  const unassignDriver = useCallback(async (orderId: string) => {
    // Your existing unassignment logic
    console.log(`Unassigning driver from order ${orderId}`);
  }, []);

  return {
    // Existing functions
    assignDriver,
    unassignDriver,
    
    // New pricing functions
    calculateOrderPrice,
    updateOrderPricing,
    bulkCalculatePricing,
    
    // State
    isCalculatingPrice,
    pricingError
  };
};