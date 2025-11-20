
// services/stripeService.ts
import { supabase } from '../lib/supabaseClient';

const getAuthHeader = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No autenticado. Por favor, inicia sesión de nuevo.");
    return { 
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
    };
};

type CheckoutItemKey = 'proPlan' | 'teamsPlan' | 'credits100' | 'credits500' | 'credits1000' | 'featuredJob' | 'invoice_payment';

interface CheckoutOptions {
    invoiceId?: string;
    amount_cents?: number;
    description?: string;
}

export const redirectToCheckout = async (itemKey: CheckoutItemKey, options: CheckoutOptions = {}) => {
    const authHeaders = await getAuthHeader();
    const body = { itemKey, ...options };

    const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(body),
    });

    const data = await response.json();
    if (response.ok && data.url) {
        window.location.href = data.url;
    } else {
        throw new Error(data.error || 'No se pudo iniciar el pago.');
    }
};

export const createConnectAccount = async () => {
    const authHeaders = await getAuthHeader();
    const response = await fetch('/api/create-connect-account', {
        method: 'POST',
        headers: authHeaders,
    });

    const data = await response.json();
    if (response.ok && data.url) {
        window.location.href = data.url;
    } else {
        throw new Error(data.error || 'No se pudo conectar con Stripe.');
    }
};

interface CustomerPortalOptions {
    email: string;
    name: string;
    id: string;
}

export const redirectToCustomerPortal = async (options: CustomerPortalOptions) => {
    const authHeaders = await getAuthHeader();
    const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
            clientEmail: options.email,
            clientName: options.name,
            clientId: options.id
        }),
    });

    const data = await response.json();
    if (response.ok && data.url) {
        window.location.href = data.url;
    } else {
        throw new Error(data.error || 'No se pudo abrir el portal del cliente.');
    }
};

export const redirectToFreelancerPortal = async () => {
    const authHeaders = await getAuthHeader();
    const response = await fetch('/api/create-freelancer-portal-session', {
        method: 'POST',
        headers: authHeaders,
    });

    const data = await response.json();
    if (response.ok && data.url) {
        window.location.href = data.url;
    } else {
        throw new Error(data.error || 'No se pudo abrir tu portal de facturación.');
    }
};

export const redirectToConnectDashboard = async () => {
    const authHeaders = await getAuthHeader();
    const response = await fetch('/api/create-connect-dashboard-link', {
        method: 'POST',
        headers: authHeaders,
    });

    const data = await response.json();
    if (response.ok && data.url) {
        window.location.href = data.url;
    } else {
        throw new Error(data.error || 'No se pudo abrir el panel de Stripe.');
    }
};
