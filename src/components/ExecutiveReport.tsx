import { FileText, Download, TrendingUp, Zap, Leaf, AlertTriangle, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PredictionResult, formatMXN } from '@/lib/tariffCalculator';
import { VampireAlert } from '@/lib/vampireDetection';
import { CarbonData } from '@/lib/carbonFootprint';
import { useToast } from '@/hooks/use-toast';

interface ExecutiveReportProps {
  title: string;
  dailyKwh: number;
  monthlyKwh: number;
  prediction: PredictionResult;
  vampireAlerts: VampireAlert[];
  carbon: CarbonData;
  variant?: 'green' | 'orange';
}

export function ExecutiveReport({
  title,
  dailyKwh,
  monthlyKwh,
  prediction,
  vampireAlerts,
  carbon,
  variant = 'green',
}: ExecutiveReportProps) {
  const { toast } = useToast();

  const colorClasses = {
    green: {
      accent: 'text-success',
      bg: 'bg-success/10',
      border: 'border-success/30',
      button: 'bg-success hover:bg-success/90 text-success-foreground',
    },
    orange: {
      accent: 'text-accent',
      bg: 'bg-accent/10',
      border: 'border-accent/30',
      button: 'bg-accent hover:bg-accent/90 text-accent-foreground',
    },
  };

  const colors = colorClasses[variant];

  const handleGenerateReport = () => {
    // Create report content
    const reportDate = new Date().toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const reportContent = `
═══════════════════════════════════════════════════════════════
                    REPORTE EJECUTIVO DE ENERGÍA
                    Energy Monitor Pro v2.0
═══════════════════════════════════════════════════════════════

Unidad: ${title}
Fecha: ${reportDate}

───────────────────────────────────────────────────────────────
                        RESUMEN DE CONSUMO
───────────────────────────────────────────────────────────────

Consumo Diario:          ${dailyKwh.toFixed(2)} kWh
Consumo Mensual:         ${monthlyKwh.toFixed(2)} kWh
Costo Estimado:          ${formatMXN(prediction.currentMonth.total)}

Tarifa Aplicada:         ${prediction.currentMonth.isDac ? 'DAC (Alto Consumo)' : 'Normal'}
Tendencia:               ${prediction.trend === 'increasing' ? 'Aumentando' : prediction.trend === 'decreasing' ? 'Disminuyendo' : 'Estable'} (${prediction.trendPercentage.toFixed(1)}%)

───────────────────────────────────────────────────────────────
                    DESGLOSE DE FACTURACIÓN
───────────────────────────────────────────────────────────────

${prediction.currentMonth.blockBreakdown.map(b => 
  `${b.block.padEnd(30)} ${b.kwh.toFixed(0).padStart(6)} kWh  ${formatMXN(b.subtotal).padStart(12)}`
).join('\n')}

Cargos Fijos:                                    ${formatMXN(prediction.currentMonth.fixedCharges).padStart(12)}
IVA (16%):                                       ${formatMXN(prediction.currentMonth.iva).padStart(12)}
─────────────────────────────────────────────────────────────
TOTAL:                                           ${formatMXN(prediction.currentMonth.total).padStart(12)}

───────────────────────────────────────────────────────────────
                    ALERTAS DE CONSUMO VAMPIRO
───────────────────────────────────────────────────────────────

Total de Alertas: ${vampireAlerts.length}
${vampireAlerts.length > 0 ? `
${vampireAlerts.slice(0, 10).map(a => 
  `• ${a.roomName} (${a.buildingName}) - ${a.hour}:00 - ${a.actualConsumption.toFixed(2)} kW - Severidad: ${a.severity.toUpperCase()}`
).join('\n')}
` : 'No se detectaron consumos vampiro. ¡Excelente!'}

───────────────────────────────────────────────────────────────
                      HUELLA DE CARBONO
───────────────────────────────────────────────────────────────

CO₂ Emitido:             ${carbon.co2EmittedKg.toFixed(2)} kg/mes
Árboles Equivalentes:    ${carbon.treesEquivalent.toFixed(1)} árboles para compensar
Equivalente en Auto:     ${carbon.carsEquivalent.toFixed(1)} meses de conducción

───────────────────────────────────────────────────────────────
                       PREDICCIÓN
───────────────────────────────────────────────────────────────

Próximo Mes (Estimado):  ${formatMXN(prediction.nextMonthEstimate.total)}
Peor Escenario:          ${formatMXN(prediction.maxEstimate.total)}

───────────────────────────────────────────────────────────────
                    RECOMENDACIONES
───────────────────────────────────────────────────────────────

${prediction.currentMonth.isDac ? '⚠️ URGENTE: Reducir consumo para salir de tarifa DAC' : ''}
${vampireAlerts.length > 0 ? '• Revisar equipos en standby y desconectar cargadores sin uso' : ''}
• Optimizar uso de aire acondicionado (mantener en 24-25°C)
• Cambiar iluminación a LED para reducir hasta 80% en iluminación
• Usar temporizadores para apagar equipos automáticamente

═══════════════════════════════════════════════════════════════
Generado por Energy Monitor Pro - ${new Date().toISOString()}
═══════════════════════════════════════════════════════════════
`;

    // Create and download the file
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-energia-${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Reporte Generado",
      description: "El reporte ejecutivo se ha descargado correctamente.",
    });
  };

  return (
    <div className={`glass-card rounded-2xl p-6 ${colors.border} border`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <FileText className={`w-5 h-5 ${colors.accent}`} />
            Reporte Ejecutivo
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Resumen completo de {title}
          </p>
        </div>
        <Button onClick={handleGenerateReport} className={colors.button}>
          <Download className="w-4 h-4 mr-2" />
          Descargar Reporte
        </Button>
      </div>

      {/* Report Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl ${colors.bg} ${colors.border} border`}>
          <div className="flex items-center gap-2 mb-2">
            <Zap className={`w-4 h-4 ${colors.accent}`} />
            <span className="text-xs text-muted-foreground">Consumo</span>
          </div>
          <p className={`text-xl font-mono font-bold ${colors.accent}`}>
            {monthlyKwh.toFixed(0)}
          </p>
          <p className="text-xs text-muted-foreground">kWh/mes</p>
        </div>

        <div className="p-4 rounded-xl bg-accent/10 border border-accent/30">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-accent" />
            <span className="text-xs text-muted-foreground">Costo</span>
          </div>
          <p className="text-xl font-mono font-bold text-accent">
            ${prediction.currentMonth.total.toFixed(0)}
          </p>
          <p className="text-xs text-muted-foreground">MXN/mes</p>
        </div>

        <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
          <div className="flex items-center gap-2 mb-2">
            <Leaf className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">CO₂</span>
          </div>
          <p className="text-xl font-mono font-bold text-primary">
            {carbon.co2EmittedKg.toFixed(0)}
          </p>
          <p className="text-xs text-muted-foreground">kg/mes</p>
        </div>

        <div className={`p-4 rounded-xl ${vampireAlerts.length > 0 ? 'bg-destructive/10 border-destructive/30' : colors.bg + ' ' + colors.border} border`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className={`w-4 h-4 ${vampireAlerts.length > 0 ? 'text-destructive' : colors.accent}`} />
            <span className="text-xs text-muted-foreground">Alertas</span>
          </div>
          <p className={`text-xl font-mono font-bold ${vampireAlerts.length > 0 ? 'text-destructive' : colors.accent}`}>
            {vampireAlerts.length}
          </p>
          <p className="text-xs text-muted-foreground">vampiro</p>
        </div>
      </div>

      {/* Trend Indicator */}
      <div className="mt-4 p-4 rounded-xl bg-secondary/30 border border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className={`w-5 h-5 ${
              prediction.trend === 'increasing' ? 'text-destructive' :
              prediction.trend === 'decreasing' ? 'text-success' : 'text-muted-foreground'
            }`} />
            <div>
              <p className="text-sm font-medium text-foreground">Tendencia de Consumo</p>
              <p className="text-xs text-muted-foreground">
                {prediction.trend === 'increasing' ? 'Aumentando' : 
                 prediction.trend === 'decreasing' ? 'Disminuyendo' : 'Estable'}
                {prediction.trendPercentage > 0 && ` ${prediction.trendPercentage.toFixed(1)}%`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Próximo mes</p>
            <p className="text-lg font-mono font-bold text-foreground">
              {formatMXN(prediction.nextMonthEstimate.total)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
