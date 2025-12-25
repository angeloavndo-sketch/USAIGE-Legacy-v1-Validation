import { Zap, Leaf } from 'lucide-react';
import { PeakAnalysis, getPeakHoursRange } from '@/lib/peakDetection';

interface PeakStatusProps {
  analysis: PeakAnalysis;
}

export function PeakStatus({ analysis }: PeakStatusProps) {
  const { currentIsPeak, peakHours } = analysis;
  const currentHour = new Date().getHours();
  
  // Find next status change
  const getNextChange = () => {
    const sorted = [...Array(24).keys()].map(h => ({
      hour: h,
      isPeak: peakHours.includes(h)
    }));
    
    for (let i = 1; i <= 24; i++) {
      const checkHour = (currentHour + i) % 24;
      const checkIsPeak = sorted[checkHour].isPeak;
      if (checkIsPeak !== currentIsPeak) {
        return { hour: checkHour, isPeak: checkIsPeak };
      }
    }
    return null;
  };

  const nextChange = getNextChange();
  const hoursUntilChange = nextChange 
    ? ((nextChange.hour - currentHour + 24) % 24) || 24
    : 0;

  return (
    <div className="glass-card p-6 opacity-0 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl ${currentIsPeak ? 'bg-accent/20' : 'bg-success/20'}`}>
            {currentIsPeak ? (
              <Zap className="w-8 h-8 text-accent" />
            ) : (
              <Leaf className="w-8 h-8 text-success" />
            )}
          </div>
          <div>
            <div className={`peak-indicator ${currentIsPeak ? 'peak-indicator-active' : 'peak-indicator-inactive'}`}>
              {currentIsPeak ? '⚡ Peak Hours Active' : '✓ Off-Peak Hours'}
            </div>
            <p className="text-muted-foreground mt-2 text-sm">
              {currentIsPeak 
                ? 'High electricity demand period - consider reducing usage'
                : 'Low demand period - optimal time for high-consumption activities'
              }
            </p>
          </div>
        </div>
        
        <div className="flex flex-col items-start md:items-end gap-1">
          <p className="text-sm text-muted-foreground">
            {nextChange 
              ? `${currentIsPeak ? 'Off-peak' : 'Peak'} starts in`
              : 'Status change'
            }
          </p>
          <p className="text-2xl font-mono font-bold text-foreground">
            {hoursUntilChange} {hoursUntilChange === 1 ? 'hour' : 'hours'}
          </p>
        </div>
      </div>
      
      <div className="mt-6 pt-6 border-t border-border/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Today's Peak Hours</p>
            <p className="text-foreground font-medium">{getPeakHoursRange(peakHours)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Detected Peak Count</p>
            <p className="text-foreground font-medium">{peakHours.length} hours identified</p>
          </div>
        </div>
      </div>
    </div>
  );
}
