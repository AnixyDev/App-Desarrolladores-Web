import React, { useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { CheckCircleIcon, SparklesIcon, CreditCard, Users, RefreshCwIcon, ZapIcon, StarIcon, SettingsIcon } from '../components/icons/Icon';
import { redirectToCheckout, redirectToCustomerPortal, StripeItemKey } from '../services/stripeService';
import { useToast } from '../hooks/useToast';

const BillingPage: React.FC = () => {
    const { profile } = useAppStore();
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [isPortalLoading, setIsPortalLoading] = useState(false);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const handlePurchase = async (itemKey: StripeItemKey) => {
        setIsLoading(itemKey);
        try {
            await redirectToCheckout(itemKey);
        } catch (error: any) {
            addToast(error.message || 'Error al iniciar el pago', 'error');
            setIsLoading(null);
        }
    };

    const handleOpenPortal = async () => {
        setIsPortalLoading(true);
        try {
            await redirectToCustomerPortal();
        } catch (error: any) {
            addToast(error.message || 'No se pudo abrir el portal', 'error');
            setIsPortalLoading(false);
        }
    };

    const isPro = profile.plan === 'Pro';
    const isTeams = profile.plan === 'Teams';

    const SubscriptionCard = ({ plan, title, price, period, features, isCurrent, itemKey, icon: Icon, recommended }: any) => (
        <div className={`relative flex flex-col p-8 bg-gray-900 rounded-2xl border transition-all duration-300 ${isCurrent ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-gray-800 hover:border-gray-700'}`}>
            {recommended && (
                <div className="absolute top-0 right-0">
                    <span className="inline-flex items-center px-4 py-1 rounded-bl-xl rounded-tr-xl text-xs font-bold uppercase tracking-wide bg-primary-600 text-white">Recomendado</span>
                </div>
            )}
            <div className="mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${isCurrent ? 'bg-primary-500/20 text-primary-400' : 'bg-gray-800 text-gray-400'}`}><Icon className="w-6 h-6" /></div>
                <h3 className="text-xl font-bold text-white">{title}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">{price}</span>
                    <span className="text-sm text-gray-400">/{period}</span>
                </div>
            </div>
            <ul className="flex-1 space-y-4 mb-8">
                {features.map((f: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                        <CheckCircleIcon className={`w-5 h-5 shrink-0 ${isCurrent ? 'text-primary-400' : 'text-green-500'}`} />
                        <span>{f}</span>
                    </li>
                ))}
            </ul>
            <Button 
                onClick={() => handlePurchase(itemKey)} 
                disabled={!!isLoading || isCurrent} 
                className={`w-full ${isCurrent ? 'bg-gray-800 text-gray-500 cursor-default' : recommended ? 'bg-white text-black hover:bg-gray-100' : ''}`}
            >
                {isLoading === itemKey ? <RefreshCwIcon className="w-5 h-5 animate-spin mx-auto"/> : isCurrent ? 'Plan Actual' : 'Actualizar'}
            </Button>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-12">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-extrabold text-white">Planes y Facturación</h1>
                <p className="text-gray-400 max-w-2xl mx-auto">Sube de nivel tu productividad. Desbloquea límites y potencia tu flujo con Inteligencia Artificial.</p>
                
                <div className="inline-flex p-1 bg-gray-900 border border-gray-800 rounded-full">
                    <button onClick={() => setBillingCycle('monthly')} className={`px-6 py-2 rounded-full text-sm font-semibold transition ${billingCycle === 'monthly' ? 'bg-gray-800 text-white' : 'text-gray-400'}`}>Mensual</button>
                    <button onClick={() => setBillingCycle('yearly')} className={`px-6 py-2 rounded-full text-sm font-semibold transition flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-gray-800 text-white' : 'text-gray-400'}`}>Anual <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded-full">Ahorra 20%</span></button>
                </div>
            </div>

            {(isPro || isTeams) && (
                <div className="flex justify-center">
                    <Button onClick={handleOpenPortal} variant="secondary" disabled={isPortalLoading} className="gap-2">
                        {isPortalLoading ? <RefreshCwIcon className="w-4 h-4 animate-spin"/> : <SettingsIcon className="w-4 h-4"/>}
                        Gestionar Suscripción y Facturas
                    </Button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <SubscriptionCard
                    plan="Pro" title="Freelancer Pro" price="3,95€" period="mes"
                    features={["Proyectos ilimitados", "Facturación AEAT", "Perfil profesional", "50 Créditos IA"]}
                    isCurrent={isPro} itemKey="proPlan" icon={CreditCard}
                />
                <SubscriptionCard
                    plan="Teams" title="Studio Team" recommended={true}
                    price={billingCycle === 'monthly' ? "35,95€" : "29,95€"}
                    period={billingCycle === 'monthly' ? "mes" : "mes (pago anual)"}
                    features={["Hasta 5 miembros", "Roles avanzados", "API & Webhooks", "200 Créditos IA"]}
                    isCurrent={isTeams} itemKey={billingCycle === 'monthly' ? 'teamsPlan' : 'teamsPlanYearly'} icon={Users}
                />
            </div>
        </div>
    );
};

export default BillingPage;