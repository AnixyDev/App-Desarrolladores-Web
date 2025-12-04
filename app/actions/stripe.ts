
'use server';

import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server'; // Assumes Next.js Supabase helper
import { redirect } from 'next/navigation';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function createCheckoutSession(
  priceId: string, 
  mode: 'subscription' | 'payment',
  redirectPath: string = '/dashboard'
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  // 1. Get or Create Stripe Customer
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, email, full_name')
    .eq('id', user.id)
    .single();

  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email || user.email,
      name: profile?.full_name,
      metadata: {
        supabase_user_id: user.id,
      },
    });
    customerId = customer.id;

    // Save customer ID to Supabase (bypassing RLS with service role if needed, or normal update)
    await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
  }

  // 2. Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: mode,
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}${redirectPath}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}${redirectPath}?payment=cancelled`,
    allow_promotion_codes: true,
    billing_address_collection: 'required', // Required for AEAT invoices
    tax_id_collection: {
      enabled: true, // Collect NIF/CIF
    },
    metadata: {
      supabase_user_id: user.id,
    },
  });

  if (!session.url) {
    throw new Error('Error al crear la sesión de pago');
  }

  redirect(session.url);
}

export async function createPortalSession() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Usuario no autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    throw new Error('No tienes un historial de facturación.');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/billing`,
  });

  redirect(session.url);
}
