import { WeeklySchedule, defaultSchedule } from './vampireDetection';

export interface ElectricalObject {
  id: string;
  name: string;
  watts: number; // Potencia en Watts (W)
  quantity: number;
  hoursPerDay: number; // Horas de uso por día
}

export interface Classroom {
  id: string;
  name: string;
  objects: ElectricalObject[];
  schedule: WeeklySchedule;
}

export interface Building {
  id: string;
  name: string;
  classrooms: Classroom[];
}

export interface BuildingsData {
  buildings: Building[];
}

// Sanitized parseFloat to prevent NaN
function safeParseFloat(value: number | string): number {
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * CÁLCULO DE CONSUMO DIARIO POR OBJETO
 * =====================================
 * Fórmula: kWh = (Watts × Cantidad × Horas) / 1000
 * 
 * @param obj - Objeto eléctrico con potencia en WATTS
 * @returns Consumo diario en kWh (4 decimales de precisión)
 */
export function calculateObjectDailyKwh(obj: ElectricalObject): number {
  const watts = safeParseFloat(obj.watts);
  const quantity = safeParseFloat(obj.quantity);
  const hours = safeParseFloat(obj.hoursPerDay);
  // Fórmula: (W × Q × H) / 1000 = kWh
  return parseFloat(((watts * quantity * hours) / 1000).toFixed(4));
}

// Calculate total kWh for a classroom per day
export function calculateClassroomDailyKwh(classroom: Classroom): number {
  const total = classroom.objects.reduce((sum, obj) => sum + calculateObjectDailyKwh(obj), 0);
  return parseFloat(total.toFixed(4));
}

// Calculate total kWh for a building per day
export function calculateBuildingDailyKwh(building: Building): number {
  const total = building.classrooms.reduce((sum, room) => sum + calculateClassroomDailyKwh(room), 0);
  return parseFloat(total.toFixed(4));
}

// Calculate total kWh for all buildings per day
export function calculateTotalDailyKwh(buildings: Building[]): number {
  const total = buildings.reduce((sum, building) => sum + calculateBuildingDailyKwh(building), 0);
  return parseFloat(total.toFixed(4));
}

// Get active hours from schedule for a specific day
function getActiveHoursForDay(schedule: WeeklySchedule, dayIndex: number): number[] {
  const days: (keyof WeeklySchedule)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const daySchedule = schedule[days[dayIndex]];
  
  if (!daySchedule.enabled) return [];
  
  const hours: number[] = [];
  for (let h = daySchedule.startHour; h < daySchedule.endHour; h++) {
    hours.push(h);
  }
  return hours;
}

// Calculate hourly usage for a single building based on schedules
// Returns kW per hour (Watts converted to kW)
export function calculateBuildingHourlyUsage(building: Building): number[] {
  const hourlyUsage = Array(24).fill(0);
  const today = new Date().getDay();
  
  building.classrooms.forEach(classroom => {
    const activeHours = getActiveHoursForDay(classroom.schedule, today);
    
    classroom.objects.forEach(obj => {
      const watts = safeParseFloat(obj.watts);
      const quantity = safeParseFloat(obj.quantity);
      // Convertir Watts a kW para visualización por hora
      const totalKw = (watts * quantity) / 1000;
      const hoursActive = Math.min(safeParseFloat(obj.hoursPerDay), activeHours.length);
      
      // Distribute usage across active hours
      for (let i = 0; i < hoursActive && i < activeHours.length; i++) {
        const hour = activeHours[i];
        hourlyUsage[hour] += totalKw;
      }
    });
  });
  
  return hourlyUsage.map(u => parseFloat(u.toFixed(4)));
}

// Calculate hourly usage for all buildings
export function calculateHourlyUsage(buildings: Building[]): number[] {
  const hourlyUsage = Array(24).fill(0);
  
  buildings.forEach(building => {
    const buildingHourly = calculateBuildingHourlyUsage(building);
    buildingHourly.forEach((usage, hour) => {
      hourlyUsage[hour] += usage;
    });
  });
  
  return hourlyUsage.map(u => parseFloat(u.toFixed(4)));
}

// Generate unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Create realistic sample data for a classroom (NOW IN WATTS)
function createSampleClassroomObjects(): ElectricalObject[] {
  const objects: ElectricalObject[] = [];
  
  // Aire Acondicionado - 2500W
  objects.push({
    id: generateId(),
    name: 'Aire Acondicionado',
    watts: 2500,
    quantity: 1,
    hoursPerDay: 8,
  });
  
  // Lámparas Fluorescentes - 40W cada una
  objects.push({
    id: generateId(),
    name: 'Lámpara Fluorescente',
    watts: 40,
    quantity: 8,
    hoursPerDay: 8,
  });
  
  // Computadoras - 300W
  objects.push({
    id: generateId(),
    name: 'Computadora',
    watts: 300,
    quantity: Math.floor(Math.random() * 5) + 1,
    hoursPerDay: 6,
  });
  
  // Proyector - 300W
  if (Math.random() > 0.3) {
    objects.push({
      id: generateId(),
      name: 'Proyector',
      watts: 300,
      quantity: 1,
      hoursPerDay: 4,
    });
  }
  
  // Ventilador - 75W
  if (Math.random() > 0.5) {
    objects.push({
      id: generateId(),
      name: 'Ventilador',
      watts: 75,
      quantity: 2,
      hoursPerDay: 6,
    });
  }
  
  return objects;
}

// Create default buildings data with realistic sample data
export function createDefaultBuildingsData(): BuildingsData {
  const buildings: Building[] = [
    {
      id: generateId(),
      name: 'Edificio A',
      classrooms: Array.from({ length: 10 }, (_, i) => ({
        id: generateId(),
        name: `Salón A-${i + 1}`,
        objects: createSampleClassroomObjects(),
        schedule: {
          ...defaultSchedule,
          monday: { enabled: true, startHour: 7, endHour: 15 },
          tuesday: { enabled: true, startHour: 7, endHour: 15 },
          wednesday: { enabled: true, startHour: 7, endHour: 15 },
          thursday: { enabled: true, startHour: 7, endHour: 15 },
          friday: { enabled: true, startHour: 7, endHour: 14 },
          saturday: { enabled: true, startHour: 8, endHour: 13 },
          sunday: { enabled: false, startHour: 0, endHour: 0 },
        },
      })),
    },
    {
      id: generateId(),
      name: 'Edificio B',
      classrooms: Array.from({ length: 10 }, (_, i) => ({
        id: generateId(),
        name: `Salón B-${i + 1}`,
        objects: createSampleClassroomObjects(),
        schedule: {
          ...defaultSchedule,
          monday: { enabled: true, startHour: 13, endHour: 21 },
          tuesday: { enabled: true, startHour: 13, endHour: 21 },
          wednesday: { enabled: true, startHour: 13, endHour: 21 },
          thursday: { enabled: true, startHour: 13, endHour: 21 },
          friday: { enabled: true, startHour: 13, endHour: 20 },
          saturday: { enabled: true, startHour: 9, endHour: 14 },
          sunday: { enabled: false, startHour: 0, endHour: 0 },
        },
      })),
    },
  ];
  
  return { buildings };
}

// Common electrical objects with typical WATTS values (Spanish)
export const commonElectricalObjects = [
  { name: 'Aire Acondicionado', watts: 2500 },
  { name: 'Aire Acondicionado Mini Split', watts: 1500 },
  { name: 'Televisión LED 55"', watts: 100 },
  { name: 'Foco LED 10W', watts: 10 },
  { name: 'Foco Incandescente 60W', watts: 60 },
  { name: 'Lámpara Fluorescente', watts: 40 },
  { name: 'Computadora de Escritorio', watts: 300 },
  { name: 'Laptop', watts: 50 },
  { name: 'Proyector', watts: 300 },
  { name: 'Ventilador de Techo', watts: 75 },
  { name: 'Ventilador de Piso', watts: 50 },
  { name: 'Refrigerador', watts: 150 },
  { name: 'Microondas', watts: 1000 },
  { name: 'Impresora', watts: 50 },
  { name: 'Dispensador de Agua', watts: 500 },
  { name: 'Cafetera', watts: 800 },
  { name: 'Router WiFi', watts: 10 },
  { name: 'Cargador de Celular', watts: 5 },
];
