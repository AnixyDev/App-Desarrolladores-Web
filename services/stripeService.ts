import { supabase } from '../lib/supabaseClient';

// Definición de ítems mapeados a IDs de precios reales en Stripe (del CSV proporcionado)
export const STRIPE_ITEMS = {
    proPlan: {
        priceId: 'price_1SOgUF8oC5awQy15dOEM5jGS', // Pro Plan - 3,95 EUR
        mode: 'subscription' as const,
        name: 'Plan Pro',
    },
    teamsPlan: {
        priceId: 'price_1SOggV8oC5awQy15YW1wAgcg', // Plan de equipos Mensual - 35,95 EUR
        mode: 'subscription' as const,
        name: 'Plan Teams',
    },
    teamsPlanYearly: {
        priceId: 'price_1SOggV8oC5awQy15Ppz7bUj0', // Plan de equipos Anual - 295,00 EUR
        mode: 'subscription' as const,
        name: 'Plan Teams (Anual)',
    },
    aiCredits100: {
        priceId: 'price_1SOgpy8oC5awQy15TW22fBot', // Credito 100 - 1,95 EUR
        mode: 'payment' as const,
        name: '100 Créditos de IA',
        credits: 100 // Propiedad usada por App.tsx para sumar créditos
    },
    aiCredits500: {
        priceId: 'price_1SOgr18oC5awQy15o1gTM2VM', // Credito 500 - 3,95 EUR
        mode: 'payment' as const,
        name: '500 Créditos de IA',
        credits: 500
    },
    aiCredits1000: {
        priceId: 'price_1SOguC8oC5awQy15LGchpkVG', // Crédito 1000 - 5,95 EUR
        mode: 'payment' as const,
        name: '1000 Créditos de IA',
        credits: 1000
    },
    featuredJobPost: {
        priceId: 'price_1SOlOv8oC5awQy15Q2aXoEg7', // Oferta de empleo destacada - 5,95 EUR
        mode: 'payment' as const,
        name: 'Oferta Destacada',
    },
    invoicePayment: {
        priceId: 'price_placeholder_invoice', // Esto normalmente se genera dinámicamente en el backend
        mode: 'payment' as const,
        name: 'Pago de Factura',
    }
};

export type StripeItemKey = keyof typeof STRIPE_ITEMS;

/**
 * Llama a la Edge Function de Supabase para crear una sesión de Checkout.
 * Incluye un fallback para usuarios mock/demo.
 */
export const redirectToCheckout = async (itemKey: StripeItemKey, extraParams: Record<string, any> = {}) => {
    const item = STRIPE_ITEMS[itemKey];

    if (!item) {
        throw new Error('El artículo de compra no es válido.');
    }

    // Check for real session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        console.warn('Modo Demo: No hay sesión activa de Supabase. Simulando redirección de pago.');
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Construct mock success URL to trigger the PaymentHandler in App.tsx
        const currentUrl = new URL(window.location.href);
        const redirectPath = currentUrl.pathname === '/' ? '' : currentUrl.pathname;
        const mockSuccessUrl = `${currentUrl.origin}${currentUrl.hash.split('?')[0]}?payment=success&item=${itemKey}&mock=true${extraParams.invoice_id ? `&invoice_id=${extraParams.invoice_id}` : ''}`;
        
        window.location.href = mockSuccessUrl;
        return;
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
        throw new Error('Error al conectar con el servidor de pagos. (Verifica que las Edge Functions estén desplegadas).');
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
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        alert("Modo Demo: No puedes acceder al portal de facturación sin una cuenta real.");
        return;
    }

    const { data, error } = await supabase.functions.invoke('create-portal-session');

    if (error) {
        console.error('Error portal:', error);
        throw new Error('Error al abrir el portal de facturación.');
    }

    if (data?.url) {
        window.location.href = data.url;
    }
};