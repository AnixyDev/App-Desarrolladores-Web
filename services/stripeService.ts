// services/stripeService.ts

// Estos item keys coinciden con lo que espera el componente PaymentHandler
export const STRIPE_ITEMS = {
    proPlan: {
        priceId: 'price_1SOgUF8oC5awQy15dOEM5jGS', // DEPRECADO EN FRONTEND, AHORA SE GESTIONA EN BACKEND
        mode: 'subscription' as const,
        name: 'Pro Plan',
        price: "3,95€",
        description: 'Plan de equipos de desarrolladores/freelancers',
    },
    teamsPlan: {
        priceId: 'price_1SOggV8oC5awQy15YW1wAgcg', // DEPRECADO EN FRONTEND
        mode: 'subscription' as const,
        name: 'Plan de equipos',
        price: "35,95€",
        description: 'Plan equipo mensual',
    },
    aiCredits100: {
        priceId: 'price_1SOgpy8oC5awQy15TW22fBot', // DEPRECADO EN FRONTEND
        mode: 'payment' as const,
        name: '100 Créditos de IA',
        credits: 100,
        price: "1,95€",
    },
    aiCredits500: {
        priceId: 'price_1SOgr18oC5awQy15o1gTM2VM', // DEPRECADO EN FRONTEND
        mode: 'payment' as const,
        name: '500 Créditos de IA',
        credits: 500,
        price: "3,95€",
    },
    aiCredits1000: {
        priceId: 'price_1SOguC8oC5awQy15LGchpkVG', // DEPRECADO EN FRONTEND
        mode: 'payment' as const,
        name: '1000 Créditos de IA',
        credits: 1000,
        price: "5,95€",
    },
    featuredJobPost: {
        priceId: 'price_1SOlOv8oC5awQy15Q2aXoEg7', // DEPRECADO EN FRONTEND
        mode: 'payment' as const,
        name: 'Oferta de empleo destacada',
        price: "5,95€",
    },
    invoicePayment: {
        priceId: null,
        mode: 'payment' as const,
        name: 'Pago de Factura',
    }
};

export type StripeItemKey = keyof typeof STRIPE_ITEMS;

declare const Stripe: any;

let stripePromise: Promise<any> | null = null;
const getStripe = () => {
    if (!stripePromise) {
        // Usamos la clave publicable de producción que proporcionaste.
        const stripePublishableKey = 'pk_live_51SDWPB8oC5awQy1545zGz4ujNU8tnMm7YDT8FME95jWrGHttn8cHN7koOrcVOGqz7jXxODYmKslH1aqSaYULJPgn00WD4Bq8SD';

        if (!stripePublishableKey) {
            console.error("La clave publicable de Stripe no está disponible.");
            return null;
        }
        stripePromise = Stripe(stripePublishableKey);
    }
    return stripePromise;
};

/**
 * Llama al backend para crear una sesión de Checkout y luego redirige al usuario.
 * @param itemKey La clave del artículo en STRIPE_ITEMS.
 * @param extraParams Parámetros adicionales como `invoice_id` para pagos dinámicos.
 */
export const redirectToCheckout = async (itemKey: StripeItemKey, extraParams: Record<string, any> = {}) => {
    const stripe = await getStripe();
    if (!stripe) {
        throw new Error('Stripe.js no se ha cargado correctamente.');
    }

    try {
        // Llama a la función serverless para crear la sesión de pago.
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ itemKey, extraParams }),
        });

        if (!response.ok) {
            const { error } = await response.json();
            throw new Error(error || 'Error al crear la sesión de pago.');
        }

        const { sessionId } = await response.json();

        // Redirige al usuario a la página de pago de Stripe.
        const { error } = await stripe.redirectToCheckout({ sessionId });

        if (error) {
            console.error('Error al redirigir a Stripe:', error);
            throw new Error(error.message || 'No se pudo redirigir a la página de pago.');
        }
    } catch (error) {
        console.error('Error en el proceso de checkout:', error);
        throw error;
    }
};
