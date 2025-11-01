// FIX: Add a triple-slash directive to explicitly include React types, resolving issues with JSX elements not being recognized by TypeScript.
/// <reference types="react" />

import React, { useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import Card, { CardContent, CardHeader } from '../components/ui/Card.tsx';
import Button from '../components/ui/Button.tsx';
import { SparklesIcon } from '../components/icons/Icon.tsx';
import { useToast } from '../hooks/useToast.ts';
import { redirectToCheckout, STRIPE_ITEMS } from '../services/stripeService.ts';

// Añade la definición de TypeScript para el elemento personalizado de Stripe
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'stripe-pricing-table': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'pricing-table-id': string;
        'publishable-key': string;
      };
    }
  }
}

const BillingPage: React.FC = () => {
    const { purchaseCredits } = useAppStore();
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState<string | null>(null);

    // Esta función se utiliza ahora solo para los paquetes de créditos
    const handlePayment = async (itemKey: keyof typeof STRIPE_ITEMS) => {
        setIsLoading(itemKey);
        try {
            await redirectToCheckout(itemKey);
            // El usuario será redirigido a Stripe.
            // Para esta app, simulamos la compra de créditos para feedback inmediato,
            // aunque en una app real esto se manejaría con un webhook.
            const credits = (STRIPE_ITEMS[itemKey] as { credits?: number }).credits || 0;
            if (credits > 0) {
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
    
    const creditPacks = [
        { credits: 100, price: '1,95€', key: 'credits100' as const },
        { credits: 500, price: '3,95€', key: 'credits500' as const },
        { credits: 1000, price: '5,95€', key: 'credits1000' as const },
    ];

    return (
        <div>
            <h1 className="text-2xl font-semibold text-white mb-6">Facturación y Planes</h1>

            <stripe-pricing-table
                pricing-table-id="prctbl_1SOkdb8oC5awQy15BOC8bHBX"
                publishable-key="pk_live_51SDWPB8oC5awQy1545zGz4ujNU8tnMm7YDT8FME95jWrGHttn8cHN7koOrcVOGqz7jXxODYmKslH1aqSaYULJPgn00WD4Bq8SD"
            >
            </stripe-pricing-table>
            
            <div className="mt-8">
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
        </div>
    );
};

export default BillingPage;