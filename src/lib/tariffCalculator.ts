// CFE Tariff Calculator for Mexico (Monterrey residential)

export interface TariffBlock {
  min: number;
  max: number;
  pricePerKwh: number;
  name: string;
}

export interface TariffConfig {
  blocks: TariffBlock[];
  dacThreshold: number;
  dacPrice: number;
  fixedCharges: number;
  ivaRate: number;
}

export interface BillCalculation {
  consumptionKwh: number;
  blockBreakdown: { block: string; kwh: number; subtotal: number }[];
  baseTotal: number;
  fixedCharges: number;
  subtotal: number;
  iva: number;
  total: number;
  isDac: boolean;
}

export interface PredictionResult {
  currentMonth: BillCalculation;
  nextMonthEstimate: BillCalculation;
  trend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number;
  averageConsumption: number;
  maxEstimate: BillCalculation;
}

// Default CFE tariff for Monterrey residential
export const defaultTariffConfig: TariffConfig = {
  blocks: [
    { min: 0, max: 150, pricePerKwh: 1.68, name: 'Bloque 1 (0-150 kWh)' },
    { min: 151, max: 300, pricePerKwh: 2.30, name: 'Bloque 2 (151-300 kWh)' },
    { min: 301, max: 500, pricePerKwh: 3.05, name: 'Bloque 3 (301-500 kWh)' },
    { min: 501, max: Infinity, pricePerKwh: 3.60, name: 'Bloque 4 (>500 kWh)' },
  ],
  dacThreshold: 500,
  dacPrice: 5.25,
  fixedCharges: 40, // Base charge + transmission/distribution
  ivaRate: 0.16,
};

export function calculateBill(consumptionKwh: number, config: TariffConfig = defaultTariffConfig): BillCalculation {
  const isDac = consumptionKwh > config.dacThreshold;
  
  let baseTotal = 0;
  const blockBreakdown: { block: string; kwh: number; subtotal: number }[] = [];

  if (isDac) {
    // DAC tariff applies to all consumption
    baseTotal = consumptionKwh * config.dacPrice;
    blockBreakdown.push({
      block: 'Tarifa DAC',
      kwh: consumptionKwh,
      subtotal: baseTotal,
    });
  } else {
    // Calculate by blocks
    let remainingKwh = consumptionKwh;
    
    for (const block of config.blocks) {
      if (remainingKwh <= 0) break;
      
      const blockSize = block.max === Infinity ? remainingKwh : (block.max - block.min + 1);
      const kwhInBlock = Math.min(remainingKwh, blockSize);
      
      if (kwhInBlock > 0) {
        const subtotal = kwhInBlock * block.pricePerKwh;
        baseTotal += subtotal;
        blockBreakdown.push({
          block: block.name,
          kwh: kwhInBlock,
          subtotal,
        });
        remainingKwh -= kwhInBlock;
      }
    }
  }

  const subtotal = baseTotal + config.fixedCharges;
  const iva = subtotal * config.ivaRate;
  const total = subtotal + iva;

  return {
    consumptionKwh,
    blockBreakdown,
    baseTotal,
    fixedCharges: config.fixedCharges,
    subtotal,
    iva,
    total,
    isDac,
  };
}

export function predictNextMonth(
  currentMonthKwh: number,
  historyKwh: number[] = [],
  config: TariffConfig = defaultTariffConfig
): PredictionResult {
  const allData = [...historyKwh, currentMonthKwh];
  
  // Calculate average consumption
  const averageConsumption = allData.reduce((a, b) => a + b, 0) / allData.length;
  
  // Calculate trend using simple linear regression
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  let trendPercentage = 0;
  let estimatedNextMonth = averageConsumption;
  
  if (allData.length >= 2) {
    // Simple trend: compare last two values
    const lastValue = allData[allData.length - 1];
    const secondLastValue = allData[allData.length - 2];
    const change = ((lastValue - secondLastValue) / secondLastValue) * 100;
    
    if (change > 5) {
      trend = 'increasing';
      trendPercentage = change;
      estimatedNextMonth = lastValue * (1 + change / 100);
    } else if (change < -5) {
      trend = 'decreasing';
      trendPercentage = Math.abs(change);
      estimatedNextMonth = lastValue * (1 + change / 100);
    } else {
      trend = 'stable';
      trendPercentage = Math.abs(change);
      estimatedNextMonth = averageConsumption;
    }
  }

  // Calculate max estimate (worst case: +20% from highest recorded)
  const maxConsumption = Math.max(...allData) * 1.2;

  return {
    currentMonth: calculateBill(currentMonthKwh, config),
    nextMonthEstimate: calculateBill(Math.max(0, estimatedNextMonth), config),
    trend,
    trendPercentage,
    averageConsumption,
    maxEstimate: calculateBill(maxConsumption, config),
  };
}

// Helper to format currency in MXN
export function formatMXN(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}
