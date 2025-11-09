

import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import AuthCard from '../../components/auth/AuthCard';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAppStore } from '../../hooks/useAppStore';
import { useToast } from '../../hooks/useToast';
import { MailIcon, RefreshCwIcon } from '../../components/icons/Icon';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, loginWithGoogle } = useAppStore();
    const { addToast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const from = location.state?.from?.pathname || '/';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await login(email, password);
            addToast('Inicio de sesión correcto. ¡Bienvenido de nuevo!', 'success');
            navigate(from, { replace: true });
        } catch (error) {
            addToast((error as Error).message || 'Credenciales incorrectas.', 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGoogleLogin = async () => {
        try {
            await loginWithGoogle();
        } catch (error) {
            addToast((error as Error).message, 'error');
        }
    };

    return (
        <AuthCard>
            <h2 className="text-2xl font-bold text-center text-white mb-6">Iniciar Sesión</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                    id="email"
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<MailIcon className="w-4 h-4 text-gray-400" />}
                    required
                    disabled={isLoading}
                />
                <Input
                    id="password"
                    label="Contraseña"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />}
                    {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
            </form>
             <div className="mt-6 text-center">
                <p className="text-sm text-gray-400">
                    ¿No tienes una cuenta?{' '}
                    <Link to="/auth/register" className="font-medium text-primary-400 hover:underline">
                        Regístrate aquí
                    </Link>
                </p>
            </div>
        </AuthCard>
    );
};

export default LoginPage;