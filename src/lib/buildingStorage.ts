import { BuildingsData, createDefaultBuildingsData } from './buildingTypes';

const STORAGE_KEY = 'electricity-buildings-data';

export function saveBuildingsData(data: BuildingsData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save buildings data:', error);
  }
}

export function loadBuildingsData(): BuildingsData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return createDefaultBuildingsData();
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load buildings data:', error);
    return createDefaultBuildingsData();
  }
}

export function clearBuildingsData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear buildings data:', error);
  }
}
