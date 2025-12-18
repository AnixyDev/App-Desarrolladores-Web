
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // Actualiza esto a la versión 2025-12-15.clover o la que decidas marcar como predeterminada
  apiVersion: '2025-12-15.clover', 
});

// Admin Client (Service Role) para saltar RLS y actualizar datos de usuario
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const headerList = await headers(); // Await headers in Next.js 15+
  const sig = headerList.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error(`❌ Webhook Error: ${(err as Error).message}`);
    return new NextResponse(`Webhook Error: ${(err as Error).message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      // EVENTO: Pago exitoso (Suscripción o Pago Único)
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const itemKey = session.metadata?.itemKey; // Clave del producto (ej: aiCredits500)

        if (userId) {
            // Manejo de Suscripciones
            if (session.mode === 'subscription') {
                await supabaseAdmin
                    .from('profiles')
                    .update({
                        stripe_subscription_id: session.subscription as string,
                        plan: itemKey?.includes('teams') ? 'Teams' : 'Pro',
                        stripe_customer_id: session.customer as string,
                        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Aproximación, ideal usar webhook de invoice
                    })
                    .eq('id', userId);
            } 
            // Manejo de Pagos Únicos (Créditos IA)
            else if (session.mode === 'payment' && itemKey) {
                let creditsToAdd = 0;
                if (itemKey === 'aiCredits100') creditsToAdd = 100;
                if (itemKey === 'aiCredits500') creditsToAdd = 500;
                if (itemKey === 'aiCredits1000') creditsToAdd = 1000;

                if (creditsToAdd > 0) {
                    await supabaseAdmin.rpc('increment_credits', { user_id: userId, amount: creditsToAdd });
                }
            }
        }
        break;
      }

      // EVENTO: Suscripción actualizada/renovada
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await supabaseAdmin
          .from('profiles')
          .update({ 
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            plan: subscription.status === 'active' ? 'Pro' : 'Free' // Simplificado, mejor verificar priceId
          })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }

      // EVENTO: Suscripción cancelada
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await supabaseAdmin
          .from('profiles')
          .update({ plan: 'Free' })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }
    }
  } catch (error) {
    console.error('Error processing webhook logic:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }

  return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
}
