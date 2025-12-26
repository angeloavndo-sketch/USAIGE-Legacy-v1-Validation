// Vampire load detection - identifies consumption during supposedly empty hours

export interface ScheduleDay {
  enabled: boolean;
  startHour: number;
  endHour: number;
}

export interface WeeklySchedule {
  monday: ScheduleDay;
  tuesday: ScheduleDay;
  wednesday: ScheduleDay;
  thursday: ScheduleDay;
  friday: ScheduleDay;
  saturday: ScheduleDay;
  sunday: ScheduleDay;
}

export interface VampireAlert {
  id: string;
  roomId: string;
  roomName: string;
  buildingName: string;
  day: string;
  hour: number;
  expectedConsumption: number;
  actualConsumption: number;
  anomalyPercentage: number;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
}

export const defaultSchedule: WeeklySchedule = {
  monday: { enabled: true, startHour: 7, endHour: 21 },
  tuesday: { enabled: true, startHour: 7, endHour: 21 },
  wednesday: { enabled: true, startHour: 7, endHour: 21 },
  thursday: { enabled: true, startHour: 7, endHour: 21 },
  friday: { enabled: true, startHour: 7, endHour: 21 },
  saturday: { enabled: true, startHour: 7, endHour: 14 },
  sunday: { enabled: false, startHour: 0, endHour: 0 },
};

export function getDayName(dayIndex: number): keyof WeeklySchedule {
  const days: (keyof WeeklySchedule)[] = [
    'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
  ];
  return days[dayIndex];
}

export function getDayLabel(day: keyof WeeklySchedule): string {
  const labels: Record<keyof WeeklySchedule, string> = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo',
  };
  return labels[day];
}

export function isWithinSchedule(schedule: WeeklySchedule, date: Date): boolean {
  const dayName = getDayName(date.getDay());
  const daySchedule = schedule[dayName];
  
  if (!daySchedule.enabled) return false;
  
  const hour = date.getHours();
  return hour >= daySchedule.startHour && hour < daySchedule.endHour;
}

export function detectVampireLoads(
  roomId: string,
  roomName: string,
  buildingName: string,
  schedule: WeeklySchedule,
  hourlyUsage: number[], // 24-hour array
  threshold: number = 0.1 // kWh threshold for detection
): VampireAlert[] {
  const alerts: VampireAlert[] = [];
  const now = new Date();
  const dayName = getDayName(now.getDay());
  const daySchedule = schedule[dayName];

  hourlyUsage.forEach((usage, hour) => {
    // Check if this hour should be empty
    const shouldBeEmpty = !daySchedule.enabled || hour < daySchedule.startHour || hour >= daySchedule.endHour;
    
    if (shouldBeEmpty && usage > threshold) {
      let severity: 'low' | 'medium' | 'high' = 'low';
      if (usage > threshold * 5) severity = 'high';
      else if (usage > threshold * 2) severity = 'medium';
      
      alerts.push({
        id: `${roomId}-${dayName}-${hour}`,
        roomId,
        roomName,
        buildingName,
        day: getDayLabel(dayName),
        hour,
        expectedConsumption: 0,
        actualConsumption: usage,
        anomalyPercentage: 100,
        timestamp: new Date(now.setHours(hour, 0, 0, 0)),
        severity,
      });
    }
  });

  return alerts;
}

// Request browser notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
}

// Send browser notification for vampire alert
export function sendVampireNotification(alert: VampireAlert): void {
  if (Notification.permission === 'granted') {
    const notification = new Notification('⚡ Alerta de Consumo Vampiro', {
      body: `${alert.roomName} en ${alert.buildingName}: Consumo detectado a las ${alert.hour}:00 (${alert.actualConsumption.toFixed(2)} kWh)`,
      icon: '/favicon.ico',
      tag: alert.id,
      requireInteraction: alert.severity === 'high',
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }
}
