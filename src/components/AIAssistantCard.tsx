import { useState } from 'react';
import { Bot, Lightbulb, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  SavingsTip, 
  AnomalyAnalysis, 
  generateSavingsTips, 
  analyzeAnomalies, 
  generateSummary 
} from '@/lib/aiAssistant';
import { VampireAlert } from '@/lib/vampireDetection';
import { PredictionResult } from '@/lib/tariffCalculator';

interface AIAssistantCardProps {
  totalDailyKwh: number;
  peakHours: number[];
  vampireAlerts: VampireAlert[];
  prediction?: PredictionResult;
  monthlyHistory?: number[];
}

export function AIAssistantCard({
  totalDailyKwh,
  peakHours,
  vampireAlerts,
  prediction,
  monthlyHistory = [],
}: AIAssistantCardProps) {
  const [showAllTips, setShowAllTips] = useState(false);
  
  const tips = generateSavingsTips(totalDailyKwh, peakHours, vampireAlerts, prediction);
  const anomalies = analyzeAnomalies(vampireAlerts, prediction, monthlyHistory);
  const summary = generateSummary(totalDailyKwh, prediction, vampireAlerts);

  const displayedTips = showAllTips ? tips : tips.slice(0, 3);

  const getPriorityColor = (priority: SavingsTip['priority']) => {
    switch (priority) {
      case 'high': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'medium': return 'bg-accent/20 text-accent border-accent/30';
      case 'low': return 'bg-muted text-muted-foreground border-border/30';
    }
  };

  const getSeverityColor = (severity: AnomalyAnalysis['severity']) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'default';
      case 'info': return 'secondary';
    }
  };

  return (
    <Card className="glass-card border-primary/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          Asistente de Ahorro
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
          <p className="text-sm text-foreground">{summary}</p>
        </div>

        {/* Anomalies */}
        {anomalies.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <AlertCircle className="w-4 h-4 text-accent" />
              Anomalías Detectadas
            </div>
            {anomalies.map((anomaly, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border ${
                  anomaly.severity === 'critical'
                    ? 'bg-destructive/10 border-destructive/30'
                    : anomaly.severity === 'warning'
                    ? 'bg-accent/10 border-accent/30'
                    : 'bg-muted/50 border-border/30'
                }`}
              >
                <div className="flex items-start gap-2">
                  <Badge variant={getSeverityColor(anomaly.severity)} className="text-xs shrink-0">
                    {anomaly.severity === 'critical' ? 'Crítico' : anomaly.severity === 'warning' ? 'Alerta' : 'Info'}
                  </Badge>
                  <div>
                    <div className="text-sm font-medium text-foreground">{anomaly.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{anomaly.description}</div>
                    <div className="text-xs text-primary mt-2">💡 {anomaly.recommendation}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tips */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Lightbulb className="w-4 h-4 text-accent" />
            Consejos de Ahorro
          </div>
          
          {displayedTips.map(tip => (
            <div
              key={tip.id}
              className={`p-3 rounded-lg border ${getPriorityColor(tip.priority)}`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">{tip.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{tip.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{tip.description}</div>
                  <div className="text-xs text-success mt-2">
                    Ahorro potencial: {tip.potentialSavings}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {tips.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllTips(!showAllTips)}
              className="w-full text-xs"
            >
              {showAllTips ? (
                <>
                  <ChevronUp className="w-3 h-3 mr-1" />
                  Ver menos
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3 mr-1" />
                  Ver {tips.length - 3} consejos más
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
