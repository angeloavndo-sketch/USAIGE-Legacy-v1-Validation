import { HouseData, createDefaultHouseData } from './houseTypes';

const STORAGE_KEY = 'electricity-house-data';

export function saveHouseData(data: HouseData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save house data:', error);
  }
}

export function loadHouseData(): HouseData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return createDefaultHouseData();
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load house data:', error);
    return createDefaultHouseData();
  }
}

export function clearHouseData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear house data:', error);
  }
}
