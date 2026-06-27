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

    const userMsg: FtoChatMessage = { role: 'user', text: inputValue };
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
            contents: newMessages.map(m => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.text }]
            })),
            responseFormat: 'json'
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Error al conectar con la IA FTO');
      }

      const data = await response.json();
      let rawText = data.text.trim();
      if (rawText.startsWith('```')) {
        rawText = rawText.replace(/^```(json)?\n?/, '').replace(/```$/, '').trim();
      }
      const parsedData = JSON.parse(rawText);

      const assistantMsg: FtoChatMessage = {
        role: 'assistant',
        text: parsedData.responseMessage,
        isReadyToSearch: parsedData.isReadyToSearch,
        suggestedQuery: parsedData.suggestedQuery,
        riskLevel: parsedData.riskLevel
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Ocurrió un error al procesar tu solicitud. Por favor, intenta de nuevo.'
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
        >
          <Bot size={24} className="group-hover:animate-bounce" />
          <span className="hidden md:inline font-medium">Chat con LIA</span>
        </button>
      )}

      {/* Sidebar Chat */}
      <div 
        className={`fixed inset-y-0 right-0 w-full md:w-[450px] bg-slate-50 shadow-[-10px_0_30px_rgba(0,0,0,0.1)] transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="bg-[#0a2540] text-white p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Bot size={20} className="text-blue-300" />
            </div>
            <div>
              <h2 className="font-semibold text-lg leading-tight">Chat con LIA</h2>
              <p className="text-xs text-blue-200">Experta FTO y Patentabilidad</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-[#0a2540] text-white rounded-br-sm' 
                  : 'bg-white border border-slate-100 text-slate-800 rounded-bl-sm'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed text-sm">
                  {msg.text}
                </p>

                {msg.isReadyToSearch && msg.suggestedQuery && (
                  <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2 text-slate-600">
                      <Search size={16} />
                      <span className="text-xs font-semibold uppercase tracking-wider">Ecuación Propuesta</span>
                    </div>
                    <code className="block text-xs bg-slate-800 text-green-400 p-2 rounded mb-3 break-all">
                      {msg.suggestedQuery}
                    </code>
                    <button
                      onClick={() => onSearchRequest(msg.suggestedQuery!)}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium transition-colors"
                    >
                      <Search size={16} />
                      Ejecutar Búsqueda FTO
                    </button>
                  </div>
                )}

                {msg.riskLevel && (
                  <div className="mt-4 flex items-center gap-2 p-2 rounded-md bg-slate-50 border border-slate-100">
                    <span className="text-xs text-slate-500 font-medium">Semáforo de Riesgo FTO:</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${getRiskColor(msg.riskLevel)}`}>
                      {msg.riskLevel}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm p-4 shadow-sm flex items-center gap-3">
                <Loader2 className="animate-spin text-blue-500" size={20} />
                <span className="text-sm text-slate-500">LIA está analizando...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-slate-100">
          <div className="flex gap-2">
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
              className="flex-1 resize-none border border-slate-200 bg-white text-slate-900 placeholder-slate-400 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#0a2540]/20 text-sm"
              rows={2}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="p-3 bg-[#0a2540] text-white rounded-xl hover:bg-[#1a365d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end flex items-center justify-center"
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-center">
            Este análisis FTO es preliminar y no constituye opinión legal.
          </p>
        </div>
      </div>
      
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
