/**
 * Swedish Character Encoding Fix Utilities
 * Handles the mojibake encoding issues where Swedish characters display incorrectly
 */

/**
 * Fix Swedish character encoding issues (mojibake)
 * Converts Ã¥, Ã¤, Ã¶ back to å, ä, ö
 */
export const fixSwedishEncoding = (text: string): string => {
  if (!text || typeof text !== 'string') return text;
  
  return text
    .replace(/Ã¥/g, 'å')
    .replace(/Ã¤/g, 'ä') 
    .replace(/Ã¶/g, 'ö')
    .replace(/Ã…/g, 'Å')
    .replace(/Ã„/g, 'Ä')
    .replace(/Ã–/g, 'Ö')
    .replace(/â‚¬/g, '€')
    .replace(/â€“/g, '–')
    .replace(/â€™/g, '\'')
    .replace(/â€œ/g, '\"')
    .replace(/â€/g, '\"');
};

/**
 * Fix encoding in objects recursively
 */
export const fixObjectEncoding = (obj: any): any => {
  if (!obj) return obj;
  
  if (typeof obj === 'string') {
    return fixSwedishEncoding(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(fixObjectEncoding);
  }
  
  if (typeof obj === 'object') {
    const fixed: any = {};
    for (const [key, value] of Object.entries(obj)) {
      fixed[key] = fixObjectEncoding(value);
    }
    return fixed;
  }
  
  return obj;
};

/**
 * Ensure proper UTF-8 headers for API requests
 */
export const getUTF8Headers = () => ({
  'Content-Type': 'application/json; charset=utf-8',
  'Accept-Charset': 'utf-8'
});

/**
 * Swedish text validation with proper encoding
 */
export const validateSwedishText = (text: string): boolean => {
  if (!text) return false;
  
  // Check for mojibake patterns that indicate encoding issues
  const hasMojibake = /Ã[¥¤¶„–]/g.test(text);
  
  if (hasMojibake) {
    console.warn('Swedish text encoding issue detected:', text);
    return false;
  }
  
  return true;
};

/**
 * Format Swedish currency with proper encoding
 */
export const formatSwedishCurrencyFixed = (amountInOre: number): string => {
  const amountInSEK = amountInOre / 100;
  const formatted = new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amountInSEK);
  
  return fixSwedishEncoding(formatted);
};

/**
 * Safe Swedish phone number formatting with encoding fix
 */
export const formatSwedishPhoneFixed = (phone: string): string => {
  if (!phone) return '';
  
  const cleaned = fixSwedishEncoding(phone);
  const digits = cleaned.replace(/\D/g, '');
  
  // Swedish mobile numbers
  if (digits.startsWith('46')) {
    // International format
    const national = digits.substring(2);
    if (national.startsWith('7')) {
      return `+46 ${national.substring(0, 2)} ${national.substring(2, 5)} ${national.substring(5, 7)} ${national.substring(7)}`;
    }
  }
  
  // National format
  if (digits.startsWith('07')) {
    return `${digits.substring(0, 3)}-${digits.substring(3, 6)} ${digits.substring(6, 8)} ${digits.substring(8)}`;
  }
  
  // Stockholm area code
  if (digits.startsWith('08')) {
    return `${digits.substring(0, 2)}-${digits.substring(2, 5)} ${digits.substring(5, 7)} ${digits.substring(7)}`;
  }
  
  // Other area codes
  if (digits.length >= 10) {
    return `${digits.substring(0, 3)}-${digits.substring(3, 6)} ${digits.substring(6, 8)} ${digits.substring(8)}`;
  }
  
  return cleaned;
};
