import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../lib/supabaseClient.js';

// FIX: The `/// <reference types="vite/client" />` directive was causing a type definition error.
// Casting `import.meta` to `any` allows access to Vite's environment variables without TypeScript errors.
const STRIPE_PUBLISHABLE_KEY = (import.meta as any).env.VITE_STRIPE_PUBLISHABLE_KEY;

let stripePromise: Promise<any> | null = null;
const getStripe = () => {
  if (!stripePromise && STRIPE_PUBLISHABLE_KEY) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

const getAuthToken = async (): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
        throw new Error("No estás autenticado. No se puede realizar la operación.");
    }
    return token;
};

/**
 * Redirige al usuario a la página de pago de Stripe.
 * @param itemKey La clave del producto a comprar (ej. 'proPlan')
 * @param invoiceDetails Detalles para pagos de facturas dinámicas
 */
export const redirectToCheckout = async (itemKey: string, invoiceDetails?: { invoiceId: string, amount_cents: number, description: string }) => {
  if (!STRIPE_PUBLISHABLE_KEY) {
    alert('Error de Configuración: La clave publicable de Stripe no está configurada.');
    throw new Error('La clave publicable de Stripe no está configurada.');
  }
  
  const token = await getAuthToken();

  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ itemKey, ...invoiceDetails }),
  });
  
  if (!response.ok) {
    const { error } = await response.json();
    throw new Error(error || 'No se pudo crear la sesión de pago.');
  }

  const { sessionId } = await response.json();
  const stripe = await getStripe();
  if (!stripe) {
     throw new Error('Stripe.js no se ha cargado.');
  }

  const { error } = await stripe.redirectToCheckout({ sessionId });
  if (error) {
    console.error('Error al redirigir a Stripe:', error);
    throw new Error('No se pudo redirigir a la página de pago.');
  }
};


/**
 * Inicia el proceso de onboarding de Stripe Connect.
 */
export const createConnectAccount = async () => {
    const token = await getAuthToken();
    const response = await fetch('/api/create-connect-account', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'No se pudo crear el enlace de Stripe Connect.');
    }

    const { url } = await response.json();
    window.location.href = url;
};

/**
 * Redirige a un cliente al Portal de Cliente de Stripe para gestionar sus métodos de pago.
 */
export const redirectToCustomerPortal = async (client: { email: string; name: string; id: string; }) => {
    const token = await getAuthToken();
    const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
            clientEmail: client.email, 
            clientName: client.name,
            clientId: client.id
        }),
    });
    if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'No se pudo crear el portal de cliente.');
    }
    const { url } = await response.json();
    window.location.href = url;
};
