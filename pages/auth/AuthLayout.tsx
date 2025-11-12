import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Logo } from '../../components/icons/Logo';

const AuthLayout: React.FC = () => {
    return (
        <div className="auth-background min-h-screen flex flex-col justify-center items-center p-4 relative text-white">
            <header className="flex justify-center mb-6">
                <Logo className="w-12 h-12" />
            </header>

            <main className="w-full max-w-md">
                <Outlet />
            </main>
            
            <div className="absolute bottom-6 text-center">
                 <Link to="/privacy-policy" className="text-sm text-gray-500 hover:text-white hover:underline">
                    Política de Privacidad
                </Link>
            </div>
        </div>
    );
};
export default AuthLayout;