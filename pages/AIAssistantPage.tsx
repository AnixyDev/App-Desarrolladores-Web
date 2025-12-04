import React, { useState, useRef, useEffect } from 'react';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
// FIX: Remove .tsx extensions from imports to fix module resolution errors.
import { SendIcon, SparklesIcon, UserIcon } from '../components/icons/Icon';
import { getAIResponse } from '../services/geminiService';
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
    const store = useAppStore();

    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: 'Hola, soy tu asistente de IA. ¿En qué puedo ayudarte hoy? Puedes pedirme que cree una factura o añada un gasto.', sender: 'ai' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    // --- Function Calling Definitions ---
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
                    projectName: { type: Type.STRING, description: "Opcional. El nombre exacto de un proyecto existente asociado a ese cliente." },
                    items: {
                        type: Type.ARRAY,
                        description: "Una lista de los conceptos de la factura.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                description: { type: Type.STRING },
                                quantity: { type: Type.NUMBER },
                                amount: { type: Type.NUMBER, description: "El precio en euros para este concepto." },
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

        const userMessage: Message = { id: Date.now(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        const history = messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        try {
            let response: GenerateContentResponse = await getAIResponse(currentInput, history, tools);
            
            while(response.functionCalls && response.functionCalls.length > 0) {
                const functionCalls = response.functionCalls;
                setMessages(prev => [...prev, { id: Date.now() + 1, text: `Ejecutando acción: ${functionCalls[0].name}...`, sender: 'system' }]);
                
                const functionResponses = [];

                for (const call of functionCalls) {
                    let functionResult: any;
                    switch (call.name) {
                        case 'addExpense':
                            // FIX: Cast call.args to any to avoid TS error: left-hand side of arithmetic operation must be of type 'any', 'number', etc.
                            const { description, amount, category } = call.args as any;
                            store.addExpense({
                                description,
                                amount_cents: Math.round(amount * 100),
                                category,
                                date: new Date().toISOString().split('T')[0],
                                project_id: null,
                                tax_percent: 21,
                            });
                            functionResult = { success: true, message: `Gasto de ${amount}€ para '${description}' añadido.` };
                            addToast(functionResult.message, 'success');
                            break;
                        
                        case 'createInvoice':
                            // FIX: Cast call.args to any to avoid TS error: Property 'map' does not exist on type 'unknown'.
                            const { clientName, projectName, items } = call.args as any;
                            const client = store.getClientByName(clientName);
                            const project = projectName ? store.getProjectByName(projectName) : null;

                            if (!client) {
                                functionResult = { success: false, message: `No se encontró al cliente "${clientName}".` };
                            } else if (projectName && !project) {
                                functionResult = { success: false, message: `No se encontró el proyecto "${projectName}".` };
                            } else {
                                const invoiceItems = items.map((item: any) => ({
                                    description: item.description,
                                    quantity: item.quantity,
                                    price_cents: Math.round(item.amount * 100),
                                }));
                                store.addInvoice({
                                    client_id: client.id,
                                    project_id: project ? project.id : null,
                                    items: invoiceItems,
                                    issue_date: new Date().toISOString().split('T')[0],
                                    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                                    tax_percent: 21,
                                });
                                functionResult = { success: true, message: `Factura creada para ${clientName}.` };
                                addToast(functionResult.message, 'success');
                            }
                            break;

                        default:
                            functionResult = { success: false, message: `Función desconocida: ${call.name}` };
                    }
                    functionResponses.push({
                        functionResponse: { name: call.name, response: { content: JSON.stringify(functionResult) } }
                    });
                }
                
                 response = await getAIResponse(currentInput, [
                    ...history,
                    { role: 'model', parts: [{ functionCall: functionCalls[0] }]},
                    ...functionResponses.map(fr => ({ role: 'user', parts: [fr] }))
                ], tools);
            }

            const aiMessage: Message = { id: Date.now() + 2, text: response.text || '', sender: 'ai' };
            setMessages(prev => [...prev, aiMessage]);

        } catch (error) {
            const errorMessage: Message = { id: Date.now() + 1, text: `Lo siento, no pude procesar tu solicitud. ${(error as Error).message}`, sender: 'ai' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full max-h-[calc(100vh-120px)]">
            <h1 className="text-2xl font-semibold text-white mb-6">Asistente IA</h1>
            <Card className="flex-1 flex flex-col">
                <CardHeader>
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-purple-400" /> Chat con tu Asistente
                    </h2>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                        <div key={message.id} className={`flex items-start gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {message.sender === 'ai' && <div className="p-2 bg-purple-500 rounded-full"><SparklesIcon className="w-5 h-5 text-white"/></div>}
                            
                            <div className={`max-w-xl p-3 rounded-lg ${
                                message.sender === 'user' ? 'bg-primary-600 text-white' : 
                                message.sender === 'ai' ? 'bg-gray-800 text-gray-200' :
                                'bg-gray-700/50 text-gray-400 italic'}`}>
                                <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{message.text}</p>
                            </div>

                             {message.sender === 'user' && <div className="p-2 bg-gray-700 rounded-full"><UserIcon className="w-5 h-5 text-white"/></div>}
                        </div>
                    ))}
                     {isLoading && (
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-purple-500 rounded-full"><SparklesIcon className="w-5 h-5 text-white"/></div>
                            <div className="max-w-xl p-3 rounded-lg bg-gray-800 text-gray-400 text-sm">
                                Pensando...
                            </div>
                        </div>
                     )}
                    <div ref={messagesEndRef} />
                </CardContent>
                <div className="p-4 border-t border-gray-800">
                    <form onSubmit={handleSend} className="flex gap-2">
                        <Input
                            wrapperClassName="flex-1"
                            placeholder="Ej: añade un gasto de 15€ para 'dominio web' en la categoría 'Software'"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading}
                        />
                        <Button type="submit" disabled={isLoading}>
                            <SendIcon className="w-5 h-5" />
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    );
};

export default AIAssistantPage;