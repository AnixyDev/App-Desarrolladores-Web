import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronDownIcon } from '../icons/Icon';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  wrapperClassName?: string;
  error?: string;
  options?: { value: string; label: string }[];
}

const Select: React.FC<SelectProps> = ({ 
  label, 
  id, 
  wrapperClassName = '', 
  error, 
  className = '', 
  children,
  options,
  ...props 
}) => {
  
  const baseSelectClasses = "block w-full rounded-lg border text-sm transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none";
  
  // Match Input.tsx style: Darker background ("carved out") with subtle border
  const styleClasses = "bg-slate-950/40 border-slate-800 text-slate-200 focus:border-primary/50 focus:ring-primary/20 hover:border-slate-700 px-3 py-2.5";
  
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
      <div className="relative group">
        <select
          id={id}
          className={cn(baseSelectClasses, styleClasses, errorClasses, className)}
          {...props}
        >
            {options 
                ? options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)
                : children
            }
        </select>
        {/* Custom Chevron to replace native arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500 group-hover:text-slate-400">
            <ChevronDownIcon className="w-4 h-4" />
        </div>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400 font-medium animate-fade-in-down">{error}</p>}
    </div>
  );
};

export default Select;