// Interactive AI Assistant for energy savings tips and anomaly analysis

import { VampireAlert } from './vampireDetection';
import { BillCalculation, PredictionResult } from './tariffCalculator';

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

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface EnergyContext {
  totalDailyKwh: number;
  monthlyKwh: number;
  estimatedBill: number;
  peakHours: number[];
  vampireAlerts: VampireAlert[];
  prediction?: PredictionResult;
  isDac: boolean;
  buildingCount?: number;
  roomCount?: number;
  topConsumers?: string[];
}

// Suggested questions for quick access
export const suggestedQuestions = [
  {
    id: 'bill',
    text: '¿De cuánto será mi próximo recibo?',
    icon: '💰',
  },
  {
    id: 'vampire',
    text: '¿Cómo detecto cargas vampiro?',
    icon: '🧛',
  },
  {
    id: 'reduce',
    text: '¿Cómo reduzco mi factura CFE?',
    icon: '📉',
  },
  {
    id: 'peak',
    text: '¿Cuáles son mis horas pico?',
    icon: '⏰',
  },
  {
    id: 'dac',
    text: '¿Qué es la tarifa DAC?',
    icon: '⚡',
  },
  {
    id: 'carbon',
    text: '¿Cuál es mi huella de carbono?',
    icon: '🌱',
  },
];

// Process user question and generate response based on context
export function processQuestion(question: string, context: EnergyContext): string {
  const q = question.toLowerCase();
  
  // Bill/cost related questions
  if (q.includes('recibo') || q.includes('factura') || q.includes('costo') || q.includes('pagar') || q.includes('cuánto')) {
    if (q.includes('próximo') || q.includes('siguiente') || q.includes('mes')) {
      const nextMonthEstimate = context.prediction?.nextMonthEstimate?.total || context.estimatedBill * 1.05;
      const trend = context.prediction?.trend || 'stable';
      const trendText = trend === 'increasing' ? 'aumentando' : trend === 'decreasing' ? 'disminuyendo' : 'estable';
      
      return `📊 **Estimación de tu próximo recibo:**\n\n` +
        `Tu consumo mensual estimado es de **${context.monthlyKwh.toFixed(0)} kWh**.\n\n` +
        `💰 Recibo estimado: **$${context.estimatedBill.toFixed(2)} MXN**\n\n` +
        (context.isDac ? `⚠️ **Estás en Tarifa DAC** (alto consumo). Tu factura es aproximadamente 45% más cara de lo normal.\n\n` : '') +
        `📈 Tendencia: Tu consumo está **${trendText}**.\n\n` +
        `💡 **Consejo:** ${context.peakHours.length > 0 ? `Evita usar equipos de alto consumo entre las ${context.peakHours[0]}:00 y ${context.peakHours[context.peakHours.length - 1]}:00 para reducir costos.` : 'Distribuye el uso de equipos grandes a lo largo del día.'}`;
    }
    
    return `💰 **Tu consumo actual:**\n\n` +
      `• Consumo diario: **${context.totalDailyKwh.toFixed(2)} kWh**\n` +
      `• Consumo mensual estimado: **${context.monthlyKwh.toFixed(0)} kWh**\n` +
      `• Costo estimado: **$${context.estimatedBill.toFixed(2)} MXN**\n\n` +
      (context.isDac ? `⚠️ Tu consumo excede 500 kWh. Aplica tarifa DAC.\n\n` : '') +
      `📊 Los bloques tarifarios de CFE son:\n` +
      `• 0-150 kWh: $1.68/kWh\n` +
      `• 151-300 kWh: $2.30/kWh\n` +
      `• 301-500 kWh: $3.05/kWh\n` +
      `• >500 kWh (DAC): $5.25/kWh`;
  }
  
  // Vampire/phantom load questions
  if (q.includes('vampiro') || q.includes('fantasma') || q.includes('phantom') || q.includes('standby')) {
    const vampireCount = context.vampireAlerts.length;
    const vampireKwh = context.vampireAlerts.reduce((sum, a) => sum + a.actualConsumption, 0);
    
    return `🧛 **Cargas Vampiro (Consumo Fantasma)**\n\n` +
      `Las cargas vampiro son dispositivos que consumen electricidad incluso cuando están "apagados" o en standby.\n\n` +
      `**Tu situación actual:**\n` +
      (vampireCount > 0 
        ? `⚠️ Se detectaron **${vampireCount} alertas** de consumo en horarios vacíos.\n` +
          `📊 Consumo vampiro estimado: **${vampireKwh.toFixed(2)} kWh** por día.\n` +
          `💰 Esto representa aproximadamente **$${(vampireKwh * 30 * 2.5).toFixed(0)} MXN** extra al mes.\n\n`
        : `✅ No se detectaron consumos vampiro significativos.\n\n`) +
      `**Cómo identificar cargas vampiro:**\n` +
      `1. Revisa equipos con luz LED de standby (TV, microondas, etc.)\n` +
      `2. Cargadores conectados sin dispositivo\n` +
      `3. Computadoras en modo suspensión\n` +
      `4. Aires acondicionados con control remoto\n\n` +
      `**Soluciones:**\n` +
      `• Usa regletas con interruptor\n` +
      `• Desconecta cargadores cuando no estén en uso\n` +
      `• Configura equipos para apagado completo`;
  }
  
  // Reduce bill questions
  if (q.includes('reduc') || q.includes('ahorr') || q.includes('bajar') || q.includes('disminuir') || q.includes('menos')) {
    return `📉 **Estrategias para reducir tu factura CFE:**\n\n` +
      `**1. Optimiza el aire acondicionado (hasta -20%):**\n` +
      `• Mantén temperatura en 24-25°C\n` +
      `• Limpia filtros mensualmente\n` +
      `• Sella fugas en puertas y ventanas\n\n` +
      `**2. Iluminación eficiente (hasta -15%):**\n` +
      `• Cambia a focos LED (80% menos consumo)\n` +
      `• Aprovecha luz natural\n` +
      `• Instala sensores de movimiento\n\n` +
      `**3. Elimina consumo fantasma (hasta -10%):**\n` +
      `• Desconecta equipos en standby\n` +
      `• Usa regletas con interruptor\n\n` +
      `**4. Horarios inteligentes:**\n` +
      (context.peakHours.length > 0 
        ? `• Evita las horas pico: ${context.peakHours.slice(0, 3).map(h => `${h}:00`).join(', ')}\n` 
        : '') +
      `• Usa lavadora/secadora en horarios de menor demanda\n\n` +
      `**5. Mantenimiento:**\n` +
      `• Limpia condensadores de refrigerador\n` +
      `• Verifica fugas en sistema de AC`;
  }
  
  // Peak hours questions
  if (q.includes('pico') || q.includes('hora') || q.includes('máximo') || q.includes('alto consumo')) {
    return `⏰ **Tus horas de mayor consumo:**\n\n` +
      (context.peakHours.length > 0
        ? `📊 Horas pico detectadas: **${context.peakHours.map(h => `${h}:00`).join(', ')}**\n\n` +
          `Estos son los momentos donde tu consumo es más alto. Durante estas horas:\n` +
          `• El costo por kWh puede ser mayor\n` +
          `• El sistema eléctrico está más demandado\n` +
          `• Es más probable exceder límites de tarifa\n\n`
        : `No se detectaron horas pico claras. Tu consumo parece distribuido uniformemente.\n\n`) +
      `**Recomendaciones:**\n` +
      `• Programa lavadora/secadora fuera de horas pico\n` +
      `• Pre-enfría espacios antes del pico de calor\n` +
      `• Usa temporizadores para distribuir cargas`;
  }
  
  // DAC tariff questions
  if (q.includes('dac') || q.includes('alto consumo') || q.includes('tarifa alta')) {
    return `⚡ **Tarifa DAC (Doméstica de Alto Consumo)**\n\n` +
      `La tarifa DAC se aplica cuando el consumo promedio de los últimos 6 meses excede **500 kWh**.\n\n` +
      `**Comparación de costos:**\n` +
      `• Tarifa normal promedio: ~$2.50/kWh\n` +
      `• Tarifa DAC: **$5.25/kWh** (+110%)\n\n` +
      `**Tu situación:**\n` +
      (context.isDac 
        ? `⚠️ **Estás en DAC.** Tu consumo de ${context.monthlyKwh.toFixed(0)} kWh excede el límite.\n` +
          `💰 Estás pagando aproximadamente **$${((context.monthlyKwh - 500) * 2.75).toFixed(0)} MXN** extra al mes.\n\n`
        : `✅ No estás en DAC. Tu consumo de ${context.monthlyKwh.toFixed(0)} kWh está dentro del rango normal.\n\n`) +
      `**Cómo salir de DAC:**\n` +
      `• Reduce consumo por 6 meses consecutivos a <500 kWh\n` +
      `• Optimiza aire acondicionado (mayor consumidor)\n` +
      `• Considera paneles solares para compensar`;
  }
  
  // Carbon footprint questions
  if (q.includes('carbon') || q.includes('co2') || q.includes('huella') || q.includes('ambiente') || q.includes('ecológ')) {
    const monthlyKwh = context.monthlyKwh;
    const co2Kg = monthlyKwh * 0.527; // Factor de emisión México
    const trees = co2Kg / 22; // Un árbol absorbe ~22 kg CO2/año
    
    return `🌱 **Tu Huella de Carbono:**\n\n` +
      `Con un consumo de **${monthlyKwh.toFixed(0)} kWh/mes**, generas:\n\n` +
      `• **${co2Kg.toFixed(1)} kg de CO₂** al mes\n` +
      `• **${(co2Kg * 12).toFixed(0)} kg de CO₂** al año\n\n` +
      `🌳 **Equivalencias:**\n` +
      `• Necesitarías plantar **${trees.toFixed(0)} árboles** para compensar\n` +
      `• Equivale a **${(co2Kg / 2.31).toFixed(0)} litros** de gasolina quemados\n` +
      `• O **${(co2Kg / 0.21).toFixed(0)} km** recorridos en auto\n\n` +
      `**Cómo reducir tu huella:**\n` +
      `• Cada kWh ahorrado = 0.527 kg CO₂ menos\n` +
      `• Energía solar reduce ~90% las emisiones\n` +
      `• Equipos eficientes = menor huella`;
  }
  
  // Why more consumption today/this month
  if (q.includes('por qué') || q.includes('porque') || q.includes('razón') || q.includes('más hoy') || q.includes('subió')) {
    const vampireCount = context.vampireAlerts.length;
    
    return `🔍 **Análisis de tu consumo elevado:**\n\n` +
      `**Posibles causas:**\n\n` +
      `1. **Clima:** Las altas temperaturas aumentan uso de AC hasta 40%\n\n` +
      `2. **Equipos nuevos:** Revisa si agregaste algún dispositivo\n\n` +
      (vampireCount > 0 
        ? `3. ⚠️ **Consumo fantasma:** Detecté ${vampireCount} alertas de uso en horarios vacíos\n\n` 
        : '') +
      `4. **Cambios de rutina:** Vacaciones, home office, visitas\n\n` +
      `5. **Mantenimiento:** Filtros sucios de AC aumentan consumo 15%\n\n` +
      `**Qué revisar:**\n` +
      `• Compara con el mismo mes del año anterior\n` +
      `• Revisa si hay equipos funcionando 24/7\n` +
      `• Verifica termostato del AC`;
  }
  
  // Default response for unknown questions
  return `🤖 Gracias por tu pregunta. Aquí está lo que puedo decirte:\n\n` +
    `**Tu resumen energético:**\n` +
    `• Consumo diario: **${context.totalDailyKwh.toFixed(2)} kWh**\n` +
    `• Consumo mensual: **${context.monthlyKwh.toFixed(0)} kWh**\n` +
    `• Costo estimado: **$${context.estimatedBill.toFixed(2)} MXN**\n` +
    (context.vampireAlerts.length > 0 ? `• ⚠️ ${context.vampireAlerts.length} alertas de consumo vampiro\n` : '') +
    (context.isDac ? `• ⚠️ Tarifa DAC activa\n` : '') +
    `\n**Pregúntame sobre:**\n` +
    `• Tu próximo recibo y cómo reducirlo\n` +
    `• Cargas vampiro y cómo detectarlas\n` +
    `• Horas pico de consumo\n` +
    `• Tarifa DAC y cómo evitarla\n` +
    `• Tu huella de carbono`;
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
      title: 'Redistribuye Uso en Horas Pico',
      description: `Las horas de mayor consumo son: ${peakHours.slice(0, 3).map(h => `${h}:00`).join(', ')}. Programa actividades de alto consumo fuera de estos horarios.`,
      potentialSavings: '10-15% del consumo pico',
      priority: 'medium',
      category: 'schedule',
      icon: '⏰',
    });
  }

  // AC tips
  if (totalDailyKwh > 30) {
    tips.push({
      id: 'ac-1',
      title: 'Optimiza el Aire Acondicionado',
      description: 'Mantén la temperatura en 24-25°C y limpia filtros mensualmente. Cada grado menos aumenta el consumo un 8%.',
      potentialSavings: '15-20% en climatización',
      priority: 'high',
      category: 'equipment',
      icon: '❄️',
    });
  }

  // LED tip
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
      title: 'Tarifa DAC Activa',
      description: `Tu consumo excede 500 kWh. Estás pagando $5.25/kWh en lugar de ~$2.50/kWh. Reduce urgentemente.`,
      potentialSavings: '45% del costo total',
      priority: 'high',
      category: 'behavior',
      icon: '⚡',
    });
  }

  // Natural light
  tips.push({
    id: 'light-1',
    title: 'Aprovecha la Luz Natural',
    description: 'Mantén cortinas abiertas durante el día y apaga luces en áreas con buena iluminación natural.',
    potentialSavings: '5-10% en iluminación',
    priority: 'low',
    category: 'behavior',
    icon: '☀️',
  });

  // Maintenance
  tips.push({
    id: 'maint-1',
    title: 'Mantenimiento Preventivo',
    description: 'Limpia filtros de AC cada mes y revisa el sellado de puertas/ventanas para evitar fugas de aire.',
    potentialSavings: '5-15% en climatización',
    priority: 'medium',
    category: 'maintenance',
    icon: '🔧',
  });

  // Timers
  tips.push({
    id: 'timer-1',
    title: 'Usa Temporizadores',
    description: 'Programa equipos para apagarse automáticamente fuera del horario de uso. Evita el standby.',
    potentialSavings: '10-20% del consumo total',
    priority: 'medium',
    category: 'schedule',
    icon: '⏲️',
  });

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return tips.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

// Analyze anomalies
export function analyzeAnomalies(
  vampireAlerts: VampireAlert[],
  prediction?: PredictionResult,
  monthlyHistory: number[] = []
): AnomalyAnalysis[] {
  const anomalies: AnomalyAnalysis[] = [];

  if (vampireAlerts.length > 0) {
    const highSeverityCount = vampireAlerts.filter(a => a.severity === 'high').length;
    anomalies.push({
      type: 'vampire',
      severity: highSeverityCount > 0 ? 'critical' : 'warning',
      title: `${vampireAlerts.length} Consumos Vampiro`,
      description: `Consumo detectado cuando los espacios deberían estar vacíos.`,
      recommendation: 'Revisa equipos en standby y desconecta cargadores sin uso.',
    });
  }

  if (prediction?.currentMonth.isDac) {
    anomalies.push({
      type: 'dac_warning',
      severity: 'critical',
      title: 'Tarifa DAC Aplicada',
      description: `Consumo de ${prediction.currentMonth.consumptionKwh.toFixed(0)} kWh excede 500 kWh.`,
      recommendation: 'Reduce consumo urgentemente para volver a tarifa normal.',
    });
  }

  if (prediction?.trend === 'increasing' && prediction.trendPercentage > 10) {
    anomalies.push({
      type: 'trend',
      severity: 'warning',
      title: `Tendencia al Alza: +${prediction.trendPercentage.toFixed(0)}%`,
      description: 'Tu consumo está aumentando significativamente.',
      recommendation: 'Revisa nuevos equipos o cambios en horarios de uso.',
    });
  }

  if (monthlyHistory.length >= 3) {
    const avg = monthlyHistory.slice(0, -1).reduce((a, b) => a + b, 0) / (monthlyHistory.length - 1);
    const current = monthlyHistory[monthlyHistory.length - 1];
    
    if (current > avg * 1.3) {
      anomalies.push({
        type: 'spike',
        severity: 'warning',
        title: 'Pico de Consumo Inusual',
        description: `Consumo ${((current / avg - 1) * 100).toFixed(0)}% mayor que tu promedio.`,
        recommendation: 'Investiga equipos defectuosos o nuevos usos.',
      });
    }
  }

  return anomalies;
}

// Generate summary
export function generateSummary(
  totalDailyKwh: number,
  prediction?: PredictionResult,
  vampireAlerts: VampireAlert[] = []
): string {
  const hour = new Date().getHours();
  let greeting = hour < 12 ? '¡Buenos días!' : hour < 18 ? '¡Buenas tardes!' : '¡Buenas noches!';
  let message = `${greeting} `;

  if (prediction) {
    message += `Tu consumo estimado este mes es de ${prediction.currentMonth.consumptionKwh.toFixed(0)} kWh. `;
    message += `Recibo estimado: $${prediction.currentMonth.total.toFixed(2)} MXN. `;
    
    if (prediction.currentMonth.isDac) {
      message += '⚠️ Estás en tarifa DAC. ';
    }
  }

  if (vampireAlerts.length > 0) {
    message += `Se detectaron ${vampireAlerts.length} consumos vampiro.`;
  }

  return message;
}
