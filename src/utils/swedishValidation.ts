/**
 * Swedish Personal Number (Personnummer) validation with Luhn algorithm
 * Supports both 10-digit (YYMMDD-XXXX) and 12-digit (YYYYMMDD-XXXX) formats
 */
export const validateSwedishPNR = (pnr: string): { isValid: boolean; formatted?: string; error?: string } => {
  // Remove all non-digits
  const digits = pnr.replace(/\D/g, '');
  
  // Check length (10 or 12 digits)
  if (digits.length !== 10 && digits.length !== 12) {
    return { isValid: false, error: 'Personnummer måste vara 10 eller 12 siffror' };
  }
  
  // Extract parts
  let year, month, day, controlDigits;
  
  if (digits.length === 10) {
    // YYMMDDXXXX format
    year = parseInt(digits.substring(0, 2));
    month = parseInt(digits.substring(2, 4));
    day = parseInt(digits.substring(4, 6));
    controlDigits = digits.substring(6, 10);
    
    // Determine century (people born after 1990 use 19XX, others use 20XX for 2-digit years)
    const currentYear = new Date().getFullYear();
    const currentCentury = Math.floor(currentYear / 100) * 100;
    year = year + (year > (currentYear % 100) ? currentCentury - 100 : currentCentury);
  } else {
    // YYYYMMDDXXXX format
    year = parseInt(digits.substring(0, 4));
    month = parseInt(digits.substring(4, 6));
    day = parseInt(digits.substring(6, 8));
    controlDigits = digits.substring(8, 12);
  }
  
  // Validate date
  if (month < 1 || month > 12) {
    return { isValid: false, error: 'Ogiltigt månad i personnummer' };
  }
  
  if (day < 1 || day > 31) {
    return { isValid: false, error: 'Ogiltigt dag i personnummer' };
  }
  
  // Special handling for coordination numbers (day + 60)
  const isCoordinationNumber = day > 60;
  const actualDay = isCoordinationNumber ? day - 60 : day;
  
  // Validate actual date
  const testDate = new Date(year, month - 1, actualDay);
  if (testDate.getFullYear() !== year || 
      testDate.getMonth() !== month - 1 || 
      testDate.getDate() !== actualDay) {
    return { isValid: false, error: 'Ogiltigt datum i personnummer' };
  }
  
  // Luhn algorithm check
  const checkDigits = digits.substring(0, digits.length - 1);
  const checksum = parseInt(digits.charAt(digits.length - 1));
  
  let sum = 0;
  for (let i = 0; i < checkDigits.length; i++) {
    let digit = parseInt(checkDigits.charAt(i));
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) {
        digit = Math.floor(digit / 10) + (digit % 10);
      }
    }
    sum += digit;
  }
  
  const calculatedChecksum = (10 - (sum % 10)) % 10;
  
  if (calculatedChecksum !== checksum) {
    return { isValid: false, error: 'Ogiltigt personnummer (kontrollsiffra)' };
  }
  
  // Format for display
  const yearStr = digits.length === 10 ? digits.substring(0, 2) : digits.substring(2, 4);
  const formatted = `${yearStr}${digits.substring(digits.length === 10 ? 2 : 4, digits.length === 10 ? 6 : 8)}-${controlDigits}`;
  
  return { isValid: true, formatted };
};

/**
 * Mask PNR for privacy (show only birth date)
 */
export const maskSwedishPNR = (pnr: string): string => {
  const validation = validateSwedishPNR(pnr);
  if (!validation.isValid || !validation.formatted) {
    return '****-****';
  }
  
  const parts = validation.formatted.split('-');
  return `${parts[0]}-****`;
};

/**
 * Validate Swedish organization number
 */
export const validateSwedishOrgNumber = (orgNumber: string): { isValid: boolean; formatted?: string; error?: string } => {
  const digits = orgNumber.replace(/\D/g, '');
  
  if (digits.length !== 10) {
    return { isValid: false, error: 'Organisationsnummer måste vara 10 siffror' };
  }
  
  // First digit should be >= 5 for organizations
  if (parseInt(digits.charAt(0)) < 5) {
    return { isValid: false, error: 'Ogiltigt organisationsnummer format' };
  }
  
  // Luhn algorithm check (similar to PNR)
  const checkDigits = digits.substring(0, 9);
  const checksum = parseInt(digits.charAt(9));
  
  let sum = 0;
  for (let i = 0; i < checkDigits.length; i++) {
    let digit = parseInt(checkDigits.charAt(i));
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) {
        digit = Math.floor(digit / 10) + (digit % 10);
      }
    }
    sum += digit;
  }
  
  const calculatedChecksum = (10 - (sum % 10)) % 10;
  
  if (calculatedChecksum !== checksum) {
    return { isValid: false, error: 'Ogiltigt organisationsnummer (kontrollsiffra)' };
  }
  
  const formatted = `${digits.substring(0, 6)}-${digits.substring(6)}`;
  return { isValid: true, formatted };
};