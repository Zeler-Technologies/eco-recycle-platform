export const VehiclePricingCalculator = {
  getQuickPrice: () => Promise.resolve(0),
  getPriceBreakdown: () => Promise.resolve({ totalPrice: 0, breakdown: [] })
};

export const usePricingCalculator = () => ({
  calculatePrice: () => Promise.resolve({ totalPrice: 0 }),
  getQuickPrice: () => Promise.resolve(0)
});

export interface VehicleInfo { year: number; fuelType: string; }
export interface PricingResult { totalPrice: number; breakdown: any[]; }