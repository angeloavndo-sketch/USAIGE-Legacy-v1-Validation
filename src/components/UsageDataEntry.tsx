import { useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UsageDataPoint, formatHour } from '@/lib/peakDetection';
import { useToast } from '@/hooks/use-toast';

interface UsageDataEntryProps {
  data: UsageDataPoint[];
  onSave: (data: UsageDataPoint[]) => void;
}

export function UsageDataEntry({ data, onSave }: UsageDataEntryProps) {
  const [editableData, setEditableData] = useState<UsageDataPoint[]>(data);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  const handleUsageChange = (hour: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    const updated = editableData.map(point => 
      point.hour === hour 
        ? { ...point, usage: Math.max(0, numValue) }
        : point
    );
    setEditableData(updated);
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(editableData);
    setHasChanges(false);
    toast({
      title: "Data Saved",
      description: "Your electricity usage data has been updated.",
    });
  };

  const handleReset = () => {
    // Reset to default pattern
    const defaultData: UsageDataPoint[] = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      usage: 0,
      timestamp: new Date(),
    }));
    setEditableData(defaultData);
    setHasChanges(true);
  };

  return (
    <div className="glass-card p-6 opacity-0 animate-fade-in-up animate-delay-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Usage Data Entry</h2>
          <p className="text-sm text-muted-foreground mt-1">Enter your hourly electricity consumption in kWh</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReset}
            className="text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={!hasChanges}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {editableData.map((point) => (
          <div 
            key={point.hour} 
            className="bg-secondary/30 rounded-lg p-3 border border-border/30"
          >
            <label className="text-xs text-muted-foreground block mb-2">
              {formatHour(point.hour)}
            </label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min="0"
                step="0.1"
                value={point.usage}
                onChange={(e) => handleUsageChange(point.hour, e.target.value)}
                className="h-8 text-sm font-mono bg-background/50 border-border/50"
              />
              <span className="text-xs text-muted-foreground">kWh</span>
            </div>
          </div>
        ))}
      </div>

      {hasChanges && (
        <div className="mt-4 p-3 bg-accent/10 border border-accent/30 rounded-lg">
          <p className="text-sm text-accent flex items-center gap-2">
            <Plus className="w-4 h-4" />
            You have unsaved changes. Click "Save Data" to update the analysis.
          </p>
        </div>
      )}
    </div>
  );
}
