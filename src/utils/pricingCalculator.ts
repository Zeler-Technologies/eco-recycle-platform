export interface VehicleInfo {
  year: number;
  fuelType: 'gasoline' | 'ethanol' | 'electric' | 'other';
  pickupDistance?: number;
  isDropoffComplete?: boolean;
  hasEngine?: boolean;
  hasTransmission?: boolean;
  hasCatalyst?: boolean;
  hasBattery?: boolean;
  hasFourWheels?: boolean;
  isOtherComplete?: boolean;
}

export interface PricingResult {
  basePrice: number;
  ageBonus: number;
  oldCarDeduction: number;
  distanceAdjustment: number;
  partsBonus: number;
  fuelAdjustment: number;
  totalPrice: number;
  breakdown: Array<{
    category: string;
    amount: number;
    description: string;
  }>;
}

const DEFAULT_PRICING = {
  ageBonuses: {
    age0to5: 10000,
    age5to10: 5000,
    age10to15: 2500,
    age15to20: 1000,
    age20plus: 0
  },
  oldCarDeduction: {
    before1990: -1000
  },
  distanceAdjustments: {
    dropoffComplete: 500,
    dropoffIncomplete: 0,
    pickup0to20: -250,
    pickup20to50: -500,
    pickup50to75: -1000,
    pickup75to100: -1250,
    pickup100plus: -2500
  },
  partsBonuses: {
    engineTransmissionCatalyst: 1000,
    batteryWheelsOther: 500
  },
  fuelAdjustments: {
    gasoline: 0,
    ethanol: 0,
    electric: 0,
    other: -500
  }
};

export class VehiclePricingCalculator {
  private tenantId: string;

  constructor(tenantId: string | number) {
    this.tenantId = String(tenantId);
  }

  private getPricingSettings() {
    // Load from memory storage (set by PricingManagement component)
    try {
      const savedSettings = (window as any).__PRICING_SETTINGS;
      if (savedSettings && savedSettings[this.tenantId]) {
        console.log('Using saved pricing settings for tenant:', this.tenantId);
        return savedSettings[this.tenantId];
      } else {
        console.log('Using default pricing settings for tenant:', this.tenantId);
        return DEFAULT_PRICING;
      }
    } catch (err) {
      console.warn('Error loading saved settings, using defaults:', err);
      return DEFAULT_PRICING;
    }
  }

  async calculatePrice(vehicleInfo: VehicleInfo, basePrice: number = 0): Promise<PricingResult> {
    const settings = this.getPricingSettings();
    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - vehicleInfo.year;
    const breakdown: Array<{category: string, amount: number, description: string}> = [];

    let ageBonus = 0;
    if (vehicleAge < 5) {
      ageBonus = settings.ageBonuses.age0to5;
      if (ageBonus > 0) breakdown.push({ category: 'Åldersbonus', amount: ageBonus, description: '0-4,99 år' });
    } else if (vehicleAge < 10) {
      ageBonus = settings.ageBonuses.age5to10;
      if (ageBonus > 0) breakdown.push({ category: 'Åldersbonus', amount: ageBonus, description: '5-9,99 år' });
    } else if (vehicleAge < 15) {
      ageBonus = settings.ageBonuses.age10to15;
      if (ageBonus > 0) breakdown.push({ category: 'Åldersbonus', amount: ageBonus, description: '10-14,99 år' });
    } else if (vehicleAge < 20) {
      ageBonus = settings.ageBonuses.age15to20;
      if (ageBonus > 0) breakdown.push({ category: 'Åldersbonus', amount: ageBonus, description: '15-19,99 år' });
    } else {
      ageBonus = settings.ageBonuses.age20plus;
      if (ageBonus > 0) breakdown.push({ category: 'Åldersbonus', amount: ageBonus, description: '20+ år' });
    }

    let oldCarDeduction = 0;
    if (vehicleInfo.year < 1990) {
      oldCarDeduction = settings.oldCarDeduction.before1990;
      if (oldCarDeduction !== 0) breakdown.push({ category: 'Avdrag', amount: oldCarDeduction, description: 'Före 1990' });
    }

    let distanceAdjustment = 0;
    if (vehicleInfo.pickupDistance === 0) {
      if (vehicleInfo.isDropoffComplete) {
        distanceAdjustment = settings.distanceAdjustments.dropoffComplete;
        if (distanceAdjustment !== 0) breakdown.push({ category: 'Avstånd', amount: distanceAdjustment, description: 'Avlämning (komplett)' });
      } else {
        distanceAdjustment = settings.distanceAdjustments.dropoffIncomplete;
        if (distanceAdjustment !== 0) breakdown.push({ category: 'Avstånd', amount: distanceAdjustment, description: 'Avlämning (ofullständig)' });
      }
    } else if (vehicleInfo.pickupDistance) {
      const distance = vehicleInfo.pickupDistance;
      if (distance <= 20) {
        distanceAdjustment = settings.distanceAdjustments.pickup0to20;
        if (distanceAdjustment !== 0) breakdown.push({ category: 'Avstånd', amount: distanceAdjustment, description: 'Hämtning 0-20km' });
      } else if (distance <= 50) {
        distanceAdjustment = settings.distanceAdjustments.pickup20to50;
        if (distanceAdjustment !== 0) breakdown.push({ category: 'Avstånd', amount: distanceAdjustment, description: 'Hämtning 20-50km' });
      } else if (distance <= 75) {
        distanceAdjustment = settings.distanceAdjustments.pickup50to75;
        if (distanceAdjustment !== 0) breakdown.push({ category: 'Avstånd', amount: distanceAdjustment, description: 'Hämtning 50-75km' });
      } else if (distance <= 100) {
        distanceAdjustment = settings.distanceAdjustments.pickup75to100;
        if (distanceAdjustment !== 0) breakdown.push({ category: 'Avstånd', amount: distanceAdjustment, description: 'Hämtning 75-100km' });
      } else {
        distanceAdjustment = settings.distanceAdjustments.pickup100plus;
        if (distanceAdjustment !== 0) breakdown.push({ category: 'Avstånd', amount: distanceAdjustment, description: 'Hämtning 100+km' });
      }
    }

    let partsBonus = 0;
    if (vehicleInfo.hasEngine || vehicleInfo.hasTransmission || vehicleInfo.hasCatalyst) {
      partsBonus += settings.partsBonuses.engineTransmissionCatalyst;
      if (settings.partsBonuses.engineTransmissionCatalyst > 0) {
        breakdown.push({ 
          category: 'Delbonus', 
          amount: settings.partsBonuses.engineTransmissionCatalyst, 
          description: 'Motor/Växellåda/Katalysator' 
        });
      }
    }
    if (vehicleInfo.hasBattery || vehicleInfo.hasFourWheels || vehicleInfo.isOtherComplete) {
      partsBonus += settings.partsBonuses.batteryWheelsOther;
      if (settings.partsBonuses.batteryWheelsOther > 0) {
        breakdown.push({ 
          category: 'Delbonus', 
          amount: settings.partsBonuses.batteryWheelsOther, 
          description: 'Batteri/Hjul/Övrigt' 
        });
      }
    }

    let fuelAdjustment = 0;
    if (vehicleInfo.fuelType === 'other') {
      fuelAdjustment = settings.fuelAdjustments.other;
      if (fuelAdjustment !== 0) breakdown.push({ category: 'Bränsle', amount: fuelAdjustment, description: 'Annat bränsle' });
    }

    const totalPrice = basePrice + ageBonus + oldCarDeduction + distanceAdjustment + partsBonus + fuelAdjustment;

    return {
      basePrice,
      ageBonus,
      oldCarDeduction,
      distanceAdjustment,
      partsBonus,
      fuelAdjustment,
      totalPrice,
      breakdown
    };
  }

  static async getQuickPrice(tenantId: string | number, vehicleInfo: VehicleInfo, basePrice: number = 0): Promise<number> {
    const calculator = new VehiclePricingCalculator(tenantId);
    const result = await calculator.calculatePrice(vehicleInfo, basePrice);
    return result.totalPrice;
  }

  static async getPriceBreakdown(tenantId: string | number, vehicleInfo: VehicleInfo, basePrice: number = 0): Promise<PricingResult> {
    const calculator = new VehiclePricingCalculator(tenantId);
    return await calculator.calculatePrice(vehicleInfo, basePrice);
  }
}

export const usePricingCalculator = (tenantId: string | number) => {
  const calculator = new VehiclePricingCalculator(tenantId);
  
  return {
    calculatePrice: (vehicleInfo: VehicleInfo, basePrice?: number) => 
      calculator.calculatePrice(vehicleInfo, basePrice),
    getQuickPrice: async (vehicleInfo: VehicleInfo, basePrice?: number) => {
      const result = await calculator.calculatePrice(vehicleInfo, basePrice);
      return result.totalPrice;
    }
  };
};