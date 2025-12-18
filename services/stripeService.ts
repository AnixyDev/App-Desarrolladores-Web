import { supabase, getURL } from '../lib/supabaseClient';
import { loadStripe } from '@stripe/stripe-js';

const getEnv = (key: string): string => {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
        return (import.meta as any).env[key] || '';
    }
    if (typeof process !== 'undefined' && process.env) {
        return process.env[key] || '';
    }
    return '';
};

const STRIPE_PUBLIC_KEY = getEnv('VITE_STRIPE_PUBLIC_KEY');

export const getStripe = () => {
    if (!STRIPE_PUBLIC_KEY || STRIPE_PUBLIC_KEY.startsWith('pk_test')) {
        console.warn('Advertencia: No se ha detectado una clave pública de Stripe para Producción (pk_live).');
    }
    return loadStripe(STRIPE_PUBLIC_KEY);
};

export const STRIPE_ITEMS = {
    proPlan: {
        priceId: 'price_LIVE_CAMBIAR_AQUI',
        mode: 'subscription' as const,
        name: 'Pro Plan',
    },
    teamsPlan: {
        priceId: 'price_LIVE_CAMBIAR_AQUI',
        mode: 'subscription' as const,
        name: 'Plan de equipos',
    },
    teamsPlanYearly: {
        priceId: 'price_LIVE_CAMBIAR_AQUI',
        mode: 'subscription' as const,
        name: 'Plan de equipos (Anual)',
    },
    aiCredits100: {
        priceId: 'price_LIVE_CAMBIAR_AQUI',
        mode: 'payment' as const,
        name: '100 Créditos de IA',
        credits: 100
    },
    aiCredits500: {
        priceId: 'price_LIVE_CAMBIAR_AQUI',
        mode: 'payment' as const,
        name: '500 Créditos de IA',
        credits: 500
    },
    aiCredits1000: {
        priceId: 'price_LIVE_CAMBIAR_AQUI',
        mode: 'payment' as const,
        name: '1000 Créditos de IA',
        credits: 1000
    },
    featuredJobPost: {
        priceId: 'price_LIVE_CAMBIAR_AQUI',
        mode: 'payment' as const,
        name: 'Oferta de empleo destacada',
    },
    invoicePayment: {
        priceId: null, 
        mode: 'payment' as const,
        name: 'Pago de Factura',
    }
};

export type StripeItemKey = keyof typeof STRIPE_ITEMS;

export const redirectToCheckout = async (itemKey: StripeItemKey, extraParams: Record<string, any> = {}) => {
    const item = STRIPE_ITEMS[itemKey];
    if (!item) throw new Error('El artículo de compra no es válido.');

    const currentUrl = getURL();

    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
            priceId: item.priceId,
            mode: item.mode,
            amount: itemKey === 'invoicePayment' ? extraParams.amount_cents : undefined,
            productName: itemKey === 'invoicePayment' ? `Factura ${extraParams.invoice_number}` : undefined,
            customOrigin: currentUrl,
            metadata: { 
                ...extraParams, 
                itemKey, 
                origin: currentUrl 
            }
        }
    });

    if (error) throw new Error('Error al conectar con la pasarela de pago.');
    if (data?.url) window.location.href = data.url;
};

/**
 * Llama a la API Route local de Next.js /api/checkout
 * Updated to support optional metadata object.
 */
export const createPaymentIntent = async (amount: number, userId: string, itemKey: string, metadata?: Record<string, any>) => {
    const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            amount,
            userId,
            itemKey,
            metadata // Pass custom metadata through to the API route.
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear el intento de pago.');
    }

    const data = await response.json();
    return data.clientSecret;
};

export const redirectToCustomerPortal = async () => {
    const currentUrl = getURL();
    const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: { return_url: `${currentUrl}/#/billing` }
    });
    if (error) throw new Error('Error al abrir el portal de facturación.');
    if (data?.url) window.location.href = data.url;
};