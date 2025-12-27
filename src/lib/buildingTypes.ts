import { WeeklySchedule, defaultSchedule } from './vampireDetection';

export interface ElectricalObject {
  id: string;
  name: string;
  kw: number; // kW consumption per hour
  quantity: number;
  hoursPerDay: number; // hours used per day
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

// Calculate total kWh for an electrical object per day
// Formula: kWh = (Watts * Hours) / 1000, where kW = Watts/1000
// So kWh = kW * Hours
export function calculateObjectDailyKwh(obj: ElectricalObject): number {
  const kw = safeParseFloat(obj.kw);
  const quantity = safeParseFloat(obj.quantity);
  const hours = safeParseFloat(obj.hoursPerDay);
  return parseFloat((kw * quantity * hours).toFixed(4));
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
export function calculateBuildingHourlyUsage(building: Building): number[] {
  const hourlyUsage = Array(24).fill(0);
  const today = new Date().getDay();
  
  building.classrooms.forEach(classroom => {
    const activeHours = getActiveHoursForDay(classroom.schedule, today);
    
    classroom.objects.forEach(obj => {
      const kw = safeParseFloat(obj.kw);
      const quantity = safeParseFloat(obj.quantity);
      const totalKw = kw * quantity;
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

// Create realistic sample data for a classroom
function createSampleClassroomObjects(): ElectricalObject[] {
  const objects: ElectricalObject[] = [];
  
  // Air Conditioner - most buildings have AC
  objects.push({
    id: generateId(),
    name: 'Aire Acondicionado',
    kw: 2.5,
    quantity: 1,
    hoursPerDay: 8,
  });
  
  // Fluorescent lights
  objects.push({
    id: generateId(),
    name: 'Lámpara Fluorescente',
    kw: 0.04,
    quantity: 8,
    hoursPerDay: 8,
  });
  
  // Computers
  objects.push({
    id: generateId(),
    name: 'Computadora',
    kw: 0.3,
    quantity: Math.floor(Math.random() * 5) + 1,
    hoursPerDay: 6,
  });
  
  // Projector
  if (Math.random() > 0.3) {
    objects.push({
      id: generateId(),
      name: 'Proyector',
      kw: 0.3,
      quantity: 1,
      hoursPerDay: 4,
    });
  }
  
  // Fan
  if (Math.random() > 0.5) {
    objects.push({
      id: generateId(),
      name: 'Ventilador',
      kw: 0.075,
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

// Common electrical objects with typical kW values (Spanish)
export const commonElectricalObjects = [
  { name: 'Aire Acondicionado', kw: 2.5 },
  { name: 'Aire Acondicionado Mini Split', kw: 1.5 },
  { name: 'Televisión LED 55"', kw: 0.1 },
  { name: 'Foco LED 10W', kw: 0.01 },
  { name: 'Foco Incandescente 60W', kw: 0.06 },
  { name: 'Lámpara Fluorescente', kw: 0.04 },
  { name: 'Computadora de Escritorio', kw: 0.3 },
  { name: 'Laptop', kw: 0.05 },
  { name: 'Proyector', kw: 0.3 },
  { name: 'Ventilador de Techo', kw: 0.075 },
  { name: 'Ventilador de Piso', kw: 0.05 },
  { name: 'Refrigerador', kw: 0.15 },
  { name: 'Microondas', kw: 1.0 },
  { name: 'Impresora', kw: 0.05 },
  { name: 'Dispensador de Agua', kw: 0.5 },
  { name: 'Cafetera', kw: 0.8 },
  { name: 'Router WiFi', kw: 0.01 },
  { name: 'Cargador de Celular', kw: 0.005 },
];
