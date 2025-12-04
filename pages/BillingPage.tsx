// pages/BillingPage.tsx
import React, { useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { CheckCircleIcon, SparklesIcon, CreditCard, Users } from '../components/icons/Icon';
import { redirectToCheckout, StripeItemKey } from '../services/stripeService';
import { useToast } from '../hooks/useToast';

const BillingPage: React.FC = () => {
    const { profile } = useAppStore();
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const handlePurchase = async (itemKey: StripeItemKey) => {
        setIsLoading(itemKey);
        try {
            await redirectToCheckout(itemKey);
            // The user will be redirected, so no further action is needed here on success.
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <PlanCard
                    plan="Pro"
                    title="Plan Pro"
                    price="3,95€"
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
                    price="35,95€"
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-gray-800/50 rounded-lg flex flex-col justify-between items-center text-center gap-3">
                            <div>
                                <p className="font-semibold text-white">100 Créditos</p>
                                <p className="text-2xl font-bold text-white">1,95€</p>
                            </div>
                            <Button onClick={() => handlePurchase('aiCredits100')} disabled={!!isLoading} className="w-full">{isLoading === 'aiCredits100' ? '...' : 'Comprar'}</Button>
                        </div>
                        <div className="p-4 bg-gray-800/50 rounded-lg flex flex-col justify-between items-center text-center gap-3 border border-primary-500/30">
                            <div>
                                <p className="font-semibold text-white">500 Créditos</p>
                                <p className="text-2xl font-bold text-white">3,95€</p>
                            </div>
                            <Button onClick={() => handlePurchase('aiCredits500')} disabled={!!isLoading} className="w-full">{isLoading === 'aiCredits500' ? '...' : 'Comprar'}</Button>
                        </div>
                        <div className="p-4 bg-gray-800/50 rounded-lg flex flex-col justify-between items-center text-center gap-3">
                            <div>
                                <p className="font-semibold text-white">1000 Créditos</p>
                                <p className="text-2xl font-bold text-white">5,95€</p>
                            </div>
                            <Button onClick={() => handlePurchase('aiCredits1000')} disabled={!!isLoading} className="w-full">{isLoading === 'aiCredits1000' ? '...' : 'Comprar'}</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default BillingPage;