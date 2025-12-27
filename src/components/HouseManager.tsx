import { useState } from 'react';
import { Home, Plus, Trash2, Save, RotateCcw, ChevronDown, ChevronUp, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { HouseData, Room, HouseElectricalObject, commonHouseObjects, generateId, calculateRoomDailyKwh, createDefaultHouseData } from '@/lib/houseTypes';
import { ScheduleEditor } from '@/components/ScheduleEditor';
import { useToast } from '@/hooks/use-toast';

interface HouseManagerProps {
  houseData: HouseData;
  onUpdate: (data: HouseData) => void;
}

export function HouseManager({ houseData, onUpdate }: HouseManagerProps) {
  const [expandedRooms, setExpandedRooms] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  const toggleRoom = (roomId: string) => {
    setExpandedRooms(prev =>
      prev.includes(roomId)
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    );
  };

  const handleSave = () => {
    onUpdate(houseData);
    setHasChanges(false);
    toast({
      title: "Datos Guardados",
      description: "Los datos de tu casa han sido guardados correctamente.",
    });
  };

  const handleReset = () => {
    const defaultData = createDefaultHouseData();
    onUpdate(defaultData);
    setHasChanges(false);
    toast({
      title: "Datos Reiniciados",
      description: "Se restauraron los datos por defecto.",
    });
  };

  const updateRoom = (roomId: string, updates: Partial<Room>) => {
    const newHouse = {
      ...houseData.house,
      rooms: houseData.house.rooms.map(room =>
        room.id === roomId ? { ...room, ...updates } : room
      ),
    };
    onUpdate({ house: newHouse });
    setHasChanges(true);
  };

  const addObject = (roomId: string) => {
    const room = houseData.house.rooms.find(r => r.id === roomId);
    if (!room) return;

    const newObject: HouseElectricalObject = {
      id: generateId(),
      name: 'Nuevo Dispositivo',
      watts: 100,
      quantity: 1,
      hoursPerDay: 4,
    };

    updateRoom(roomId, {
      objects: [...room.objects, newObject],
    });
  };

  const updateObject = (roomId: string, objectId: string, updates: Partial<HouseElectricalObject>) => {
    const room = houseData.house.rooms.find(r => r.id === roomId);
    if (!room) return;

    updateRoom(roomId, {
      objects: room.objects.map(obj =>
        obj.id === objectId ? { ...obj, ...updates } : obj
      ),
    });
  };

  const removeObject = (roomId: string, objectId: string) => {
    const room = houseData.house.rooms.find(r => r.id === roomId);
    if (!room) return;

    updateRoom(roomId, {
      objects: room.objects.filter(obj => obj.id !== objectId),
    });
  };

  const addRoom = () => {
    const newRoom: Room = {
      id: generateId(),
      name: `Habitación ${houseData.house.rooms.length + 1}`,
      objects: [],
      schedule: {
        monday: { enabled: true, startHour: 6, endHour: 23 },
        tuesday: { enabled: true, startHour: 6, endHour: 23 },
        wednesday: { enabled: true, startHour: 6, endHour: 23 },
        thursday: { enabled: true, startHour: 6, endHour: 23 },
        friday: { enabled: true, startHour: 6, endHour: 23 },
        saturday: { enabled: true, startHour: 8, endHour: 24 },
        sunday: { enabled: true, startHour: 8, endHour: 23 },
      },
    };

    onUpdate({
      house: {
        ...houseData.house,
        rooms: [...houseData.house.rooms, newRoom],
      },
    });
    setHasChanges(true);
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent/20 border border-accent/30">
            <Home className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Configuración de Casa</h2>
            <p className="text-sm text-muted-foreground">Gestiona habitaciones y dispositivos eléctricos</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reiniciar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!hasChanges} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Save className="w-4 h-4 mr-2" />
            Guardar
          </Button>
        </div>
      </div>

      {/* Add Room Button */}
      <Button variant="outline" className="w-full mb-4 border-dashed border-accent/50 hover:border-accent" onClick={addRoom}>
        <Plus className="w-4 h-4 mr-2" />
        Agregar Habitación
      </Button>

      {/* Rooms List */}
      <div className="space-y-3">
        {houseData.house.rooms.map(room => {
          const isExpanded = expandedRooms.includes(room.id);
          const roomKwh = calculateRoomDailyKwh(room);

          return (
            <Collapsible key={room.id} open={isExpanded}>
              <div className="rounded-xl border border-border/50 bg-secondary/20 overflow-hidden">
                <CollapsibleTrigger asChild>
                  <button
                    onClick={() => toggleRoom(room.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Home className="w-4 h-4 text-accent" />
                      <Input
                        value={room.name}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateRoom(room.id, { name: e.target.value });
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-40 h-8 bg-transparent border-none p-0 font-medium"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-lg font-mono font-semibold text-accent">
                          {roomKwh.toFixed(2)}
                        </span>
                        <span className="text-sm text-muted-foreground ml-1">kWh/día</span>
                      </div>
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                        {room.objects.length} dispositivos
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="p-4 pt-0 space-y-4">
                    {/* Schedule */}
                    <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                      <div className="flex items-center gap-2 mb-2 text-sm font-medium text-foreground">
                        <Clock className="w-4 h-4 text-accent" />
                        Horario de Uso
                      </div>
                      <ScheduleEditor
                        schedule={room.schedule}
                        onChange={(schedule) => updateRoom(room.id, { schedule })}
                      />
                    </div>

                    {/* Objects */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground flex items-center gap-2">
                          <Zap className="w-4 h-4 text-accent" />
                          Dispositivos Eléctricos
                        </span>
                        <Button size="sm" variant="outline" onClick={() => addObject(room.id)}>
                          <Plus className="w-3 h-3 mr-1" />
                          Agregar
                        </Button>
                      </div>

                      {room.objects.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No hay dispositivos. Agrega uno para comenzar.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {room.objects.map(obj => (
                            <div
                              key={obj.id}
                              className="flex items-center gap-2 p-3 rounded-lg bg-background/30 border border-border/30"
                            >
                              <Select
                                value={obj.name}
                                onValueChange={(value) => {
                                  const preset = commonHouseObjects.find(o => o.name === value);
                                  updateObject(room.id, obj.id, {
                                    name: value,
                                    watts: preset?.watts || obj.watts,
                                  });
                                }}
                              >
                                <SelectTrigger className="w-48 h-8 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {commonHouseObjects.map(o => (
                                    <SelectItem key={o.name} value={o.name}>
                                      {o.name} ({o.watts}W)
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  step="1"
                                  value={obj.watts}
                                  onChange={(e) => updateObject(room.id, obj.id, { watts: parseFloat(e.target.value) || 0 })}
                                  className="w-20 h-8 text-sm"
                                />
                                <span className="text-xs text-muted-foreground">W</span>
                              </div>

                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">×</span>
                                <Input
                                  type="number"
                                  value={obj.quantity}
                                  onChange={(e) => updateObject(room.id, obj.id, { quantity: parseInt(e.target.value) || 1 })}
                                  className="w-16 h-8 text-sm"
                                />
                              </div>

                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  step="0.5"
                                  value={obj.hoursPerDay}
                                  onChange={(e) => updateObject(room.id, obj.id, { hoursPerDay: parseFloat(e.target.value) || 0 })}
                                  className="w-16 h-8 text-sm"
                                />
                                <span className="text-xs text-muted-foreground">hrs</span>
                              </div>

                              <span className="text-sm font-mono text-accent ml-auto">
                                {((obj.watts * obj.quantity * obj.hoursPerDay) / 1000).toFixed(2)} kWh
                              </span>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => removeObject(room.id, obj.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>

      {hasChanges && (
        <div className="mt-4 p-3 bg-accent/10 border border-accent/30 rounded-lg">
          <p className="text-sm text-accent flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Tienes cambios sin guardar. Presiona "Guardar" para conservarlos.
          </p>
        </div>
      )}
    </div>
  );
}
