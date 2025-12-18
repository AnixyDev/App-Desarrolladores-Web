import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { SendIcon, SparklesIcon, UserIcon, AlertTriangleIcon, CreditCard, RefreshCwIcon } from '../components/icons/Icon';
import { getAIResponse, AI_CREDIT_COSTS } from '../services/geminiService';
import { useAppStore } from '../hooks/useAppStore';
import { GenerateContentResponse } from '@google/genai';
import { useToast } from '../hooks/useToast';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'ai';
}

const AIAssistantPage: React.FC = () => {
    const { addToast } = useToast();
    const navigate = useNavigate();
    const { profile, consumeCredits } = useAppStore();

    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: 'Hola. Soy tu **Consultor Senior de Estrategia**. \n\nAnalizaré tus datos de negocio para detectar fugas de dinero, optimizar tus tarifas y mejorar la relación con tus clientes. ¿Cuál es tu desafío más urgente hoy?', sender: 'ai' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedInput = input.trim();
        if (!trimmedInput || isLoading) return;

        // 1. VALIDACIÓN PREVENTIVA DE CRÉDITOS
        if (profile.ai_credits < AI_CREDIT_COSTS.chatMessage) {
            addToast('Saldo de créditos insuficiente. Por favor, recarga para continuar.', 'error');
            navigate('/billing');
            return;
        }

        const userMessage: Message = { id: Date.now(), text: trimmedInput, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = trimmedInput;
        setInput('');
        setIsLoading(true);

        // 2. OPTIMIZACIÓN DE CONTEXTO (Last 6 messages = 3 full turns)
        const chatHistory = messages
            .slice(-6)
            .map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));

        try {
            // 3. LLAMADA AL MOTOR DE IA
            const response: GenerateContentResponse = await getAIResponse(currentInput, chatHistory);
            const aiText = response.text || "Lo siento, mi motor estratégico ha tenido un problema. Por favor, intenta reformular tu pregunta.";

            // 4. DEDUCCIÓN ATÓMICA DE CRÉDITOS (Solo tras respuesta exitosa)
            const wasConsumed = await consumeCredits(AI_CREDIT_COSTS.chatMessage);
            
            if (wasConsumed) {
                setMessages(prev => [...prev, { id: Date.now() + 1, text: aiText, sender: 'ai' }]);
            } else {
                addToast('Hubo un problema al validar tus créditos. Contacta con soporte.', 'error');
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { id: Date.now(), text: "Error de conexión con el Consultor Senior. Verifica tu conexión e inténtalo de nuevo.", sender: 'ai' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto">
            <header className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-600/20 rounded-xl">
                        <SparklesIcon className="w-6 h-6 text-primary-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">CFO & Consultor IA</h1>
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">Estrategia Senior de Negocio</p>
                    </div>
                </div>
                
                <div className="bg-gray-900 border border-gray-800 px-4 py-2 rounded-2xl flex items-center gap-4 shadow-xl">
                    <div className="text-right border-r border-gray-800 pr-4">
                        <p className="text-[10px] uppercase font-black text-gray-500">Saldo IA</p>
                        <p className={`text-sm font-black ${profile.ai_credits > 0 ? 'text-primary-400' : 'text-red-400'}`}>
                            {profile.ai_credits} créditos
                        </p>
                    </div>
                    <button 
                        onClick={() => navigate('/billing')}
                        className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-primary-400"
                        title="Recargar créditos"
                    >
                        <CreditCard className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {profile.ai_credits <= 0 && (
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl mb-4 flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-3 text-red-300 text-sm">
                        <AlertTriangleIcon className="w-5 h-5 shrink-0" />
                        <p className="font-medium">Tu cuenta no tiene créditos activos para consultoría estratégica.</p>
                    </div>
                    <Button size="sm" onClick={() => navigate('/billing')} className="bg-red-600 hover:bg-red-700 border-none">Recargar ahora</Button>
                </div>
            )}

            <Card className="flex-1 flex flex-col overflow-hidden border-gray-800 shadow-2xl bg-gray-950/50 backdrop-blur-md relative">
                <CardContent className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar scroll-smooth">
                    {messages.map((message) => (
                        <div key={message.id} className={`flex items-start gap-4 ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg border ${
                                message.sender === 'user' ? 'bg-primary-600 border-primary-500' : 'bg-gray-800 border-gray-700'
                            }`}>
                                {message.sender === 'user' ? <UserIcon className="w-5 h-5 text-white" /> : <SparklesIcon className="w-5 h-5 text-primary-400" />}
                            </div>
                            
                            <div className={`max-w-[85%] p-5 rounded-2xl text-sm leading-relaxed shadow-sm transition-all duration-300 ${
                                message.sender === 'user' 
                                    ? 'bg-primary-600/10 text-white border border-primary-500/20 rounded-tr-none' 
                                    : 'bg-gray-900/80 text-gray-200 border border-gray-800 rounded-tl-none prose prose-invert prose-headings:text-white prose-p:text-gray-300 prose-strong:text-primary-400 prose-code:bg-black/50 prose-code:p-1 prose-code:rounded prose-code:text-primary-300'
                            }`}>
                                <p style={{ whiteSpace: 'pre-wrap' }}>{message.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-4">
                            <div className="shrink-0 w-10 h-10 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center animate-pulse">
                                <SparklesIcon className="w-5 h-5 text-gray-600" />
                            </div>
                            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl rounded-tl-none flex gap-2 items-center">
                                <RefreshCwIcon className="w-4 h-4 animate-spin text-primary-500" />
                                <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">El consultor está analizando tu negocio...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </CardContent>
                
                <div className="p-4 border-t border-gray-800 bg-gray-900/80">
                    <form onSubmit={handleSend} className="flex gap-4">
                        <div className="flex-1 relative group">
                            <input
                                placeholder={profile.ai_credits > 0 ? "Ej: ¿Cómo puedo subir mi tarifa por hora sin perder este cliente?" : "Debes recargar créditos para preguntar"}
                                className="w-full bg-gray-800 text-white rounded-2xl py-4 px-5 pr-20 border border-gray-700 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed group-hover:border-gray-600 shadow-inner"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isLoading || profile.ai_credits <= 0}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-950 rounded-lg border border-gray-700 text-[9px] font-black text-gray-500 uppercase tracking-tighter">
                                -1 Crédito
                            </div>
                        </div>
                        <Button 
                            type="submit" 
                            disabled={isLoading || !input.trim() || profile.ai_credits <= 0}
                            className="shrink-0 w-14 h-14 rounded-2xl p-0 shadow-2xl shadow-primary-500/20 active:scale-95 transition-transform"
                        >
                            <SendIcon className="w-6 h-6" />
                        </Button>
                    </form>
                    <div className="flex items-center justify-center gap-2 mt-4 text-[10px] text-gray-500 font-bold uppercase tracking-tight">
                        <SparklesIcon className="w-3 h-3 text-primary-500" />
                        <span>Motor de IA: Gemini 3.0 Pro con Razonamiento Estratégico</span>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AIAssistantPage;