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
          const totalKw = parseFloat((obj.kw * obj.quantity).toFixed(4));
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
        const totalKw = parseFloat((obj.kw * obj.quantity).toFixed(4));
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
    <div className="min-h-screen bg-background">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-success/30 blur-xl rounded-full" />
                <div className="relative p-3 rounded-2xl bg-gradient-to-br from-success/20 to-success/5 border border-success/30">
                  <Zap className="w-7 h-7 text-success" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold font-display bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text">
                  Energy Monitor Pro
                </h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Sistema de Gestión Energética Empresarial
                </p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/30">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-sm font-medium text-success">Sistema Activo</span>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Consumo Total Hoy</p>
                <p className="text-lg font-mono font-bold text-foreground">
                  {(buildingsDailyKwh + houseDailyKwh).toFixed(2)} <span className="text-sm text-muted-foreground">kWh</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Navigation Tabs */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full sm:w-auto flex flex-wrap justify-start gap-2 bg-secondary/30 backdrop-blur-sm border border-border/50 p-2 rounded-2xl">
            <TabsTrigger 
              value="buildings" 
              className="flex-1 sm:flex-none gap-2 px-6 py-3 rounded-xl data-[state=active]:bg-success data-[state=active]:text-success-foreground data-[state=active]:shadow-glow-green transition-all duration-300"
            >
              <Building2 className="w-5 h-5" />
              <span className="hidden sm:inline">Edificios</span>
            </TabsTrigger>
            <TabsTrigger 
              value="house" 
              className="flex-1 sm:flex-none gap-2 px-6 py-3 rounded-xl data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-glow-orange transition-all duration-300"
            >
              <Home className="w-5 h-5" />
              <span className="hidden sm:inline">Casa</span>
            </TabsTrigger>
            <TabsTrigger 
              value="assistant" 
              className="flex-1 sm:flex-none gap-2 px-6 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
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
      <footer className="border-t border-border/30 mt-auto">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-success" />
              <span>Energy Monitor Pro v2.0</span>
            </div>
            <p>Tarifas CFE Monterrey • Detección de Vampiros • Predicción IA • Huella de Carbono</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
