import { useState, useEffect, useMemo } from 'react';
import { Zap, TrendingUp, TrendingDown, Percent, Activity, Database, Building2, Home, Bot } from 'lucide-react';
import { generateUsageData, detectPeakHours, UsageDataPoint, PeakAnalysis } from '@/lib/peakDetection';
import { saveUsageData, loadUsageData, hasStoredData } from '@/lib/storage';
import { loadBuildingsData, saveBuildingsData } from '@/lib/buildingStorage';
import { loadHouseData, saveHouseData } from '@/lib/houseStorage';
import { calculateTotalDailyKwh, calculateHourlyUsage } from '@/lib/buildingTypes';
import { calculateHouseDailyKwh, calculateHouseHourlyUsage } from '@/lib/houseTypes';
import { detectVampireLoads, VampireAlert } from '@/lib/vampireDetection';
import { UsageChart } from '@/components/UsageChart';
import { StatCard } from '@/components/StatCard';
import { PeakStatus } from '@/components/PeakStatus';
import { PeakHoursTimeline } from '@/components/PeakHoursTimeline';
import { UsageDataEntry } from '@/components/UsageDataEntry';
import { BuildingManager } from '@/components/BuildingManager';
import { TariffCalculator } from '@/components/TariffCalculator';
import { CarbonFootprintCard } from '@/components/CarbonFootprintCard';
import { VampireAlertsCard } from '@/components/VampireAlertsCard';
import { AIAssistantCard } from '@/components/AIAssistantCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const [usageData, setUsageData] = useState<UsageDataPoint[]>([]);
  const [analysis, setAnalysis] = useState<PeakAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState('buildings');
  const [vampireAlerts, setVampireAlerts] = useState<VampireAlert[]>([]);

  // Load building data for vampire detection
  const buildingsData = useMemo(() => loadBuildingsData(), []);
  const houseData = useMemo(() => loadHouseData(), []);

  // Calculate monthly kWh (daily * 30)
  const buildingsDailyKwh = calculateTotalDailyKwh(buildingsData.buildings);
  const houseDailyKwh = calculateHouseDailyKwh(houseData.house);
  const totalDailyKwh = buildingsDailyKwh + houseDailyKwh;
  const monthlyKwh = totalDailyKwh * 30;

  useEffect(() => {
    const storedData = loadUsageData();
    if (storedData) {
      setUsageData(storedData);
      setAnalysis(detectPeakHours(storedData));
    } else {
      // Generate from buildings data
      const hourlyUsage = calculateHourlyUsage(buildingsData.buildings);
      const now = new Date();
      const generatedData: UsageDataPoint[] = hourlyUsage.map((usage, hour) => ({
        hour,
        usage,
        timestamp: new Date(now.setHours(hour, 0, 0, 0)),
      }));
      setUsageData(generatedData);
      setAnalysis(detectPeakHours(generatedData));
    }

    // Detect vampire loads
    const alerts: VampireAlert[] = [];
    buildingsData.buildings.forEach(building => {
      building.classrooms.forEach(classroom => {
        const hourlyUsage = Array(24).fill(0);
        classroom.objects.forEach(obj => {
          const totalKw = obj.kw * obj.quantity;
          for (let h = 7; h < Math.min(7 + obj.hoursPerDay, 21); h++) {
            hourlyUsage[h] += totalKw;
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
    setVampireAlerts(alerts);
  }, []);

  const handleDataSave = (newData: UsageDataPoint[]) => {
    setUsageData(newData);
    setAnalysis(detectPeakHours(newData));
    saveUsageData(newData);
    setActiveTab('buildings');
  };

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-primary animate-pulse" />
          <span className="text-muted-foreground">Analizando patrones...</span>
        </div>
      </div>
    );
  }

  const currentUsage = usageData.find(d => d.hour === new Date().getHours())?.usage || 0;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 opacity-0 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/20">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Monitor de Electricidad
            </h1>
          </div>
          <p className="text-muted-foreground">
            Análisis de consumo, predicción de costos y detección de anomalías
          </p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-secondary/50 border border-border/50 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="buildings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Building2 className="w-4 h-4 mr-2" />
              Edificios
            </TabsTrigger>
            <TabsTrigger value="house" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Home className="w-4 h-4 mr-2" />
              Casa
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Activity className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="assistant" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Bot className="w-4 h-4 mr-2" />
              Asistente
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buildings" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <BuildingManager onCalculate={handleDataSave} />
              </div>
              <div className="space-y-4">
                <TariffCalculator monthlyKwh={buildingsDailyKwh * 30} />
                <CarbonFootprintCard monthlyKwh={buildingsDailyKwh * 30} />
                <VampireAlertsCard alerts={vampireAlerts} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="house" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <UsageDataEntry data={usageData} onSave={handleDataSave} />
              </div>
              <div className="space-y-4">
                <TariffCalculator monthlyKwh={houseDailyKwh * 30} />
                <CarbonFootprintCard monthlyKwh={houseDailyKwh * 30} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dashboard" className="mt-6 space-y-8">
            <section>
              <PeakStatus analysis={analysis} />
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Uso Actual" value={currentUsage.toFixed(2)} unit="kWh" icon={<Activity className="w-5 h-5" />} variant={analysis.currentIsPeak ? 'accent' : 'primary'} delay={100} />
              <StatCard label="Promedio Pico" value={analysis.peakUsage} unit="kWh" icon={<TrendingUp className="w-5 h-5" />} variant="accent" delay={150} />
              <StatCard label="Promedio Normal" value={analysis.offPeakUsage} unit="kWh" icon={<TrendingDown className="w-5 h-5" />} variant="success" delay={200} />
              <StatCard label="Ahorro Potencial" value={analysis.savingsPotential} unit="%" icon={<Percent className="w-5 h-5" />} variant="primary" delay={250} />
            </section>

            <section>
              <UsageChart data={usageData} analysis={analysis} />
            </section>

            <section>
              <PeakHoursTimeline peakHours={analysis.peakHours} />
            </section>
          </TabsContent>

          <TabsContent value="assistant" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AIAssistantCard
                totalDailyKwh={totalDailyKwh}
                peakHours={analysis.peakHours}
                vampireAlerts={vampireAlerts}
              />
              <div className="space-y-4">
                <VampireAlertsCard alerts={vampireAlerts} />
                <CarbonFootprintCard monthlyKwh={monthlyKwh} />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <footer className="text-center text-sm text-muted-foreground opacity-0 animate-fade-in-up animate-delay-400">
          <p>Sistema de monitoreo con tarifas CFE • Detección de anomalías • Huella de carbono</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
