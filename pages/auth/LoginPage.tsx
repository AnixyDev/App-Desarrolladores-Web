import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthCard from '../../components/auth/AuthCard';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAppStore } from '../../hooks/useAppStore';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { GoogleJwtPayload } from '../../types';
import { AlertTriangleIcon } from '../../components/icons/Icon';
import { jwtDecode, validateEmail } from '../../lib/utils';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const login = useAppStore(state => state.login);
    const loginWithGoogle = useAppStore(state => state.loginWithGoogle);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [showGoogleConfigError, setShowGoogleConfigError] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setEmailError('');

        if (!validateEmail(email)) {
            setEmailError('Por favor, introduce un correo electrónico válido.');
            return;
        }

        const success = login(email, password);
        if (success) {
            navigate('/');
        } else {
            setError('Email o contraseña incorrectos. Por favor, inténtalo de nuevo.');
        }
    };

    const handleGoogleSuccess = (credentialResponse: CredentialResponse) => {
        setShowGoogleConfigError(false);
        if (credentialResponse.credential) {
            const decoded: GoogleJwtPayload | null = jwtDecode(credentialResponse.credential);
            if (decoded) {
                loginWithGoogle(decoded);
                navigate('/');
            } else {
                setError('No se pudo verificar la información de Google.');
            }
        }
    };

    const handleGoogleError = () => {
        setError('');
        setShowGoogleConfigError(true);
        console.error('Login Failed');
    };

    return (
        <AuthCard>
            <h2 className="text-2xl font-bold text-center text-white mb-6">Iniciar Sesión</h2>
            
            {showGoogleConfigError && (
                 <div className="bg-red-900/50 border border-red-500/50 text-red-300 p-4 rounded-lg mb-6 text-sm">
                    <div className="flex items-start">
                        <AlertTriangleIcon className="w-5 h-5 mr-3 shrink-0" />
                        <div>
                            <h3 className="font-bold mb-1">Error de Configuración de Google Login</h3>
                            <p className="mb-2">El inicio de sesión falló. La causa más común es una configuración incorrecta en Google Cloud:</p>
                             <ul className="list-disc list-inside space-y-1 my-2">
                                <li>El <b>ID de Cliente de Google</b> que usa la app es un valor de ejemplo y <b className="text-white">DEBE SER REEMPLAZADO</b> por uno real.</li>
                                <li>El <b>origen</b> de esta aplicación no está autorizado en tu configuración.</li>
                            </ul>
                            <p className="font-semibold">Solución (para error `origin_mismatch`):</p>
                            <ol className="list-decimal list-inside space-y-1 mt-1">
                                <li>Copia la URL de origen: <br/><code className="bg-gray-800 text-white p-1 rounded text-xs select-all">{window.location.origin}</code></li>
                                <li>Añádela a "Orígenes de JavaScript autorizados" en la configuración de tu cliente OAuth.</li>
                            </ol>
                            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="inline-block mt-3 px-3 py-1 bg-red-600 text-white font-semibold rounded hover:bg-red-700">
                                Ir a Google Cloud Console
                            </a>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <Input 
                    label="Email" 
                    type="email" 
                    placeholder="tu@email.com" 
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError('');
                    }}
                    required
                    error={emailError}
                />
                <Input 
                    label="Contraseña" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                <Button type="submit" className="w-full">Entrar</Button>
            </form>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-900 text-gray-500">O continúa con</span>
                </div>
            </div>

            <div className='flex justify-center'>
                 <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="filled_black"
                    text="continue_with"
                    shape="pill"
                />
            </div>

            <p className="mt-6 text-center text-sm text-gray-400">
                ¿No tienes cuenta?{' '}
                <Link to="/auth/register" className="font-medium text-primary-400 hover:text-primary-300">
                    Regístrate
                </Link>
            </p>
        </AuthCard>
    );
};

export default LoginPage;