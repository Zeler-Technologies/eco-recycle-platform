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
  details?: {
    scrapyardUsed: string;
    scrapyardName: string | null;
    scrapyardDirectAddress: string | null;
    scrapyardCombinedAddress: string | null;
    matchMethod: string;
  };
}

// Helper function to normalize addresses for comparison
const normalizeAddress = (addr: string | null): string => {
  if (!addr) return '';
  return addr
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')           // Collapse whitespace
    .replace(/,+/g, ',')            // Remove duplicate commas
    .replace(/,\s*,/g, ',')         // Remove empty comma segments
    .replace(/^,|,$/g, '');         // Remove leading/trailing commas
};

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
    
    // Get primary scrapyard data (using is_primary = true)
    const { data: scrapyardData, error: scrapyardError } = await supabase
      .from('scrapyards')
      .select('name, address, postal_code, city')
      .eq('tenant_id', tenantId)
      .eq('is_primary', true)
      .maybeSingle();
    
    if (scrapyardError) {
      errors.push(`Primary scrapyard fetch error: ${scrapyardError.message}`);
    }
    
    if (!scrapyardData) {
      errors.push('No primary scrapyard found for this tenant');
    }
    
    const tenantAddress = tenantData?.base_address || null;
    const scrapyardParts = {
      address: scrapyardData?.address || null,
      postalCode: scrapyardData?.postal_code || null,
      city: scrapyardData?.city || null
    };
    
    // Normalize addresses for comparison
    const tenantAddr = normalizeAddress(tenantAddress);
    const directAddr = normalizeAddress(scrapyardData?.address);
    
    // Try direct comparison first (preferred)
    const isDirectMatch = tenantAddr === directAddr;
    
    // Fallback: construct from parts if direct doesn't match
    const combinedAddr = normalizeAddress(
      scrapyardData ? [scrapyardData.address, scrapyardData.postal_code, scrapyardData.city]
        .filter(Boolean)
        .join(', ') : null
    );
    const isCombinedMatch = tenantAddr === combinedAddr;
    
    const addressesMatch = isDirectMatch || isCombinedMatch;
    
    return {
      success: errors.length === 0,
      tenantAddress,
      scrapyardAddress: combinedAddr,
      scrapyardParts,
      isConsistent: addressesMatch,
      errors,
      details: {
        scrapyardUsed: 'Primary Scrapyard',
        scrapyardName: scrapyardData?.name || null,
        scrapyardDirectAddress: scrapyardData?.address || null,
        scrapyardCombinedAddress: combinedAddr,
        matchMethod: isDirectMatch ? 'Direct Address' : 
                    isCombinedMatch ? 'Combined Address' : 'No Match'
      }
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
    
    // Update only primary scrapyard address parts
    const { error: scrapyardError } = await supabase
      .from('scrapyards')
      .update({
        address: newAddress,        // Store complete address
        postal_code: postalCode,
        city,
        updated_at: new Date().toISOString()
      })
      .eq('tenant_id', tenantId)
      .eq('is_primary', true);      // Target primary scrapyard only
    
    if (scrapyardError) {
      errors.push(`Primary scrapyard update error: ${scrapyardError.message}`);
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