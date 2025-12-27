import { useState, useEffect, useMemo, useCallback } from 'react';
import { Zap, Building2, Home, BarChart3, Bot, TrendingUp, TrendingDown, Activity, Percent, FileText, Sparkles } from 'lucide-react';
import { loadBuildingsData, saveBuildingsData } from '@/lib/buildingStorage';
import { loadHouseData, saveHouseData } from '@/lib/houseStorage';
import { Building, calculateBuildingDailyKwh, calculateBuildingHourlyUsage, calculateTotalDailyKwh } from '@/lib/buildingTypes';
import { House, calculateHouseDailyKwh, calculateHouseHourlyUsage, calculateRoomDailyKwh } from '@/lib/houseTypes';
import { detectVampireLoads, VampireAlert } from '@/lib/vampireDetection';
import { detectPeakHours, PeakAnalysis, UsageDataPoint } from '@/lib/peakDetection';
import { predictNextMonth, PredictionResult, calculateBill } from '@/lib/tariffCalculator';
import { BuildingsDashboard } from '@/components/dashboards/BuildingsDashboard';
import { HouseDashboard } from '@/components/dashboards/HouseDashboard';
import { InteractiveAIChat } from '@/components/InteractiveAIChat';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const [activeTab, setActiveTab] = useState('buildings');
  const [buildingsData, setBuildingsData] = useState(() => loadBuildingsData());
  const [houseData, setHouseData] = useState(() => loadHouseData());
  const [buildingVampireAlerts, setBuildingVampireAlerts] = useState<VampireAlert[]>([]);
  const [houseVampireAlerts, setHouseVampireAlerts] = useState<VampireAlert[]>([]);

  // Calculate metrics for buildings
  const buildingsDailyKwh = useMemo(() => calculateTotalDailyKwh(buildingsData.buildings), [buildingsData]);
  const buildingsMonthlyKwh = parseFloat((buildingsDailyKwh * 30).toFixed(2));
  
  // Calculate metrics for house
  const houseDailyKwh = useMemo(() => calculateHouseDailyKwh(houseData.house), [houseData]);
  const houseMonthlyKwh = parseFloat((houseDailyKwh * 30).toFixed(2));

  // Building predictions
  const buildingPrediction = useMemo(() => 
    predictNextMonth(buildingsMonthlyKwh, [buildingsMonthlyKwh * 0.9, buildingsMonthlyKwh * 0.95]),
    [buildingsMonthlyKwh]
  );

  // House predictions
  const housePrediction = useMemo(() =>
    predictNextMonth(houseMonthlyKwh, [houseMonthlyKwh * 0.92, houseMonthlyKwh * 0.97]),
    [houseMonthlyKwh]
  );

  // Detect vampire loads for buildings
  useEffect(() => {
    const alerts: VampireAlert[] = [];
    buildingsData.buildings.forEach(building => {
      building.classrooms.forEach(classroom => {
        const hourlyUsage = Array(24).fill(0);
        classroom.objects.forEach(obj => {
          // Convertir Watts a kW para cálculo horario
          const totalKw = parseFloat(((obj.watts * obj.quantity) / 1000).toFixed(4));
          const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
          const today = days[new Date().getDay()];
          const schedule = classroom.schedule[today];
          
          if (schedule.enabled) {
            for (let h = schedule.startHour; h < Math.min(schedule.startHour + obj.hoursPerDay, schedule.endHour); h++) {
              hourlyUsage[h] += totalKw;
            }
          }
        });
        const roomAlerts = detectVampireLoads(
          classroom.id,
          classroom.name,
          building.name,
          classroom.schedule,
          hourlyUsage
        );
        alerts.push(...roomAlerts);
      });
    });
    setBuildingVampireAlerts(alerts);
  }, [buildingsData]);

  // Detect vampire loads for house
  useEffect(() => {
    const alerts: VampireAlert[] = [];
    houseData.house.rooms.forEach(room => {
      const hourlyUsage = Array(24).fill(0);
      room.objects.forEach(obj => {
        // Convertir Watts a kW para cálculo horario
        const totalKw = parseFloat(((obj.watts * obj.quantity) / 1000).toFixed(4));
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
        const today = days[new Date().getDay()];
        const schedule = room.schedule[today];
        
        if (schedule.enabled) {
          for (let h = schedule.startHour; h < Math.min(schedule.startHour + obj.hoursPerDay, schedule.endHour); h++) {
            hourlyUsage[h] += totalKw;
          }
        }
      });
      const roomAlerts = detectVampireLoads(
        room.id,
        room.name,
        'Casa',
        room.schedule,
        hourlyUsage
      );
      alerts.push(...roomAlerts);
    });
    setHouseVampireAlerts(alerts);
  }, [houseData]);

  const handleBuildingsUpdate = useCallback((newData: typeof buildingsData) => {
    setBuildingsData(newData);
    saveBuildingsData(newData);
  }, []);

  const handleHouseUpdate = useCallback((newData: typeof houseData) => {
    setHouseData(newData);
    saveHouseData(newData);
  }, []);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Animated Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-success/5 rounded-full blur-[150px] animate-float" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[150px] animate-float" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/3 rounded-full blur-[200px]" />
      </div>

      {/* Premium Header */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-background/60 border-b border-border/30">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              {/* Animated Logo */}
              <div className="relative group">
                <div className="absolute inset-0 bg-success/40 blur-2xl rounded-full group-hover:bg-success/60 transition-all duration-500" />
                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-success/30 via-success/20 to-transparent border border-success/40 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-8 h-8 text-success" strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display text-foreground tracking-tight">
                  Energy<span className="neon-text-green">Monitor</span>Pro
                </h1>
                <p className="text-sm text-muted-foreground hidden sm:block mt-1">
                  Sistema de Gestión Energética Premium • v3.0
                </p>
              </div>
            </div>
            
            {/* Header Stats */}
            <div className="hidden lg:flex items-center gap-8">
              <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-success/10 border border-success/30 backdrop-blur-sm">
                <div className="relative">
                  <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
                  <div className="absolute inset-0 w-3 h-3 rounded-full bg-success animate-ping opacity-50" />
                </div>
                <span className="text-sm font-semibold text-success">Sistema Activo</span>
              </div>
              <div className="text-right px-4 py-2 rounded-xl bg-secondary/30 border border-border/30">
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Consumo Total Hoy</p>
                <p className="text-2xl font-mono font-bold text-foreground">
                  {(buildingsDailyKwh + houseDailyKwh).toFixed(2)} 
                  <span className="text-sm text-muted-foreground ml-1">kWh</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Navigation Tabs */}
      <div className="relative max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="w-full sm:w-auto flex flex-wrap justify-center gap-2 bg-secondary/20 backdrop-blur-xl border border-border/30 p-2 rounded-3xl shadow-2xl">
            <TabsTrigger 
              value="buildings" 
              className="flex-1 sm:flex-none gap-3 px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-500 data-[state=active]:bg-gradient-to-r data-[state=active]:from-success data-[state=active]:to-success/80 data-[state=active]:text-success-foreground data-[state=active]:shadow-[0_0_40px_hsl(142,76%,50%,0.4)] hover:bg-secondary/50"
            >
              <Building2 className="w-5 h-5" />
              <span className="hidden sm:inline">Edificios</span>
            </TabsTrigger>
            <TabsTrigger 
              value="house" 
              className="flex-1 sm:flex-none gap-3 px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-500 data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-accent/80 data-[state=active]:text-accent-foreground data-[state=active]:shadow-[0_0_40px_hsl(25,95%,55%,0.4)] hover:bg-secondary/50"
            >
              <Home className="w-5 h-5" />
              <span className="hidden sm:inline">Casa</span>
            </TabsTrigger>
            <TabsTrigger 
              value="assistant" 
              className="flex-1 sm:flex-none gap-3 px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-500 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(187,92%,55%)] data-[state=active]:to-[hsl(187,92%,45%)] data-[state=active]:text-background data-[state=active]:shadow-[0_0_40px_hsl(187,92%,55%,0.4)] hover:bg-secondary/50"
            >
              <Bot className="w-5 h-5" />
              <span className="hidden sm:inline">Asistente IA</span>
            </TabsTrigger>
          </TabsList>

          {/* Buildings Dashboard - Independent */}
          <TabsContent value="buildings" className="mt-0 animate-fade-in">
            <div className="theme-buildings">
              <BuildingsDashboard
                buildingsData={buildingsData}
                onUpdate={handleBuildingsUpdate}
                vampireAlerts={buildingVampireAlerts}
                prediction={buildingPrediction}
              />
            </div>
          </TabsContent>

          {/* House Dashboard - Independent */}
          <TabsContent value="house" className="mt-0 animate-fade-in">
            <div className="theme-house">
              <HouseDashboard
                houseData={houseData}
                onUpdate={handleHouseUpdate}
                vampireAlerts={houseVampireAlerts}
                prediction={housePrediction}
              />
            </div>
          </TabsContent>

          {/* Interactive AI Assistant */}
          <TabsContent value="assistant" className="mt-0 animate-fade-in">
            <InteractiveAIChat
              buildingsData={buildingsData}
              houseData={houseData}
              buildingVampireAlerts={buildingVampireAlerts}
              houseVampireAlerts={houseVampireAlerts}
              buildingPrediction={buildingPrediction}
              housePrediction={housePrediction}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Premium Footer */}
      <footer className="relative border-t border-border/20 mt-auto bg-gradient-to-t from-background to-transparent">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-success/10 border border-success/20">
                <Sparkles className="w-5 h-5 text-success" />
              </div>
              <div>
                <span className="font-semibold text-foreground">Energy Monitor Pro</span>
                <span className="text-muted-foreground ml-2">v3.0</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="px-3 py-1 rounded-full bg-secondary/30 border border-border/20">Tarifas CFE Monterrey</span>
              <span className="px-3 py-1 rounded-full bg-secondary/30 border border-border/20">Detección Vampiros</span>
              <span className="px-3 py-1 rounded-full bg-secondary/30 border border-border/20">Predicción IA</span>
              <span className="px-3 py-1 rounded-full bg-secondary/30 border border-border/20">Huella de Carbono</span>
            </div>
            <p className="text-xs text-muted-foreground">© 2024 • Potencia en Watts (W)</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
