// src/utils/pricingCalculator.ts
import { supabase } from '@/integrations/supabase/client';

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
  breakdown: {
    category: string;
    amount: number;
    description: string;
  }[];
}

// Default pricing settings - used as fallback
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
  private pricingSettings: any = null;
  private tenantId: number;

  constructor(tenantId: number) {
    this.tenantId = tenantId;
  }

  private async loadPricingSettings() {
    if (this.pricingSettings) {
      return this.pricingSettings;
    }

    try {
      // Try to load from database
      const { data, error } = await supabase
        .from('pricing_tiers')
        .select('*')
        .eq('tenant_id', this.tenantId)
        .eq('is_vehicle_pricing', true)
        .single();

      if (!error && data) {
        // Extract settings from database
        this.pricingSettings = {
          ageBonuses: (data as any).vehicle_age_bonuses || DEFAULT_PRICING.ageBonuses,
          oldCarDeduction: (data as any).vehicle_old_car_deduction || DEFAULT_PRICING.oldCarDeduction,
          distanceAdjustments: (data as any).vehicle_distance_adjustments || DEFAULT_PRICING.distanceAdjustments,
          partsBonuses: (data as any).vehicle_parts_bonuses || DEFAULT_PRICING.partsBonuses,
          fuelAdjustments: (data as any).vehicle_fuel_adjustments || DEFAULT_PRICING.fuelAdjustments
        };
      } else {
        // Use default settings if database query fails
        console.log('Using default pricing settings');
        this.pricingSettings = DEFAULT_PRICING;
      }
    } catch (err) {
      console.warn('Error loading pricing settings, using defaults:', err);
      this.pricingSettings = DEFAULT_PRICING;
    }

    return this.pricingSettings;
  }

  async calculatePrice(vehicleInfo: VehicleInfo, basePrice: number = 0): Promise<PricingResult> {
    await this.loadPricingSettings();
    
    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - vehicleInfo.year;
    const breakdown: PricingResult['breakdown'] = [];

    // Calculate age bonus
    let ageBonus = 0;
    if (vehicleAge < 5) {
      ageBonus = this.pricingSettings.ageBonuses.age0to5;
      breakdown.push({ category: 'Åldersbonus', amount: ageBonus, description: '0-4,99 år' });
    } else if (vehicleAge < 10) {
      ageBonus = this.pricingSettings.ageBonuses.age5to10;
      breakdown.push({ category: 'Åldersbonus', amount: ageBonus, description: '5-9,99 år' });
    } else if (vehicleAge < 15) {
      ageBonus = this.pricingSettings.ageBonuses.age10to15;
      breakdown.push({ category: 'Åldersbonus', amount: ageBonus, description: '10-14,99 år' });
    } else if (vehicleAge < 20) {
      ageBonus = this.pricingSettings.ageBonuses.age15to20;
      breakdown.push({ category: 'Åldersbonus', amount: ageBonus, description: '15-19,99 år' });
    } else {
      ageBonus = this.pricingSettings.ageBonuses.age20plus;
      breakdown.push({ category: 'Åldersbonus', amount: ageBonus, description: '20+ år' });
    }

    // Calculate old car deduction
    let oldCarDeduction = 0;
    if (vehicleInfo.year < 1990) {
      oldCarDeduction = this.pricingSettings.oldCarDeduction.before1990;
      breakdown.push({ category: 'Avdrag', amount: oldCarDeduction, description: 'Före 1990' });
    }

    // Calculate distance adjustment
    let distanceAdjustment = 0;
    if (vehicleInfo.pickupDistance === 0) {
      if (vehicleInfo.isDropoffComplete) {
        distanceAdjustment = this.pricingSettings.distanceAdjustments.dropoffComplete;
        breakdown.push({ category: 'Avstånd', amount: distanceAdjustment, description: 'Avlämning (komplett)' });
      } else {
        distanceAdjustment = this.pricingSettings.distanceAdjustments.dropoffIncomplete;
        breakdown.push({ category: 'Avstånd', amount: distanceAdjustment, description: 'Avlämning (ofullständig)' });
      }
    } else if (vehicleInfo.pickupDistance) {
      const distance = vehicleInfo.pickupDistance;
      if (distance <= 20) {
        distanceAdjustment = this.pricingSettings.distanceAdjustments.pickup0to20;
        breakdown.push({ category: 'Avstånd', amount: distanceAdjustment, description: 'Hämtning 0-20km' });
      } else if (distance <= 50) {
        distanceAdjustment = this.pricingSettings.distanceAdjustments.pickup20to50;
        breakdown.push({ category: 'Avstånd', amount: distanceAdjustment, description: 'Hämtning 20-50km' });
      } else if (distance <= 75) {
        distanceAdjustment = this.pricingSettings.distanceAdjustments.pickup50to75;
        breakdown.push({ category: 'Avstånd', amount: distanceAdjustment, description: 'Hämtning 50-75km' });
      } else if (distance <= 100) {
        distanceAdjustment = this.pricingSettings.distanceAdjustments.pickup75to100;
        breakdown.push({ category: 'Avstånd', amount: distanceAdjustment, description: 'Hämtning 75-100km' });
      } else {
        distanceAdjustment = this.pricingSettings.distanceAdjustments.pickup100plus;
        breakdown.push({ category: 'Avstånd', amount: distanceAdjustment, description: 'Hämtning 100+km' });
      }
    }

    // Calculate parts bonus
    let partsBonus = 0;
    if (vehicleInfo.hasEngine || vehicleInfo.hasTransmission || vehicleInfo.hasCatalyst) {
      partsBonus += this.pricingSettings.partsBonuses.engineTransmissionCatalyst;
      breakdown.push({ 
        category: 'Delbonus', 
        amount: this.pricingSettings.partsBonuses.engineTransmissionCatalyst, 
        description: 'Motor/Växellåda/Katalysator' 
      });
    }
    if (vehicleInfo.hasBattery || vehicleInfo.hasFourWheels || vehicleInfo.isOtherComplete) {
      partsBonus += this.pricingSettings.partsBonuses.batteryWheelsOther;
      breakdown.push({ 
        category: 'Delbonus', 
        amount: this.pricingSettings.partsBonuses.batteryWheelsOther, 
        description: 'Batteri/Hjul/Övrigt' 
      });
    }

    // Calculate fuel adjustment
    let fuelAdjustment = 0;
    switch (vehicleInfo.fuelType) {
      case 'gasoline':
        fuelAdjustment = this.pricingSettings.fuelAdjustments.gasoline;
        if (fuelAdjustment !== 0) {
          breakdown.push({ category: 'Bränsle', amount: fuelAdjustment, description: 'Bensin' });
        }
        break;
      case 'ethanol':
        fuelAdjustment = this.pricingSettings.fuelAdjustments.ethanol;
        if (fuelAdjustment !== 0) {
          breakdown.push({ category: 'Bränsle', amount: fuelAdjustment, description: 'Etanol' });
        }
        break;
      case 'electric':
        fuelAdjustment = this.pricingSettings.fuelAdjustments.electric;
        if (fuelAdjustment !== 0) {
          breakdown.push({ category: 'Bränsle', amount: fuelAdjustment, description: 'El' });
        }
        break;
      case 'other':
        fuelAdjustment = this.pricingSettings.fuelAdjustments.other;
        if (fuelAdjustment !== 0) {
          breakdown.push({ category: 'Bränsle', amount: fuelAdjustment, description: 'Annat' });
        }
        break;
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
      breakdown: breakdown.filter(item => item.amount !== 0)
    };
  }

  // Static helper methods
  static async getQuickPrice(tenantId: number, vehicleInfo: VehicleInfo, basePrice: number = 0): Promise<number> {
    const calculator = new VehiclePricingCalculator(tenantId);
    const result = await calculator.calculatePrice(vehicleInfo, basePrice);
    return result.totalPrice;
  }

  static async getPriceBreakdown(tenantId: number, vehicleInfo: VehicleInfo, basePrice: number = 0): Promise<PricingResult> {
    const calculator = new VehiclePricingCalculator(tenantId);
    return await calculator.calculatePrice(vehicleInfo, basePrice);
  }
}

// React hook for easy use in components
export const usePricingCalculator = (tenantId: number) => {
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