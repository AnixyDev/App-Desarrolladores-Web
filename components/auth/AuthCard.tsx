// FIX: Add a triple-slash directive to explicitly include React types, resolving issues with JSX elements not being recognized by TypeScript.
/// <reference types="react" />

import React from 'react';
import { Link } from 'react-router-dom';

const AuthCard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-lg w-full flex flex-col">
            <div className="p-8">
                {children}
            </div>
            <div className="p-4 border-t border-gray-800 bg-gray-800/20 rounded-b-lg text-center mt-auto">
                <Link to="/privacy-policy" className="text-xs text-gray-500 hover:text-gray-300 hover:underline">
                    Política de Privacidad
                </Link>
            </div>
        </div>
    );
};
export default AuthCard;