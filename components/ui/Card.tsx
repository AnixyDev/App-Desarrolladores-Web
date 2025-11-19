
import React from 'react';
import Button from './Button';
import { PlusIcon } from '../icons/Icon';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', noPadding = false }) => {
  return (
    <div className={`
      relative group
      bg-slate-900/40 
      backdrop-blur-xl 
      border border-white/5 
      rounded-2xl 
      shadow-xl shadow-black/20 
      ring-1 ring-white/5
      overflow-hidden 
      transition-all duration-300
      ${className}
    `}>
      {/* Subtle Inner Glow */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"></div>
      
      {/* Optional: Hover Glow Effect */}
      <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

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
    <div className={`px-6 py-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}>
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
    <div className={`relative px-6 py-6 ${className}`}>
       {onAddClick && (
        <div className="absolute top-5 right-6 z-10">
            <Button 
                onClick={onAddClick} 
                variant="secondary"
                size="sm"
                className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border-white/5"
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
    <div className={`px-6 py-4 bg-black/20 border-t border-white/5 flex flex-col sm:flex-row gap-4 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
