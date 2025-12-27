import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PremiumStatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: ReactNode;
  trend?: 'up' | 'down' | 'stable';
  color?: 'green' | 'orange' | 'cyan' | 'purple' | 'red';
  glow?: boolean;
  subtitle?: string;
}

const colorClasses = {
  green: {
    bg: 'bg-success/10',
    border: 'border-success/30',
    text: 'text-success',
    glow: 'shadow-glow-green',
    gradient: 'from-success/20 to-success/5',
  },
  orange: {
    bg: 'bg-accent/10',
    border: 'border-accent/30',
    text: 'text-accent',
    glow: 'shadow-glow-orange',
    gradient: 'from-accent/20 to-accent/5',
  },
  cyan: {
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    text: 'text-primary',
    glow: 'shadow-glow-cyan',
    gradient: 'from-primary/20 to-primary/5',
  },
  purple: {
    bg: 'bg-[hsl(265,80%,60%)]/10',
    border: 'border-[hsl(265,80%,60%)]/30',
    text: 'text-[hsl(265,80%,60%)]',
    glow: 'shadow-[0_0_30px_hsl(265,80%,60%,0.4)]',
    gradient: 'from-[hsl(265,80%,60%)]/20 to-[hsl(265,80%,60%)]/5',
  },
  red: {
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
    text: 'text-destructive',
    glow: 'shadow-[0_0_30px_hsl(0,84%,60%,0.4)]',
    gradient: 'from-destructive/20 to-destructive/5',
  },
};

export function PremiumStatCard({ 
  label, 
  value, 
  unit, 
  icon, 
  trend = 'stable', 
  color = 'green',
  glow = false,
  subtitle
}: PremiumStatCardProps) {
  const colors = colorClasses[color];
  
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-destructive' : trend === 'down' ? 'text-success' : 'text-muted-foreground';

  return (
    <div 
      className={`
        relative overflow-hidden rounded-2xl p-5
        bg-gradient-to-br ${colors.gradient}
        border ${colors.border}
        backdrop-blur-xl
        transition-all duration-300
        hover:scale-[1.02] hover:border-opacity-60
        ${glow ? colors.glow : ''}
      `}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 grid-pattern opacity-30" />
      
      {/* Top Row */}
      <div className="relative flex items-start justify-between mb-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className={`p-2 rounded-xl ${colors.bg} ${colors.text}`}>
          {icon}
        </div>
      </div>
      
      {/* Value */}
      <div className="relative flex items-baseline gap-2">
        <span className={`text-3xl lg:text-4xl font-bold font-mono ${colors.text}`}>
          {value}
        </span>
        {unit && (
          <span className="text-sm font-medium text-muted-foreground">
            {unit}
          </span>
        )}
      </div>

      {/* Trend Indicator */}
      {trend !== 'stable' && (
        <div className={`relative flex items-center gap-1 mt-2 text-xs ${trendColor}`}>
          <TrendIcon className="w-3 h-3" />
          <span>{trend === 'up' ? 'Subiendo' : 'Bajando'}</span>
        </div>
      )}

      {subtitle && (
        <p className="relative text-xs text-muted-foreground mt-2">{subtitle}</p>
      )}

      {/* Decorative Corner */}
      <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full ${colors.bg} blur-2xl opacity-50`} />
    </div>
  );
}
