
import React, { useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import Card, { CardContent, CardHeader } from '../components/ui/Card.tsx';
import Button from '../components/ui/Button.tsx';
import { SparklesIcon, CheckCircleIcon, StarIcon } from '../components/icons/Icon.tsx';
import { useToast } from '../hooks/useToast.ts';
import { redirectToCheckout, STRIPE_ITEMS } from '../services/stripeService.ts';

const BillingPage: React.FC = () => {
    const { profile } = useAppStore();
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const handlePayment = async (itemKey: keyof typeof STRIPE_ITEMS) => {
        setIsLoading(itemKey);
        try {
            await redirectToCheckout(itemKey);
            // El usuario será redirigido a Stripe. El manejo del éxito o cancelación
            // se procesa en App.tsx a través de los parámetros de la URL.
        } catch (error) {
            console.error(error);
            addToast((error as Error).message, 'error');
            setIsLoading(null); // Solo restaurar en caso de error antes de la redirección.
        }
    };
    
    const plans = [
        {
            name: 'Free',
            price: '0€',
            description: 'Ideal para empezar y organizar tus finanzas básicas.',
            features: [
                '1 Cliente',
                '3 Facturas/mes',
                'Proyectos ilimitados',
                'Gestión de Gastos',
                '10 Créditos IA (única vez)',
            ],
            itemKey: null,
            isCurrent: profile?.plan === 'Free',
        },
        {
            name: 'Pro',
            price: '19€',
            priceSuffix: '/ mes',
            description: 'Para freelancers que buscan crecer y profesionalizarse.',
            features: [
                'Todo en Free, y además:',
                'Clientes ilimitados',
                'Facturas ilimitadas',
                'Presupuestos y Propuestas',
                'Portal de Cliente',
                '500 Créditos IA / mes',
            ],
            itemKey: 'proPlan' as const,
            isCurrent: profile?.plan === 'Pro',
            recommended: true,
        },
        {
            name: 'Teams',
            price: 'Desde 49€',
            priceSuffix: '/ mes',
            description: 'Para equipos y agencias que necesitan colaborar.',
            features: [
                'Todo en Pro, y además:',
                'Gestión de Equipos y Roles',
                'Timesheets colaborativos',
                'Knowledge Base interna',
                'Integraciones y Webhooks',
                '2,500 Créditos IA / mes',
            ],
            itemKey: 'teamsPlanMonthly' as const, // O una página de contacto
            isCurrent: profile?.plan === 'Teams',
        }
    ];

    const creditPacks = [
        { credits: 100, price: '1,95€', key: 'credits100' as const },
        { credits: 500, price: '3,95€', key: 'credits500' as const },
        { credits: 1000, price: '5,95€', key: 'credits1000' as const },
    ];

    if (!profile) return null;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-white">Facturación y Planes</h1>

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold">Resumen de tu Cuenta</h2>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-center sm:text-left">
                        <p className="text-gray-400">Tu Plan Actual</p>
                        <p className="text-2xl font-bold text-primary-400">{profile.plan}</p>
                    </div>
                    <div className="h-12 w-px bg-gray-700 hidden sm:block"></div>
                    <div className="text-center sm:text-left">
                        <p className="text-gray-400">Créditos de IA restantes</p>
                        <p className="text-2xl font-bold text-white flex items-center gap-2 justify-center">
                            <SparklesIcon className="w-6 h-6 text-purple-400"/>
                            {profile.ai_credits.toLocaleString('es-ES')}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                {plans.map(plan => (
                    <Card key={plan.name} className={`flex flex-col relative ${plan.recommended ? 'border-2 border-primary-500' : ''}`}>
                        {plan.recommended && (
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                                <StarIcon className="w-4 h-4"/> Recomendado
                            </div>
                        )}
                        <CardHeader className="text-center">
                            <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                            <p className="text-gray-400 text-sm mt-1">{plan.description}</p>
                            <div className="mt-4">
                                <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                                {plan.priceSuffix && <span className="text-gray-400">{plan.priceSuffix}</span>}
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <ul className="space-y-3 text-gray-300">
                                {plan.features.map(feature => (
                                    <li key={feature} className="flex items-start gap-3">
                                        <CheckCircleIcon className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <div className="p-4 mt-auto">
                            {plan.isCurrent ? (
                                <Button className="w-full" variant="secondary" disabled>Tu Plan Actual</Button>
                            ) : (
                                <Button 
                                    className="w-full"
                                    variant={plan.recommended ? 'primary' : 'secondary'}
                                    onClick={() => plan.itemKey && handlePayment(plan.itemKey)}
                                    disabled={isLoading !== null || !plan.itemKey}
                                >
                                    {isLoading === plan.itemKey ? 'Procesando...' : `Cambiar a ${plan.name}`}
                                </Button>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
            
            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-purple-400"/>Comprar Créditos de IA
                    </h2>
                    <p className="text-sm text-gray-400">Añade créditos para usar funciones avanzadas de IA de forma puntual.</p>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {creditPacks.map(pack => (
                        <div key={pack.credits} className="p-4 bg-gray-800/50 rounded-lg text-center flex flex-col items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-purple-400">{pack.credits.toLocaleString('es-ES')} créditos</p>
                                <p className="text-xl font-semibold text-white mb-3">{pack.price}</p>
                            </div>
                            <Button 
                                variant="secondary"
                                className="w-full mt-2"
                                onClick={() => handlePayment(pack.key)} 
                                disabled={isLoading !== null}
                            >
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