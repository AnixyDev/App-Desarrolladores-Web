import React from 'react';
import { cn } from '../../lib/utils';

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
  ...props 
}) => {
  
  const baseClasses = "block w-full rounded-lg border text-sm transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50";
  
  // Match Input.tsx style: Darker background ("carved out") with subtle border
  const styleClasses = "bg-slate-950/40 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-primary/50 focus:ring-primary/20 hover:border-slate-700 px-3 py-2.5";
  
  const errorClasses = error 
    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
    : '';

  return (
    <div className={wrapperClassName}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={cn(baseClasses, styleClasses, errorClasses, className)}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-400 font-medium animate-fade-in-down">{error}</p>}
    </div>
  );
};

export default Textarea;