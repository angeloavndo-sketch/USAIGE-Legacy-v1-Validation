import { useState, useEffect } from 'react';
import { Zap, TrendingUp, TrendingDown, Percent, Activity, Database, Building2 } from 'lucide-react';
import { generateUsageData, detectPeakHours, UsageDataPoint, PeakAnalysis } from '@/lib/peakDetection';
import { saveUsageData, loadUsageData, hasStoredData } from '@/lib/storage';
import { UsageChart } from '@/components/UsageChart';
import { StatCard } from '@/components/StatCard';
import { PeakStatus } from '@/components/PeakStatus';
import { PeakHoursTimeline } from '@/components/PeakHoursTimeline';
import { UsageDataEntry } from '@/components/UsageDataEntry';
import { BuildingManager } from '@/components/BuildingManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const [usageData, setUsageData] = useState<UsageDataPoint[]>([]);
  const [analysis, setAnalysis] = useState<PeakAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    // Load stored data or generate sample data
    const storedData = loadUsageData();
    if (storedData) {
      setUsageData(storedData);
      setAnalysis(detectPeakHours(storedData));
    } else {
      const sampleData = generateUsageData();
      setUsageData(sampleData);
      setAnalysis(detectPeakHours(sampleData));
    }
  }, []);

  const handleDataSave = (newData: UsageDataPoint[]) => {
    setUsageData(newData);
    setAnalysis(detectPeakHours(newData));
    saveUsageData(newData);
    setActiveTab('dashboard');
  };

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-primary animate-pulse" />
          <span className="text-muted-foreground">Analyzing usage patterns...</span>
        </div>
      </div>
    );
  }

  const currentUsage = usageData.find(d => d.hour === new Date().getHours())?.usage || 0;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 opacity-0 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/20">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Peak Hour Detection
            </h1>
          </div>
          <p className="text-muted-foreground">
            Real-time electricity usage analysis and peak hour identification
          </p>
        </header>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-secondary/50 border border-border/50">
            <TabsTrigger 
              value="dashboard" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Activity className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="buildings"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Buildings
            </TabsTrigger>
            <TabsTrigger 
              value="data-entry"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Database className="w-4 h-4 mr-2" />
              Data Entry
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6 space-y-8">
            {/* Current Status */}
            <section>
              <PeakStatus analysis={analysis} />
            </section>

            {/* Stats Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Current Usage"
                value={currentUsage.toFixed(2)}
                unit="kWh"
                icon={<Activity className="w-5 h-5" />}
                variant={analysis.currentIsPeak ? 'accent' : 'primary'}
                delay={100}
              />
              <StatCard
                label="Peak Average"
                value={analysis.peakUsage}
                unit="kWh"
                icon={<TrendingUp className="w-5 h-5" />}
                variant="accent"
                delay={150}
              />
              <StatCard
                label="Off-Peak Average"
                value={analysis.offPeakUsage}
                unit="kWh"
                icon={<TrendingDown className="w-5 h-5" />}
                variant="success"
                delay={200}
              />
              <StatCard
                label="Savings Potential"
                value={analysis.savingsPotential}
                unit="%"
                icon={<Percent className="w-5 h-5" />}
                variant="primary"
                delay={250}
              />
            </section>

            {/* Usage Chart */}
            <section>
              <UsageChart data={usageData} analysis={analysis} />
            </section>

            {/* Timeline */}
            <section>
              <PeakHoursTimeline peakHours={analysis.peakHours} />
            </section>

            {/* Data Source Info */}
            <section className="glass-card p-4 opacity-0 animate-fade-in-up animate-delay-400">
              <div className="flex items-center gap-3 text-sm">
                <Database className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {hasStoredData() 
                    ? 'Using your custom data • Go to Data Entry to modify'
                    : 'Using sample data • Go to Data Entry to add your own data'
                  }
                </span>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="buildings" className="mt-6">
            <BuildingManager onCalculate={handleDataSave} />
          </TabsContent>

          <TabsContent value="data-entry" className="mt-6">
            <UsageDataEntry data={usageData} onSave={handleDataSave} />
            
            <div className="mt-6 glass-card p-4 border-primary/30">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Database className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-foreground font-medium">Local Storage</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your data is currently saved in your browser's local storage. 
                    For persistent cloud storage and multi-device access, consider connecting to Cloud.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground opacity-0 animate-fade-in-up animate-delay-400">
          <p>Peak detection uses statistical analysis • Data persisted locally</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
