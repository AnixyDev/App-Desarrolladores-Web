import React from 'react';

const AuthCard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div 
          className="w-full p-8 rounded-3xl shadow-2xl shadow-fuchsia-heavy border-t-8 border-primary-500"
          style={{ backgroundColor: '#111111' }}
        >
          {children}
        </div>
    );
};
export default AuthCard;