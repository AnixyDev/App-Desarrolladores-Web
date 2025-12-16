
import { supabase } from '../lib/supabaseClient';
import { loadStripe } from '@stripe/stripe-js';

// Asegúrate de definir tu clave pública en el entorno o sustitúyela aquí para pruebas
const STRIPE_PUBLIC_KEY = 'pk_test_...'; // REEMPLAZAR CON TU CLAVE PÚBLICA REAL

export const getStripe = () => {
    return loadStripe(STRIPE_PUBLIC_KEY);
};

// Definición de ítems mapeados a IDs de precios reales en Stripe
export const STRIPE_ITEMS = {
    proPlan: {
        priceId: 'price_1SOgUF8oC5awQy15dOEM5jGS', 
        mode: 'subscription' as const,
        name: 'Plan Pro',
    },
    teamsPlan: {
        priceId: 'price_1SOggV8oC5awQy15YW1wAgcg', 
        mode: 'subscription' as const,
        name: 'Plan Teams',
    },
    teamsPlanYearly: {
        priceId: 'price_1SOggV8oC5awQy15Ppz7bUj0', 
        mode: 'subscription' as const,
        name: 'Plan Teams (Anual)',
    },
    aiCredits100: {
        priceId: 'price_1SOgpy8oC5awQy15TW22fBot',
        mode: 'payment' as const,
        name: '100 Créditos de IA',
        credits: 100
    },
    aiCredits500: {
        priceId: 'price_1SOgr18oC5awQy15o1gTM2VM', 
        mode: 'payment' as const,
        name: '500 Créditos de IA',
        credits: 500
    },
    aiCredits1000: {
        priceId: 'price_1SOguC8oC5awQy15LGchpkVG', 
        mode: 'payment' as const,
        name: '1000 Créditos de IA',
        credits: 1000
    },
    featuredJobPost: {
        priceId: 'price_1SOlOv8oC5awQy15Q2aXoEg7', 
        mode: 'payment' as const,
        name: 'Oferta Destacada',
    },
    invoicePayment: {
        priceId: null, 
        mode: 'payment' as const,
        name: 'Pago de Factura',
    }
};

export type StripeItemKey = keyof typeof STRIPE_ITEMS;

// Función antigua para Checkout Redirect (Mantener si se usa para suscripciones)
export const redirectToCheckout = async (itemKey: StripeItemKey, extraParams: Record<string, any> = {}) => {
    const item = STRIPE_ITEMS[itemKey];
    if (!item) throw new Error('El artículo de compra no es válido.');

    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
            priceId: item.priceId,
            mode: item.mode,
            amount: itemKey === 'invoicePayment' ? extraParams.amount_cents : undefined,
            productName: itemKey === 'invoicePayment' ? `Factura ${extraParams.invoice_number}` : undefined,
            metadata: { ...extraParams, itemKey }
        }
    });

    if (error) {
        console.error('Error Edge Function:', error);
        throw new Error('Error al conectar con la pasarela de pago.');
    }

    if (data?.url) {
        window.location.href = data.url;
    } else {
        throw new Error('No se recibió URL de pago.');
    }
};

// 1. Lógica para llamar a payment-sheet (Single Payment Flow - Embedded)
export const createPaymentSheet = async (amountCents: number, description: string, metadata: any = {}) => {
    const { data, error } = await supabase.functions.invoke('payment-sheet', {
        body: { 
            amount: amountCents,
            description,
            metadata
        }
    });

    if (error) {
        console.error('Error creating payment sheet:', error);
        throw new Error('No se pudo inicializar el pago.');
    }

    return data.paymentIntentClientSecret;
};

// 2. Lógica para llamar a create-portal-session (Billing Management)
export const redirectToCustomerPortal = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        throw new Error("Debes iniciar sesión.");
    }
    
    const { data, error } = await supabase.functions.invoke('create-portal-session');
    
    if (error) {
        console.error('Error portal session:', error);
        throw new Error('Error al abrir el portal de facturación. Asegúrate de tener una suscripción activa.');
    }
    
    if (data?.url) {
        window.location.href = data.url;
    } else {
        throw new Error('URL del portal no recibida.');
    }
};
