import { supabase, getURL } from '../lib/supabaseClient';
import { loadStripe } from '@stripe/stripe-js';

/**
 * IMPORTANTE PARA PRODUCCIÓN:
 * 1. Ve al Dashboard de Stripe (Modo Real).
 * 2. Crea tus productos (Planes y Créditos).
 * 3. Copia los IDs de precio (price_...) y pégalos abajo.
 * 4. Asegúrate de que VITE_STRIPE_PUBLIC_KEY en Vercel sea tu clave pk_live_...
 */

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
        priceId: 'price_LIVE_CAMBIAR_AQUI', // Reemplazar con ID Real de Stripe Live
        mode: 'subscription' as const,
        name: 'Pro Plan',
    },
    teamsPlan: {
        priceId: 'price_LIVE_CAMBIAR_AQUI', // Reemplazar con ID Real de Stripe Live
        mode: 'subscription' as const,
        name: 'Plan de equipos',
    },
    teamsPlanYearly: {
        priceId: 'price_LIVE_CAMBIAR_AQUI', // Reemplazar con ID Real de Stripe Live
        mode: 'subscription' as const,
        name: 'Plan de equipos (Anual)',
    },
    aiCredits100: {
        priceId: 'price_LIVE_CAMBIAR_AQUI', // Reemplazar con ID Real de Stripe Live
        mode: 'payment' as const,
        name: '100 Créditos de IA',
        credits: 100
    },
    aiCredits500: {
        priceId: 'price_LIVE_CAMBIAR_AQUI', // Reemplazar con ID Real de Stripe Live
        mode: 'payment' as const,
        name: '500 Créditos de IA',
        credits: 500
    },
    aiCredits1000: {
        priceId: 'price_LIVE_CAMBIAR_AQUI', // Reemplazar con ID Real de Stripe Live
        mode: 'payment' as const,
        name: '1000 Créditos de IA',
        credits: 1000
    },
    featuredJobPost: {
        priceId: 'price_LIVE_CAMBIAR_AQUI', // Reemplazar con ID Real de Stripe Live
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

    // Llamada a la Edge Function de Supabase
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

    if (error) {
        console.error('Error al invocar función de pago:', error);
        throw new Error('Error al conectar con la pasarela de pago.');
    }
    
    if (data?.url) {
        window.location.href = data.url;
    } else {
        throw new Error('No se pudo generar la sesión de pago.');
    }
};

export const redirectToCustomerPortal = async () => {
    const currentUrl = getURL();
    const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: { return_url: `${currentUrl}/#/billing` }
    });
    if (error) throw new Error('Error al abrir el portal de facturación.');
    if (data?.url) window.location.href = data.url;
};

export const createPaymentSheet = async (amountCents: number, description: string, metadata: any = {}) => {
    const { data, error } = await supabase.functions.invoke('payment-sheet', {
        body: { 
            amount: amountCents,
            description,
            metadata: { ...metadata, origin: getURL() }
        }
    });
    if (error) throw new Error('Error al inicializar la pasarela de pago.');
    return data.paymentIntentClientSecret;
};