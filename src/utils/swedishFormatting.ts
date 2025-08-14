/**
 * Format currency in Swedish SEK format
 */
export const formatSwedishCurrency = (amountInOre: number): string => {
  const amountInSEK = amountInOre / 100;
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amountInSEK);
};

/**
 * Format date in Swedish format
 */
export const formatSwedishDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(dateObj);
};

/**
 * Format date and time in Swedish format
 */
export const formatSwedishDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
};

/**
 * Format phone number in Swedish format
 */
export const formatSwedishPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  
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
  
  return phone; // Return original if no pattern matches
};

/**
 * Format Swedish postal code
 */
export const formatSwedishPostalCode = (postalCode: string): string => {
  const digits = postalCode.replace(/\D/g, '');
  if (digits.length === 5) {
    return `${digits.substring(0, 3)} ${digits.substring(3)}`;
  }
  return postalCode;
};
