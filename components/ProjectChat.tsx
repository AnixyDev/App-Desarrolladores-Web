import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { useToast } from '../hooks/useToast';
import { SendIcon, SparklesIcon, UserIcon } from './icons/Icon';
import { ProjectMessage } from '../types';
import Input from './ui/Input';
import Button from './ui/Button';
import { summarizeChatHistory, AI_CREDIT_COSTS } from '../services/geminiService';
import BuyCreditsModal from './modals/BuyCreditsModal';

interface ProjectChatProps {
    projectId: string;
}

const ProjectChat: React.FC<ProjectChatProps> = ({ projectId }) => {
    const { profile, projectComments, addProjectComment, consumeCredits } = useAppStore();
    const { addToast } = useToast();
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isBuyCreditsModalOpen, setIsBuyCreditsModalOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const messages = useMemo(() => {
        return projectComments.filter(c => c.project_id === projectId);
    }, [projectComments, projectId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() === '' || !profile) return;

        setIsLoading(true);
        try {
            const messageData = {
                project_id: projectId,
                user_id: profile.id,
                user_name: profile.full_name,
                text: input,
            };

            const emailMessage = await addProjectComment(messageData);
            if (emailMessage) {
                addToast(emailMessage, 'info');
            }
            setInput('');
        } catch (error) {
            addToast(`Error al enviar mensaje: ${(error as Error).message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSummarize = async () => {
        if (!profile || profile.ai_credits < AI_CREDIT_COSTS.summarizeChat) {
            setIsBuyCreditsModalOpen(true);
            return;
        }
        setIsLoading(true);
        try {
            const chatHistory = messages.map(m => `${m.user_name}: ${m.text}`).join('\n');
            const summary = await summarizeChatHistory(chatHistory);
            const aiMessageData = {
                project_id: projectId,
                user_id: 'ai',
                user_name: 'Asistente IA',
                text: summary,
            };
            await addProjectComment(aiMessageData);
            consumeCredits(AI_CREDIT_COSTS.summarizeChat);
        } catch(e) {
            addToast((e as Error).message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[500px]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900 rounded-t-lg">
                {messages.map((message) => (
                    <div key={message.id} className={`flex items-start gap-3 ${message.user_id === profile?.id ? 'justify-end' : ''}`}>
                        {message.user_id !== profile?.id && <div className={`p-2 rounded-full ${message.user_id === 'ai' ? 'bg-purple-500' : 'bg-gray-600'}`}><SparklesIcon className="w-5 h-5 text-white"/></div>}
                        <div className={`max-w-xl p-3 rounded-lg ${message.user_id === profile?.id ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-200'}`}>
                            <p className="text-sm font-bold mb-1">{message.user_name}</p>
                            <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{message.text}</p>
                            <p className="text-xs text-right mt-1 opacity-60">{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        {message.user_id === profile?.id && <div className="p-2 bg-gray-700 rounded-full"><UserIcon className="w-5 h-5 text-white"/></div>}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-gray-700 bg-gray-900 rounded-b-lg">
                 <div className="flex justify-end mb-2">
                    <button onClick={handleSummarize} disabled={isLoading} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 disabled:opacity-50">
                        <SparklesIcon className="w-4 h-4" />
                        {isLoading ? 'Resumiendo...' : 'Resumir con IA'}
                    </button>
                </div>
                <form onSubmit={handleSend} className="flex gap-2">
                    <Input
                        wrapperClassName="flex-1"
                        placeholder="Escribe tu mensaje..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading}><SendIcon className="w-5 h-5" /></Button>
                </form>
            </div>
            <BuyCreditsModal isOpen={isBuyCreditsModalOpen} onClose={() => setIsBuyCreditsModalOpen(false)} />
        </div>
    );
};

export default ProjectChat;