import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Classroom, ElectricalObject, calculateClassroomDailyKwh, generateId, commonElectricalObjects } from '@/lib/buildingTypes';
import { ElectricalObjectRow } from './ElectricalObjectRow';
import { ScheduleEditor } from './ScheduleEditor';
import { WeeklySchedule } from '@/lib/vampireDetection';

interface ClassroomCardProps {
  classroom: Classroom;
  onChange: (updated: Classroom) => void;
}

export function ClassroomCard({ classroom, onChange }: ClassroomCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  
  const dailyKwh = calculateClassroomDailyKwh(classroom);

  const handleScheduleChange = (schedule: WeeklySchedule) => {
    onChange({ ...classroom, schedule });
  };

  const handleAddObject = () => {
    const newObject: ElectricalObject = {
      id: generateId(),
      name: 'New Object',
      kw: 0.1,
      quantity: 1,
      hoursPerDay: 8,
    };
    onChange({
      ...classroom,
      objects: [...classroom.objects, newObject],
    });
  };

  const handleAddPreset = (presetName: string) => {
    const preset = commonElectricalObjects.find(p => p.name === presetName);
    if (preset) {
      const newObject: ElectricalObject = {
        id: generateId(),
        name: preset.name,
        kw: preset.kw,
        quantity: 1,
        hoursPerDay: 8,
      };
      onChange({
        ...classroom,
        objects: [...classroom.objects, newObject],
      });
    }
    setSelectedPreset('');
  };

  const handleObjectChange = (index: number, updated: ElectricalObject) => {
    const newObjects = [...classroom.objects];
    newObjects[index] = updated;
    onChange({ ...classroom, objects: newObjects });
  };

  const handleObjectDelete = (index: number) => {
    const newObjects = classroom.objects.filter((_, i) => i !== index);
    onChange({ ...classroom, objects: newObjects });
  };

  return (
    <div className="border border-border/30 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-secondary/30 hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="font-medium text-foreground">{classroom.name}</span>
          <span className="text-xs text-muted-foreground">
            ({classroom.objects.length} objetos)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ScheduleEditor schedule={classroom.schedule} onChange={handleScheduleChange} />
          <div className="text-sm font-mono text-primary">
            {dailyKwh.toFixed(2)} kWh/día
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="p-3 bg-background/50">
          {classroom.objects.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-muted-foreground text-left">
                    <th className="p-2 font-medium">Object</th>
                    <th className="p-2 font-medium">kW</th>
                    <th className="p-2 font-medium">Qty</th>
                    <th className="p-2 font-medium">Hrs/Day</th>
                    <th className="p-2 font-medium text-right">kWh/Day</th>
                    <th className="p-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {classroom.objects.map((obj, index) => (
                    <ElectricalObjectRow
                      key={obj.id}
                      object={obj}
                      onChange={(updated) => handleObjectChange(index, updated)}
                      onDelete={() => handleObjectDelete(index)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No electrical objects yet. Add one below.
            </p>
          )}

          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
            <Select value={selectedPreset} onValueChange={handleAddPreset}>
              <SelectTrigger className="h-8 text-sm bg-background/50 border-border/50 flex-1">
                <SelectValue placeholder="Add common object..." />
              </SelectTrigger>
              <SelectContent>
                {commonElectricalObjects.map((obj) => (
                  <SelectItem key={obj.name} value={obj.name}>
                    {obj.name} ({obj.kw} kW)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddObject}
              className="h-8 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Custom
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
