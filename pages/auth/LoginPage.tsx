import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import AuthCard from '../../components/auth/AuthCard';
import AuthInput from '../../components/auth/AuthInput';
import { useAppStore } from '../../hooks/useAppStore';
import { useToast } from '../../hooks/useToast';
import { MailIcon, Github, RefreshCwIcon, Lock } from '../../components/icons/Icon';
import { GoogleIcon } from '../../components/icons/GoogleIcon';


const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, loginWithGoogle, loginWithGithub } = useAppStore();
    const { addToast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const from = (location.state as any)?.from?.pathname || '/';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login(email, password);
            addToast('Inicio de sesión correcto. ¡Bienvenido de nuevo!', 'success');
            navigate(from, { replace: true });
        } catch (err) {
            setError((err as Error).message || 'Credenciales incorrectas.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSocialSignIn = async (provider: 'google' | 'github') => {
        setIsLoading(true);
        setError('');
        try {
            if (provider === 'google') {
                await loginWithGoogle();
            } else if (provider === 'github') {
                await loginWithGithub();
            }
            // La redirección ocurrirá aquí, por lo que el código siguiente puede no ejecutarse.
        } catch (err) {
            console.error('Social Sign-In Error:', err);
            const errorMessage = (err as Error).message || 'No se pudo iniciar la sesión social. Revisa la consola o la configuración.';
            setError(errorMessage);
            setIsLoading(false);
        }
    };

    return (
        <AuthCard>
            <h1 className="text-3xl font-bold text-center mb-2 text-white">Iniciar Sesión</h1>
            <p className="text-center text-sm mb-8 text-gray-400">Bienvenido de nuevo a DevFreelancer</p>
            
            <form onSubmit={handleSubmit}>
                <AuthInput
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Correo Electrónico"
                  icon={MailIcon}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <AuthInput
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Contraseña"
                  icon={Lock}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                {error && <p className="text-sm text-red-500 text-center mb-4">{error}</p>}
                
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-4 py-3 font-semibold rounded-full shadow-lg transition-all duration-200 flex items-center justify-center bg-primary-500 text-black disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    {isLoading ? <RefreshCwIcon className="w-5 h-5 animate-spin" /> : 'Iniciar Sesión'}
                </button>
            </form>
            
            <div className="flex items-center my-6">
                <hr className="flex-grow border-t border-gray-700" />
                <span className="px-4 text-xs text-gray-500">O continúa con</span>
                <hr className="flex-grow border-t border-gray-700" />
            </div>

            <div className="flex justify-center gap-4">
                <button
                    onClick={() => handleSocialSignIn('google')}
                    disabled={isLoading}
                    className="p-3 bg-white rounded-full border border-white transition-colors duration-200"
                    title="Iniciar sesión con Google"
                >
                    <GoogleIcon />
                </button>
                <button
                    onClick={() => handleSocialSignIn('github')}
                    disabled={isLoading}
                    className="p-3 bg-white rounded-full border border-white transition-colors duration-200"
                    title="Iniciar sesión con GitHub"
                >
                    <Github className="w-5 h-5 text-black" />
                </button>
            </div>
            
            <p className="text-center text-sm mt-8 text-gray-500">
                ¿No tienes cuenta?
                <Link to="/auth/register" className="font-semibold ml-1 text-primary-500 transition-colors hover:underline">
                    Regístrate
                </Link>
            </p>
        </AuthCard>
    );
};

export default LoginPage;