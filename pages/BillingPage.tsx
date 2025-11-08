// pages/BillingPage.tsx
import React, { useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { CheckCircleIcon, SparklesIcon, CreditCard, Users, RefreshCwIcon, LinkIcon } from '../components/icons/Icon';
import { redirectToCheckout, StripeItemKey, STRIPE_ITEMS } from '../services/stripeService';
import { useToast } from '../hooks/useToast';

const BillingPage: React.FC = () => {
    const { profile, updateStripeConnection } = useAppStore();
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [isConnectingStripe, setIsConnectingStripe] = useState(false);

    const handlePurchase = async (itemKey: StripeItemKey) => {
        setIsLoading(itemKey);
        try {
            await redirectToCheckout(itemKey);
        } catch (error) {
            addToast((error as Error).message, 'error');
            setIsLoading(null);
        }
    };

    const handleStripeConnect = async () => {
        setIsConnectingStripe(true);
        addToast('Redirigiendo a Stripe para la conexión de tu cuenta...', 'info');
        // Simulación de una llamada a un backend para crear una cuenta de Stripe Connect
        setTimeout(() => {
            const simulatedAccountId = `acct_${Date.now()}`;
            // Simulación de la redirección a la URL de onboarding de Stripe.
            // En una app real, esta URL vendría de tu backend.
            console.log("Simulating redirect to Stripe Onboarding...");
            
            // Simulación del regreso del usuario a la app y actualización del estado.
            setTimeout(() => {
                updateStripeConnection(simulatedAccountId, true);
                addToast('¡Tu cuenta de Stripe ha sido conectada con éxito!', 'success');
                setIsConnectingStripe(false);
            }, 2000); // Simula el tiempo que el usuario pasa en la página de Stripe
        }, 1500);
    };

    const isPro = profile.plan === 'Pro';
    const isTeams = profile.plan === 'Teams';

    const PlanCard: React.FC<{
        plan: 'Pro' | 'Teams';
        title: string;
        price: string;
        features: string[];
        isCurrent: boolean;
        itemKey: 'proPlan' | 'teamsPlan';
        icon: React.ElementType;
    }> = ({ plan, title, price, features, isCurrent, itemKey, icon: Icon }) => (
        <Card className={`flex flex-col ${isCurrent ? 'border-primary-500' : ''}`}>
            <CardHeader className="text-center">
                <Icon className="w-8 h-8 mx-auto text-primary-400 mb-2" />
                <h3 className="text-xl font-bold text-white">{title}</h3>
                <p className="text-3xl font-extrabold text-white mt-2">{price}<span className="text-base font-normal text-gray-400">/mes</span></p>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
                {features.map((feature, i) => (
                    <p key={i} className="flex items-start gap-2"><CheckCircleIcon className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />{feature}</p>
                ))}
            </CardContent>
            <CardFooter>
                {isCurrent ? (
                    <Button className="w-full" disabled>Plan Actual</Button>
                ) : (
                    <Button className="w-full" onClick={() => handlePurchase(itemKey)} disabled={!!isLoading}>
                        {isLoading === itemKey ? 'Procesando...' : 'Actualizar Plan'}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-white">Facturación y Planes</h1>
                <p className="text-gray-400 mt-2">Tu plan actual es: <span className="font-semibold text-primary-400">{profile.plan}</span></p>
            </div>

            <Card>
                <CardHeader>
                    <h2 className="text-xl font-semibold text-white">Métodos de Pago y Cobro</h2>
                </CardHeader>
                <CardContent>
                    <div className="p-4 bg-gray-800/50 rounded-lg flex flex-col sm:flex-row justify-between items-center">
                        <div>
                             <h3 className="font-semibold text-white">Recibe pagos con Stripe</h3>
                             <p className="text-sm text-gray-400">Conecta tu cuenta de Stripe para que tus clientes puedan pagarte con tarjeta de crédito directamente desde sus facturas.</p>
                        </div>
                        {profile.stripe_onboarding_complete ? (
                             <div className="text-center mt-4 sm:mt-0">
                                <p className="flex items-center gap-2 text-green-400 font-semibold"><CheckCircleIcon/> Conectado</p>
                                <Button variant="secondary" size="sm" className="mt-2">Gestionar cuenta</Button>
                             </div>
                        ) : (
                            <Button onClick={handleStripeConnect} disabled={isConnectingStripe} className="mt-4 sm:mt-0">
                                {isConnectingStripe ? <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" /> : <LinkIcon className="w-4 h-4 mr-2" />}
                                {isConnectingStripe ? 'Conectando...' : 'Conectar con Stripe'}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <PlanCard
                    plan="Pro"
                    title="Plan Pro"
                    price={STRIPE_ITEMS.proPlan.price}
                    features={[
                        "Facturas y clientes ilimitados",
                        "Perfil público de freelancer",
                        "Acceso al Marketplace de Proyectos",
                        "Aplicar a ofertas con IA",
                        "Alertas de nuevos trabajos"
                    ]}
                    isCurrent={isPro}
                    itemKey="proPlan"
                    icon={CreditCard}
                />
                <PlanCard
                    plan="Teams"
                    title="Plan Teams"
                    price={STRIPE_ITEMS.teamsPlan.price}
                    features={[
                        "Todas las funciones del Plan Pro",
                        "Invita a miembros a tu equipo",
                        "Gestión de roles y permisos",
                        "Base de Conocimiento colaborativa",
                        "Integraciones y Webhooks"
                    ]}
                    isCurrent={isTeams}
                    itemKey="teamsPlan"
                    icon={Users}
                />
            </div>

            <Card>
                <CardHeader>
                     <h2 className="text-xl font-semibold text-white flex items-center gap-2"><SparklesIcon className="text-purple-400" /> Créditos de IA</h2>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-gray-400">Tus créditos de IA se usan para funciones avanzadas como la generación de propuestas, resúmenes de candidatos y análisis financieros. Tu saldo actual es: <span className="font-bold text-white">{profile.ai_credits}</span>.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-gray-800/50 rounded-lg flex flex-col justify-between">
                            <div>
                                <p className="font-semibold text-white">Paquete de 100 Créditos</p>
                                <p className="text-2xl font-bold text-white">{STRIPE_ITEMS.aiCredits100.price}</p>
                            </div>
                            <Button className="mt-4 w-full" onClick={() => handlePurchase('aiCredits100')} disabled={!!isLoading}>{isLoading === 'aiCredits100' ? '...' : 'Comprar'}</Button>
                        </div>
                        <div className="p-4 bg-gray-800/50 rounded-lg flex flex-col justify-between">
                            <div>
                                <p className="font-semibold text-white">Paquete de 500 Créditos</p>
                                <p className="text-2xl font-bold text-white">{STRIPE_ITEMS.aiCredits500.price}</p>
                            </div>
                            <Button className="mt-4 w-full" onClick={() => handlePurchase('aiCredits500')} disabled={!!isLoading}>{isLoading === 'aiCredits500' ? '...' : 'Comprar'}</Button>
                        </div>
                        <div className="p-4 bg-gray-800/50 rounded-lg flex flex-col justify-between">
                            <div>
                                <p className="font-semibold text-white">Paquete de 1000 Créditos</p>
                                <p className="text-2xl font-bold text-white">{STRIPE_ITEMS.aiCredits1000.price}</p>
                            </div>
                            <Button className="mt-4 w-full" onClick={() => handlePurchase('aiCredits1000')} disabled={!!isLoading}>{isLoading === 'aiCredits1000' ? '...' : 'Comprar'}</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default BillingPage;