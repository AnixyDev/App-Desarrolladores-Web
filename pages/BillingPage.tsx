import React, { useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import Card, { CardContent, CardHeader } from '../components/ui/Card.tsx';
import Button from '../components/ui/Button.tsx';
import { CheckCircleIcon, SparklesIcon } from '../components/icons/Icon.tsx';
import { useToast } from '../hooks/useToast.ts';
import { redirectToCheckout, STRIPE_ITEMS } from '../services/stripeService.ts';

const BillingPage: React.FC = () => {
    const { profile, upgradePlan, purchaseCredits } = useAppStore();
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const handlePayment = async (itemKey: keyof typeof STRIPE_ITEMS) => {
        setIsLoading(itemKey);
        try {
            await redirectToCheckout(itemKey);
            // En un caso real, Stripe te notificaría a través de webhooks
            // y aquí gestionarías la respuesta de la redirección.
            // Para esta simulación, asumimos éxito después del intento.
            if (itemKey === 'proPlan' || itemKey === 'teamsPlanMonthly' || itemKey === 'teamsPlanYearly') {
                const plan = itemKey === 'proPlan' ? 'Pro' : 'Teams';
                upgradePlan(plan);
                addToast(`¡Pago simulado! Plan actualizado a ${plan}.`, 'success');
            } else {
                const credits = STRIPE_ITEMS[itemKey].credits || 0;
                purchaseCredits(credits);
                addToast(`¡Pago simulado! ${credits} créditos añadidos.`, 'success');
            }
        } catch (error) {
            console.error(error);
            addToast((error as Error).message, 'error');
        } finally {
            setIsLoading(null);
        }
    };
    
    interface PlanCardProps {
        title: string;
        price: string;
        features: string[];
        isCurrent: boolean;
        planType: 'Free' | 'Pro' | 'Teams';
        paymentKey: keyof typeof STRIPE_ITEMS | null;
        priceDescription?: string;
        children?: React.ReactNode;
    }
    
    const PlanCard: React.FC<PlanCardProps> = ({ title, price, priceDescription, children, features, isCurrent, planType, paymentKey }) => {
        const isFree = planType === 'Free';
        const buttonDisabled = isLoading !== null || isCurrent || (planType === 'Pro' && profile.plan === 'Teams');

        return (
             <Card className={`flex flex-col ${isCurrent ? 'border-primary-500 ring-2 ring-primary-500' : 'border-gray-800'}`}>
                <CardHeader className="text-center">
                    <h3 className="text-2xl font-bold text-white">{title}</h3>
                    <p className="text-4xl font-extrabold text-primary-400 mt-2">{price}</p>
                    <p className="text-gray-400">{priceDescription || (isFree ? 'Para empezar' : '/mes')}</p>
                </CardHeader>
                <CardContent className="flex-grow">
                    {children}
                    <div className="space-y-3">
                        {features.map((feature, i) => (
                            <p key={i} className="flex items-start gap-2"><CheckCircleIcon className="w-5 h-5 text-green-400 shrink-0 mt-0.5" /><span>{feature}</span></p>
                        ))}
                    </div>
                </CardContent>
                <div className="p-4 mt-auto">
                    <Button 
                        className="w-full" 
                        onClick={() => paymentKey && handlePayment(paymentKey)}
                        disabled={buttonDisabled}
                    >
                        {isLoading === paymentKey ? 'Procesando...' : isCurrent ? 'Plan Actual' : (planType === 'Pro' && profile.plan === 'Teams' ? 'Incluido en Teams' : 'Cambiar a ' + title)}
                    </Button>
                </div>
            </Card>
        )
    };
    
    const creditPacks = [
        { credits: 100, price: '1,95€', key: 'credits100' as const },
        { credits: 500, price: '3,95€', key: 'credits500' as const },
        { credits: 1000, price: '5,95€', key: 'credits1000' as const },
    ];

    return (
        <div>
            <h1 className="text-2xl font-semibold text-white mb-6">Facturación y Planes</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                 <PlanCard 
                    title="Free"
                    price="0€"
                    features={['1 Cliente', '2 Proyectos', '3 Facturas/mes', 'Funciones IA limitadas']}
                    isCurrent={profile.plan === 'Free'}
                    planType='Free'
                    paymentKey={null}
                 />
                 <PlanCard 
                    title="Pro"
                    price="19€"
                    features={['Clientes Ilimitados', 'Proyectos Ilimitados', 'Portal de Cliente', 'Reportes Avanzados', 'Soporte prioritario']}
                    isCurrent={profile.plan === 'Pro'}
                    planType='Pro'
                    paymentKey="proPlan"
                 />
                 <PlanCard 
                    title="Teams"
                    price={billingCycle === 'monthly' ? "35,95€" : "295€"}
                    priceDescription={billingCycle === 'monthly' ? "/mes" : "/año"}
                    features={['Todo en Pro', 'Gestión de Equipos', 'Knowledge Base Compartida', 'Automatización (Webhooks)', 'Roles y Permisos']}
                    isCurrent={profile.plan === 'Teams'}
                    planType='Teams'
                    paymentKey={billingCycle === 'monthly' ? "teamsPlanMonthly" : "teamsPlanYearly"}
                 >
                    <div className="flex justify-center items-center my-4 space-x-3">
                        <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-400'}`}>Mensual</span>
                         <button
                            type="button"
                            onClick={() => setBillingCycle(c => c === 'monthly' ? 'yearly' : 'monthly')}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${billingCycle === 'yearly' ? 'bg-primary-600' : 'bg-gray-700'}`}
                            aria-pressed={billingCycle === 'yearly'}
                            aria-label="Cambiar a facturación anual"
                        >
                            <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${billingCycle === 'yearly' ? 'translate-x-5' : 'translate-x-0'}`}
                            />
                        </button>
                        <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-white' : 'text-gray-400'}`}>Anual</span>
                        {billingCycle === 'yearly' && (
                             <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-green-500/20 text-green-300">Ahorra 29%</span>
                        )}
                    </div>
                 </PlanCard>
            </div>
            
             <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-purple-400"/>Comprar Créditos de IA
                    </h2>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {creditPacks.map(pack => (
                        <div key={pack.credits} className="p-4 bg-gray-800/50 rounded-lg text-center">
                            <p className="text-2xl font-bold text-purple-400">{pack.credits.toLocaleString('es-ES')} créditos</p>
                            <p className="text-xl font-semibold text-white mb-3">{pack.price}</p>
                            <Button variant="secondary" onClick={() => handlePayment(pack.key)} disabled={isLoading !== null}>
                                {isLoading === pack.key ? 'Procesando...' : 'Comprar'}
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
};

export default BillingPage;
