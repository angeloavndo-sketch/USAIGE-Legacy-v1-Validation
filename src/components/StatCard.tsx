import { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: ReactNode;
  variant?: 'default' | 'primary' | 'accent' | 'success';
  delay?: number;
}

export function StatCard({ label, value, unit, icon, variant = 'default', delay = 0 }: StatCardProps) {
  const variantClasses = {
    default: 'text-foreground',
    primary: 'text-primary glow-primary',
    accent: 'text-accent glow-accent',
    success: 'text-success glow-success',
  };

  return (
    <div 
      className={`glass-card p-6 opacity-0 animate-fade-in-up`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{label}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`stat-value ${variantClasses[variant]}`}>
              {value}
            </span>
            {unit && (
              <span className="text-lg text-muted-foreground font-mono">{unit}</span>
            )}
          </div>
        </div>
        <div className={`p-3 rounded-lg bg-secondary/50 ${variantClasses[variant]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
