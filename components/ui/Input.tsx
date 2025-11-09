import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  wrapperClassName?: string;
  icon?: React.ReactNode;
  error?: string;
};

const Input: React.FC<InputProps> = ({ label, id, wrapperClassName = '', icon, error, ...props }) => {
  const hasIcon = !!icon;
  const errorClasses = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-primary-500 focus:border-primary-500';

  return (
    <div className={wrapperClassName}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1">
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
          className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-slate-500 focus:outline-none sm:text-sm bg-slate-800 text-white disabled:bg-slate-700 disabled:opacity-70 disabled:cursor-not-allowed ${errorClasses} ${hasIcon ? 'pl-10' : ''}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
};

export default Input;