import { supabase } from "@/integrations/supabase/client";

export interface AddressTestResult {
  success: boolean;
  tenantAddress: string | null;
  scrapyardAddress: string | null;
  scrapyardParts: {
    streetAddress: string | null;
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

// Utility function to format full address from separate components
export const formatFullAddress = (streetAddress: string | null, postalCode: string | null, city: string | null): string => {
  const parts = [streetAddress, postalCode, city].filter(part => part && part.trim());
  return parts.join(', ');
};

// Utility function to parse combined address into components
export const parseAddress = (combinedAddress: string | null): { streetAddress: string | null; postalCode: string | null; city: string | null } => {
  if (!combinedAddress || !combinedAddress.trim()) {
    return { streetAddress: null, postalCode: null, city: null };
  }

  const parts = combinedAddress.split(',').map(part => part.trim());
  const postalPattern = /\d{3}\s?\d{2}/;
  const postalMatch = combinedAddress.match(postalPattern)?.[0] || null;

  if (parts.length >= 3) {
    // Format: street, postal, city
    return {
      streetAddress: parts[0] || null,
      postalCode: postalMatch || parts[1] || null,
      city: parts[2] || null
    };
  } else if (parts.length === 2) {
    // Format: street, postal+city
    return {
      streetAddress: parts[0] || null,
      postalCode: postalMatch,
      city: parts[1]?.replace(postalPattern, '').trim() || null
    };
  } else {
    // Single field - try to extract components
    return {
      streetAddress: combinedAddress.replace(postalPattern, '').replace(/,.*$/, '').trim() || null,
      postalCode: postalMatch,
      city: combinedAddress.replace(/^.*\d{3}\s?\d{2}\s*,?\s*/, '').trim() || null
    };
  }
};

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
    // Get tenant data - try new separate fields first, fallback to base_address
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .select('base_address, street_address, postal_code, city')
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
    
    // Get tenant address - prefer separate fields, fallback to base_address
    let tenantAddress: string | null = null;
    if (tenantData?.street_address || tenantData?.postal_code || tenantData?.city) {
      tenantAddress = formatFullAddress(tenantData.street_address, tenantData.postal_code, tenantData.city);
    } else {
      tenantAddress = tenantData?.base_address || null;
    }
    
    const scrapyardParts = {
      streetAddress: scrapyardData?.address || null,
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
      scrapyardData ? formatFullAddress(scrapyardData.address, scrapyardData.postal_code, scrapyardData.city) : null
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
      scrapyardParts: { streetAddress: null, postalCode: null, city: null },
      isConsistent: false,
      errors
    };
  }
};

export const updateAddressAndTest = async (
  tenantId: number, 
  streetAddress: string,
  postalCode: string,
  city: string
): Promise<AddressTestResult> => {
  const errors: string[] = [];
  
  try {
    const fullAddress = formatFullAddress(streetAddress, postalCode, city);
    
    // Update tenant with separate address fields AND base_address for backward compatibility
    const { error: tenantError } = await supabase
      .from('tenants')
      .update({ 
        street_address: streetAddress,
        postal_code: postalCode,
        city: city,
        base_address: fullAddress  // Keep for backward compatibility
      })
      .eq('tenants_id', tenantId);
    
    if (tenantError) {
      errors.push(`Tenant update error: ${tenantError.message}`);
    }
    
    // Update only primary scrapyard address parts
    const { error: scrapyardError } = await supabase
      .from('scrapyards')
      .update({
        address: streetAddress,     // Store street address separately
        postal_code: postalCode,
        city: city,
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
      scrapyardParts: { streetAddress: null, postalCode: null, city: null },
      isConsistent: false,
      errors
    };
  }
};