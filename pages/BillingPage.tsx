import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { CheckCircleIcon, SparklesIcon, DollarSignIcon, CreditCard, RefreshCwIcon } from '../components/icons/Icon';
import { useToast } from '../hooks/useToast';
import { redirectToCheckout, createConnectAccount } from '../services/stripeService';

const UpgradeModal = lazy(() => import('../components/modals/UpgradeModal'));

const BillingPage: React.FC = () => {
    const { profile, upgradePlan, purchaseCredits, updateStripeConnection } = useAppStore();
    const { addToast } = useToast();
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [isConnectingStripe, setIsConnectingStripe] = useState(false);
    
    // Handle Stripe Connect return
    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        if (query.get('stripe_return') === 'true') {
            // In a real app, you would fetch the account status from your backend
            // to verify the onboarding is complete. Here we simulate it.
            if (profile && !profile.stripe_onboarding_complete) {
                // A better approach would be to get the accountId from the backend after creation
                updateStripeConnection('acct_simulation_id', true);
                addToast('¡Tu cuenta de Stripe ha sido conectada con éxito!', 'success');
            }
             // Clean up URL
             window.history.replaceState(null, '', window.location.pathname + window.location.hash);
        }
    }, [profile, updateStripeConnection, addToast]);

    if (!profile) {
        return <div>Cargando información de facturación...</div>;
    }

    const handleUpgrade = async (newPlan: 'Free' | 'Pro' | 'Teams') => {
        if (newPlan === 'Teams') {
            setIsUpgradeModalOpen(true);
            return;
        }
        try {
            await upgradePlan(newPlan);
            addToast(`¡Has actualizado al plan ${newPlan}!`, 'success');
        } catch (error) {
            addToast('Hubo un error al actualizar tu plan.', 'error');
        }
    };

    const handleBuyCredits = async (amount: number, itemKey: 'credits50' | 'credits200' | 'credits1000') => {
        try {
            addToast(`Redirigiendo a la pasarela de pago para comprar ${amount} créditos...`, 'info');
            await redirectToCheckout(itemKey);

        } catch (error) {
            addToast((error as Error).message, 'error');
        }
    };
    
    const handleConnectStripe = async () => {
        setIsConnectingStripe(true);
        try {
            await createConnectAccount();
        } catch (error) {
            addToast((error as Error).message, 'error');
            setIsConnectingStripe(false);
        }
    };
    
    const PlanCard: React.FC<{
        plan: 'Free' | 'Pro' | 'Teams';
        title: string;
        price: string;
        features: string[];
        isCurrent: boolean;
    }> = ({ plan, title, price, features, isCurrent }) => (
        <Card className={`flex flex-col ${isCurrent ? 'border-primary-500' : 'border-gray-800'}`}>
            <CardHeader>
                <h3 className="text-xl font-bold text-center text-white">{title}</h3>
                <p className="text-2xl font-bold text-center text-primary-400">{price}</p>
                <p className="text-sm text-center text-gray-400">{plan === 'Teams' ? 'por usuario/mes' : '/mes'}</p>
            </CardHeader>
            <CardContent className="flex-grow space-y-2">
                {features.map(feat => (
                    <p key={feat} className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircleIcon className="w-4 h-4 text-green-400" /> {feat}
                    </p>
                ))}
            </CardContent>
            <div className="p-4 mt-auto">
                {isCurrent ? (
                    <Button disabled className="w-full">Tu Plan Actual</Button>
                ) : (
                    <Button onClick={() => handleUpgrade(plan)} className="w-full">
                        {plan === 'Free' ? 'Bajar a Free' : `Actualizar a ${plan}`}
                    </Button>
                )}
            </div>
        </Card>
    );

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-semibold text-white">Facturación y Plan</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <PlanCard
                    plan="Free"
                    title="Plan Básico"
                    price="0€"
                    features={['1 Cliente', 'Proyectos ilimitados', 'Facturación básica', '10 Créditos de IA']}
                    isCurrent={profile.plan === 'Free'}
                />
                 <PlanCard
                    plan="Pro"
                    title="Plan Profesional"
                    price="12,95€"
                    features={['Clientes ilimitados', 'Perfil Público', 'Marketplace de Proyectos', '100 Créditos de IA/mes']}
                    isCurrent={profile.plan === 'Pro'}
                />
                <PlanCard
                    plan="Teams"
                    title="Plan de Equipo"
                    price="35,95€"
                    features={['Todo en Pro', 'Gestión de Equipo', 'Knowledge Base', 'Webhooks y Automatización']}
                    isCurrent={profile.plan === 'Teams'}
                />
            </div>

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2"><SparklesIcon/> Créditos de IA</h2>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <p className="text-sm text-gray-400">Créditos disponibles</p>
                        <p className="text-3xl font-bold text-purple-400">{profile.ai_credits}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Button variant="secondary" onClick={() => handleBuyCredits(50, 'credits50')}>Comprar 50 créditos (5€)</Button>
                        <Button variant="secondary" onClick={() => handleBuyCredits(200, 'credits200')}>Comprar 200 créditos (15€)</Button>
                        <Button variant="secondary" onClick={() => handleBuyCredits(1000, 'credits1000')}>Comprar 1000 créditos (50€)</Button>
                    </div>
                </CardContent>
            </Card>
            
             <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2"><CreditCard/> Pagos y Transferencias</h2>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-300 mb-4">Conecta tu cuenta de Stripe para recibir pagos de clientes y gestionar tus comisiones de afiliado de forma segura.</p>
                    {profile.stripe_onboarding_complete ? (
                        <div className="p-4 bg-green-900/50 border border-green-700 rounded-lg text-center">
                            <CheckCircleIcon className="w-8 h-8 mx-auto text-green-400 mb-2"/>
                            <p className="font-semibold text-green-300">¡Tu cuenta de Stripe está conectada!</p>
                            <p className="text-xs text-green-400">Puedes gestionar tu cuenta desde el panel de Stripe.</p>
                        </div>
                    ) : (
                        <Button onClick={handleConnectStripe} disabled={isConnectingStripe}>
                            {isConnectingStripe ? <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin"/> : null}
                            {isConnectingStripe ? 'Conectando...' : 'Conectar con Stripe'}
                        </Button>
                    )}
                </CardContent>
            </Card>

            <Suspense fallback={null}>
                <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />
            </Suspense>
        </div>
    );
};

export default BillingPage;