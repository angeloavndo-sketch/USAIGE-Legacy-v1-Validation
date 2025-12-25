import { formatHour } from '@/lib/peakDetection';

interface PeakHoursTimelineProps {
  peakHours: number[];
}

export function PeakHoursTimeline({ peakHours }: PeakHoursTimelineProps) {
  const currentHour = new Date().getHours();
  
  return (
    <div className="glass-card p-6 opacity-0 animate-fade-in-up animate-delay-300">
      <h2 className="text-xl font-semibold text-foreground mb-4">24-Hour Timeline</h2>
      <p className="text-sm text-muted-foreground mb-6">Visual representation of detected peak hours</p>
      
      <div className="grid grid-cols-12 gap-1">
        {Array.from({ length: 24 }, (_, hour) => {
          const isPeak = peakHours.includes(hour);
          const isCurrent = hour === currentHour;
          
          return (
            <div key={hour} className="flex flex-col items-center gap-1">
              <div
                className={`
                  w-full h-12 rounded-md transition-all duration-300
                  ${isPeak ? 'bg-accent/60' : 'bg-secondary/60'}
                  ${isCurrent ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                `}
                title={`${formatHour(hour)} - ${isPeak ? 'Peak' : 'Off-Peak'}`}
              />
              {hour % 4 === 0 && (
                <span className="text-[10px] text-muted-foreground">
                  {formatHour(hour).replace(' AM', 'a').replace(' PM', 'p')}
                </span>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="flex items-center justify-center gap-6 mt-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-accent/60" />
          <span className="text-muted-foreground">Peak</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-secondary/60" />
          <span className="text-muted-foreground">Off-Peak</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-secondary/60 ring-2 ring-primary" />
          <span className="text-muted-foreground">Current Hour</span>
        </div>
      </div>
    </div>
  );
}
