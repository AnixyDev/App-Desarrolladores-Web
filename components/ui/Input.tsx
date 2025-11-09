import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  wrapperClassName?: string;
  icon?: React.ReactNode;
  error?: string;
};

const Input: React.FC<InputProps> = ({ label, id, wrapperClassName = '', icon, error, ...props }) => {
  const hasIcon = !!icon;
  const errorClasses = error 
    ? 'border-red-500 focus:border-red-500' 
    : 'border-transparent focus:border-fuchsia-500';

  return (
    <div className={wrapperClassName}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-400 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {hasIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={id}
          className={`block w-full px-3 py-2 border-2 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-0 sm:text-sm bg-[#2a2a50] text-white disabled:bg-slate-600 disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200 ${errorClasses} ${hasIcon ? 'pl-10' : ''}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
};

export default Input;