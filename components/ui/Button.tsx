
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

  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';

  const variantStyles = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40 border border-transparent',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border hover:border-primary/30',
    danger: 'bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/50',
    outline: 'bg-transparent text-foreground border border-input hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground text-muted-foreground',
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
