import { WeeklySchedule, defaultSchedule } from './vampireDetection';

export interface HouseElectricalObject {
  id: string;
  name: string;
  watts: number; // Potencia en Watts (W)
  quantity: number;
  hoursPerDay: number;
}

export interface Room {
  id: string;
  name: string;
  objects: HouseElectricalObject[];
  schedule: WeeklySchedule;
}

export interface House {
  id: string;
  name: string;
  rooms: Room[];
}

export interface HouseData {
  house: House;
}

// Sanitized parseFloat to prevent NaN
function safeParseFloat(value: number | string): number {
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * CÁLCULO DE CONSUMO DIARIO POR OBJETO (CASA)
 * Fórmula: kWh = (Watts × Cantidad × Horas) / 1000
 */
export function calculateObjectDailyKwh(obj: HouseElectricalObject): number {
  const watts = safeParseFloat(obj.watts);
  const quantity = safeParseFloat(obj.quantity);
  const hours = safeParseFloat(obj.hoursPerDay);
  return parseFloat(((watts * quantity * hours) / 1000).toFixed(4));
}

// Calculate daily kWh for a room
export function calculateRoomDailyKwh(room: Room): number {
  const total = room.objects.reduce((sum, obj) => sum + calculateObjectDailyKwh(obj), 0);
  return parseFloat(total.toFixed(4));
}

// Calculate total daily kWh for house
export function calculateHouseDailyKwh(house: House): number {
  const total = house.rooms.reduce((sum, room) => sum + calculateRoomDailyKwh(room), 0);
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

// Calculate hourly usage for a single room (returns kW)
export function calculateRoomHourlyUsage(room: Room): number[] {
  const hourlyUsage = Array(24).fill(0);
  const today = new Date().getDay();
  const activeHours = getActiveHoursForDay(room.schedule, today);
  
  room.objects.forEach(obj => {
    const watts = safeParseFloat(obj.watts);
    const quantity = safeParseFloat(obj.quantity);
    // Convertir Watts a kW
    const totalKw = (watts * quantity) / 1000;
    const hoursActive = Math.min(safeParseFloat(obj.hoursPerDay), activeHours.length);
    
    for (let i = 0; i < hoursActive && i < activeHours.length; i++) {
      const hour = activeHours[i];
      hourlyUsage[hour] += totalKw;
    }
  });
  
  return hourlyUsage.map(u => parseFloat(u.toFixed(4)));
}

// Calculate hourly usage for house
export function calculateHouseHourlyUsage(house: House): number[] {
  const hourlyUsage = Array(24).fill(0);
  
  house.rooms.forEach(room => {
    const roomHourly = calculateRoomHourlyUsage(room);
    roomHourly.forEach((usage, hour) => {
      hourlyUsage[hour] += usage;
    });
  });
  
  return hourlyUsage.map(u => parseFloat(u.toFixed(4)));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Create sample objects for a room (NOW IN WATTS)
function createSampleRoomObjects(roomName: string): HouseElectricalObject[] {
  const objects: HouseElectricalObject[] = [];
  
  // Common for most rooms: LED lights (10W each)
  objects.push({
    id: generateId(),
    name: 'Foco LED 10W',
    watts: 10,
    quantity: roomName === 'Sala' ? 6 : roomName === 'Cocina' ? 4 : 2,
    hoursPerDay: 5,
  });
  
  // Room-specific objects (ALL IN WATTS)
  switch (roomName) {
    case 'Sala':
      objects.push(
        { id: generateId(), name: 'Televisión LED 55"', watts: 100, quantity: 1, hoursPerDay: 6 },
        { id: generateId(), name: 'Aire Acondicionado', watts: 2500, quantity: 1, hoursPerDay: 8 },
        { id: generateId(), name: 'Consola de Videojuegos', watts: 150, quantity: 1, hoursPerDay: 3 },
        { id: generateId(), name: 'Router WiFi', watts: 10, quantity: 1, hoursPerDay: 24 }
      );
      break;
    case 'Cocina':
      objects.push(
        { id: generateId(), name: 'Refrigerador', watts: 150, quantity: 1, hoursPerDay: 24 },
        { id: generateId(), name: 'Microondas', watts: 1000, quantity: 1, hoursPerDay: 0.5 },
        { id: generateId(), name: 'Licuadora', watts: 300, quantity: 1, hoursPerDay: 0.25 },
        { id: generateId(), name: 'Cafetera', watts: 800, quantity: 1, hoursPerDay: 0.5 }
      );
      break;
    case 'Recámara Principal':
      objects.push(
        { id: generateId(), name: 'Aire Acondicionado Mini Split', watts: 1500, quantity: 1, hoursPerDay: 8 },
        { id: generateId(), name: 'Televisión LED 40"', watts: 80, quantity: 1, hoursPerDay: 3 },
        { id: generateId(), name: 'Cargador de Celular', watts: 5, quantity: 2, hoursPerDay: 8 },
        { id: generateId(), name: 'Ventilador de Techo', watts: 75, quantity: 1, hoursPerDay: 6 }
      );
      break;
    case 'Recámara 2':
      objects.push(
        { id: generateId(), name: 'Ventilador de Piso', watts: 50, quantity: 1, hoursPerDay: 8 },
        { id: generateId(), name: 'Laptop', watts: 50, quantity: 1, hoursPerDay: 4 },
        { id: generateId(), name: 'Cargador de Celular', watts: 5, quantity: 1, hoursPerDay: 8 }
      );
      break;
    case 'Estudio':
      objects.push(
        { id: generateId(), name: 'Computadora de Escritorio', watts: 300, quantity: 1, hoursPerDay: 6 },
        { id: generateId(), name: 'Monitor', watts: 30, quantity: 2, hoursPerDay: 6 },
        { id: generateId(), name: 'Impresora', watts: 50, quantity: 1, hoursPerDay: 0.5 },
        { id: generateId(), name: 'Aire Acondicionado Mini Split', watts: 1500, quantity: 1, hoursPerDay: 6 }
      );
      break;
    case 'Lavandería':
      objects.push(
        { id: generateId(), name: 'Lavadora', watts: 500, quantity: 1, hoursPerDay: 1.5 },
        { id: generateId(), name: 'Secadora', watts: 3000, quantity: 1, hoursPerDay: 1 },
        { id: generateId(), name: 'Plancha', watts: 1200, quantity: 1, hoursPerDay: 0.5 }
      );
      break;
    case 'Garage':
      objects.push(
        { id: generateId(), name: 'Lámpara Fluorescente', watts: 40, quantity: 2, hoursPerDay: 2 },
        { id: generateId(), name: 'Bomba de Agua', watts: 750, quantity: 1, hoursPerDay: 1 }
      );
      break;
    case 'Patio':
      objects.push(
        { id: generateId(), name: 'Bomba de Agua', watts: 750, quantity: 1, hoursPerDay: 0.5 },
        { id: generateId(), name: 'Luz Exterior', watts: 15, quantity: 4, hoursPerDay: 6 }
      );
      break;
    case 'Baño Principal':
    case 'Baño 2':
      objects.push(
        { id: generateId(), name: 'Calentador de Agua', watts: 4500, quantity: 1, hoursPerDay: 0.5 },
        { id: generateId(), name: 'Secadora de Pelo', watts: 1500, quantity: 1, hoursPerDay: 0.25 }
      );
      break;
  }
  
  return objects;
}

export function createDefaultHouseData(): HouseData {
  const defaultRooms = [
    'Sala', 'Cocina', 'Recámara Principal', 'Recámara 2', 
    'Baño Principal', 'Baño 2', 'Estudio', 'Lavandería', 'Garage', 'Patio'
  ];

  // Home schedule: typically active from morning to night
  const homeSchedule: WeeklySchedule = {
    monday: { enabled: true, startHour: 6, endHour: 23 },
    tuesday: { enabled: true, startHour: 6, endHour: 23 },
    wednesday: { enabled: true, startHour: 6, endHour: 23 },
    thursday: { enabled: true, startHour: 6, endHour: 23 },
    friday: { enabled: true, startHour: 6, endHour: 24 },
    saturday: { enabled: true, startHour: 8, endHour: 24 },
    sunday: { enabled: true, startHour: 8, endHour: 23 },
  };

  return {
    house: {
      id: generateId(),
      name: 'Mi Casa',
      rooms: defaultRooms.map(name => ({
        id: generateId(),
        name,
        objects: createSampleRoomObjects(name),
        schedule: { ...homeSchedule },
      })),
    },
  };
}

// Common house objects (ALL IN WATTS)
export const commonHouseObjects = [
  { name: 'Aire Acondicionado', watts: 2500 },
  { name: 'Aire Acondicionado Mini Split', watts: 1500 },
  { name: 'Refrigerador', watts: 150 },
  { name: 'Televisión LED 55"', watts: 100 },
  { name: 'Televisión LED 40"', watts: 80 },
  { name: 'Lavadora', watts: 500 },
  { name: 'Secadora', watts: 3000 },
  { name: 'Microondas', watts: 1000 },
  { name: 'Foco LED 10W', watts: 10 },
  { name: 'Foco Incandescente 60W', watts: 60 },
  { name: 'Computadora de Escritorio', watts: 300 },
  { name: 'Laptop', watts: 50 },
  { name: 'Ventilador de Techo', watts: 75 },
  { name: 'Ventilador de Piso', watts: 50 },
  { name: 'Router WiFi', watts: 10 },
  { name: 'Cargador de Celular', watts: 5 },
  { name: 'Consola de Videojuegos', watts: 150 },
  { name: 'Plancha', watts: 1200 },
  { name: 'Licuadora', watts: 300 },
  { name: 'Cafetera', watts: 800 },
  { name: 'Horno Eléctrico', watts: 2000 },
  { name: 'Calentador de Agua', watts: 4500 },
  { name: 'Bomba de Agua', watts: 750 },
  { name: 'Secadora de Pelo', watts: 1500 },
  { name: 'Monitor', watts: 30 },
  { name: 'Impresora', watts: 50 },
  { name: 'Luz Exterior', watts: 15 },
];
