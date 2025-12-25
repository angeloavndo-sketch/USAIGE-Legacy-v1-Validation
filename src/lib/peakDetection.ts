export interface UsageDataPoint {
  hour: number;
  usage: number;
  timestamp: Date;
}

export interface PeakAnalysis {
  peakHours: number[];
  offPeakHours: number[];
  averageUsage: number;
  peakUsage: number;
  offPeakUsage: number;
  currentIsPeak: boolean;
  savingsPotential: number;
}

// Generate realistic electricity usage data
export function generateUsageData(): UsageDataPoint[] {
  const now = new Date();
  const data: UsageDataPoint[] = [];
  
  for (let hour = 0; hour < 24; hour++) {
    const timestamp = new Date(now);
    timestamp.setHours(hour, 0, 0, 0);
    
    // Simulate realistic usage patterns
    let baseUsage = 1.5; // kWh base load
    
    // Morning peak (6-9 AM)
    if (hour >= 6 && hour <= 9) {
      baseUsage += 2.5 + Math.random() * 1.5;
    }
    // Midday dip (10 AM - 4 PM)
    else if (hour >= 10 && hour <= 16) {
      baseUsage += 1 + Math.random() * 0.8;
    }
    // Evening peak (5-9 PM) - highest usage
    else if (hour >= 17 && hour <= 21) {
      baseUsage += 3.5 + Math.random() * 2;
    }
    // Late night low (10 PM - 5 AM)
    else {
      baseUsage += Math.random() * 0.5;
    }
    
    data.push({
      hour,
      usage: Math.round(baseUsage * 100) / 100,
      timestamp,
    });
  }
  
  return data;
}

// Detect peak hours using statistical analysis
export function detectPeakHours(data: UsageDataPoint[]): PeakAnalysis {
  const usages = data.map(d => d.usage);
  const averageUsage = usages.reduce((a, b) => a + b, 0) / usages.length;
  
  // Calculate standard deviation
  const squaredDiffs = usages.map(u => Math.pow(u - averageUsage, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
  const stdDev = Math.sqrt(avgSquaredDiff);
  
  // Peak threshold: above average + 0.5 standard deviation
  const peakThreshold = averageUsage + (stdDev * 0.5);
  
  const peakHours: number[] = [];
  const offPeakHours: number[] = [];
  let peakUsageSum = 0;
  let offPeakUsageSum = 0;
  
  data.forEach((point) => {
    if (point.usage >= peakThreshold) {
      peakHours.push(point.hour);
      peakUsageSum += point.usage;
    } else {
      offPeakHours.push(point.hour);
      offPeakUsageSum += point.usage;
    }
  });
  
  const currentHour = new Date().getHours();
  const currentIsPeak = peakHours.includes(currentHour);
  
  const peakUsage = peakHours.length > 0 ? peakUsageSum / peakHours.length : 0;
  const offPeakUsage = offPeakHours.length > 0 ? offPeakUsageSum / offPeakHours.length : 0;
  
  // Calculate potential savings if peak usage was reduced to off-peak levels
  const savingsPotential = peakHours.length > 0 
    ? Math.round(((peakUsage - offPeakUsage) / peakUsage) * 100) 
    : 0;
  
  return {
    peakHours,
    offPeakHours,
    averageUsage: Math.round(averageUsage * 100) / 100,
    peakUsage: Math.round(peakUsage * 100) / 100,
    offPeakUsage: Math.round(offPeakUsage * 100) / 100,
    currentIsPeak,
    savingsPotential,
  };
}

export function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

export function getPeakHoursRange(peakHours: number[]): string {
  if (peakHours.length === 0) return 'None detected';
  
  // Group consecutive hours
  const ranges: string[] = [];
  let start = peakHours[0];
  let end = peakHours[0];
  
  for (let i = 1; i < peakHours.length; i++) {
    if (peakHours[i] === end + 1) {
      end = peakHours[i];
    } else {
      ranges.push(start === end ? formatHour(start) : `${formatHour(start)} - ${formatHour(end + 1)}`);
      start = peakHours[i];
      end = peakHours[i];
    }
  }
  ranges.push(start === end ? formatHour(start) : `${formatHour(start)} - ${formatHour(end + 1)}`);
  
  return ranges.join(', ');
}
