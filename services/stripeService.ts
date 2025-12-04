
import { supabase } from '../lib/supabaseClient';

// Definición de ítems mapeados a IDs de precios reales en Stripe
export const STRIPE_ITEMS = {
    proPlan: {
        priceId: 'price_1Q...', // ID real de Stripe Dashboard
        mode: 'subscription' as const,
        name: 'Plan Pro',
    },
    teamsPlan: {
        priceId: 'price_1Q...', 
        mode: 'subscription' as const,
        name: 'Plan Teams',
    },
    aiCredits500: {
        priceId: 'price_1Q...',
        mode: 'payment' as const,
        name: '500 Créditos de IA',
    },
    aiCredits1500: {
        priceId: 'price_1Q...',
        mode: 'payment' as const,
        name: '1500 Créditos de IA',
    },
    featuredJobPost: {
        priceId: 'price_1Q...',
        mode: 'payment' as const,
        name: 'Oferta Destacada',
    },
    invoicePayment: {
        priceId: 'price_placeholder_invoice',
        mode: 'payment' as const,
        name: 'Pago de Factura',
    }
};

export type StripeItemKey = keyof typeof STRIPE_ITEMS;

/**
 * Llama a la Edge Function de Supabase para crear una sesión de Checkout.
 * Esto es seguro porque la lógica de Stripe ocurre en el servidor (Edge Function).
 */
export const redirectToCheckout = async (itemKey: StripeItemKey, extraParams: Record<string, any> = {}) => {
    const item = STRIPE_ITEMS[itemKey];

    if (!item) {
        throw new Error('El artículo de compra no es válido.');
    }

    // Llamada a la Edge Function 'create-checkout-session'
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
            priceId: item.priceId,
            mode: item.mode,
            metadata: { ...extraParams, itemKey } // Pasamos metadatos útiles para el webhook
        }
    });

    if (error) {
        console.error('Error invocando Edge Function:', error);
        throw new Error('Error al conectar con el servidor de pagos.');
    }

    if (!data?.url) {
        throw new Error('No se recibió la URL de pago.');
    }

    // Redirigir a Stripe
    window.location.href = data.url;
};

/**
 * Abre el portal de facturación de Stripe para gestionar suscripciones.
 */
export const redirectToCustomerPortal = async () => {
    const { data, error } = await supabase.functions.invoke('create-portal-session');

    if (error) {
        console.error('Error portal:', error);
        throw new Error('Error al abrir el portal de facturación.');
    }

    if (data?.url) {
        window.location.href = data.url;
    }
};
