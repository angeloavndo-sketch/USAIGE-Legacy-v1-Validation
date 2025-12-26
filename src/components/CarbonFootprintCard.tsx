import { Leaf, TreeDeciduous, Car, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateCarbonFootprint, formatCO2, CarbonData } from '@/lib/carbonFootprint';

interface CarbonFootprintCardProps {
  monthlyKwh: number;
}

export function CarbonFootprintCard({ monthlyKwh }: CarbonFootprintCardProps) {
  const carbon: CarbonData = calculateCarbonFootprint(monthlyKwh);

  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Leaf className="w-5 h-5 text-success" />
          Huella de Carbono
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-mono font-bold text-success mb-1">
          {formatCO2(carbon.co2EmittedKg)}
        </div>
        <div className="text-sm text-muted-foreground mb-4">
          CO₂ emitido por {monthlyKwh.toFixed(0)} kWh
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-2 bg-success/10 rounded-lg">
            <TreeDeciduous className="w-5 h-5 text-success" />
            <div>
              <div className="text-sm font-medium text-foreground">
                {carbon.treesEquivalent.toFixed(1)} árboles
              </div>
              <div className="text-xs text-muted-foreground">
                necesarios para absorber este CO₂ al año
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 bg-accent/10 rounded-lg">
            <Car className="w-5 h-5 text-accent" />
            <div>
              <div className="text-sm font-medium text-foreground">
                {carbon.carsEquivalent.toFixed(1)} meses
              </div>
              <div className="text-xs text-muted-foreground">
                de emisiones de un auto promedio
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 bg-primary/10 rounded-lg">
            <Lightbulb className="w-5 h-5 text-primary" />
            <div>
              <div className="text-sm font-medium text-foreground">
                {(carbon.lightBulbHours / 1000).toFixed(0)}k horas
              </div>
              <div className="text-xs text-muted-foreground">
                de un foco de 60W encendido
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
