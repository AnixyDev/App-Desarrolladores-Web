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
    <div className={`bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 ${className}`}>
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  return <div className={`px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}>{children}</div>;
};


interface CardContentProps {
  children: React.ReactNode;
  className?: string;
  onAddClick?: () => void;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '', onAddClick }) => {
  return (
    <div className={`relative px-6 py-5 ${className}`}>
       {onAddClick && (
        <div className="absolute top-4 right-6 z-10">
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
  return <div className={`px-6 py-4 bg-slate-900/50 border-t border-slate-800 ${className}`}>{children}</div>;
};

export default Card;