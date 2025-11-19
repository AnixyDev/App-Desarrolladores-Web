import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  wrapperClassName?: string;
  icon?: React.ReactNode;
  error?: string;
};

const Input: React.FC<InputProps> = ({ label, id, wrapperClassName = '', icon, error, className = '', ...props }) => {
  const hasIcon = !!icon;
  
  // Use slate-800 for background to match cards and other UI elements better than specific hex
  const baseInputClasses = "block w-full border rounded-lg shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 sm:text-sm bg-slate-900/50 text-white disabled:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200";
  
  const stateClasses = error 
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
    : 'border-slate-700 focus:border-primary-500 focus:ring-primary-500/20 hover:border-slate-600';

  const paddingClasses = hasIcon ? 'pl-10 pr-3 py-2' : 'px-3 py-2';

  return (
    <div className={wrapperClassName}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {hasIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
        <input
          id={id}
          className={`${baseInputClasses} ${stateClasses} ${paddingClasses} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-400 animate-fade-in-down">{error}</p>}
    </div>
  );
};

export default Input;