// In a pickup order component
import { VehiclePricingCalculator } from '@/utils/pricingCalculator';

const handlePriceCalculation = async () => {
  const vehicleInfo = {
    year: 2015,
    fuelType: 'gasoline' as const,
    pickupDistance: 30,
    hasEngine: true,
    hasFourWheels: true
  };
  
  const result = await VehiclePricingCalculator.getPriceBreakdown(
    tenantId, 
    vehicleInfo, 
    5000 // base price
  );
  
  console.log(`Total price: ${result.totalPrice} KR`);
  console.log('Breakdown:', result.breakdown);
};