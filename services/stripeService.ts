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
        priceId: 'price_1Q...', // ID de Stripe Pro
        mode: 'subscription' as const,
        name: 'Pro Plan',
    },
    teamsPlan: {
        priceId: 'price_1Q...', // ID de Stripe Teams
        mode: 'subscription' as const,
        name: 'Plan de equipos',
    },
    teamsPlanYearly: {
        priceId: 'price_1Q...', // ID de Stripe Teams Anual
        mode: 'subscription' as const,
        name: 'Plan de equipos (Anual)',
    },
    aiCredits100: {
        priceId: 'price_1Q...', 
        mode: 'payment' as const,
        name: '100 Créditos de IA',
        credits: 100
    },
    aiCredits500: {
        priceId: 'price_1Q...',
        mode: 'payment' as const,
        name: '500 Créditos de IA',
        credits: 500
    },
    aiCredits1000: {
        priceId: 'price_1Q...',
        mode: 'payment' as const,
        name: '1000 Créditos de IA',
        credits: 1000
    },
    featuredJobPost: {
        priceId: 'price_1Q...',
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

/**
 * Redirige a Stripe Checkout (Usa Edge Functions de Supabase)
 * Conecta con: https://umqsjycqypxvhbhmidma.supabase.co/functions/v1/create-checkout-session
 */
export const redirectToCheckout = async (itemKey: StripeItemKey, extraParams: Record<string, any> = {}) => {
    const item = STRIPE_ITEMS[itemKey];
    if (!item) throw new Error('El artículo de compra no es válido.');

    const currentUrl = getURL();

    // 2. Cuerpo de la Petición: Estructura requerida por la Edge Function
    const bodyPayload = {
        priceId: item.priceId || undefined,
        mode: item.mode,
        amount: itemKey === 'invoicePayment' ? extraParams.amount_cents : undefined,
        productName: itemKey === 'invoicePayment' ? `Factura ${extraParams.invoice_number}` : undefined,
        metadata: { 
            ...extraParams, 
            itemKey, 
            origin: currentUrl 
        }
    };

    // 1. URL de la Función: invoke() apunta automáticamente al subdominio del proyecto
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: bodyPayload
    });

    if (error) {
        console.error('Supabase Function Invoke Error:', error);
        throw new Error('No se pudo iniciar la sesión de pago. Inténtalo de nuevo.');
    }

    // 3. Manejo de Respuesta: Redirección mediante assign para mejor compatibilidad
    if (data?.url) {
        window.location.assign(data.url);
    } else {
        throw new Error('La pasarela de pago no devolvió una URL válida.');
    }
};

/**
 * Crea un PaymentIntent llamando al endpoint local de Next.js /api/checkout.
 */
export const createPaymentIntent = async (amountCents: number, userId: string, itemKey: string, metadata: Record<string, any> = {}) => {
    if (!userId) throw new Error("Se requiere el ID de usuario para procesar el pago.");
    const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(amountCents), userId, itemKey, metadata }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en el servidor de pagos.');
    }
    const data = await response.json();
    return data.clientSecret;
};

/**
 * Redirige al portal de Stripe eliminando el símbolo de hash.
 */
export const redirectToCustomerPortal = async () => {
    const currentUrl = getURL();
    const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: { return_url: `${currentUrl}/billing` }
    });
    if (error) throw new Error('Error al abrir el portal de facturación.');
    if (data?.url) window.location.assign(data.url);
};