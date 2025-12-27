import { WeeklySchedule, defaultSchedule } from './vampireDetection';

export interface HouseElectricalObject {
  id: string;
  name: string;
  kw: number;
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

// Calculate daily kWh for an object
// Formula: kWh = kW * hours
export function calculateObjectDailyKwh(obj: HouseElectricalObject): number {
  const kw = safeParseFloat(obj.kw);
  const quantity = safeParseFloat(obj.quantity);
  const hours = safeParseFloat(obj.hoursPerDay);
  return parseFloat((kw * quantity * hours).toFixed(4));
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

// Calculate hourly usage for a single room
export function calculateRoomHourlyUsage(room: Room): number[] {
  const hourlyUsage = Array(24).fill(0);
  const today = new Date().getDay();
  const activeHours = getActiveHoursForDay(room.schedule, today);
  
  room.objects.forEach(obj => {
    const kw = safeParseFloat(obj.kw);
    const quantity = safeParseFloat(obj.quantity);
    const totalKw = kw * quantity;
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

// Create sample objects for a room
function createSampleRoomObjects(roomName: string): HouseElectricalObject[] {
  const objects: HouseElectricalObject[] = [];
  
  // Common for most rooms: LED lights
  objects.push({
    id: generateId(),
    name: 'Foco LED 10W',
    kw: 0.01,
    quantity: roomName === 'Sala' ? 6 : roomName === 'Cocina' ? 4 : 2,
    hoursPerDay: 5,
  });
  
  // Room-specific objects
  switch (roomName) {
    case 'Sala':
      objects.push(
        { id: generateId(), name: 'Televisión LED 55"', kw: 0.1, quantity: 1, hoursPerDay: 6 },
        { id: generateId(), name: 'Aire Acondicionado', kw: 2.5, quantity: 1, hoursPerDay: 8 },
        { id: generateId(), name: 'Consola de Videojuegos', kw: 0.15, quantity: 1, hoursPerDay: 3 },
        { id: generateId(), name: 'Router WiFi', kw: 0.01, quantity: 1, hoursPerDay: 24 }
      );
      break;
    case 'Cocina':
      objects.push(
        { id: generateId(), name: 'Refrigerador', kw: 0.15, quantity: 1, hoursPerDay: 24 },
        { id: generateId(), name: 'Microondas', kw: 1.0, quantity: 1, hoursPerDay: 0.5 },
        { id: generateId(), name: 'Licuadora', kw: 0.3, quantity: 1, hoursPerDay: 0.25 },
        { id: generateId(), name: 'Cafetera', kw: 0.8, quantity: 1, hoursPerDay: 0.5 }
      );
      break;
    case 'Recámara Principal':
      objects.push(
        { id: generateId(), name: 'Aire Acondicionado Mini Split', kw: 1.5, quantity: 1, hoursPerDay: 8 },
        { id: generateId(), name: 'Televisión LED 40"', kw: 0.08, quantity: 1, hoursPerDay: 3 },
        { id: generateId(), name: 'Cargador de Celular', kw: 0.005, quantity: 2, hoursPerDay: 8 },
        { id: generateId(), name: 'Ventilador de Techo', kw: 0.075, quantity: 1, hoursPerDay: 6 }
      );
      break;
    case 'Recámara 2':
      objects.push(
        { id: generateId(), name: 'Ventilador de Piso', kw: 0.05, quantity: 1, hoursPerDay: 8 },
        { id: generateId(), name: 'Laptop', kw: 0.05, quantity: 1, hoursPerDay: 4 },
        { id: generateId(), name: 'Cargador de Celular', kw: 0.005, quantity: 1, hoursPerDay: 8 }
      );
      break;
    case 'Estudio':
      objects.push(
        { id: generateId(), name: 'Computadora de Escritorio', kw: 0.3, quantity: 1, hoursPerDay: 6 },
        { id: generateId(), name: 'Monitor', kw: 0.03, quantity: 2, hoursPerDay: 6 },
        { id: generateId(), name: 'Impresora', kw: 0.05, quantity: 1, hoursPerDay: 0.5 },
        { id: generateId(), name: 'Aire Acondicionado Mini Split', kw: 1.5, quantity: 1, hoursPerDay: 6 }
      );
      break;
    case 'Lavandería':
      objects.push(
        { id: generateId(), name: 'Lavadora', kw: 0.5, quantity: 1, hoursPerDay: 1.5 },
        { id: generateId(), name: 'Secadora', kw: 3.0, quantity: 1, hoursPerDay: 1 },
        { id: generateId(), name: 'Plancha', kw: 1.2, quantity: 1, hoursPerDay: 0.5 }
      );
      break;
    case 'Garage':
      objects.push(
        { id: generateId(), name: 'Lámpara Fluorescente', kw: 0.04, quantity: 2, hoursPerDay: 2 },
        { id: generateId(), name: 'Bomba de Agua', kw: 0.75, quantity: 1, hoursPerDay: 1 }
      );
      break;
    case 'Patio':
      objects.push(
        { id: generateId(), name: 'Bomba de Agua', kw: 0.75, quantity: 1, hoursPerDay: 0.5 },
        { id: generateId(), name: 'Luz Exterior', kw: 0.015, quantity: 4, hoursPerDay: 6 }
      );
      break;
    case 'Baño Principal':
    case 'Baño 2':
      objects.push(
        { id: generateId(), name: 'Calentador de Agua', kw: 4.5, quantity: 1, hoursPerDay: 0.5 },
        { id: generateId(), name: 'Secadora de Pelo', kw: 1.5, quantity: 1, hoursPerDay: 0.25 }
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

export const commonHouseObjects = [
  { name: 'Aire Acondicionado', kw: 2.5 },
  { name: 'Aire Acondicionado Mini Split', kw: 1.5 },
  { name: 'Refrigerador', kw: 0.15 },
  { name: 'Televisión LED 55"', kw: 0.1 },
  { name: 'Televisión LED 40"', kw: 0.08 },
  { name: 'Lavadora', kw: 0.5 },
  { name: 'Secadora', kw: 3.0 },
  { name: 'Microondas', kw: 1.0 },
  { name: 'Foco LED 10W', kw: 0.01 },
  { name: 'Foco Incandescente 60W', kw: 0.06 },
  { name: 'Computadora de Escritorio', kw: 0.3 },
  { name: 'Laptop', kw: 0.05 },
  { name: 'Ventilador de Techo', kw: 0.075 },
  { name: 'Ventilador de Piso', kw: 0.05 },
  { name: 'Router WiFi', kw: 0.01 },
  { name: 'Cargador de Celular', kw: 0.005 },
  { name: 'Consola de Videojuegos', kw: 0.15 },
  { name: 'Plancha', kw: 1.2 },
  { name: 'Licuadora', kw: 0.3 },
  { name: 'Cafetera', kw: 0.8 },
  { name: 'Horno Eléctrico', kw: 2.0 },
  { name: 'Calentador de Agua', kw: 4.5 },
  { name: 'Bomba de Agua', kw: 0.75 },
  { name: 'Secadora de Pelo', kw: 1.5 },
  { name: 'Monitor', kw: 0.03 },
  { name: 'Impresora', kw: 0.05 },
  { name: 'Luz Exterior', kw: 0.015 },
];
