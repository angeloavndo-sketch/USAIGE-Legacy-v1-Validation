import { useState } from 'react';
import { DollarSign, TrendingUp, AlertTriangle, Calculator, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  TariffConfig, 
  defaultTariffConfig, 
  predictNextMonth, 
  formatMXN, 
  PredictionResult 
} from '@/lib/tariffCalculator';

interface TariffCalculatorProps {
  monthlyKwh: number;
  historyKwh?: number[];
}

export function TariffCalculator({ monthlyKwh, historyKwh = [] }: TariffCalculatorProps) {
  const [config, setConfig] = useState<TariffConfig>(defaultTariffConfig);
  const [configOpen, setConfigOpen] = useState(false);

  const prediction: PredictionResult = predictNextMonth(monthlyKwh, historyKwh, config);

  const handleBlockPriceChange = (index: number, price: number) => {
    setConfig(prev => ({
      ...prev,
      blocks: prev.blocks.map((block, i) => 
        i === index ? { ...block, pricePerKwh: price } : block
      ),
    }));
  };

  return (
    <div className="space-y-4">
      {/* Current Month Bill */}
      <Card className="glass-card border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Recibo Actual
            </div>
            <Dialog open={configOpen} onOpenChange={setConfigOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configurar Tarifas CFE</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  {config.blocks.map((block, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Label className="w-40 text-xs">{block.name}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={block.pricePerKwh}
                        onChange={(e) => handleBlockPriceChange(index, parseFloat(e.target.value) || 0)}
                        className="w-24 h-8 text-sm"
                      />
                      <span className="text-xs text-muted-foreground">MXN/kWh</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-3">
                    <Label className="w-40 text-xs">Tarifa DAC</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={config.dacPrice}
                      onChange={(e) => setConfig(prev => ({ ...prev, dacPrice: parseFloat(e.target.value) || 0 }))}
                      className="w-24 h-8 text-sm"
                    />
                    <span className="text-xs text-muted-foreground">MXN/kWh</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Label className="w-40 text-xs">Cargos Fijos</Label>
                    <Input
                      type="number"
                      step="1"
                      value={config.fixedCharges}
                      onChange={(e) => setConfig(prev => ({ ...prev, fixedCharges: parseFloat(e.target.value) || 0 }))}
                      className="w-24 h-8 text-sm"
                    />
                    <span className="text-xs text-muted-foreground">MXN</span>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-mono font-bold text-primary mb-2">
            {formatMXN(prediction.currentMonth.total)}
          </div>
          <div className="text-sm text-muted-foreground">
            {prediction.currentMonth.consumptionKwh.toFixed(0)} kWh este mes
          </div>
          
          {prediction.currentMonth.isDac && (
            <div className="mt-3 p-2 bg-destructive/20 border border-destructive/30 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-xs text-destructive">Tarifa DAC activa - Alto consumo</span>
            </div>
          )}

          {/* Block breakdown */}
          <div className="mt-4 space-y-2">
            <div className="text-xs text-muted-foreground font-medium">Desglose:</div>
            {prediction.currentMonth.blockBreakdown.map((item, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{item.block} ({item.kwh.toFixed(0)} kWh)</span>
                <span className="text-foreground">{formatMXN(item.subtotal)}</span>
              </div>
            ))}
            <div className="flex justify-between text-xs border-t border-border/30 pt-2">
              <span className="text-muted-foreground">Cargos fijos</span>
              <span className="text-foreground">{formatMXN(prediction.currentMonth.fixedCharges)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">IVA (16%)</span>
              <span className="text-foreground">{formatMXN(prediction.currentMonth.iva)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prediction */}
      <Card className="glass-card border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            Predicción Próximo Mes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-mono font-bold text-accent mb-2">
            {formatMXN(prediction.nextMonthEstimate.total)}
          </div>
          <div className="text-sm text-muted-foreground mb-3">
            ~{prediction.nextMonthEstimate.consumptionKwh.toFixed(0)} kWh estimados
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <span className={`px-2 py-0.5 rounded text-xs ${
              prediction.trend === 'increasing' 
                ? 'bg-destructive/20 text-destructive' 
                : prediction.trend === 'decreasing'
                ? 'bg-success/20 text-success'
                : 'bg-muted text-muted-foreground'
            }`}>
              {prediction.trend === 'increasing' ? '↑' : prediction.trend === 'decreasing' ? '↓' : '→'}
              {prediction.trend === 'increasing' ? 'Aumentando' : prediction.trend === 'decreasing' ? 'Disminuyendo' : 'Estable'}
              {prediction.trendPercentage > 0 && ` ${prediction.trendPercentage.toFixed(0)}%`}
            </span>
          </div>

          {/* Max estimate */}
          <div className="mt-4 p-3 bg-accent/10 border border-accent/30 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-accent mb-1">
              <Calculator className="w-3 h-3" />
              Estimación máxima
            </div>
            <div className="text-lg font-mono font-semibold text-accent">
              {formatMXN(prediction.maxEstimate.total)}
            </div>
            <div className="text-xs text-muted-foreground">
              ~{prediction.maxEstimate.consumptionKwh.toFixed(0)} kWh (peor caso)
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
