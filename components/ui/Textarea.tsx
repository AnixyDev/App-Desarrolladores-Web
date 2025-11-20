import React, { useState, useRef } from 'react';
import { cn } from '../../lib/utils';
import { SparklesIcon, RefreshCwIcon } from '../icons/Icon';
import { improveText, AI_CREDIT_COSTS } from '../../services/geminiService';
import { useAppStore } from '../../hooks/useAppStore';
import { useToast } from '../../hooks/useToast';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  wrapperClassName?: string;
  error?: string;
}

const Textarea: React.FC<TextareaProps> = ({ 
  label, 
  id, 
  wrapperClassName = '', 
  error, 
  className = '', 
  value,
  onChange,
  ...props 
}) => {
  const { profile, consumeCredits } = useAppStore();
  const { addToast } = useToast();
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const baseClasses = "block w-full rounded-lg border text-sm transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50";
  
  const styleClasses = "bg-slate-950/40 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-primary/50 focus:ring-primary/20 hover:border-slate-700 px-3 py-2.5";
  
  const errorClasses = error 
    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
    : '';

  // Handle AI Actions
  const handleAiAction = async (action: 'fix_grammar' | 'professional' | 'shorten' | 'expand') => {
    if (!value || typeof value !== 'string' || value.trim().length < 10) {
        addToast("Escribe algo más de texto para que la IA pueda trabajar.", "info");
        return;
    }

    if (!profile || profile.ai_credits < AI_CREDIT_COSTS.improveText) {
        addToast("No tienes suficientes créditos de IA.", "error");
        return;
    }

    setIsLoading(true);
    setIsAiMenuOpen(false);

    try {
        const improvedText = await improveText(value, action);
        
        // Simulate event to update parent state
        if (onChange) {
            const event = {
                target: { value: improvedText, name: props.name || id }
            } as React.ChangeEvent<HTMLTextAreaElement>;
            onChange(event);
        }

        await consumeCredits(AI_CREDIT_COSTS.improveText);
        addToast("Texto mejorado con IA.", "success");
    } catch (err) {
        addToast("Hubo un error al procesar el texto.", "error");
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className={cn("relative group/textarea", wrapperClassName)} ref={containerRef}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
            <div className="flex justify-between items-center">
                <span>{label}</span>
                {/* AI Button visible on label hover or focus */}
                {!isLoading && (
                   <button 
                        type="button"
                        onClick={() => setIsAiMenuOpen(!isAiMenuOpen)}
                        className="flex items-center text-[10px] text-purple-400 hover:text-purple-300 transition-colors opacity-0 group-focus-within/textarea:opacity-100 group-hover/textarea:opacity-100"
                    >
                        <SparklesIcon className="w-3 h-3 mr-1" /> Mejorar con IA
                   </button>
                )}
            </div>
        </label>
      )}
      
      <div className="relative">
        <textarea
            id={id}
            value={value}
            onChange={onChange}
            className={cn(baseClasses, styleClasses, errorClasses, className)}
            disabled={isLoading || props.disabled}
            {...props}
        />
        {isLoading && (
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
                <RefreshCwIcon className="w-6 h-6 text-purple-400 animate-spin" />
            </div>
        )}
        
        {/* AI Popup Menu */}
        {isAiMenuOpen && (
            <div className="absolute top-2 right-2 z-20 w-48 bg-slate-900 border border-purple-500/30 shadow-xl rounded-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="p-2 bg-purple-500/10 border-b border-purple-500/20 text-xs font-semibold text-purple-300 flex justify-between items-center">
                    <span>Asistente de Escritura</span>
                    <button onClick={() => setIsAiMenuOpen(false)} className="hover:text-white">×</button>
                </div>
                <div className="p-1">
                    <button type="button" onClick={() => handleAiAction('fix_grammar')} className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-purple-500/20 hover:text-white rounded-md transition-colors">
                        Corregir Gramática
                    </button>
                    <button type="button" onClick={() => handleAiAction('professional')} className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-purple-500/20 hover:text-white rounded-md transition-colors">
                        Tono Profesional
                    </button>
                    <button type="button" onClick={() => handleAiAction('shorten')} className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-purple-500/20 hover:text-white rounded-md transition-colors">
                        Resumir / Acortar
                    </button>
                    <button type="button" onClick={() => handleAiAction('expand')} className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-purple-500/20 hover:text-white rounded-md transition-colors">
                        Expandir Texto
                    </button>
                </div>
            </div>
        )}
      </div>
      
      {error && <p className="mt-1.5 text-xs text-red-400 font-medium animate-fade-in-down">{error}</p>}
    </div>
  );
};

export default Textarea;
