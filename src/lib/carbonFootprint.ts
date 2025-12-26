// Carbon footprint calculator
// CO2 emission factor for Mexico's electricity grid (kg CO2 per kWh)
// Source: CFE average emission factor

export const CO2_FACTOR_KG_PER_KWH = 0.435; // kg CO2 per kWh (Mexico average)

export interface CarbonData {
  totalKwh: number;
  co2EmittedKg: number;
  co2EmittedTons: number;
  treesEquivalent: number;
  carsEquivalent: number;
  lightBulbHours: number;
}

// Calculate carbon footprint from kWh consumption
export function calculateCarbonFootprint(kwhConsumed: number): CarbonData {
  const co2Kg = kwhConsumed * CO2_FACTOR_KG_PER_KWH;
  const co2Tons = co2Kg / 1000;
  
  // A mature tree absorbs about 21 kg of CO2 per year
  const treesNeeded = co2Kg / 21;
  
  // Average car emits about 4.6 metric tons of CO2 per year (driving ~12,000 miles)
  const carsEquivalent = co2Tons / 4.6;
  
  // A 60W incandescent bulb running for 1 hour = 0.06 kWh
  const lightBulbHours = kwhConsumed / 0.06;

  return {
    totalKwh: kwhConsumed,
    co2EmittedKg: co2Kg,
    co2EmittedTons: co2Tons,
    treesEquivalent: treesNeeded,
    carsEquivalent: carsEquivalent * 12, // Convert to months
    lightBulbHours,
  };
}

// Calculate CO2 savings from efficiency improvements
export function calculateCO2Savings(originalKwh: number, reducedKwh: number): CarbonData {
  const savedKwh = originalKwh - reducedKwh;
  return calculateCarbonFootprint(savedKwh);
}

export function formatCO2(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(2)} toneladas`;
  }
  return `${kg.toFixed(2)} kg`;
}
