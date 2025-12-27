import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, MessageCircle, Zap, DollarSign, Leaf, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BuildingsData, calculateTotalDailyKwh } from '@/lib/buildingTypes';
import { HouseData, calculateHouseDailyKwh } from '@/lib/houseTypes';
import { VampireAlert } from '@/lib/vampireDetection';
import { PredictionResult } from '@/lib/tariffCalculator';
import { processQuestion, suggestedQuestions, ChatMessage, EnergyContext, generateSummary } from '@/lib/aiAssistant';

interface InteractiveAIChatProps {
  buildingsData: BuildingsData;
  houseData: HouseData;
  buildingVampireAlerts: VampireAlert[];
  houseVampireAlerts: VampireAlert[];
  buildingPrediction: PredictionResult;
  housePrediction: PredictionResult;
}

export function InteractiveAIChat({
  buildingsData,
  houseData,
  buildingVampireAlerts,
  houseVampireAlerts,
  buildingPrediction,
  housePrediction,
}: InteractiveAIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Calculate context
  const buildingsDailyKwh = calculateTotalDailyKwh(buildingsData.buildings);
  const houseDailyKwh = calculateHouseDailyKwh(houseData.house);
  const totalDailyKwh = buildingsDailyKwh + houseDailyKwh;
  const totalMonthlyKwh = totalDailyKwh * 30;

  const context: EnergyContext = {
    totalDailyKwh,
    monthlyKwh: totalMonthlyKwh,
    estimatedBill: buildingPrediction.currentMonth.total + housePrediction.currentMonth.total,
    peakHours: [10, 11, 12, 13, 14, 15], // Common peak hours
    vampireAlerts: [...buildingVampireAlerts, ...houseVampireAlerts],
    prediction: buildingPrediction,
    isDac: buildingPrediction.currentMonth.isDac || housePrediction.currentMonth.isDac,
    buildingCount: buildingsData.buildings.length,
    roomCount: houseData.house.rooms.length,
  };

  // Welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: `¡Hola! 👋 Soy tu asistente de energía con IA. 

${generateSummary(totalDailyKwh, buildingPrediction, context.vampireAlerts)}

**Puedo ayudarte con:**
• Calcular y predecir tu próximo recibo CFE
• Detectar consumos vampiro y anomalías
• Darte consejos personalizados de ahorro
• Explicar las tarifas y cómo reducir costos
• Analizar tu huella de carbono

¿En qué te puedo ayudar hoy?`,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));

    const response = processQuestion(text, context);
    
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  const handleSuggestedQuestion = (question: string) => {
    handleSend(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Chat Area */}
      <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden flex flex-col h-[700px]">
        {/* Chat Header */}
        <div className="p-4 border-b border-border/30 bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 blur-lg rounded-full" />
              <div className="relative p-2.5 rounded-xl bg-primary/20 border border-primary/30">
                <Bot className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Asistente de Energía IA</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                En línea • Contexto RAG activo
              </p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    max-w-[85%] rounded-2xl p-4 
                    ${message.role === 'user' 
                      ? 'bg-primary/20 border border-primary/30 text-foreground' 
                      : 'bg-secondary/50 border border-border/30 text-foreground'
                    }
                  `}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/20">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium text-primary">Asistente IA</span>
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-wrap leading-relaxed prose prose-invert prose-sm max-w-none">
                    {message.content.split('\n').map((line, i) => {
                      // Handle bold text
                      const parts = line.split(/(\*\*[^*]+\*\*)/g);
                      return (
                        <p key={i} className="my-1">
                          {parts.map((part, j) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={j} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
                            }
                            return <span key={j}>{part}</span>;
                          })}
                        </p>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {message.timestamp.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-secondary/50 border border-border/30 rounded-2xl p-4 max-w-[85%]">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-muted-foreground">Escribiendo...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-border/30 bg-secondary/20">
          <div className="flex gap-3">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu pregunta aquí..."
              className="flex-1 bg-background/50 border-border/50 focus:border-primary"
              disabled={isTyping}
            />
            <Button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isTyping}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar with Quick Actions */}
      <div className="space-y-4">
        {/* Suggested Questions */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" />
            Preguntas Sugeridas
          </h3>
          <div className="space-y-2">
            {suggestedQuestions.map((q) => (
              <button
                key={q.id}
                onClick={() => handleSuggestedQuestion(q.text)}
                disabled={isTyping}
                className="w-full text-left p-3 rounded-xl bg-secondary/30 border border-border/30 hover:bg-secondary/50 hover:border-primary/30 transition-all duration-200 group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{q.icon}</span>
                  <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                    {q.text}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-success" />
            Resumen Rápido
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-success/10 border border-success/20">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-success" />
                <span className="text-sm text-muted-foreground">Consumo Diario</span>
              </div>
              <span className="text-sm font-mono font-semibold text-success">
                {totalDailyKwh.toFixed(2)} kWh
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-accent/10 border border-accent/20">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-accent" />
                <span className="text-sm text-muted-foreground">Recibo Estimado</span>
              </div>
              <span className="text-sm font-mono font-semibold text-accent">
                ${context.estimatedBill.toFixed(0)} MXN
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">CO₂ Mensual</span>
              </div>
              <span className="text-sm font-mono font-semibold text-primary">
                {(totalMonthlyKwh * 0.527).toFixed(0)} kg
              </span>
            </div>

            {context.vampireAlerts.length > 0 && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="text-sm text-muted-foreground">Alertas Vampiro</span>
                </div>
                <span className="text-sm font-mono font-semibold text-destructive">
                  {context.vampireAlerts.length}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* AI Status */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Estado del Contexto
          </h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Edificios monitoreados</span>
              <span className="font-mono text-foreground">{buildingsData.buildings.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Habitaciones casa</span>
              <span className="font-mono text-foreground">{houseData.house.rooms.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Tarifa CFE</span>
              <span className="font-mono text-foreground">{context.isDac ? 'DAC' : 'Normal'}</span>
            </div>
            <div className="flex justify-between">
              <span>Última actualización</span>
              <span className="font-mono text-foreground">Ahora</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
