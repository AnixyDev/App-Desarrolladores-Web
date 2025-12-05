
import React, { useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { CheckCircleIcon, SparklesIcon, CreditCard, Users, RefreshCwIcon, ZapIcon, StarIcon } from '../components/icons/Icon';
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

    const SubscriptionCard: React.FC<{
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
        <div className={`relative flex flex-col p-8 bg-gray-900 rounded-2xl border transition-all duration-300 ${isCurrent ? 'border-primary-500 ring-1 ring-primary-500' : 'border-gray-800 hover:border-gray-700'} ${recommended ? 'shadow-2xl shadow-purple-900/20' : ''}`}>
            {recommended && (
                <div className="absolute top-0 right-0">
                    <span className="inline-flex items-center px-3 py-1 rounded-bl-xl rounded-tr-xl text-xs font-bold uppercase tracking-wide bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white">
                        Recomendado
                    </span>
                </div>
            )}
            <div className="mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${isCurrent ? 'bg-primary-500/20 text-primary-400' : 'bg-gray-800 text-gray-400'}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">{title}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white tracking-tight">{price}</span>
                    <span className="text-sm font-medium text-gray-400">/{period}</span>
                </div>
                <p className="mt-2 text-sm text-gray-400">Perfecto para {plan === 'Pro' ? 'freelancers individuales.' : 'equipos en crecimiento.'}</p>
            </div>
            
            <ul className="flex-1 space-y-4 mb-8">
                {features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                        <CheckCircleIcon className={`w-5 h-5 shrink-0 ${isCurrent ? 'text-primary-500' : 'text-green-500'}`} />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>

            {isCurrent ? (
                <button className="w-full py-3 px-4 rounded-lg bg-gray-800 text-gray-400 font-medium cursor-default border border-gray-700" disabled>
                    Plan Actual
                </button>
            ) : (
                <button 
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                        recommended 
                        ? 'bg-white text-black hover:bg-gray-100 shadow-lg shadow-white/10' 
                        : 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'
                    }`} 
                    onClick={() => handlePurchase(itemKey)} 
                    disabled={!!isLoading}
                >
                    {isLoading === itemKey ? <RefreshCwIcon className="w-5 h-5 animate-spin mx-auto"/> : 'Actualizar Plan'}
                </button>
            )}
        </div>
    );

    const CreditCardItem: React.FC<{
        credits: number;
        price: string;
        itemKey: StripeItemKey;
        popular?: boolean;
        features: string[];
    }> = ({ credits, price, itemKey, popular, features }) => (
        <div className={`relative group flex flex-col p-6 rounded-2xl border transition-all duration-300 ${
            popular 
            ? 'bg-gradient-to-b from-gray-800 to-gray-900 border-purple-500 shadow-2xl shadow-purple-500/20 scale-105 z-10' 
            : 'bg-gray-900 border-gray-800 hover:border-gray-700 hover:shadow-xl'
        }`}>
            {popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="inline-flex items-center px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-lg">
                        <StarIcon className="w-3 h-3 mr-1 fill-current" /> Mejor Valor
                    </span>
                </div>
            )}
            
            <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4 group-hover:scale-110 transition-transform duration-300">
                    <SparklesIcon className={`w-8 h-8 ${popular ? 'text-purple-400' : 'text-gray-400'}`} />
                </div>
                <h3 className="text-lg font-medium text-gray-300">Paquete de Energía</h3>
                <div className="mt-2 flex items-center justify-center gap-2">
                    <span className={`text-4xl font-extrabold ${popular ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400' : 'text-white'}`}>
                        {credits}
                    </span>
                    <span className="text-lg font-semibold text-gray-500">Créditos</span>
                </div>
                <p className="text-2xl font-bold text-white mt-2">{price}</p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
                {features.map((feat, i) => (
                    <li key={i} className="flex items-center text-sm text-gray-400 justify-center">
                        <ZapIcon className="w-3 h-3 mr-2 text-yellow-500" />
                        {feat}
                    </li>
                ))}
            </ul>

            <button 
                onClick={() => handlePurchase(itemKey)} 
                disabled={!!isLoading}
                className={`w-full py-3 px-4 rounded-xl font-bold transition-all duration-200 shadow-lg ${
                    popular 
                    ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:shadow-purple-500/40 hover:-translate-y-1' 
                    : 'bg-gray-800 text-white hover:bg-gray-700 hover:-translate-y-1'
                }`}
            >
                {isLoading === itemKey ? (
                    <RefreshCwIcon className="w-5 h-5 animate-spin mx-auto"/>
                ) : (
                    `Comprar por ${price}`
                )}
            </button>
        </div>
    );

    return (
        <div className="space-y-16 pb-12 animate-fade-in-up">
            {/* Header Section */}
            <div className="text-center space-y-6 max-w-3xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-purple-400">
                    Potencia tu carrera freelance
                </h1>
                <p className="text-lg text-gray-400">
                    Elige el plan que se adapte a tu ritmo. Desbloquea facturación ilimitada, gestión de equipos y el poder de la IA.
                </p>
                
                {/* Billing Toggle */}
                <div className="flex items-center justify-center gap-4 p-1 bg-gray-900/50 backdrop-blur-sm rounded-full inline-block border border-gray-800">
                    <button 
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${billingCycle === 'monthly' ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Mensual
                    </button>
                    <button 
                        onClick={() => setBillingCycle('yearly')}
                        className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Anual
                        <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded-full uppercase">Ahorra 20%</span>
                    </button>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto px-4">
                <SubscriptionCard
                    plan="Pro"
                    title="Freelancer Pro"
                    price="3,95€"
                    period="mes"
                    features={[
                        "Clientes y proyectos ilimitados",
                        "Generador de Facturas AEAT",
                        "Perfil público profesional",
                        "Acceso básico al Marketplace",
                        "50 Créditos IA / mes"
                    ]}
                    isCurrent={isPro}
                    itemKey="proPlan"
                    icon={CreditCard}
                />

                <SubscriptionCard
                    plan="Teams"
                    title="Studio Team"
                    price={billingCycle === 'monthly' ? "35,95€" : "295,00€"}
                    period={billingCycle === 'monthly' ? "mes" : "año"}
                    features={[
                        "Todo lo incluido en Pro",
                        "Hasta 5 miembros de equipo",
                        "Roles y permisos avanzados",
                        "API y Webhooks para automatización",
                        "Soporte prioritario",
                        "200 Créditos IA / mes"
                    ]}
                    isCurrent={isTeams}
                    itemKey={billingCycle === 'monthly' ? 'teamsPlan' : 'teamsPlanYearly'}
                    icon={Users}
                    recommended={true}
                />
            </div>

            {/* AI Credits Section */}
            <div className="relative pt-12">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-purple-900/10 pointer-events-none" />
                <div className="relative max-w-6xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
                            <SparklesIcon className="w-8 h-8 text-fuchsia-500" />
                            Recarga tu Inteligencia Artificial
                        </h2>
                        <p className="text-gray-400 mt-2 max-w-2xl mx-auto">
                            ¿Necesitas más potencia para generar contratos, analizar finanzas o redactar propuestas? Compra paquetes de créditos sin caducidad.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                        {/* 100 Credits */}
                        <CreditCardItem 
                            credits={100}
                            price="1,95 €"
                            itemKey="aiCredits100"
                            features={["~20 Propuestas IA", "~5 Análisis Financieros"]}
                        />

                        {/* 500 Credits (Featured) */}
                        <CreditCardItem 
                            credits={500}
                            price="3,95 €"
                            itemKey="aiCredits500"
                            popular={true}
                            features={["~100 Propuestas IA", "~25 Análisis Profundos", "Generación de Documentos"]}
                        />

                        {/* 1000 Credits */}
                        <CreditCardItem 
                            credits={1000}
                            price="5,95 €"
                            itemKey="aiCredits1000"
                            features={["Uso intensivo", "Ideal para Agencias", "Soporte para todo el equipo"]}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillingPage;
