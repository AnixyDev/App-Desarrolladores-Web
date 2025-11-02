
import React, { useState, useRef, useEffect } from 'react';
import Card, { CardContent, CardHeader } from '../components/ui/Card.tsx';
import Input from '../components/ui/Input.tsx';
import Button from '../components/ui/Button.tsx';
import { SendIcon, SparklesIcon, UserIcon } from '../components/icons/Icon.tsx';
import { getAIResponse } from '../services/geminiService.ts';
import { useAppStore } from '../hooks/useAppStore.tsx';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'ai';
}

const AIAssistantPage: React.FC = () => {
    const { profile } = useAppStore();
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: 'Hola, soy tu asistente de IA. ¿En qué puedo ayudarte hoy a gestionar tu negocio de freelance?', sender: 'ai' }
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
        if (input.trim() === '' || isLoading) return;

        const userMessage: Message = { id: Date.now(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // Format history for Gemini API
        const history = messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        try {
            const aiResponseText = await getAIResponse(input, history);
            const aiMessage: Message = { id: Date.now() + 1, text: aiResponseText, sender: 'ai' };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage: Message = { id: Date.now() + 1, text: 'Lo siento, no pude procesar tu solicitud.', sender: 'ai' };
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
                        <div key={message.id} className={`flex items-start gap-3 ${message.sender === 'user' ? 'justify-end' : ''}`}>
                            {message.sender === 'ai' && <div className="p-2 bg-purple-500 rounded-full"><SparklesIcon className="w-5 h-5 text-white"/></div>}
                            <div className={`max-w-xl p-3 rounded-lg ${message.sender === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-200'}`}>
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
                            placeholder="Pregúntame sobre tus proyectos, clientes, o pídeme que redacte un email..."
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