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
}

export interface Building {
  id: string;
  name: string;
  classrooms: Classroom[];
}

export interface BuildingsData {
  buildings: Building[];
}

// Calculate total kWh for an electrical object per day
export function calculateObjectDailyKwh(obj: ElectricalObject): number {
  return obj.kw * obj.quantity * obj.hoursPerDay;
}

// Calculate total kWh for a classroom per day
export function calculateClassroomDailyKwh(classroom: Classroom): number {
  return classroom.objects.reduce((sum, obj) => sum + calculateObjectDailyKwh(obj), 0);
}

// Calculate total kWh for a building per day
export function calculateBuildingDailyKwh(building: Building): number {
  return building.classrooms.reduce((sum, room) => sum + calculateClassroomDailyKwh(room), 0);
}

// Calculate total kWh for all buildings per day
export function calculateTotalDailyKwh(buildings: Building[]): number {
  return buildings.reduce((sum, building) => sum + calculateBuildingDailyKwh(building), 0);
}

// Calculate hourly usage based on objects and their hours of operation
export function calculateHourlyUsage(buildings: Building[]): number[] {
  const hourlyUsage = Array(24).fill(0);
  
  // Default operating hours: 7 AM to 9 PM for most objects
  const defaultStartHour = 7;
  const defaultEndHour = 21;
  
  buildings.forEach(building => {
    building.classrooms.forEach(classroom => {
      classroom.objects.forEach(obj => {
        const totalKw = obj.kw * obj.quantity;
        const hoursActive = obj.hoursPerDay;
        
        // Distribute usage across operating hours
        const startHour = defaultStartHour;
        const endHour = Math.min(startHour + hoursActive, defaultEndHour);
        
        for (let hour = startHour; hour < endHour; hour++) {
          hourlyUsage[hour] += totalKw;
        }
      });
    });
  });
  
  return hourlyUsage;
}

// Generate unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Create default buildings data
export function createDefaultBuildingsData(): BuildingsData {
  const buildings: Building[] = [
    {
      id: generateId(),
      name: 'Building A',
      classrooms: Array.from({ length: 10 }, (_, i) => ({
        id: generateId(),
        name: `Classroom ${i + 1}`,
        objects: [],
      })),
    },
    {
      id: generateId(),
      name: 'Building B',
      classrooms: Array.from({ length: 10 }, (_, i) => ({
        id: generateId(),
        name: `Classroom ${i + 1}`,
        objects: [],
      })),
    },
  ];
  
  return { buildings };
}

// Common electrical objects with typical kW values
export const commonElectricalObjects = [
  { name: 'Air Conditioner', kw: 2.5 },
  { name: 'Television', kw: 0.1 },
  { name: 'Light Bulb (LED)', kw: 0.01 },
  { name: 'Light Bulb (Incandescent)', kw: 0.06 },
  { name: 'Fluorescent Light', kw: 0.04 },
  { name: 'Computer', kw: 0.3 },
  { name: 'Projector', kw: 0.3 },
  { name: 'Fan', kw: 0.075 },
  { name: 'Refrigerator', kw: 0.15 },
  { name: 'Microwave', kw: 1.0 },
  { name: 'Printer', kw: 0.05 },
  { name: 'Water Dispenser', kw: 0.5 },
];
