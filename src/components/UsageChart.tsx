import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { UsageDataPoint, PeakAnalysis, formatHour } from '@/lib/peakDetection';

interface UsageChartProps {
  data: UsageDataPoint[];
  analysis: PeakAnalysis;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const isPeak = payload[0].payload.isPeak;
    return (
      <div className="glass-card p-3 border border-border/50">
        <p className="text-sm text-muted-foreground">{formatHour(label)}</p>
        <p className={`text-lg font-mono font-bold ${isPeak ? 'text-accent' : 'text-primary'}`}>
          {payload[0].value.toFixed(2)} kWh
        </p>
        <p className={`text-xs ${isPeak ? 'text-accent' : 'text-success'}`}>
          {isPeak ? '⚡ Peak Hour' : '✓ Off-Peak'}
        </p>
      </div>
    );
  }
  return null;
};

export function UsageChart({ data, analysis }: UsageChartProps) {
  const chartData = data.map(point => ({
    ...point,
    isPeak: analysis.peakHours.includes(point.hour),
  }));

  const currentHour = new Date().getHours();

  return (
    <div className="glass-card p-6 opacity-0 animate-fade-in-up animate-delay-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">24-Hour Usage Pattern</h2>
          <p className="text-sm text-muted-foreground mt-1">Peak hours highlighted in amber</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Off-Peak</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent" />
            <span className="text-muted-foreground">Peak</span>
          </div>
        </div>
      </div>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradientPrimary" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(187, 92%, 55%)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(187, 92%, 55%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientAccent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(38, 92%, 55%)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(38, 92%, 55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="hour" 
              tickFormatter={(hour) => formatHour(hour)}
              tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(222, 30%, 18%)' }}
              tickLine={false}
              interval={2}
            />
            <YAxis 
              tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value}`}
              unit=" kWh"
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine 
              x={currentHour} 
              stroke="hsl(187, 92%, 55%)" 
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{ 
                value: 'Now', 
                position: 'top', 
                fill: 'hsl(187, 92%, 55%)',
                fontSize: 12
              }}
            />
            <Area
              type="monotone"
              dataKey="usage"
              stroke="hsl(187, 92%, 55%)"
              strokeWidth={2}
              fill="url(#gradientPrimary)"
            />
            {/* Overlay peak hours with accent color */}
            {analysis.peakHours.map((hour) => {
              const point = chartData.find(d => d.hour === hour);
              if (!point) return null;
              return (
                <ReferenceLine
                  key={hour}
                  x={hour}
                  stroke="hsl(38, 92%, 55%)"
                  strokeOpacity={0.3}
                  strokeWidth={20}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
