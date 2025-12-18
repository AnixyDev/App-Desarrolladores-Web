import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { SendIcon, SparklesIcon, UserIcon, AlertTriangleIcon, CreditCard } from '../components/icons/Icon';
import { getAIResponse, AI_CREDIT_COSTS } from '../services/geminiService';
import { useAppStore } from '../hooks/useAppStore';
import { FunctionDeclaration, Type, GenerateContentResponse } from '@google/genai';
import { useToast } from '../hooks/useToast';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'ai' | 'system';
}

const AIAssistantPage: React.FC = () => {
    const { addToast } = useToast();
    const navigate = useNavigate();
    const store = useAppStore();
    const { profile, consumeCredits } = store;

    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: 'Hola. Soy tu Consultor Senior. Tengo acceso a tus datos de negocio para ayudarte a optimizar tus facturas, gastos y proyectos. ¿En qué desafío trabajamos hoy?', sender: 'ai' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const tools: FunctionDeclaration[] = [
        {
            name: 'addExpense',
            description: 'Añade un nuevo gasto a la contabilidad del usuario.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    description: { type: Type.STRING, description: 'La descripción del gasto.' },
                    amount: { type: Type.NUMBER, description: 'El importe del gasto en euros.' },
                    category: { type: Type.STRING, description: 'La categoría del gasto (ej. Software, Marketing).' },
                },
                required: ['description', 'amount', 'category'],
            },
        },
        {
            name: 'createInvoice',
            description: 'Crea una nueva factura para un cliente.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    clientName: { type: Type.STRING, description: "El nombre exacto de un cliente existente." },
                    items: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                description: { type: Type.STRING },
                                quantity: { type: Type.NUMBER },
                                amount: { type: Type.NUMBER },
                            },
                            required: ["description", "quantity", "amount"],
                        }
                    }
                },
                required: ['clientName', 'items'],
            },
        }
    ];

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() === '' || isLoading) return;

        // 1. VALIDACIÓN DE CRÉDITOS
        if (profile.ai_credits < AI_CREDIT_COSTS.chatMessage) {
            addToast('No tienes créditos suficientes.', 'error');
            return;
        }

        const userMessage: Message = { id: Date.now(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        // 2. MANEJO DE CONTEXTO (Últimos 6 mensajes = 3 turnos para ahorrar tokens)
        const chatHistory = messages
            .filter(m => m.sender !== 'system')
            .slice(-6)
            .map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));

        try {
            let response: GenerateContentResponse = await getAIResponse(currentInput, chatHistory, tools);
            
            // 3. PROCESAMIENTO DE LLAMADAS A FUNCIONES (IA AGENT)
            while(response.functionCalls && response.functionCalls.length > 0) {
                const functionCalls = response.functionCalls;
                const functionResponses = [];

                for (const call of functionCalls) {
                    let functionResult: any;
                    if (call.name === 'addExpense') {
                        const { description, amount, category } = call.args as any;
                        store.addExpense({
                            description,
                            amount_cents: Math.round(amount * 100),
                            category,
                            date: new Date().toISOString().split('T')[0],
                            project_id: null,
                            tax_percent: 21,
                        });
                        functionResult = { success: true, msg: "Gasto registrado." };
                    } else if (call.name === 'createInvoice') {
                        const { clientName, items } = call.args as any;
                        const client = store.getClientByName(clientName);
                        if (client) {
                            store.addInvoice({
                                client_id: client.id,
                                items: items.map((i: any) => ({ description: i.description, quantity: i.quantity, price_cents: Math.round(i.amount * 100) })),
                                issue_date: new Date().toISOString().split('T')[0],
                                due_date: new Date(Date.now() + 2592000000).toISOString().split('T')[0],
                                tax_percent: 21,
                            });
                            functionResult = { success: true, msg: "Factura generada." };
                        } else {
                            functionResult = { success: false, msg: "Cliente no encontrado." };
                        }
                    }

                    functionResponses.push({
                        functionResponse: { name: call.name, response: { content: JSON.stringify(functionResult) } }
                    });
                }
                
                response = await getAIResponse(currentInput, [
                    ...chatHistory,
                    { role: 'model', parts: [{ functionCall: functionCalls[0] }]},
                    ...functionResponses.map(fr => ({ role: 'user', parts: [fr] }))
                ], tools);
            }

            // 4. RESPUESTA EXITOSA Y DEDUCCIÓN DE CRÉDITO
            if (response.text) {
                setMessages(prev => [...prev, { id: Date.now() + 2, text: response.text || '', sender: 'ai' }]);
                consumeCredits(AI_CREDIT_COSTS.chatMessage);
            }

        } catch (error) {
            setMessages(prev => [...prev, { id: Date.now(), text: `Error: ${(error as Error).message}`, sender: 'ai' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-primary-400" /> Asistente de Estrategia IA
                    </h1>
                    <p className="text-sm text-gray-400">Consultoría Senior personalizada para tu negocio.</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 px-4 py-2 rounded-xl flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Créditos IA</p>
                        <p className={`text-sm font-black ${profile.ai_credits > 5 ? 'text-primary-400' : 'text-red-400'}`}>
                            {profile.ai_credits} disponibles
                        </p>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => navigate('/billing')} className="p-2">
                        <CreditCard className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {profile.ai_credits <= 0 && (
                <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-xl mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-red-200 text-sm">
                        <AlertTriangleIcon className="w-5 h-5" />
                        <span>Has agotado tus créditos. Recarga para continuar la consultoría.</span>
                    </div>
                    <Button size="sm" onClick={() => navigate('/billing')}>Recargar ahora</Button>
                </div>
            )}

            <Card className="flex-1 flex flex-col overflow-hidden border-gray-800 shadow-2xl bg-gray-950/50 backdrop-blur-sm">
                <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {messages.map((message) => (
                        <div key={message.id} className={`flex items-start gap-4 ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-lg ${
                                message.sender === 'user' ? 'bg-primary-600' : 'bg-gray-800 border border-gray-700'
                            }`}>
                                {message.sender === 'user' ? <UserIcon className="w-5 h-5 text-white" /> : <SparklesIcon className="w-5 h-5 text-primary-400" />}
                            </div>
                            
                            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                message.sender === 'user' 
                                    ? 'bg-primary-600/10 text-white border border-primary-500/20 rounded-tr-none' 
                                    : 'bg-gray-900 text-gray-200 border border-gray-800 rounded-tl-none prose prose-invert prose-headings:text-white prose-p:text-gray-300 prose-strong:text-primary-400'
                            }`}>
                                <p style={{ whiteSpace: 'pre-wrap' }}>{message.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-4 animate-pulse">
                            <div className="shrink-0 w-9 h-9 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center">
                                <SparklesIcon className="w-5 h-5 text-gray-500" />
                            </div>
                            <div className="h-10 w-32 bg-gray-900 border border-gray-800 rounded-2xl rounded-tl-none"></div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </CardContent>
                
                <div className="p-4 border-t border-gray-800 bg-gray-900/50">
                    <form onSubmit={handleSend} className="flex gap-3">
                        <div className="flex-1 relative">
                            <input
                                placeholder={profile.ai_credits > 0 ? "Haz una pregunta estratégica..." : "Recarga créditos para preguntar"}
                                className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 pr-12 border border-gray-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isLoading || profile.ai_credits <= 0}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-500 bg-gray-900 px-1.5 py-0.5 rounded border border-gray-700">
                                1 CRÉDITO
                            </div>
                        </div>
                        <Button 
                            type="submit" 
                            disabled={isLoading || !input.trim() || profile.ai_credits <= 0}
                            className="shrink-0 w-12 h-12 rounded-xl p-0 shadow-lg shadow-primary-500/20"
                        >
                            <SendIcon className="w-5 h-5" />
                        </Button>
                    </form>
                    <p className="text-[10px] text-gray-500 text-center mt-3 uppercase tracking-tighter font-medium">
                        La IA puede cometer errores. Verifica siempre la información financiera crítica.
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default AIAssistantPage;