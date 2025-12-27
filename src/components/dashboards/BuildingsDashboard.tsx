import { useState, useMemo } from 'react';
import { Building2, BarChart3, Zap, TrendingUp, TrendingDown, AlertTriangle, Leaf, DollarSign, FileText, Settings2 } from 'lucide-react';
import { Building, BuildingsData, calculateBuildingDailyKwh, calculateBuildingHourlyUsage, calculateTotalDailyKwh } from '@/lib/buildingTypes';
import { VampireAlert } from '@/lib/vampireDetection';
import { PredictionResult, formatMXN } from '@/lib/tariffCalculator';
import { calculateCarbonFootprint } from '@/lib/carbonFootprint';
import { detectPeakHours } from '@/lib/peakDetection';
import { BuildingManager } from '@/components/BuildingManager';
import { PremiumChart } from '@/components/PremiumChart';
import { PremiumStatCard } from '@/components/PremiumStatCard';
import { VampireDetectorCard } from '@/components/VampireDetectorCard';
import { TariffCalculator } from '@/components/TariffCalculator';
import { CarbonFootprintCard } from '@/components/CarbonFootprintCard';
import { ExecutiveReport } from '@/components/ExecutiveReport';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BuildingsDashboardProps {
  buildingsData: BuildingsData;
  onUpdate: (data: BuildingsData) => void;
  vampireAlerts: VampireAlert[];
  prediction: PredictionResult;
}

export function BuildingsDashboard({ buildingsData, onUpdate, vampireAlerts, prediction }: BuildingsDashboardProps) {
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [activeView, setActiveView] = useState<'dashboard' | 'config'>('dashboard');

  // Calculate metrics based on selection
  const selectedData = useMemo(() => {
    if (selectedBuilding === 'all') {
      const dailyKwh = calculateTotalDailyKwh(buildingsData.buildings);
      const hourlyUsage = Array(24).fill(0);
      buildingsData.buildings.forEach(b => {
        const bHourly = calculateBuildingHourlyUsage(b);
        bHourly.forEach((v, i) => hourlyUsage[i] += v);
      });
      return { 
        name: 'Todos los Edificios', 
        dailyKwh, 
        monthlyKwh: dailyKwh * 30,
        hourlyUsage,
        alerts: vampireAlerts 
      };
    }
    
    const building = buildingsData.buildings.find(b => b.id === selectedBuilding);
    if (!building) return null;
    
    const dailyKwh = calculateBuildingDailyKwh(building);
    const hourlyUsage = calculateBuildingHourlyUsage(building);
    const alerts = vampireAlerts.filter(a => a.buildingName === building.name);
    
    return { 
      name: building.name, 
      dailyKwh, 
      monthlyKwh: dailyKwh * 30,
      hourlyUsage,
      alerts 
    };
  }, [selectedBuilding, buildingsData, vampireAlerts]);

  if (!selectedData) return null;

  const peakAnalysis = detectPeakHours(selectedData.hourlyUsage.map((usage, hour) => ({
    hour,
    usage,
    timestamp: new Date()
  })));

  const carbon = calculateCarbonFootprint(selectedData.monthlyKwh);
  const currentHour = new Date().getHours();
  const currentUsage = selectedData.hourlyUsage[currentHour] || 0;

  return (
    <div className="space-y-6">
      {/* Header with Building Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-success/20 border border-success/30 glow-green">
            <Building2 className="w-6 h-6 text-success" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-display text-foreground">Dashboard Edificios</h2>
            <p className="text-sm text-muted-foreground">Gestión institucional independiente</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
            <SelectTrigger className="w-full sm:w-[220px] bg-secondary/50 border-success/30 focus:ring-success">
              <SelectValue placeholder="Seleccionar edificio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Todos los Edificios
                </div>
              </SelectItem>
              {buildingsData.buildings.map(b => (
                <SelectItem key={b.id} value={b.id}>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {b.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'dashboard' | 'config')}>
            <TabsList className="bg-secondary/30 border border-border/50">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-success data-[state=active]:text-success-foreground">
                <BarChart3 className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="config" className="data-[state=active]:bg-success data-[state=active]:text-success-foreground">
                <Settings2 className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {activeView === 'dashboard' ? (
        <>
          {/* Premium Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <PremiumStatCard
              label="Consumo Actual"
              value={currentUsage.toFixed(2)}
              unit="kW"
              icon={<Zap className="w-5 h-5" />}
              trend={peakAnalysis.currentIsPeak ? 'up' : 'stable'}
              color="green"
              glow
            />
            <PremiumStatCard
              label="Consumo Diario"
              value={selectedData.dailyKwh.toFixed(2)}
              unit="kWh"
              icon={<TrendingUp className="w-5 h-5" />}
              color="green"
            />
            <PremiumStatCard
              label="Estimado Mensual"
              value={formatMXN(prediction.currentMonth.total)}
              icon={<DollarSign className="w-5 h-5" />}
              trend={prediction.currentMonth.isDac ? 'up' : 'stable'}
              color={prediction.currentMonth.isDac ? 'orange' : 'green'}
            />
            <PremiumStatCard
              label="Huella CO₂"
              value={carbon.co2EmittedKg.toFixed(1)}
              unit="kg/mes"
              icon={<Leaf className="w-5 h-5" />}
              color="green"
            />
          </div>

          {/* Main Chart */}
          <PremiumChart
            title={`Consumo por Hora - ${selectedData.name}`}
            data={selectedData.hourlyUsage}
            peakHours={peakAnalysis.peakHours}
            color="green"
            unit="kW"
          />

          {/* Three Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <TariffCalculator monthlyKwh={selectedData.monthlyKwh} />
            <VampireDetectorCard alerts={selectedData.alerts} variant="green" />
            <CarbonFootprintCard monthlyKwh={selectedData.monthlyKwh} />
          </div>

          {/* Executive Report */}
          <ExecutiveReport
            title={selectedData.name}
            dailyKwh={selectedData.dailyKwh}
            monthlyKwh={selectedData.monthlyKwh}
            prediction={prediction}
            vampireAlerts={selectedData.alerts}
            carbon={carbon}
            variant="green"
          />
        </>
      ) : (
        <BuildingManager onCalculate={() => {}} />
      )}
    </div>
  );
}
