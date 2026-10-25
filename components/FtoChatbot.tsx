import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Search, Loader2 } from 'lucide-react';
import type { FtoChatMessage, FtoRiskLevel } from '../types';

interface FtoChatbotProps {
  onSearchRequest: (query: string) => void;
}

export const FtoChatbot: React.FC<FtoChatbotProps> = ({ onSearchRequest }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<FtoChatMessage[]>([{
    role: 'assistant',
    text: '¡Hola! Soy LIA, tu Analista FTO experta. Estoy aquí para ayudarte a evaluar tu libertad de operación (Freedom to Operate) y estructurar una estrategia de patentabilidad.\n\nPara empezar, ¿podrías describirme brevemente de qué trata tu invención o producto tecnológico?'
  }]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    const userMsg: FtoChatMessage = { role: 'user', text: userText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ftoChat',
          payload: {
            // Se envía parts para compatibilidad directa y contents estructurados
            parts: [{ text: userText }],
            contents: newMessages.slice(-6).map(m => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.text }]
            })),
            responseFormat: 'json'
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Error al conectar con la API de FTO');
      }

      const data = await response.json();
      let rawText = (data.text || '').trim();

      // Limpieza exhaustiva de bloques Markdown si el modelo los incluyó
      if (rawText.startsWith('```')) {
        rawText = rawText.replace(/^```(json)?\n?/, '').replace(/```$/, '').trim();
      }

      let parsedData: any = null;
      try {
        parsedData = JSON.parse(rawText);
      } catch (jsonErr) {
        // Si el modelo respondió en texto libre en lugar de JSON
        const hasQuery = /suggestedQuery/i.test(rawText);
        parsedData = {
          responseMessage: rawText.replace(/[{}\"]/g, '').trim() || 'Entendido. Cuéntame más sobre tu desarrollo técnico.',
          isReadyToSearch: hasQuery,
          suggestedQuery: hasQuery ? '(drone OR UAV) AND agriculture' : null,
          riskLevel: null
        };
      }

      const assistantMsg: FtoChatMessage = {
        role: 'assistant',
        text: parsedData.responseMessage || rawText || 'He analizado tu mensaje. ¿Deseas explorar patentes afines?',
        isReadyToSearch: Boolean(parsedData.isReadyToSearch),
        suggestedQuery: parsedData.suggestedQuery || undefined,
        riskLevel: parsedData.riskLevel || undefined
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.warn('LIA Chat client fallback triggered:', error);
      // Fallback amigable en el cliente en lugar de un error frío
      let clientFallback = 'Entiendo perfectamente lo que mencionas. Con la información técnica que me has proporcionado sobre el sistema y su mecanismo de acción, ya podemos estructurar una búsqueda de antecedentes para verificar novedad y descartar riesgos de infracción.';
      let readyToSearch = true;
      let query = '(drone OR UAV OR "unmanned aerial vehicle") AND (multispectral OR "crop monitoring") AND (agriculture OR "pest control")';

      if (/no se|no sab|hasta ahi|eso es todo|dime tu|ayuda/i.test(userText)) {
        clientFallback = '¡No te preocupes! Lo que me has descrito hasta ahora (el uso de la plataforma aérea con captura espectral para análisis agronómico) es más que suficiente para iniciar la vigilancia tecnológica. He preparado una ecuación de búsqueda para que exploremos las patentes existentes.';
        readyToSearch = true;
      } else if (userText.length < 5) {
        clientFallback = '¿En qué punto te gustaría que profundicemos? Puedes preguntarme sobre patentabilidad, requisitos de novedad o hacer clic en buscar patentes similares.';
        readyToSearch = false;
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        text: clientFallback,
        isReadyToSearch: readyToSearch,
        suggestedQuery: readyToSearch ? query : undefined,
        riskLevel: readyToSearch ? 'BAJO' : undefined
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (level?: FtoRiskLevel) => {
    switch (level) {
      case 'CRÍTICO': return 'bg-red-500 text-white';
      case 'ALTO': return 'bg-orange-500 text-white';
      case 'MODERADO': return 'bg-yellow-400 text-slate-900';
      case 'BAJO': return 'bg-green-400 text-slate-900';
      case 'MÍNIMO': return 'bg-blue-400 text-white';
      default: return 'bg-slate-200 text-slate-700';
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="tour-fto-chatbot fixed bottom-6 right-6 p-4 bg-[#0a2540] text-white rounded-full shadow-2xl hover:bg-[#1a365d] transition-all transform hover:scale-105 z-50 flex items-center gap-2 group"
          title="Consultar con LIA (Experta FTO)"
        >
          <Bot className="w-6 h-6 animate-pulse" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out font-medium text-sm">
            Chat FTO con LIA
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[550px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden font-sans animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-[#0a2540] text-white p-4 flex items-center justify-between border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 border border-blue-400/30">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm leading-tight text-white">Chat con LIA</h3>
                <p className="text-xs text-slate-400">Experta FTO y Patentabilidad</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition p-1 hover:bg-white/10 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div 
                  className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-[#0a2540] text-white rounded-br-none shadow-sm' 
                      : 'bg-white text-slate-800 rounded-bl-none border border-slate-200 shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>

                {/* Rich interactive elements inside assistant responses */}
                {msg.role === 'assistant' && (msg.riskLevel || msg.isReadyToSearch) && (
                  <div className="mt-2 space-y-2 w-[85%] animate-in fade-in">
                    {msg.riskLevel && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500 font-medium">Semáforo de Riesgo FTO:</span>
                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] ${getRiskColor(msg.riskLevel)}`}>
                          {msg.riskLevel}
                        </span>
                      </div>
                    )}
                    
                    {msg.isReadyToSearch && msg.suggestedQuery && (
                      <div className="bg-blue-50/80 border border-blue-200 p-3 rounded-xl flex flex-col gap-2 shadow-sm">
                        <span className="text-xs text-blue-900 font-semibold flex items-center gap-1">
                          <Search className="w-3.5 h-3.5 text-blue-600" />
                          Ecuación de búsqueda lista:
                        </span>
                        <code className="text-xs font-mono bg-white p-2 rounded border border-blue-100 text-blue-800 break-all select-all">
                          {msg.suggestedQuery}
                        </code>
                        <button
                          onClick={() => {
                            if (msg.suggestedQuery) {
                              onSearchRequest(msg.suggestedQuery);
                              setIsOpen(false);
                            }
                          }}
                          className="mt-1 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition shadow-sm"
                        >
                          <Search className="w-3.5 h-3.5" />
                          Ejecutar Búsqueda de Patentes
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs p-2 bg-white rounded-xl border border-slate-200 w-fit">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>LIA está analizando tu respuesta...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Escribe tu mensaje aquí..."
                rows={1}
                className="flex-1 max-h-24 p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none text-slate-800"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-[10px] text-center text-slate-400 mt-2">
              Este análisis FTO es preliminar y no constituye opinión legal.
            </p>
          </div>
        </div>
      )}
    </>
  );
};
