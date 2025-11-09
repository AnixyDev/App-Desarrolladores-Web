import React from 'react';

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
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
  return <div className={`p-4 sm:p-5 ${className}`}>{children}</div>;
};


interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}
export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  return <div className={`p-4 sm:p-5 border-t border-slate-800 bg-slate-800/20 rounded-b-[calc(0.5rem-1px)] ${className}`}>{children}</div>;
};

export default Card;