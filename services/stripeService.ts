// services/stripeService.ts

// These item keys match what's expected in the PaymentHandler component
export const STRIPE_ITEMS = {
    proPlan: {
        priceId: 'price_1SOgUF8oC5awQy15dOEM5jGS', // From CSV
        mode: 'subscription' as const,
        name: 'Pro Plan',
        description: 'Plan de equipos de desarrolladores/freelancers',
    },
    teamsPlan: {
        priceId: 'price_1SOggV8oC5awQy15YW1wAgcg', // From CSV
        mode: 'subscription' as const,
        name: 'Plan de equipos',
        description: 'Plan equipo mensual',
    },
    aiCredits100: {
        priceId: 'price_1SOgpy8oC5awQy15TW22fBot', // From CSV
        mode: 'payment' as const,
        name: '100 Créditos de IA',
        credits: 100,
    },
    aiCredits500: {
        priceId: 'price_1SOgr18oC5awQy15o1gTM2VM', // From CSV
        mode: 'payment' as const,
        name: '500 Créditos de IA',
        credits: 500,
    },
    aiCredits1000: {
        priceId: 'price_1SOguC8oC5awQy15LGchpkVG', // From CSV
        mode: 'payment' as const,
        name: '1000 Créditos de IA',
        credits: 1000,
    },
    featuredJobPost: {
        priceId: 'price_1SOlOv8oC5awQy15Q2aXoEg7', // From CSV
        mode: 'payment' as const,
        name: 'Oferta de empleo destacada',
    },
    // This is a dynamic item for invoices, so it won't have a static price ID here.
    invoicePayment: {
        mode: 'payment' as const,
        name: 'Pago de Factura',
    }
};

export type StripeItemKey = keyof typeof STRIPE_ITEMS;

/**
 * Redirects the user to a Stripe Checkout session.
 * This is a mock function that simulates a call to a serverless function.
 * @param itemKey The key of the item in STRIPE_ITEMS.
 * @param extraParams Additional parameters to pass to the checkout session, like invoice_id.
 */
export const redirectToCheckout = async (itemKey: StripeItemKey, extraParams: Record<string, any> = {}) => {
    const item = STRIPE_ITEMS[itemKey];

    if (!item) {
        throw new Error('El artículo de compra no es válido.');
    }

    // In a real application, you would make a POST request to a backend endpoint.
    // This endpoint would create a Stripe Checkout Session and return its URL.
    // For this simulation, we'll just redirect to a success or cancelled URL with parameters.
    // This mimics Stripe's redirect behavior.
    console.log(`Simulating Stripe checkout for: ${item.name}`, extraParams);
    
    // In a real application, you would provide success_url and cancel_url to Stripe.
    // Stripe would then redirect to these URLs.
    // For this mock, we build the success URL ourselves.
    
    const successUrl = new URL(window.location.origin);
    successUrl.searchParams.set('payment', 'success');
    successUrl.searchParams.set('item', itemKey);
    for (const key in extraParams) {
        successUrl.searchParams.set(key, extraParams[key]);
    }
    
    // Simulate redirecting to Stripe and then back to our app.
    // We'll just directly go to the success URL for this mock.
    window.location.href = successUrl.toString();
};