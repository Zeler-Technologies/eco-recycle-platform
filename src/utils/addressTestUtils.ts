import { supabase } from "@/integrations/supabase/client";

export interface AddressTestResult {
  success: boolean;
  tenantAddress: string | null;
  scrapyardAddress: string | null;
  scrapyardParts: {
    address: string | null;
    postalCode: string | null;
    city: string | null;
  };
  isConsistent: boolean;
  errors: string[];
}

export const testAddressConsistency = async (tenantId: number): Promise<AddressTestResult> => {
  const errors: string[] = [];
  
  try {
    // Get tenant data
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .select('base_address')
      .eq('tenants_id', tenantId)
      .maybeSingle();
    
    if (tenantError) {
      errors.push(`Tenant fetch error: ${tenantError.message}`);
    }
    
    // Get primary scrapyard data (first created)
    const { data: scrapyardData, error: scrapyardError } = await supabase
      .from('scrapyards')
      .select('address, postal_code, city')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    
    if (scrapyardError) {
      errors.push(`Scrapyard fetch error: ${scrapyardError.message}`);
    }
    
    const tenantAddress = tenantData?.base_address || null;
    const scrapyardFullAddress = scrapyardData ? 
      [scrapyardData.address, scrapyardData.postal_code, scrapyardData.city]
        .filter(Boolean)
        .join(', ') : null;
    
    const scrapyardParts = {
      address: scrapyardData?.address || null,
      postalCode: scrapyardData?.postal_code || null,
      city: scrapyardData?.city || null
    };
    
    // Check consistency - tenant base_address should match scrapyard combined address
    const isConsistent = tenantAddress === scrapyardFullAddress;
    
    return {
      success: errors.length === 0,
      tenantAddress,
      scrapyardAddress: scrapyardFullAddress,
      scrapyardParts,
      isConsistent,
      errors
    };
  } catch (error) {
    errors.push(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      success: false,
      tenantAddress: null,
      scrapyardAddress: null,
      scrapyardParts: { address: null, postalCode: null, city: null },
      isConsistent: false,
      errors
    };
  }
};

export const updateAddressAndTest = async (
  tenantId: number, 
  newAddress: string
): Promise<AddressTestResult> => {
  const errors: string[] = [];
  
  try {
    // Parse the new address
    const addressParts = newAddress.split(',').map(part => part.trim());
    const address = addressParts[0] || '';
    const postalCode = addressParts[1] || '';
    const city = addressParts[2] || '';
    
    // Update tenant base_address
    const { error: tenantError } = await supabase
      .from('tenants')
      .update({ base_address: newAddress })
      .eq('tenants_id', tenantId);
    
    if (tenantError) {
      errors.push(`Tenant update error: ${tenantError.message}`);
    }
    
    // Update primary scrapyard address parts
    const { error: scrapyardError } = await supabase
      .from('scrapyards')
      .update({
        address,
        postal_code: postalCode,
        city
      })
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true })
      .limit(1);
    
    if (scrapyardError) {
      errors.push(`Scrapyard update error: ${scrapyardError.message}`);
    }
    
    // Test consistency after update
    return await testAddressConsistency(tenantId);
  } catch (error) {
    errors.push(`Update error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      success: false,
      tenantAddress: null,
      scrapyardAddress: null,
      scrapyardParts: { address: null, postalCode: null, city: null },
      isConsistent: false,
      errors
    };
  }
};