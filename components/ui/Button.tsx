
import React from 'react';

type ButtonOwnProps<E extends React.ElementType = React.ElementType> = {
  as?: E;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
  className?: string;
}

type ButtonProps<E extends React.ElementType> = ButtonOwnProps<E> & Omit<React.ComponentProps<E>, keyof ButtonOwnProps>;

const defaultElement = 'button';

const Button = <E extends React.ElementType = typeof defaultElement>({
  children,
  as,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps<E>) => {
  const Tag: React.ElementType = as || defaultElement;

  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 transition-all duration-150';

  const variantStyles = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 border border-transparent focus:ring-primary-500 shadow-lg shadow-primary-900/20 hover:shadow-primary-900/40',
    secondary: 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 focus:ring-slate-500 hover:text-white shadow-sm',
    danger: 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/50 focus:ring-red-500',
    outline: 'bg-transparent text-slate-300 border border-slate-600 hover:bg-slate-800 hover:text-white focus:ring-slate-500',
    ghost: 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-800/50 focus:ring-slate-500',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  
  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  return (
    <Tag className={combinedClassName} {...props}>
        {children}
    </Tag>
  );
};

export default Button;
