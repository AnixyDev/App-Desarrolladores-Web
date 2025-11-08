// services/stripeService.ts

// These item keys match what's expected in the PaymentHandler component
export const STRIPE_ITEMS = {
    proPlan: {
        priceId: 'price_1SOgUF8oC5awQy15dOEM5jGS', // From CSV
        mode: 'subscription' as const,
        name: 'Pro Plan',
        price: "3,95€",
        description: 'Plan de equipos de desarrolladores/freelancers',
    },
    teamsPlan: {
        priceId: 'price_1SOggV8oC5awQy15YW1wAgcg', // From CSV
        mode: 'subscription' as const,
        name: 'Plan de equipos',
        price: "35,95€",
        description: 'Plan equipo mensual',
    },
    aiCredits100: {
        priceId: 'price_1SOgpy8oC5awQy15TW22fBot', // From CSV
        mode: 'payment' as const,
        name: '100 Créditos de IA',
        credits: 100,
        price: "1,95€",
    },
    aiCredits500: {
        priceId: 'price_1SOgr18oC5awQy15o1gTM2VM', // From CSV
        mode: 'payment' as const,
        name: '500 Créditos de IA',
        credits: 500,
        price: "3,95€",
    },
    aiCredits1000: {
        priceId: 'price_1SOguC8oC5awQy15LGchpkVG', // From CSV
        mode: 'payment' as const,
        name: '1000 Créditos de IA',
        credits: 1000,
        price: "5,95€",
    },
    featuredJobPost: {
        priceId: 'price_1SOlOv8oC5awQy15Q2aXoEg7', // From CSV
        mode: 'payment' as const,
        name: 'Oferta de empleo destacada',
        price: "5,95€",
    },
    // This is a dynamic item for invoices, so it won't have a static price ID here.
    invoicePayment: {
        priceId: null, // No price ID for dynamic payments
        mode: 'payment' as const,
        name: 'Pago de Factura',
    }
};

export type StripeItemKey = keyof typeof STRIPE_ITEMS;

// Access the global Stripe object from the script tag in index.html
declare const Stripe: any;

let stripePromise: Promise<any> | null = null;
const getStripe = () => {
    if (!stripePromise) {
        // FIX: Use a public Stripe test key. This is safe and standard for client-side code.
        // The previous implementation was incorrectly using the Gemini API key.
        const stripePublishableKey = 'pk_test_51SDWQy6cXnycOZkp6L9sF3NNMjTLJKuIFDaVcKQC9C17XZJm2jCSDR2XoNhilRqOXkgils51SjgeIpt923lOc2AL00GTkifTGo';

        if (!stripePublishableKey) {
            console.error("Stripe publishable key is not available.");
            return null;
        }
        stripePromise = Stripe(stripePublishableKey);
    }
    return stripePromise;
};


/**
 * Redirects the user to a Stripe Checkout session.
 * This function now attempts a real client-side redirect for predefined products.
 * For dynamic payments like invoices, it falls back to a simulation.
 * @param itemKey The key of the item in STRIPE_ITEMS.
 * @param extraParams Additional parameters to pass to the checkout session, like invoice_id.
 */
export const redirectToCheckout = async (itemKey: StripeItemKey, extraParams: Record<string, any> = {}) => {
    const item = STRIPE_ITEMS[itemKey];

    if (!item) {
        throw new Error('El artículo de compra no es válido.');
    }
    
    // --- SIMULATION FOR INVOICE PAYMENTS ---
    // Real checkout for invoices requires a backend to create a dynamic price & session.
    // Since this is a frontend-only app, we will simulate the payment for invoices.
    if (itemKey === 'invoicePayment' || !item.priceId) {
        console.log(`Simulating Stripe checkout for dynamic payment: ${item.name}`, extraParams);
        
        const currentUrl = new URL(window.location.href);
        const params = new URLSearchParams(currentUrl.search);
        params.set('payment', 'success');
        params.set('item', itemKey);
        for (const key in extraParams) {
            params.set(key, extraParams[key]);
        }
        
        // Reconstruct the URL for HashRouter compatibility
        const newUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}${window.location.hash}`;
        
        // Directly navigate to the success URL to simulate payment completion.
        window.location.href = newUrl;
        return; // End execution for simulation
    }

    // --- REAL CLIENT-SIDE CHECKOUT FOR PREDEFINED PRODUCTS ---
    const stripe = await getStripe();
    if (!stripe) {
        throw new Error('Stripe.js no se ha cargado correctamente o la clave de API no está configurada.');
    }

    const successUrl = `${window.location.origin}${window.location.pathname}?payment=success&item=${itemKey}`;
    const cancelUrl = `${window.location.origin}${window.location.pathname}?payment=cancelled`;

    const checkoutOptions: any = {
        lineItems: [{ price: item.priceId, quantity: 1 }],
        mode: item.mode,
        successUrl: successUrl,
        cancelUrl: cancelUrl,
    };

    const { error } = await stripe.redirectToCheckout(checkoutOptions);

    if (error) {
        console.error('Stripe redirectToCheckout error:', error);
        throw new Error(error.message || 'No se pudo redirigir a la página de pago.');
    }
};