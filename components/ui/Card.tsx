import React from 'react';
import Button from './Button';
import { PlusIcon } from '../icons/Icon';
import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  hoverable?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', noPadding = false, hoverable = false }) => {
  return (
    <div className={cn(
      "group relative rounded-xl border border-white/[0.08] bg-[#0f172a]/70 backdrop-blur-md transition-all duration-300",
      hoverable && "hover:border-primary/40 hover:shadow-[0_0_30px_-10px_rgba(217,70,239,0.2)] hover:-translate-y-[2px] cursor-pointer",
      className
    )}>
       {/* Noise Texture Overlay - Very Subtle (Reduced Opacity) */}
      <div className="absolute inset-0 rounded-xl bg-noise opacity-[0.03] pointer-events-none z-0"></div>
      
      {/* Inner Glow Top Highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50"></div>

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  return (
    <div className={cn("px-6 py-5 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", className)}>
      {children}
    </div>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
  onAddClick?: () => void;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '', onAddClick }) => {
  return (
    <div className={cn("relative px-6 py-6", className)}>
       {onAddClick && (
        <div className="absolute top-5 right-6 z-20">
            <Button 
                onClick={onAddClick} 
                variant="secondary"
                size="sm"
                className="flex items-center gap-1.5"
                aria-label="Añadir"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Añadir</span>
            </Button>
        </div>
      )}
      {children}
    </div>
  );
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  return (
    <div className={cn("px-6 py-4 bg-white/[0.02] border-t border-white/[0.06] flex flex-col sm:flex-row gap-4 rounded-b-xl", className)}>
      {children}
    </div>
  );
};

export default Card;