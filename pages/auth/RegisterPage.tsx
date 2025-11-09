

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthCard from '../../components/auth/AuthCard';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAppStore } from '../../hooks/useAppStore';
import { useToast } from '../../hooks/useToast';
import { MailIcon, RefreshCwIcon, UserIcon } from '../../components/icons/Icon';

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const { register } = useAppStore();
    const { addToast } = useToast();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await register(name, email, password);
            addToast('Registro completado. ¡Bienvenido!', 'success');
            navigate('/');
        } catch (error) {
            addToast((error as Error).message || 'Error en el registro.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthCard>
            <h2 className="text-2xl font-bold text-center text-white mb-6">Crear Cuenta</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                    id="name"
                    label="Nombre Completo"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    icon={<UserIcon className="w-4 h-4 text-gray-400" />}
                    required
                    disabled={isLoading}
                />
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
                    placeholder="Mínimo 6 caracteres"
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />}
                    {isLoading ? 'Creando cuenta...' : 'Registrarse'}
                </Button>
            </form>
             <div className="mt-6 text-center">
                <p className="text-sm text-gray-400">
                    ¿Ya tienes una cuenta?{' '}
                    <Link to="/auth/login" className="font-medium text-primary-400 hover:underline">
                        Inicia sesión
                    </Link>
                </p>
            </div>
        </AuthCard>
    );
};

export default RegisterPage;