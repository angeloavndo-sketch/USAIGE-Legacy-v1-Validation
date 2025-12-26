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

// Calculate daily kWh for a room
export function calculateRoomDailyKwh(room: Room): number {
  return room.objects.reduce((sum, obj) => sum + (obj.kw * obj.quantity * obj.hoursPerDay), 0);
}

// Calculate total daily kWh for house
export function calculateHouseDailyKwh(house: House): number {
  return house.rooms.reduce((sum, room) => sum + calculateRoomDailyKwh(room), 0);
}

// Calculate hourly usage for house
export function calculateHouseHourlyUsage(house: House): number[] {
  const hourlyUsage = Array(24).fill(0);
  
  house.rooms.forEach(room => {
    room.objects.forEach(obj => {
      const totalKw = obj.kw * obj.quantity;
      const hoursActive = obj.hoursPerDay;
      
      // Use room schedule
      const activeHours = getActiveHoursFromSchedule(room.schedule);
      const startHour = activeHours[0] || 7;
      const endHour = Math.min(startHour + hoursActive, activeHours[activeHours.length - 1] + 1 || 21);
      
      for (let hour = startHour; hour < endHour; hour++) {
        if (activeHours.includes(hour)) {
          hourlyUsage[hour] += totalKw;
        }
      }
    });
  });
  
  return hourlyUsage;
}

function getActiveHoursFromSchedule(schedule: WeeklySchedule): number[] {
  const today = new Date().getDay();
  const days: (keyof WeeklySchedule)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const daySchedule = schedule[days[today]];
  
  if (!daySchedule.enabled) return [];
  
  const hours: number[] = [];
  for (let h = daySchedule.startHour; h < daySchedule.endHour; h++) {
    hours.push(h);
  }
  return hours;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function createDefaultHouseData(): HouseData {
  const defaultRooms = [
    'Sala', 'Cocina', 'Comedor', 'Recámara Principal', 'Recámara 2', 
    'Baño Principal', 'Baño 2', 'Estudio', 'Garage', 'Patio'
  ];

  return {
    house: {
      id: generateId(),
      name: 'Mi Casa',
      rooms: defaultRooms.map(name => ({
        id: generateId(),
        name,
        objects: [],
        schedule: { ...defaultSchedule },
      })),
    },
  };
}

export const commonHouseObjects = [
  { name: 'Aire Acondicionado', kw: 2.5 },
  { name: 'Refrigerador', kw: 0.15 },
  { name: 'Televisión LED', kw: 0.1 },
  { name: 'Lavadora', kw: 0.5 },
  { name: 'Secadora', kw: 3.0 },
  { name: 'Microondas', kw: 1.0 },
  { name: 'Foco LED', kw: 0.01 },
  { name: 'Foco Incandescente', kw: 0.06 },
  { name: 'Computadora', kw: 0.3 },
  { name: 'Laptop', kw: 0.05 },
  { name: 'Ventilador', kw: 0.075 },
  { name: 'Router WiFi', kw: 0.01 },
  { name: 'Cargador de Celular', kw: 0.005 },
  { name: 'Consola de Videojuegos', kw: 0.15 },
  { name: 'Plancha', kw: 1.2 },
  { name: 'Licuadora', kw: 0.3 },
  { name: 'Cafetera', kw: 0.8 },
  { name: 'Horno Eléctrico', kw: 2.0 },
  { name: 'Calentador de Agua', kw: 4.5 },
  { name: 'Bomba de Agua', kw: 0.75 },
];
