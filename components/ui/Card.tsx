import React from 'react';
import Button from './Button';
import { PlusIcon, Share2Icon } from '../icons/Icon';
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
      "group relative rounded-xl border border-white/[0.06] bg-[#0f172a]/60 backdrop-blur-xl transition-all duration-300 ease-out",
      "shadow-lg shadow-black/20", 
      hoverable && "hover:border-white/10 hover:bg-[#0f172a]/80 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40 cursor-pointer",
      className
    )}>
       {/* Noise Texture Overlay */}
      <div className="absolute inset-0 rounded-xl bg-noise opacity-[0.02] pointer-events-none z-0 mix-blend-overlay"></div>
      
      {/* Top Highlight for 3D effect */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-60"></div>

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  onShare?: () => void;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '', onShare }) => {
  return (
    <div className={cn("px-5 sm:px-6 py-5 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 min-h-[72px]", className)}>
      <div className="flex-1">
        {children}
      </div>
      {onShare && (
        <Button 
            variant="secondary" 
            size="sm" 
            onClick={onShare}
            className="flex items-center gap-2 shrink-0"
        >
            <Share2Icon className="w-4 h-4" />
            <span className="hidden sm:inline">Compartir</span>
        </Button>
      )}
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
    <div className={cn("relative px-5 sm:px-6 py-6", className)}>
       {onAddClick && (
        <div className="absolute top-5 right-5 sm:right-6 z-20">
            <Button 
                onClick={onAddClick} 
                variant="secondary"
                size="sm"
                className="flex items-center gap-1.5 shadow-lg"
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
    <div className={cn("px-5 sm:px-6 py-4 bg-black/20 border-t border-white/[0.06] flex flex-col sm:flex-row gap-4 rounded-b-xl items-center", className)}>
      {children}
    </div>
  );
};

export default Card;