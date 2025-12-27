import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ElectricalObject, calculateObjectDailyKwh } from '@/lib/buildingTypes';

interface ElectricalObjectRowProps {
  object: ElectricalObject;
  onChange: (updated: ElectricalObject) => void;
  onDelete: () => void;
}

export function ElectricalObjectRow({ object, onChange, onDelete }: ElectricalObjectRowProps) {
  const dailyKwh = calculateObjectDailyKwh(object);

  return (
    <tr className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
      <td className="p-2">
        <Input
          value={object.name}
          onChange={(e) => onChange({ ...object, name: e.target.value })}
          className="h-8 text-sm bg-background/50 border-border/50"
          placeholder="Object name"
        />
      </td>
      <td className="p-2">
        <Input
          type="number"
          min="0"
          step="1"
          value={object.watts}
          onChange={(e) => onChange({ ...object, watts: Math.max(0, parseFloat(e.target.value) || 0) })}
          className="h-8 text-sm font-mono bg-background/50 border-border/50 w-20"
          placeholder="Watts"
        />
      </td>
      <td className="p-2">
        <Input
          type="number"
          min="1"
          step="1"
          value={object.quantity}
          onChange={(e) => onChange({ ...object, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
          className="h-8 text-sm font-mono bg-background/50 border-border/50 w-16"
        />
      </td>
      <td className="p-2">
        <Input
          type="number"
          min="0"
          max="24"
          step="0.5"
          value={object.hoursPerDay}
          onChange={(e) => onChange({ ...object, hoursPerDay: Math.min(24, Math.max(0, parseFloat(e.target.value) || 0)) })}
          className="h-8 text-sm font-mono bg-background/50 border-border/50 w-16"
        />
      </td>
      <td className="p-2 text-right">
        <span className="font-mono text-sm text-primary">{dailyKwh.toFixed(2)}</span>
      </td>
      <td className="p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </td>
    </tr>
  );
}
