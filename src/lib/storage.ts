import { UsageDataPoint } from './peakDetection';

const STORAGE_KEY = 'electricity-usage-data';

export function saveUsageData(data: UsageDataPoint[]): void {
  try {
    const serialized = JSON.stringify(data.map(d => ({
      hour: d.hour,
      usage: d.usage,
    })));
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save usage data:', error);
  }
}

export function loadUsageData(): UsageDataPoint[] | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    const now = new Date();
    
    return parsed.map((d: { hour: number; usage: number }) => ({
      hour: d.hour,
      usage: d.usage,
      timestamp: new Date(now.setHours(d.hour, 0, 0, 0)),
    }));
  } catch (error) {
    console.error('Failed to load usage data:', error);
    return null;
  }
}

export function clearUsageData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear usage data:', error);
  }
}

export function hasStoredData(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}
