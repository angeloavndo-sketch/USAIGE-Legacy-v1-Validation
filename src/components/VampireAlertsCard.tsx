import { useEffect, useState } from 'react';
import { AlertTriangle, Bell, BellOff, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VampireAlert, requestNotificationPermission, sendVampireNotification } from '@/lib/vampireDetection';

interface VampireAlertsCardProps {
  alerts: VampireAlert[];
  onDismiss?: (alertId: string) => void;
}

export function VampireAlertsCard({ alerts, onDismiss }: VampireAlertsCardProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Check current notification permission
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  useEffect(() => {
    // Send notifications for new high-severity alerts
    if (notificationsEnabled) {
      alerts
        .filter(alert => alert.severity === 'high' && !dismissedAlerts.has(alert.id))
        .forEach(alert => sendVampireNotification(alert));
    }
  }, [alerts, notificationsEnabled, dismissedAlerts]);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
  };

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
    onDismiss?.(alertId);
  };

  const activeAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id));
  const highCount = activeAlerts.filter(a => a.severity === 'high').length;
  const mediumCount = activeAlerts.filter(a => a.severity === 'medium').length;

  if (activeAlerts.length === 0) {
    return (
      <Card className="glass-card border-success/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-success">
            <AlertTriangle className="w-5 h-5" />
            Consumo Vampiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-success text-lg font-medium">✓ Sin alertas</div>
            <div className="text-sm text-muted-foreground">
              No se detectaron consumos anómalos
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`glass-card ${highCount > 0 ? 'border-destructive/50' : 'border-accent/50'}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2 text-accent">
            <AlertTriangle className="w-5 h-5" />
            Consumo Vampiro
            <Badge variant="destructive" className="ml-2">
              {activeAlerts.length}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEnableNotifications}
            className={notificationsEnabled ? 'text-success' : 'text-muted-foreground'}
          >
            {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-3">
          {highCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {highCount} críticas
            </Badge>
          )}
          {mediumCount > 0 && (
            <Badge className="bg-accent text-accent-foreground text-xs">
              {mediumCount} moderadas
            </Badge>
          )}
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {activeAlerts.slice(0, 5).map(alert => (
            <div
              key={alert.id}
              className={`flex items-start justify-between p-2 rounded-lg ${
                alert.severity === 'high'
                  ? 'bg-destructive/20 border border-destructive/30'
                  : alert.severity === 'medium'
                  ? 'bg-accent/20 border border-accent/30'
                  : 'bg-muted/50 border border-border/30'
              }`}
            >
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">
                  {alert.roomName}
                </div>
                <div className="text-xs text-muted-foreground">
                  {alert.buildingName} • {alert.day} {alert.hour}:00
                </div>
                <div className="text-xs text-accent mt-1">
                  {alert.actualConsumption.toFixed(2)} kWh detectados
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleDismiss(alert.id)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>

        {activeAlerts.length > 5 && (
          <div className="text-xs text-muted-foreground text-center mt-2">
            +{activeAlerts.length - 5} alertas más
          </div>
        )}
      </CardContent>
    </Card>
  );
}
