
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
      "glass-card relative rounded-xl overflow-hidden",
      hoverable && "hover:-translate-y-1 hover:shadow-glow cursor-pointer",
      className
    )}>
      {/* Inner Shine Effect */}
      <div className="absolute inset-0 rounded-xl pointer-events-none shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"></div>
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
    <div className={cn("px-6 py-5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", className)}>
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
        <div className="absolute top-5 right-6 z-10">
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
    <div className={cn("px-6 py-4 bg-muted/30 border-t border-border flex flex-col sm:flex-row gap-4", className)}>
      {children}
    </div>
  );
};

export default Card;
