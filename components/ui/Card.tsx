import React from 'react';
import Button from './Button';
import { PlusIcon } from '../icons/Icon';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`relative bg-slate-900 rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 p-px bg-gradient-to-r from-fuchsia-800/30 via-slate-800 to-purple-800/30 ${className}`}>
      <div className="relative bg-slate-900 rounded-[calc(0.5rem-1px)] h-full">
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
  return <div className={`p-4 sm:p-5 border-b border-slate-800 ${className}`}>{children}</div>;
};


interface CardContentProps {
  children: React.ReactNode;
  className?: string;
  onAddClick?: () => void;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '', onAddClick }) => {
  return (
    <div className={`relative p-4 sm:p-5 ${className}`}>
       {onAddClick && (
        <Button 
            onClick={onAddClick} 
            variant="secondary"
            size="sm"
            className="absolute top-4 right-4 !px-3 !py-1.5 flex items-center gap-1.5 z-10"
            aria-label="Añadir"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Añadir</span>
        </Button>
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
  return <div className={`p-4 sm:p-5 border-t border-slate-800 bg-slate-800/20 rounded-b-[calc(0.5rem-1px)] ${className}`}>{children}</div>;
};

export default Card;