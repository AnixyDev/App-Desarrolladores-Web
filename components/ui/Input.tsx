import React from 'react';
import { cn } from '../../lib/utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  wrapperClassName?: string;
  icon?: React.ReactNode;
  error?: string;
};

const Input: React.FC<InputProps> = ({ label, id, wrapperClassName = '', icon, error, className = '', ...props }) => {
  const hasIcon = !!icon;
  
  const baseInputClasses = "block w-full rounded-lg border text-sm transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-inner";
  
  // Style: "Carved out" look with very dark background (slate-950) and subtle borders
  const styleClasses = "bg-slate-950/50 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-primary/50 focus:ring-primary/20 hover:border-slate-700 focus:bg-slate-900/80";
  
  const errorClasses = error 
    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
    : '';

  const paddingClasses = hasIcon ? 'pl-10 pr-3 py-2.5' : 'px-3 py-2.5';

  return (
    <div className={wrapperClassName}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5 ml-0.5">
          {label}
        </label>
      )}
      <div className="relative group">
        {hasIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary-400 transition-colors">
            {icon}
          </div>
        )}
        <input
          id={id}
          className={cn(baseInputClasses, styleClasses, errorClasses, paddingClasses, className)}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400 font-medium animate-fade-in">{error}</p>}
    </div>
  );
};

export default Input;