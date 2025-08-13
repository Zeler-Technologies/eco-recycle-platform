// src/utils/pricingCalculator.ts
import { supabase } from '@/integrations/supabase/client';

interface VehicleInfo {
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

interface PricingResult {
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

export class VehiclePricingCalculator {
  private pricingSettings: any = null;

  constructor(private tenantId: string) {}

  async loadPricingSettings() {
    if (this.pricingSettings) return this.pricingSettings;

    const { data, error } = await supabase
      .from('vehicle_pricing_config')
      .select('*')
      .eq('tenant_id', this.tenantId)
      .single();

    if (error) {
      console.error('Error loading pricing settings:', error);
      throw new Error('Could not load pricing settings');
    }

    this.pricingSettings = {
      ageBonuses: data.age_bonuses,
      oldCarDeduction: data.old_car_deduction,
      distanceAdjustments: data.distance_adjustments,
      partsBonuses: data.parts_bonuses,
      fuelAdjustments: data.fuel_adjustments
    };

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
      // Drop-off scenario
      if (vehicleInfo.isDropoffComplete) {
        distanceAdjustment = this.pricingSettings.distanceAdjustments.dropoffComplete;
        breakdown.push({ category: 'Avstånd', amount: distanceAdjustment, description: 'Avlämning (komplett)' });
      } else {
        distanceAdjustment = this.pricingSettings.distanceAdjustments.dropoffIncomplete;
        breakdown.push({ category: 'Avstånd', amount: distanceAdjustment, description: 'Avlämning (ofullständig)' });
      }
    } else if (vehicleInfo.pickupDistance) {
      // Pickup scenario
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
      breakdown: breakdown.filter(item => item.amount !== 0) // Only show non-zero adjustments
    };
  }

  // Helper method for quick price calculation
  static async getQuickPrice(tenantId: string, vehicleInfo: VehicleInfo, basePrice: number = 0): Promise<number> {
    const calculator = new VehiclePricingCalculator(tenantId);
    const result = await calculator.calculatePrice(vehicleInfo, basePrice);
    return result.totalPrice;
  }

  // Helper method for drivers to see price breakdown
  static async getPriceBreakdown(tenantId: string, vehicleInfo: VehicleInfo, basePrice: number = 0): Promise<PricingResult> {
    const calculator = new VehiclePricingCalculator(tenantId);
    return await calculator.calculatePrice(vehicleInfo, basePrice);
  }
}

// React hook for easy use in components
export const usePricingCalculator = (tenantId: string) => {
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

// Export types for use in other components
export type { VehicleInfo, PricingResult };