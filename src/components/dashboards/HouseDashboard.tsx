import { useState, useMemo } from 'react';
import { Home, BarChart3, Zap, TrendingUp, DollarSign, Leaf, Settings2 } from 'lucide-react';
import { HouseData, House, Room, calculateHouseDailyKwh, calculateRoomDailyKwh, calculateHouseHourlyUsage, calculateRoomHourlyUsage } from '@/lib/houseTypes';
import { VampireAlert } from '@/lib/vampireDetection';
import { PredictionResult, formatMXN } from '@/lib/tariffCalculator';
import { calculateCarbonFootprint } from '@/lib/carbonFootprint';
import { detectPeakHours } from '@/lib/peakDetection';
import { HouseManager } from '@/components/HouseManager';
import { PremiumChart } from '@/components/PremiumChart';
import { PremiumStatCard } from '@/components/PremiumStatCard';
import { VampireDetectorCard } from '@/components/VampireDetectorCard';
import { TariffCalculator } from '@/components/TariffCalculator';
import { CarbonFootprintCard } from '@/components/CarbonFootprintCard';
import { ExecutiveReport } from '@/components/ExecutiveReport';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface HouseDashboardProps {
  houseData: HouseData;
  onUpdate: (data: HouseData) => void;
  vampireAlerts: VampireAlert[];
  prediction: PredictionResult;
}

export function HouseDashboard({ houseData, onUpdate, vampireAlerts, prediction }: HouseDashboardProps) {
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [activeView, setActiveView] = useState<'dashboard' | 'config'>('dashboard');

  // Calculate metrics based on selection
  const selectedData = useMemo(() => {
    if (selectedRoom === 'all') {
      const dailyKwh = calculateHouseDailyKwh(houseData.house);
      const hourlyUsage = calculateHouseHourlyUsage(houseData.house);
      return { 
        name: 'Toda la Casa', 
        dailyKwh, 
        monthlyKwh: dailyKwh * 30,
        hourlyUsage,
        alerts: vampireAlerts 
      };
    }
    
    const room = houseData.house.rooms.find(r => r.id === selectedRoom);
    if (!room) return null;
    
    const dailyKwh = calculateRoomDailyKwh(room);
    const hourlyUsage = calculateRoomHourlyUsage(room);
    const alerts = vampireAlerts.filter(a => a.roomId === room.id);
    
    return { 
      name: room.name, 
      dailyKwh, 
      monthlyKwh: dailyKwh * 30,
      hourlyUsage,
      alerts 
    };
  }, [selectedRoom, houseData, vampireAlerts]);

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
      {/* Header with Room Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-accent/20 border border-accent/30 glow-orange">
            <Home className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-display text-foreground">Dashboard Casa</h2>
            <p className="text-sm text-muted-foreground">Gestión residencial independiente</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select value={selectedRoom} onValueChange={setSelectedRoom}>
            <SelectTrigger className="w-full sm:w-[220px] bg-secondary/50 border-accent/30 focus:ring-accent">
              <SelectValue placeholder="Seleccionar habitación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Toda la Casa
                </div>
              </SelectItem>
              {houseData.house.rooms.map(r => (
                <SelectItem key={r.id} value={r.id}>
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    {r.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'dashboard' | 'config')}>
            <TabsList className="bg-secondary/30 border border-border/50">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                <BarChart3 className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="config" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
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
              color="orange"
              glow
            />
            <PremiumStatCard
              label="Consumo Diario"
              value={selectedData.dailyKwh.toFixed(2)}
              unit="kWh"
              icon={<TrendingUp className="w-5 h-5" />}
              color="orange"
            />
            <PremiumStatCard
              label="Estimado Mensual"
              value={formatMXN(prediction.currentMonth.total)}
              icon={<DollarSign className="w-5 h-5" />}
              trend={prediction.currentMonth.isDac ? 'up' : 'stable'}
              color={prediction.currentMonth.isDac ? 'red' : 'orange'}
            />
            <PremiumStatCard
              label="Huella CO₂"
              value={carbon.co2EmittedKg.toFixed(1)}
              unit="kg/mes"
              icon={<Leaf className="w-5 h-5" />}
              color="orange"
            />
          </div>

          {/* Main Chart */}
          <PremiumChart
            title={`Consumo por Hora - ${selectedData.name}`}
            data={selectedData.hourlyUsage}
            peakHours={peakAnalysis.peakHours}
            color="orange"
            unit="kW"
          />

          {/* Three Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <TariffCalculator monthlyKwh={selectedData.monthlyKwh} />
            <VampireDetectorCard alerts={selectedData.alerts} variant="orange" />
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
            variant="orange"
          />
        </>
      ) : (
        <HouseManager 
          houseData={houseData}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
}
