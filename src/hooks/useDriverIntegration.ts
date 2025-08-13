// hooks/useDriverIntegration.ts - TEMPORARY VERSION WITH MOCK DATA
import { useState, useEffect, useCallback } from 'react';

// Mock data to match what PantaBilenDriverApp expects
const MOCK_DRIVER = {
  driver_id: 'driver-123',
  full_name: 'Test Driver',
  driver_status: 'available',
  email: 'driver@scrapyard.se',
  phone: '+46700000000',
  vehicle_type: 'Truck',
  current_location: 'Stockholm',
  tenant_id: '1'
};

const MOCK_PICKUPS = [
  {
    id: 'pickup-1',
    pickup_id: 'pickup-1',
    car_registration_number: 'ABC123',
    car_year: 2015,
    car_brand: 'Volvo',
    car_model: 'XC90',
    owner_name: 'John Doe',
    pickup_address: 'Storgatan 1, Stockholm',
    final_price: 5000,
    status: 'scheduled',
    created_at: new Date().toISOString(),
    vehicle_year: 2015,
    vehicle_make: 'Volvo',
    vehicle_model: 'XC90',
    fuel_type: 'gasoline',
    pickup_distance: 15,
    customer_name: 'John Doe',
    pickup_location: 'Storgatan 1, Stockholm'
  },
  {
    id: 'pickup-2',
    pickup_id: 'pickup-2',
    car_registration_number: 'XYZ789',
    car_year: 2018,
    car_brand: 'BMW',
    car_model: '320i',
    owner_name: 'Jane Smith',
    pickup_address: 'Kungsgatan 10, Stockholm',
    final_price: 7500,
    status: 'in_progress',
    created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    vehicle_year: 2018,
    vehicle_make: 'BMW',
    vehicle_model: '320i',
    fuel_type: 'gasoline',
    pickup_distance: 25,
    customer_name: 'Jane Smith',
    pickup_location: 'Kungsgatan 10, Stockholm'
  },
  {
    id: 'pickup-3',
    pickup_id: 'pickup-3',
    car_registration_number: 'DEF456',
    car_year: 2020,
    car_brand: 'Tesla',
    car_model: 'Model 3',
    owner_name: 'Erik Andersson',
    pickup_address: 'Vasagatan 5, Stockholm',
    final_price: 12000,
    status: 'completed',
    created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    vehicle_year: 2020,
    vehicle_make: 'Tesla',
    vehicle_model: 'Model 3',
    fuel_type: 'electric',
    pickup_distance: 0,
    customer_name: 'Erik Andersson',
    pickup_location: 'Vasagatan 5, Stockholm'
  }
];

const MOCK_STATUS_HISTORY = [
  {
    id: 'history-1',
    pickup_order_id: 'pickup-1',
    driver_id: 'driver-123',
    old_status: 'pending',
    new_status: 'scheduled',
    notes: 'Driver assigned and scheduled',
    created_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
  }
];

export const useDriverIntegration = (tenantId?: string | number, driverId?: string) => {
  // State to match what the component expects
  const [pickups, setPickups] = useState(MOCK_PICKUPS);
  const [driver, setDriver] = useState(MOCK_DRIVER);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusHistory, setStatusHistory] = useState(MOCK_STATUS_HISTORY);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [pricingError, setPricingError] = useState(null);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Mock functions that match what the component expects
  const updateDriverStatus = useCallback(async (driverId: string, status: string) => {
    console.log('Updating driver status:', driverId, status);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Update local state
    setDriver(prev => prev ? { ...prev, driver_status: status } : prev);
    
    return true; // Return success
  }, []);

  const updatePickupStatus = useCallback(async (pickupId: string, status: string, notes?: string) => {
    console.log('Updating pickup status:', pickupId, status, notes);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Update local state
    setPickups(prev => 
      prev.map(pickup => 
        pickup.pickup_id === pickupId || pickup.id === pickupId
          ? { ...pickup, status }
          : pickup
      )
    );
    
    // Add to status history
    const historyItem = {
      id: `history-${Date.now()}`,
      pickup_order_id: pickupId,
      driver_id: driver?.driver_id || 'driver-123',
      old_status: 'previous_status',
      new_status: status,
      notes: notes || '',
      created_at: new Date().toISOString()
    };
    
    setStatusHistory(prev => [historyItem, ...prev]);
    
    return true; // Return success
  }, [driver]);

  // Additional functions for compatibility
  const assignDriver = useCallback(async (orderId: string, driverId: string) => {
    console.log('Assigning driver:', orderId, driverId);
    await updatePickupStatus(orderId, 'assigned');
  }, [updatePickupStatus]);

  const unassignDriver = useCallback(async (orderId: string) => {
    console.log('Unassigning driver:', orderId);
    await updatePickupStatus(orderId, 'pending');
  }, [updatePickupStatus]);

  const calculateOrderPrice = useCallback(async (order: any) => {
    console.log('Calculating price for order:', order);
    setIsCalculatingPrice(true);
    
    // Simulate calculation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsCalculatingPrice(false);
    
    return {
      basePrice: 3000,
      totalPrice: order.final_price || 5000,
      breakdown: [
        { category: 'Base Price', amount: 3000, description: 'Base pickup price' },
        { category: 'Age Bonus', amount: 2000, description: 'Vehicle age bonus' }
      ]
    };
  }, []);

  const updateOrderPricing = useCallback(async (orderId: string, vehicleInfo: any, basePrice?: number) => {
    console.log('Updating order pricing:', orderId, vehicleInfo, basePrice);
    setIsCalculatingPrice(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsCalculatingPrice(false);
  }, []);

  const bulkCalculatePricing = useCallback(async (orders: any[]) => {
    console.log('Bulk calculating pricing for orders:', orders);
    return orders; // Return as-is for now
  }, []);

  const refreshData = useCallback(async () => {
    console.log('Refreshing data...');
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setLoading(false);
  }, []);

  return {
    // Core data (matches PantaBilenDriverApp expectations)
    pickups,
    driver, // This will have driver_status, full_name, etc.
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