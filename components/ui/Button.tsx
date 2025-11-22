import React from 'react';
import { cn } from '../../lib/utils';

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

  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

  const variantStyles = {
    // Primary: Vibrant Gradient with Glow
    primary: 'bg-gradient-to-r from-fuchsia-600 via-purple-600 to-purple-700 text-white hover:brightness-110 shadow-[0_0_20px_-5px_rgba(192,38,211,0.4)] hover:shadow-[0_0_25px_-5px_rgba(192,38,211,0.6)] border border-white/10',
    
    // Secondary: Glassy, subtle but interactive
    secondary: 'bg-white/[0.03] text-slate-200 hover:bg-white/[0.08] hover:text-white border border-white/[0.1] shadow-sm',
    
    // Danger: Red tint
    danger: 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 transition-colors',
    
    outline: 'bg-transparent text-foreground border border-white/20 hover:bg-white/5 hover:border-white/40',
    ghost: 'hover:bg-white/5 text-slate-400 hover:text-white',
  };

  const sizeStyles = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 py-2 text-sm',
    lg: 'h-12 px-8 text-base',
  };
  
  return (
    <Tag className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)} {...props}>
        {children}
    </Tag>
  );
};

export default Button;