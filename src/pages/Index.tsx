import { useState, useEffect } from 'react';
import { Zap, TrendingUp, TrendingDown, Percent, Activity } from 'lucide-react';
import { generateUsageData, detectPeakHours, UsageDataPoint, PeakAnalysis } from '@/lib/peakDetection';
import { UsageChart } from '@/components/UsageChart';
import { StatCard } from '@/components/StatCard';
import { PeakStatus } from '@/components/PeakStatus';
import { PeakHoursTimeline } from '@/components/PeakHoursTimeline';

const Index = () => {
  const [usageData, setUsageData] = useState<UsageDataPoint[]>([]);
  const [analysis, setAnalysis] = useState<PeakAnalysis | null>(null);

  useEffect(() => {
    // Generate initial data
    const data = generateUsageData();
    setUsageData(data);
    setAnalysis(detectPeakHours(data));

    // Refresh data every 5 minutes
    const interval = setInterval(() => {
      const newData = generateUsageData();
      setUsageData(newData);
      setAnalysis(detectPeakHours(newData));
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

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

        {/* Current Status */}
        <section className="mb-8">
          <PeakStatus analysis={analysis} />
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
        <section className="mb-8">
          <UsageChart data={usageData} analysis={analysis} />
        </section>

        {/* Timeline */}
        <section className="mb-8">
          <PeakHoursTimeline peakHours={analysis.peakHours} />
        </section>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground opacity-0 animate-fade-in-up animate-delay-400">
          <p>Data updates every 5 minutes • Peak detection uses statistical analysis</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
