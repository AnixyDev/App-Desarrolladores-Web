

import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { GoogleOAuthProvider } from '@react-oauth/google';


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// ========================== ACCIÓN REQUERIDA PARA PRODUCCIÓN ==========================
// IMPORTANTE: El ID de cliente de abajo es un placeholder. Para desplegar tu aplicación
// en una URL pública (ej. devfreelancer.app, Vercel), DEBES crear un nuevo ID de Cliente de OAuth
// en la Google Cloud Console, autorizar tus URLs, y reemplazar el valor de abajo.
// Consola de Google Cloud: https://console.cloud.google.com/apis/credentials
const GOOGLE_CLIENT_ID: string = "457438236235-n2s8q6nvcjm32u0o3ut2lksd8po8gfqf.apps.googleusercontent.com";


const root = ReactDOM.createRoot(rootElement);

// A simple loading fallback for Suspense if needed by any lazy-loaded components in the future.
const LoadingFallback = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#030712', fontFamily: 'Inter, sans-serif' }}>
        <p style={{ color: '#f9fafb' }}>Loading application...</p>
    </div>
);

// A simple Error Boundary to catch rendering errors in the component tree.
type ErrorBoundaryProps = React.PropsWithChildren<{ fallback: React.ReactNode }>;
type ErrorBoundaryState = { hasError: boolean };

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    // FIX: Reverted to a constructor for state initialization to resolve issues where `this.props` was not being recognized.
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
        // Return a new state object to indicate an error has occurred.
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // You can log the error to an error reporting service here.
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // Render the fallback UI when an error is caught.
            return this.props.fallback;
        }

        // Normally, just render children.
        return this.props.children;
    }
}

const ErrorFallback = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#030712', fontFamily: 'Inter, sans-serif', padding: '1rem' }}>
        <div style={{ textAlign: 'center', color: '#f9fafb' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Oops! Something went wrong.</h2>
            <p style={{ color: '#d1d5db', marginTop: '0.5rem' }}>We're sorry for the inconvenience. Please try refreshing the page.</p>
        </div>
    </div>
);

// Componente contenedor que verifica si el ID de cliente de Google está configurado.
const AppContainer = () => {
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.startsWith("YOUR_GOOGLE_CLIENT_ID")) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#030712', fontFamily: 'Inter, sans-serif', padding: '1rem', color: '#f9fafb', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#f87171', marginBottom: '0.5rem' }}>Acción Requerida: Configurar Login con Google</h2>
                <p style={{ color: '#d1d5db', maxWidth: '650px', lineHeight: '1.6' }}>
                    Para activar el inicio de sesión con Google, necesitas configurar tu propio ID de cliente de OAuth 2.0.
                </p>
                <div style={{ backgroundColor: '#1f2937', padding: '1rem', borderRadius: '8px', marginTop: '1.5rem', maxWidth: '650px', textAlign: 'left', border: '1px solid #374151' }}>
                    <h3 style={{ fontWeight: '600', color: '#e5e7eb' }}>Pasos a seguir:</h3>
                    <ol style={{ listStyleType: 'decimal', paddingLeft: '1.5rem', marginTop: '0.75rem', color: '#d1d5db', fontSize: '0.9rem', lineHeight: '1.5' }}>
                        <li>Ve a la <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" style={{ color: '#c026d3', textDecoration: 'underline' }}>Consola de Google Cloud</a> y crea un "ID de cliente de OAuth 2.0".</li>
                        <li>En la configuración de tu cliente, añade las siguientes URLs a <strong>"Orígenes de JavaScript autorizados"</strong>:
                            <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', marginTop: '0.5rem' }}>
                                <li><code style={{ backgroundColor: '#374151', padding: '0.2rem 0.4rem', borderRadius: '4px', color: '#e5e7eb' }}>https://devfreelancer.app</code> (para producción)</li>
                                <li><code style={{ backgroundColor: '#374151', padding: '0.2rem 0.4rem', borderRadius: '4px', color: '#e5e7eb' }}>http://localhost:3000</code> (para desarrollo local)</li>
                                <li><code style={{ backgroundColor: '#374151', padding: '0.2rem 0.4rem', borderRadius: '4px', color: '#e5e7eb' }}>https://aistudio.google.com</code> (para desarrollo en AI Studio)</li>
                            </ul>
                        </li>
                         <li style={{ marginTop: '0.75rem' }}>Copia tu nuevo ID de cliente y pégalo en la variable <code style={{ backgroundColor: '#374151', padding: '0.2rem 0.4rem', borderRadius: '4px', color: '#e5e7eb' }}>GOOGLE_CLIENT_ID</code> del archivo <code style={{ backgroundColor: '#374151', padding: '0.2rem 0.4rem', borderRadius: '4px', color: '#e5e7eb' }}>index.tsx</code>.</li>
                    </ol>
                </div>
                 <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', backgroundColor: '#c026d3', color: 'white', textDecoration: 'none', borderRadius: '0.375rem', fontWeight: '600' }}
                >
                    Ir a la Consola de Google Cloud
                </a>
            </div>
        );
    }

    return (
        <>
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                <App />
            </GoogleOAuthProvider>
        </>
    );
};


root.render(
  <React.StrictMode>
    <ErrorBoundary fallback={<ErrorFallback />}>
        <Suspense fallback={<LoadingFallback />}>
           <AppContainer />
        </Suspense>
    </ErrorBoundary>
  </React.StrictMode>
);