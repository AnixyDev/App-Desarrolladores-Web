// These item keys match what's expected in the PaymentHandler component
export const STRIPE_ITEMS = {
    proPlan: {
        priceId: 'price_pro_plan_monthly', // Example Price ID from Stripe
        mode: 'subscription' as const,
        name: 'Plan Pro',
        description: 'Acceso ilimitado y funciones avanzadas.',
    },
    teamsPlan: {
        priceId: 'price_teams_plan_monthly',
        mode: 'subscription' as const,
        name: 'Plan Teams',
        description: 'Colaboración en equipo y gestión de roles.'
    },
    aiCredits500: {
        priceId: 'price_credits_500',
        mode: 'payment' as const,
        name: '500 Créditos de IA',
        credits: 500,
    },
    aiCredits1500: {
        priceId: 'price_credits_1500',
        mode: 'payment' as const,
        name: '1500 Créditos de IA',
        credits: 1500,
    },
    featuredJobPost: {
        priceId: 'price_featured_job_post',
        mode: 'payment' as const,
        name: 'Oferta de Trabajo Destacada',
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