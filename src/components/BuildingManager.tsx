import { useState, useEffect } from 'react';
import { Building2, Save, RotateCcw, Calculator, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, BuildingsData, calculateBuildingDailyKwh, calculateTotalDailyKwh, calculateHourlyUsage, createDefaultBuildingsData, Classroom } from '@/lib/buildingTypes';
import { saveBuildingsData, loadBuildingsData } from '@/lib/buildingStorage';
import { ClassroomCard } from './ClassroomCard';
import { useToast } from '@/hooks/use-toast';
import { UsageDataPoint } from '@/lib/peakDetection';

interface BuildingManagerProps {
  onCalculate: (hourlyData: UsageDataPoint[]) => void;
}

export function BuildingManager({ onCalculate }: BuildingManagerProps) {
  const [data, setData] = useState<BuildingsData>(() => loadBuildingsData());
  const [hasChanges, setHasChanges] = useState(false);
  const [activeBuilding, setActiveBuilding] = useState(data.buildings[0]?.id || '');
  const { toast } = useToast();

  const handleSave = () => {
    saveBuildingsData(data);
    setHasChanges(false);
    toast({
      title: "Data Saved",
      description: "Your buildings data has been saved.",
    });
  };

  const handleReset = () => {
    const defaultData = createDefaultBuildingsData();
    setData(defaultData);
    setActiveBuilding(defaultData.buildings[0]?.id || '');
    setHasChanges(true);
    toast({
      title: "Data Reset",
      description: "All buildings data has been reset to default.",
    });
  };

  const handleCalculate = () => {
    saveBuildingsData(data);
    const hourlyUsage = calculateHourlyUsage(data.buildings);
    const now = new Date();
    
    const usageData: UsageDataPoint[] = hourlyUsage.map((usage, hour) => ({
      hour,
      usage,
      timestamp: new Date(now.setHours(hour, 0, 0, 0)),
    }));
    
    onCalculate(usageData);
    
    toast({
      title: "Calculation Complete",
      description: "Hourly usage has been calculated and sent to the dashboard.",
    });
  };

  const handleClassroomChange = (buildingId: string, classroomIndex: number, updated: Classroom) => {
    const newBuildings = data.buildings.map(building => {
      if (building.id === buildingId) {
        const newClassrooms = [...building.classrooms];
        newClassrooms[classroomIndex] = updated;
        return { ...building, classrooms: newClassrooms };
      }
      return building;
    });
    setData({ buildings: newBuildings });
    setHasChanges(true);
  };

  const totalDailyKwh = calculateTotalDailyKwh(data.buildings);

  return (
    <div className="glass-card p-6 opacity-0 animate-fade-in-up animate-delay-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Buildings & Classrooms
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage electrical objects for each classroom
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {data.buildings.map((building) => (
          <div key={building.id} className="bg-secondary/30 rounded-lg p-4 border border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="font-medium text-foreground">{building.name}</span>
            </div>
            <div className="text-2xl font-mono text-primary">
              {calculateBuildingDailyKwh(building).toFixed(2)}
              <span className="text-sm text-muted-foreground ml-1">kWh/day</span>
            </div>
          </div>
        ))}
        <div className="bg-primary/10 rounded-lg p-4 border border-primary/30">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-medium text-foreground">Total</span>
          </div>
          <div className="text-2xl font-mono text-primary">
            {totalDailyKwh.toFixed(2)}
            <span className="text-sm text-muted-foreground ml-1">kWh/day</span>
          </div>
        </div>
      </div>

      {/* Calculate Button */}
      <div className="mb-6">
        <Button
          onClick={handleCalculate}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Calculator className="w-4 h-4 mr-2" />
          Calculate Hourly Usage & Send to Dashboard
        </Button>
      </div>

      {/* Building Tabs */}
      <Tabs value={activeBuilding} onValueChange={setActiveBuilding}>
        <TabsList className="bg-secondary/50 border border-border/50 mb-4">
          {data.buildings.map((building) => (
            <TabsTrigger
              key={building.id}
              value={building.id}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {building.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {data.buildings.map((building) => (
          <TabsContent key={building.id} value={building.id} className="space-y-3">
            {building.classrooms.map((classroom, index) => (
              <ClassroomCard
                key={classroom.id}
                classroom={classroom}
                onChange={(updated) => handleClassroomChange(building.id, index, updated)}
              />
            ))}
          </TabsContent>
        ))}
      </Tabs>

      {hasChanges && (
        <div className="mt-4 p-3 bg-accent/10 border border-accent/30 rounded-lg">
          <p className="text-sm text-accent flex items-center gap-2">
            <Zap className="w-4 h-4" />
            You have unsaved changes. Click "Save" to persist your data.
          </p>
        </div>
      )}
    </div>
  );
}
