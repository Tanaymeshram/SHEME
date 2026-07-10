/**
 * Round a floating-point number to specified decimal places safely
 */
export const round = (value, decimals = 2) => {
  return parseFloat(Number(value).toFixed(decimals));
};

/**
 * Format a number as currency or energy readings (e.g. 1,234.56 kW)
 */
export const formatNumber = (num, suffix = '') => {
  if (num === null || num === undefined) return '0.00' + suffix;
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + suffix;
};

/**
 * Calculates apparent power (kVA) from active power (kW) and power factor
 */
export const calculateKva = (kw, powerFactor = 0.92) => {
  if (!powerFactor) return 0;
  return round(kw / powerFactor);
};

/**
 * Estimates carbon footprint reduction in kg CO2 based on saved kWh
 * Average offset coefficient: 0.475 kg CO2 per kWh saved (standard grid average)
 */
export const calculateCarbonReduction = (kwhSaved) => {
  return round(kwhSaved * 0.475);
};

/**
 * Get color code for status severity (Normal, Warning, Critical)
 */
export const getStatusColorClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'critical':
      return 'bg-rose-500/10 text-rose-400 border border-rose-500/30';
    case 'warning':
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
    case 'normal':
    default:
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
  }
};

/**
 * Helper to display current localized date/time
 */
export const getFormattedDateTime = (date = new Date()) => {
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};
