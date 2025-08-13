// Example usage in any component:
import { VehiclePricingCalculator } from '@/utils/pricingCalculator';

const testPricing = async () => {
  const vehicleInfo = {
    year: 2015,
    fuelType: 'gasoline' as const,
    pickupDistance: 30,
    hasEngine: true,
    hasFourWheels: true
  };
  
  try {
    const result = await VehiclePricingCalculator.getPriceBreakdown(1, vehicleInfo, 5000);
    console.log(`Total price: ${result.totalPrice} KR`);
    console.log('Breakdown:', result.breakdown);
  } catch (error) {
    console.error('Pricing calculation failed:', error);
  }
};