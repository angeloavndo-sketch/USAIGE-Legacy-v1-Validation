import { AlertTriangle, Zap, Clock, Info } from 'lucide-react';
import { VampireAlert } from '@/lib/vampireDetection';

interface VampireDetectorCardProps {
  alerts: VampireAlert[];
  variant?: 'green' | 'orange';
}

export function VampireDetectorCard({ alerts, variant = 'green' }: VampireDetectorCardProps) {
  const colorClasses = {
    green: {
      accent: 'text-success',
      bg: 'bg-success/10',
      border: 'border-success/30',
    },
    orange: {
      accent: 'text-accent',
      bg: 'bg-accent/10',
      border: 'border-accent/30',
    },
  };

  const colors = colorClasses[variant];
  const highSeverity = alerts.filter(a => a.severity === 'high');
  const mediumSeverity = alerts.filter(a => a.severity === 'medium');
  const lowSeverity = alerts.filter(a => a.severity === 'low');

  const totalVampireKwh = alerts.reduce((sum, a) => sum + a.actualConsumption, 0);
  const monthlyVampireCost = totalVampireKwh * 30 * 2.5; // Approximate cost

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Zap className="w-5 h-5 text-accent" />
          Detector de Vampiros
        </h3>
        {alerts.length > 0 ? (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-destructive/20 text-destructive">
            {alerts.length} alertas
          </span>
        ) : (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-success/20 text-success">
            Sin alertas
          </span>
        )}
      </div>

      {/* Algorithm Explanation */}
      <div className="mb-4 p-3 rounded-xl bg-secondary/30 border border-border/30">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">¿Cómo funciona?</p>
            <p>El algoritmo detecta consumo eléctrico fuera del horario programado de cada salón/habitación. 
            Si hay consumo cuando el espacio debería estar vacío (según el horario configurado), 
            se genera una alerta con severidad basada en el nivel de consumo.</p>
            <ul className="mt-2 space-y-1">
              <li>• <span className="text-destructive">Alta:</span> Consumo {'>'} 0.5 kW</li>
              <li>• <span className="text-accent">Media:</span> Consumo {'>'} 0.2 kW</li>
              <li>• <span className="text-muted-foreground">Baja:</span> Consumo {'>'} 0.1 kW</li>
            </ul>
          </div>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-6">
          <div className={`inline-flex p-3 rounded-full ${colors.bg} mb-3`}>
            <Zap className={`w-6 h-6 ${colors.accent}`} />
          </div>
          <p className="text-sm text-muted-foreground">
            ¡Excelente! No se detectaron consumos vampiro.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
              <p className="text-2xl font-mono font-bold text-destructive">
                {totalVampireKwh.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">kWh/día perdido</p>
            </div>
            <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 text-center">
              <p className="text-2xl font-mono font-bold text-accent">
                ${monthlyVampireCost.toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground">MXN/mes extra</p>
            </div>
          </div>

          {/* Severity Summary */}
          <div className="flex gap-2 mb-4">
            {highSeverity.length > 0 && (
              <span className="flex-1 text-center py-2 rounded-lg bg-destructive/20 text-destructive text-xs font-medium">
                {highSeverity.length} Alta
              </span>
            )}
            {mediumSeverity.length > 0 && (
              <span className="flex-1 text-center py-2 rounded-lg bg-accent/20 text-accent text-xs font-medium">
                {mediumSeverity.length} Media
              </span>
            )}
            {lowSeverity.length > 0 && (
              <span className="flex-1 text-center py-2 rounded-lg bg-muted text-muted-foreground text-xs font-medium">
                {lowSeverity.length} Baja
              </span>
            )}
          </div>

          {/* Alert List */}
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-xl border ${
                  alert.severity === 'high'
                    ? 'bg-destructive/10 border-destructive/30'
                    : alert.severity === 'medium'
                    ? 'bg-accent/10 border-accent/30'
                    : 'bg-muted/50 border-border/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                      alert.severity === 'high' ? 'text-destructive' :
                      alert.severity === 'medium' ? 'text-accent' : 'text-muted-foreground'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {alert.roomName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {alert.buildingName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-semibold text-foreground">
                      {alert.actualConsumption.toFixed(2)} kW
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {alert.hour}:00
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {alerts.length > 5 && (
              <p className="text-center text-xs text-muted-foreground py-2">
                +{alerts.length - 5} alertas más
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
