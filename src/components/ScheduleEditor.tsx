import { useState } from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WeeklySchedule, getDayLabel } from '@/lib/vampireDetection';

interface ScheduleEditorProps {
  schedule: WeeklySchedule;
  onChange: (schedule: WeeklySchedule) => void;
}

const hours = Array.from({ length: 24 }, (_, i) => i);
const dayKeys: (keyof WeeklySchedule)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function ScheduleEditor({ schedule, onChange }: ScheduleEditorProps) {
  const [open, setOpen] = useState(false);
  const [localSchedule, setLocalSchedule] = useState<WeeklySchedule>(schedule);

  const handleDayChange = (day: keyof WeeklySchedule, field: 'enabled' | 'startHour' | 'endHour', value: boolean | number) => {
    setLocalSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleSave = () => {
    onChange(localSchedule);
    setOpen(false);
  };

  const getScheduleSummary = () => {
    const activeDays = dayKeys.filter(day => schedule[day].enabled);
    if (activeDays.length === 0) return 'Sin horario';
    if (activeDays.length === 7) return 'Todos los días';
    if (activeDays.length === 6 && !schedule.sunday.enabled) return 'Lun-Sáb';
    return `${activeDays.length} días`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
          <Clock className="w-3 h-3" />
          {getScheduleSummary()}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Horario de Uso
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 mt-4">
          {dayKeys.map(day => (
            <div key={day} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
              <Switch
                checked={localSchedule[day].enabled}
                onCheckedChange={(checked) => handleDayChange(day, 'enabled', checked)}
              />
              <span className="w-24 text-sm font-medium text-foreground">
                {getDayLabel(day)}
              </span>
              
              {localSchedule[day].enabled ? (
                <div className="flex items-center gap-2 flex-1">
                  <Select
                    value={localSchedule[day].startHour.toString()}
                    onValueChange={(v) => handleDayChange(day, 'startHour', parseInt(v))}
                  >
                    <SelectTrigger className="h-8 w-20 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map(h => (
                        <SelectItem key={h} value={h.toString()}>
                          {h.toString().padStart(2, '0')}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground text-xs">a</span>
                  <Select
                    value={localSchedule[day].endHour.toString()}
                    onValueChange={(v) => handleDayChange(day, 'endHour', parseInt(v))}
                  >
                    <SelectTrigger className="h-8 w-20 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map(h => (
                        <SelectItem key={h} value={h.toString()}>
                          {h.toString().padStart(2, '0')}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Cerrado</span>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
