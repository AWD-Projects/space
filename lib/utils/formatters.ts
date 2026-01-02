/**
 * Formats a number as currency (adds commas and optional decimal places)
 * Example: 1234567.89 -> "1,234,567.89"
 */
export function formatCurrency(value: string | number): string {
  const numericValue = typeof value === 'string'
    ? value.replace(/[^\d.]/g, '')
    : String(value);

  if (!numericValue || numericValue === '.') return '';

  const parts = numericValue.split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const decimalPart = parts[1] ? `.${parts[1].slice(0, 2)}` : '';

  return integerPart + decimalPart;
}

/**
 * Parses a formatted currency string back to a number
 * Example: "1,234,567.89" -> 1234567.89
 */
export function parseCurrency(value: string): number {
  const numeric = value.replace(/[^\d.]/g, '');
  return parseFloat(numeric) || 0;
}

/**
 * Formats a phone number with international format
 * Example: "5219991234567" -> "+52 1 999 123 4567"
 */
export function formatPhoneNumber(value: string): string {
  const numeric = value.replace(/\D/g, '');

  if (!numeric) return '';

  // Basic formatting for international numbers
  if (numeric.length <= 3) return numeric;
  if (numeric.length <= 6) return `${numeric.slice(0, 2)} ${numeric.slice(2)}`;
  if (numeric.length <= 9) return `${numeric.slice(0, 2)} ${numeric.slice(2, 3)} ${numeric.slice(3)}`;
  if (numeric.length <= 12) {
    return `${numeric.slice(0, 2)} ${numeric.slice(2, 3)} ${numeric.slice(3, 6)} ${numeric.slice(6)}`;
  }

  return `${numeric.slice(0, 2)} ${numeric.slice(2, 3)} ${numeric.slice(3, 6)} ${numeric.slice(6, 9)} ${numeric.slice(9, 13)}`;
}

/**
 * Parses a formatted phone number back to numeric string
 */
export function parsePhoneNumber(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Formats a number with thousand separators
 * Example: 1234567 -> "1,234,567"
 */
export function formatNumber(value: string | number): string {
  const numericValue = typeof value === 'string'
    ? value.replace(/\D/g, '')
    : String(value);

  if (!numericValue) return '';

  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Parses a formatted number back to an integer
 */
export function parseNumber(value: string): number {
  const numeric = value.replace(/\D/g, '');
  return parseInt(numeric) || 0;
}

/**
 * Formats stock quantity with thousand separators
 * Example: 1234 -> "1,234"
 */
export function formatStock(value: string | number): string {
  const numericValue = typeof value === 'string'
    ? value.replace(/\D/g, '')
    : String(value);

  if (!numericValue) return '0';

  return parseInt(numericValue).toLocaleString('es-MX');
}

/**
 * Parses stock value
 */
export function parseStock(value: string): number {
  return parseInt(value.replace(/\D/g, '')) || 0;
}

/**
 * Formats a number as Mexican Pesos
 * Example: 1234.56 -> "$1,234.56 MXN"
 */
export function formatMXN(value: string | number): string {
  const numericValue = typeof value === 'string'
    ? parseFloat(value.replace(/[^\d.]/g, ''))
    : value;

  if (isNaN(numericValue)) return '$0.00 MXN';

  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericValue);
}

/**
 * Formats a number with Mexican locale (thousand separators)
 * Example: 1234567 -> "1,234,567"
 */
export function formatNumberMX(value: string | number): string {
  const numericValue = typeof value === 'string'
    ? parseInt(value.replace(/\D/g, ''))
    : value;

  if (isNaN(numericValue)) return '0';

  return numericValue.toLocaleString('es-MX');
}

/**
 * Formats price text intelligently
 * If it's a pure number, formats as MXN
 * If it already has text, returns as-is
 * Example: "1500" -> "$1,500.00 MXN"
 * Example: "desde $500" -> "desde $500"
 */
export function formatPriceDisplay(priceText: string | null): string {
  if (!priceText) return '';

  // Check if it's a pure number (with or without decimals)
  const numberMatch = priceText.match(/^[\d,\.]+$/);

  if (numberMatch) {
    const numericValue = parseFloat(priceText.replace(/,/g, ''));
    if (!isNaN(numericValue)) {
      return formatMXN(numericValue);
    }
  }

  // If it already has formatting or text, return as-is
  return priceText;
}
