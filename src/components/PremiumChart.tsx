import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';
import { formatHour } from '@/lib/peakDetection';

interface PremiumChartProps {
  title: string;
  data: number[];
  peakHours: number[];
  color?: 'green' | 'orange' | 'cyan';
  unit?: string;
  showLegend?: boolean;
}

const colorConfig = {
  green: {
    stroke: 'hsl(142, 76%, 50%)',
    fill: 'url(#gradientGreen)',
    glow: 'hsl(142, 76%, 50%)',
  },
  orange: {
    stroke: 'hsl(25, 95%, 55%)',
    fill: 'url(#gradientOrange)',
    glow: 'hsl(25, 95%, 55%)',
  },
  cyan: {
    stroke: 'hsl(187, 92%, 55%)',
    fill: 'url(#gradientCyan)',
    glow: 'hsl(187, 92%, 55%)',
  },
};

const CustomTooltip = ({ active, payload, label, color }: any) => {
  if (active && payload && payload.length) {
    const isPeak = payload[0].payload.isPeak;
    const colors = colorConfig[color as keyof typeof colorConfig];
    
    return (
      <div className="glass-card p-4 border border-border/50 min-w-[140px]">
        <p className="text-sm font-medium text-foreground mb-1">{formatHour(label)}</p>
        <p className="text-2xl font-mono font-bold" style={{ color: colors.stroke }}>
          {parseFloat(payload[0].value).toFixed(2)}
          <span className="text-sm text-muted-foreground ml-1">kW</span>
        </p>
        <div className={`flex items-center gap-2 mt-2 text-xs ${isPeak ? 'text-accent' : 'text-success'}`}>
          <div className={`w-2 h-2 rounded-full ${isPeak ? 'bg-accent' : 'bg-success'}`} />
          {isPeak ? 'Hora Pico' : 'Normal'}
        </div>
      </div>
    );
  }
  return null;
};

export function PremiumChart({ title, data, peakHours, color = 'green', unit = 'kW', showLegend = true }: PremiumChartProps) {
  const colors = colorConfig[color];
  const currentHour = new Date().getHours();

  const chartData = useMemo(() => 
    data.map((usage, hour) => ({
      hour,
      usage: parseFloat(usage.toFixed(4)),
      isPeak: peakHours.includes(hour),
    })), 
    [data, peakHours]
  );

  const maxValue = Math.max(...data) * 1.2;

  return (
    <div className="glass-card p-6 rounded-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Patrón de consumo de 24 horas • Actualizado en tiempo real
          </p>
        </div>
        
        {showLegend && (
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.stroke }} />
              <span className="text-muted-foreground">Consumo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent" />
              <span className="text-muted-foreground">Hora Pico</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-primary rounded" />
              <span className="text-muted-foreground">Ahora</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Chart */}
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradientGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(142, 76%, 50%)" stopOpacity={0.5} />
                <stop offset="50%" stopColor="hsl(142, 76%, 50%)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="hsl(142, 76%, 50%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientOrange" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(25, 95%, 55%)" stopOpacity={0.5} />
                <stop offset="50%" stopColor="hsl(25, 95%, 55%)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="hsl(25, 95%, 55%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientCyan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(187, 92%, 55%)" stopOpacity={0.5} />
                <stop offset="50%" stopColor="hsl(187, 92%, 55%)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="hsl(187, 92%, 55%)" stopOpacity={0} />
              </linearGradient>
              {/* Glow filter */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(228, 15%, 18%)" 
              vertical={false}
            />
            
            <XAxis 
              dataKey="hour" 
              tickFormatter={formatHour}
              tick={{ fill: 'hsl(228, 10%, 55%)', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(228, 15%, 18%)' }}
              tickLine={false}
              interval={2}
            />
            
            <YAxis 
              tick={{ fill: 'hsl(228, 10%, 55%)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value}`}
              domain={[0, maxValue]}
              width={50}
            />
            
            <Tooltip content={<CustomTooltip color={color} />} />
            
            {/* Peak hour highlights */}
            {peakHours.map((hour) => (
              <ReferenceLine
                key={`peak-${hour}`}
                x={hour}
                stroke="hsl(25, 95%, 55%)"
                strokeOpacity={0.15}
                strokeWidth={30}
              />
            ))}
            
            {/* Current hour indicator */}
            <ReferenceLine 
              x={currentHour} 
              stroke={colors.stroke}
              strokeDasharray="5 5"
              strokeWidth={2}
              filter="url(#glow)"
              label={{ 
                value: 'Ahora', 
                position: 'top', 
                fill: colors.stroke,
                fontSize: 11,
                fontWeight: 600
              }}
            />
            
            <Area
              type="monotone"
              dataKey="usage"
              stroke={colors.stroke}
              strokeWidth={3}
              fill={colors.fill}
              filter="url(#glow)"
              dot={false}
              activeDot={{
                r: 6,
                fill: colors.stroke,
                stroke: 'hsl(228, 15%, 5%)',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border/30">
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Mínimo</p>
          <p className="text-lg font-mono font-bold" style={{ color: colors.stroke }}>
            {Math.min(...data).toFixed(2)} {unit}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Promedio</p>
          <p className="text-lg font-mono font-bold text-foreground">
            {(data.reduce((a, b) => a + b, 0) / data.length).toFixed(2)} {unit}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Máximo</p>
          <p className="text-lg font-mono font-bold text-accent">
            {Math.max(...data).toFixed(2)} {unit}
          </p>
        </div>
      </div>
    </div>
  );
}
