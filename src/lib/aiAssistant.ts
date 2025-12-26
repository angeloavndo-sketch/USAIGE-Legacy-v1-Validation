// Rule-based AI Assistant for energy savings tips and anomaly analysis

import { VampireAlert } from './vampireDetection';
import { BillCalculation, PredictionResult } from './tariffCalculator';
import { CarbonData } from './carbonFootprint';

export interface SavingsTip {
  id: string;
  title: string;
  description: string;
  potentialSavings: string;
  priority: 'low' | 'medium' | 'high';
  category: 'equipment' | 'behavior' | 'schedule' | 'maintenance' | 'vampire';
  icon: string;
}

export interface AnomalyAnalysis {
  type: 'vampire' | 'spike' | 'trend' | 'dac_warning';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  recommendation: string;
}

// Generate savings tips based on usage patterns
export function generateSavingsTips(
  totalDailyKwh: number,
  peakHours: number[],
  vampireAlerts: VampireAlert[],
  prediction?: PredictionResult
): SavingsTip[] {
  const tips: SavingsTip[] = [];

  // Vampire load tips
  if (vampireAlerts.length > 0) {
    tips.push({
      id: 'vampire-1',
      title: 'Consumo Vampiro Detectado',
      description: `Se detectaron ${vampireAlerts.length} alertas de consumo en horarios vacíos. Revisa equipos que permanecen encendidos innecesariamente.`,
      potentialSavings: `${(vampireAlerts.reduce((sum, a) => sum + a.actualConsumption, 0) * 30).toFixed(0)} kWh/mes`,
      priority: 'high',
      category: 'vampire',
      icon: '🧛',
    });
  }

  // Peak hour tips
  if (peakHours.length > 0) {
    tips.push({
      id: 'peak-1',
      title: 'Evita Uso en Horas Pico',
      description: `Las horas de mayor consumo son: ${peakHours.slice(0, 3).map(h => `${h}:00`).join(', ')}. Considera redistribuir actividades.`,
      potentialSavings: '10-15% del consumo pico',
      priority: 'medium',
      category: 'schedule',
      icon: '⏰',
    });
  }

  // AC tips (most buildings use AC heavily)
  if (totalDailyKwh > 50) {
    tips.push({
      id: 'ac-1',
      title: 'Optimiza el Aire Acondicionado',
      description: 'Mantén la temperatura en 24-25°C. Cada grado menos aumenta el consumo un 8%.',
      potentialSavings: '15-20% en climatización',
      priority: 'high',
      category: 'equipment',
      icon: '❄️',
    });
  }

  // Lighting tips
  tips.push({
    id: 'light-1',
    title: 'Aprovecha la Luz Natural',
    description: 'Mantén cortinas abiertas durante el día y apaga luces en áreas con buena iluminación natural.',
    potentialSavings: '5-10% en iluminación',
    priority: 'low',
    category: 'behavior',
    icon: '💡',
  });

  // LED upgrade tip
  tips.push({
    id: 'led-1',
    title: 'Cambia a Iluminación LED',
    description: 'Los focos LED consumen hasta 80% menos energía que los incandescentes y duran 25 veces más.',
    potentialSavings: '75-80% en iluminación',
    priority: 'medium',
    category: 'equipment',
    icon: '💡',
  });

  // DAC warning
  if (prediction?.currentMonth.isDac) {
    tips.push({
      id: 'dac-1',
      title: '⚠️ Tarifa DAC Activa',
      description: 'Tu consumo excede 500 kWh. La tarifa DAC tiene un costo 45% mayor. Reduce urgentemente el consumo.',
      potentialSavings: '45% del costo total',
      priority: 'high',
      category: 'behavior',
      icon: '⚡',
    });
  }

  // Maintenance tips
  tips.push({
    id: 'maint-1',
    title: 'Mantenimiento de Equipos',
    description: 'Limpia filtros de AC cada mes y revisa el sellado de puertas/ventanas para evitar fugas de aire.',
    potentialSavings: '5-15% en climatización',
    priority: 'medium',
    category: 'maintenance',
    icon: '🔧',
  });

  // Schedule optimization
  tips.push({
    id: 'schedule-1',
    title: 'Automatiza con Temporizadores',
    description: 'Usa temporizadores para apagar equipos automáticamente fuera del horario laboral.',
    potentialSavings: '10-20% del consumo total',
    priority: 'medium',
    category: 'schedule',
    icon: '⏲️',
  });

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return tips.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

// Analyze anomalies in consumption patterns
export function analyzeAnomalies(
  vampireAlerts: VampireAlert[],
  prediction?: PredictionResult,
  monthlyHistory: number[] = []
): AnomalyAnalysis[] {
  const anomalies: AnomalyAnalysis[] = [];

  // Vampire loads
  if (vampireAlerts.length > 0) {
    const highSeverityCount = vampireAlerts.filter(a => a.severity === 'high').length;
    anomalies.push({
      type: 'vampire',
      severity: highSeverityCount > 0 ? 'critical' : 'warning',
      title: `${vampireAlerts.length} Consumos Vampiro Detectados`,
      description: `Se detectó consumo eléctrico en ${vampireAlerts.length} instancias cuando los espacios deberían estar vacíos.`,
      recommendation: 'Revisa equipos enchufados, verifica que el AC y luces estén apagados fuera de horario.',
    });
  }

  // DAC warning
  if (prediction?.currentMonth.isDac) {
    anomalies.push({
      type: 'dac_warning',
      severity: 'critical',
      title: 'Tarifa DAC Aplicada',
      description: `Tu consumo de ${prediction.currentMonth.consumptionKwh.toFixed(0)} kWh excede el límite de 500 kWh. Se aplica tarifa de alto consumo.`,
      recommendation: 'Reduce el consumo urgentemente para volver a tarifa normal el próximo mes.',
    });
  }

  // Trend analysis
  if (prediction?.trend === 'increasing' && prediction.trendPercentage > 10) {
    anomalies.push({
      type: 'trend',
      severity: 'warning',
      title: `Tendencia al Alza: +${prediction.trendPercentage.toFixed(0)}%`,
      description: 'Tu consumo está aumentando significativamente comparado con el mes anterior.',
      recommendation: 'Revisa nuevos equipos instalados o cambios en horarios de uso.',
    });
  }

  // Spike detection in monthly history
  if (monthlyHistory.length >= 3) {
    const avg = monthlyHistory.slice(0, -1).reduce((a, b) => a + b, 0) / (monthlyHistory.length - 1);
    const current = monthlyHistory[monthlyHistory.length - 1];
    
    if (current > avg * 1.3) {
      anomalies.push({
        type: 'spike',
        severity: 'warning',
        title: 'Pico de Consumo Inusual',
        description: `El consumo actual es ${((current / avg - 1) * 100).toFixed(0)}% mayor que tu promedio histórico.`,
        recommendation: 'Investiga si hay equipos defectuosos o nuevos usos que expliquen el aumento.',
      });
    }
  }

  return anomalies;
}

// Get greeting based on time of day
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return '¡Buenos días!';
  if (hour < 18) return '¡Buenas tardes!';
  return '¡Buenas noches!';
}

// Generate summary message
export function generateSummary(
  totalDailyKwh: number,
  prediction?: PredictionResult,
  vampireAlerts: VampireAlert[] = []
): string {
  let message = `${getGreeting()} `;

  if (prediction) {
    message += `Tu consumo estimado este mes es de ${prediction.currentMonth.consumptionKwh.toFixed(0)} kWh. `;
    message += `El recibo estimado es de ${(prediction.currentMonth.total).toFixed(2)} MXN. `;
    
    if (prediction.currentMonth.isDac) {
      message += '⚠️ Estás en tarifa DAC (alto consumo). ';
    }
  }

  if (vampireAlerts.length > 0) {
    message += `Se detectaron ${vampireAlerts.length} consumos vampiro. `;
  }

  return message;
}
