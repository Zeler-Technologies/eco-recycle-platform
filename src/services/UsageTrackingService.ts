import { supabase } from '@/integrations/supabase/client';

export interface ServiceUsageData {
  tenantId: number;
  serviceId: string;
  unitsUsed: number;
  unitCost?: number;
  baseCostAllocation?: number;
  metadata?: Record<string, any>;
}

export class UsageTrackingService {
  // Service IDs - these should match your service_cost_models table
  static readonly SERVICE_IDS = {
    SMS: 'sms_service_id',
    CAR_PROCESSING: 'car_processing_service_id', 
    GOOGLE_MAPS: 'google_maps_service_id',
    PAYMENT_PROCESSING: 'payment_processing_service_id'
  } as const;

  /**
   * Record service usage in tenant_service_usage table
   */
  static async recordUsage(data: ServiceUsageData): Promise<boolean> {
    try {
      // Get service details for unit cost if not provided
      let unitCost = data.unitCost;
      if (!unitCost) {
        const { data: service } = await supabase
          .from('service_cost_models' as any)
          .select('unit_cost')
          .eq('id', data.serviceId)
          .single();
        
        unitCost = (service as any)?.unit_cost || 0;
      }

      const totalCost = (data.unitsUsed * unitCost) + (data.baseCostAllocation || 0);

      const { error } = await supabase
        .from('tenant_service_usage' as any)
        .insert({
          tenant_id: data.tenantId,
          service_id: data.serviceId,
          units_used: data.unitsUsed,
          unit_cost: unitCost,
          base_cost_allocation: data.baseCostAllocation || 0,
          total_cost: totalCost,
          usage_date: new Date().toISOString().split('T')[0],
          metadata: data.metadata || {}
        });

      if (error) {
        console.error('Error recording service usage:', error);
        return false;
      }

      console.log(`✅ Recorded usage: ${data.unitsUsed} units of ${data.serviceId} for tenant ${data.tenantId}`);
      return true;
    } catch (error) {
      console.error('Exception in recordUsage:', error);
      return false;
    }
  }

  /**
   * Record SMS usage specifically
   */
  static async recordSMSUsage(tenantId: number, smsCount: number, metadata?: any): Promise<boolean> {
    return this.recordUsage({
      tenantId,
      serviceId: this.SERVICE_IDS.SMS,
      unitsUsed: smsCount,
      unitCost: 0.04, // €0.04 per SMS from your service_cost_models
      metadata: {
        ...metadata,
        recorded_at: new Date().toISOString()
      }
    });
  }

  /**
   * Record car processing usage
   */
  static async recordCarProcessingUsage(tenantId: number, carCount: number = 1, metadata?: any): Promise<boolean> {
    return this.recordUsage({
      tenantId,
      serviceId: this.SERVICE_IDS.CAR_PROCESSING,
      unitsUsed: carCount,
      unitCost: 2.00, // €2.00 per car from your service_cost_models
      metadata: {
        ...metadata,
        recorded_at: new Date().toISOString()
      }
    });
  }

  /**
   * Record Google Maps API usage
   */
  static async recordGoogleMapsUsage(tenantId: number, apiCalls: number, metadata?: any): Promise<boolean> {
    return this.recordUsage({
      tenantId,
      serviceId: this.SERVICE_IDS.GOOGLE_MAPS,
      unitsUsed: apiCalls,
      unitCost: 0.005, // €0.005 per API call from your service_cost_models
      metadata: {
        ...metadata,
        recorded_at: new Date().toISOString()
      }
    });
  }

  /**
   * Record payment processing usage
   */
  static async recordPaymentProcessingUsage(tenantId: number, transactionCount: number, metadata?: any): Promise<boolean> {
    return this.recordUsage({
      tenantId,
      serviceId: this.SERVICE_IDS.PAYMENT_PROCESSING,
      unitsUsed: transactionCount,
      unitCost: 0.30, // €0.30 per transaction from your service_cost_models
      metadata: {
        ...metadata,
        recorded_at: new Date().toISOString()
      }
    });
  }

  /**
   * Calculate shared cost allocation for Google Maps API (€500 base cost)
   * This should be run monthly to allocate the base cost
   */
  static async calculateSharedCostAllocation(billingMonth: string): Promise<void> {
    try {
      // Get total Google Maps usage for the month across all tenants
      const startDate = `${billingMonth}-01`;
      const endDate = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 0)
        .toISOString().split('T')[0];

      const { data: monthlyUsage } = await supabase
        .from('tenant_service_usage' as any)
        .select('tenant_id, units_used')
        .eq('service_id', this.SERVICE_IDS.GOOGLE_MAPS)
        .gte('usage_date', startDate)
        .lte('usage_date', endDate);

      if (!monthlyUsage || monthlyUsage.length === 0) {
        console.log('No Google Maps usage found for', billingMonth);
        return;
      }

      // Calculate total usage and allocations
      const totalUnits = (monthlyUsage as any[]).reduce((sum: number, usage: any) => sum + (usage.units_used || 0), 0);
      const baseCost = 500; // €500 monthly base cost

      // Group by tenant and calculate allocations
      const tenantUsage = (monthlyUsage as any[]).reduce((acc: Record<number, number>, usage: any) => {
        acc[usage.tenant_id] = (acc[usage.tenant_id] || 0) + (usage.units_used || 0);
        return acc;
      }, {} as Record<number, number>);

      // Insert allocation records
      const allocationPromises = Object.entries(tenantUsage).map(([tenantId, usage]) => {
        const usagePercentage = usage / totalUnits;
        const allocation = baseCost * usagePercentage;

        return this.recordUsage({
          tenantId: parseInt(tenantId),
          serviceId: this.SERVICE_IDS.GOOGLE_MAPS,
          unitsUsed: 0, // This is just the base cost allocation
          unitCost: 0,
          baseCostAllocation: allocation,
          metadata: {
            allocation_type: 'monthly_base_cost',
            billing_month: billingMonth,
            usage_percentage: usagePercentage,
            total_monthly_units: usage
          }
        });
      });

      await Promise.all(allocationPromises);
      console.log(`✅ Allocated Google Maps base cost for ${billingMonth}`);
    } catch (error) {
      console.error('Error calculating shared cost allocation:', error);
    }
  }

  /**
   * Get usage summary for a tenant and date range
   */
  static async getUsageSummary(tenantId: number, startDate: string, endDate: string) {
    try {
      const { data, error } = await supabase
        .from('tenant_service_usage' as any)
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('usage_date', startDate)
        .lte('usage_date', endDate)
        .order('usage_date', { ascending: false });

      if (error) {
        console.error('Error fetching usage summary:', error);
        return null;
      }

      // Group by service and calculate totals
      const summary = (data as any[])?.reduce((acc: any, usage: any) => {
        const serviceName = usage.service_name || 'Unknown Service';
        if (!acc[serviceName]) {
          acc[serviceName] = {
            total_units: 0,
            total_cost: 0,
            base_cost_allocation: 0,
            cost_type: usage.cost_type || 'usage_based'
          };
        }
        
        acc[serviceName].total_units += usage.units_used || 0;
        acc[serviceName].total_cost += usage.total_cost || 0;
        acc[serviceName].base_cost_allocation += usage.base_cost_allocation || 0;
        
        return acc;
      }, {} as Record<string, any>);

      return summary;
    } catch (error) {
      console.error('Exception in getUsageSummary:', error);
      return null;
    }
  }
}