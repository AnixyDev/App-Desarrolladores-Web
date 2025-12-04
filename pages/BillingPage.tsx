// pages/BillingPage.tsx
import React, { useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { CheckCircleIcon, SparklesIcon, CreditCard, Users, RefreshCwIcon } from '../components/icons/Icon';
import { redirectToCheckout, StripeItemKey } from '../services/stripeService';
import { useToast } from '../hooks/useToast';

const BillingPage: React.FC = () => {
    const { profile } = useAppStore();
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const handlePurchase = async (itemKey: StripeItemKey) => {
        setIsLoading(itemKey);
        try {
            await redirectToCheckout(itemKey);
        } catch (error) {
            addToast((error as Error).message, 'error');
            setIsLoading(null);
        }
    };

    const isPro = profile.plan === 'Pro';
    const isTeams = profile.plan === 'Teams';

    const PlanCard: React.FC<{
        plan: 'Pro' | 'Teams';
        title: string;
        price: string;
        period: string;
        features: string[];
        isCurrent: boolean;
        itemKey: StripeItemKey;
        icon: React.ElementType;
        recommended?: boolean;
    }> = ({ plan, title, price, period, features, isCurrent, itemKey, icon: Icon, recommended }) => (
        <Card className={`flex flex-col relative ${isCurrent ? 'border-primary-500 ring-1 ring-primary-500' : ''} ${recommended ? 'border-fuchsia-500 shadow-lg shadow-fuchsia-900/20' : ''}`}>
            {recommended && <div className="absolute top-0 right-0 bg-fuchsia-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">Recomendado</div>}
            <CardHeader className="text-center pb-2">
                <Icon className={`w-10 h-10 mx-auto mb-3 ${isCurrent ? 'text-primary-400' : 'text-gray-400'}`} />
                <h3 className="text-xl font-bold text-white">{title}</h3>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-extrabold text-white">{price}</span>
                    <span className="text-sm font-normal text-gray-400">/{period}</span>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4 pt-4">
                <div className="border-t border-gray-800 my-2"></div>
                {features.map((feature, i) => (
                    <p key={i} className="flex items-start gap-3 text-sm text-gray-300">
                        <CheckCircleIcon className={`w-5 h-5 shrink-0 ${isCurrent ? 'text-primary-500' : 'text-green-500'}`} />
                        {feature}
                    </p>
                ))}
            </CardContent>
            <CardFooter>
                {isCurrent ? (
                    <Button className="w-full bg-gray-700 hover:bg-gray-700 cursor-default" disabled>Plan Actual</Button>
                ) : (
                    <Button 
                        className={`w-full ${recommended ? 'bg-fuchsia-600 hover:bg-fuchsia-700' : ''}`} 
                        onClick={() => handlePurchase(itemKey)} 
                        disabled={!!isLoading}
                    >
                        {isLoading === itemKey ? <RefreshCwIcon className="w-4 h-4 animate-spin mx-auto"/> : 'Seleccionar Plan'}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );

    return (
        <div className="space-y-10 max-w-6xl mx-auto pb-12">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold text-white">Planes Flexibles para Freelancers</h1>
                <p className="text-gray-400 max-w-2xl mx-auto">Elige el plan que mejor se adapte a tu etapa de crecimiento. Cancela en cualquier momento.</p>
                
                <div className="flex items-center justify-center gap-4 mt-6">
                    <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-500'}`}>Mensual</span>
                    <button 
                        onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                        className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-2 focus:ring-offset-gray-950"
                    >
                        <span className={`${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                    </button>
                    <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-white' : 'text-gray-500'}`}>
                        Anual <span className="text-fuchsia-400 text-xs ml-1">(Ahorra hasta 30%)</span>
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* PRO PLAN - Siempre mensual según CSV */}
                <PlanCard
                    plan="Pro"
                    title="Plan Pro"
                    price="3,95€"
                    period="mes"
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

                {/* TEAMS PLAN - Cambia según el ciclo */}
                <PlanCard
                    plan="Teams"
                    title="Plan Teams"
                    price={billingCycle === 'monthly' ? "35,95€" : "295,00€"}
                    period={billingCycle === 'monthly' ? "mes" : "año"}
                    features={[
                        "Todas las funciones del Plan Pro",
                        "Hasta 5 miembros de equipo",
                        "Roles y permisos avanzados",
                        "Base de Conocimiento compartida",
                        "Integraciones y Webhooks",
                        billingCycle === 'yearly' ? "Soporte Prioritario 24/7" : null
                    ].filter(Boolean) as string[]}
                    isCurrent={isTeams}
                    itemKey={billingCycle === 'monthly' ? 'teamsPlan' : 'teamsPlanYearly'}
                    icon={Users}
                    recommended={true}
                />
            </div>

            <div className="mt-16">
                <Card className="border-gray-800 bg-gradient-to-b from-gray-900 to-gray-950">
                    <CardHeader>
                         <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                <SparklesIcon className="w-6 h-6 text-purple-400" />
                            </div>
                            Paquetes de Créditos IA
                         </h2>
                         <p className="text-gray-400 mt-2">Potencia tu flujo de trabajo con generación de contenido, análisis financiero y más. Los créditos nunca caducan.</p>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
                            {[
                                { credits: 100, price: "1,95€", id: 'aiCredits100' as const },
                                { credits: 500, price: "3,95€", id: 'aiCredits500' as const, popular: true },
                                { credits: 1000, price: "5,95€", id: 'aiCredits1000' as const }
                            ].map((pkg) => (
                                <div key={pkg.id} className={`relative p-6 rounded-xl border flex flex-col justify-between items-center text-center gap-4 transition-transform hover:scale-105 ${pkg.popular ? 'bg-gray-800 border-purple-500 shadow-purple-900/20 shadow-lg' : 'bg-gray-800/50 border-gray-700'}`}>
                                    {pkg.popular && <span className="absolute -top-3 bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Más Popular</span>}
                                    <div>
                                        <p className="text-gray-400 font-medium">Paquete Básico</p>
                                        <p className="text-3xl font-bold text-white mt-2">{pkg.credits} <span className="text-base font-normal text-purple-400">Créditos</span></p>
                                        <p className="text-2xl font-bold text-white mt-2">{pkg.price}</p>
                                    </div>
                                    <Button 
                                        onClick={() => handlePurchase(pkg.id)} 
                                        disabled={!!isLoading} 
                                        className={`w-full ${pkg.popular ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                                    >
                                        {isLoading === pkg.id ? '...' : 'Comprar Pack'}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default BillingPage;