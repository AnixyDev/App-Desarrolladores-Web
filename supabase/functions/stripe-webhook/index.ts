
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

declare const Deno: any;

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')
  const body = await req.text()

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature!, endpointSecret!)
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  // Cliente Supabase con Service Role para saltar RLS
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  switch (event.type) {
    // Caso 1: Pagos vía Stripe Checkout (Redirección)
    case 'checkout.session.completed': {
      const session = event.data.object
      const userId = session.metadata?.supabase_user_id
      const itemKey = session.metadata?.itemKey

      if (userId) {
        if (session.mode === 'subscription') {
          // Actualizar perfil con datos de suscripción
          const planName = itemKey?.includes('teams') ? 'Teams' : 'Pro';
          await supabaseAdmin.from('profiles').update({
            stripe_subscription_id: session.subscription,
            stripe_customer_id: session.customer,
            plan: planName,
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Placeholder
          }).eq('id', userId)
        } 
        else if (session.mode === 'payment') {
          // Compra de Créditos
          if (itemKey?.startsWith('aiCredits')) {
             let amount = 0;
             if(itemKey === 'aiCredits100') amount = 100;
             if(itemKey === 'aiCredits500') amount = 500;
             if(itemKey === 'aiCredits1000') amount = 1000;
             
             if(amount > 0) {
               await supabaseAdmin.rpc('increment_credits', { user_id: userId, amount: amount })
             }
          }
          // Pago de Factura vía Checkout (Fallback)
          if (session.metadata?.invoice_id) {
             await supabaseAdmin.from('invoices').update({
               paid: true,
               payment_date: new Date().toISOString(),
               stripe_payment_intent_id: session.payment_intent
             }).eq('id', session.metadata.invoice_id)
          }
        }
      }
      break
    }

    // Caso 2: Pagos vía Payment Element (Embebido)
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object
      const invoiceId = paymentIntent.metadata?.invoice_id
      
      // Si el payment intent tiene un ID de factura en los metadatos, actualizamos la factura
      if (invoiceId) {
         await supabaseAdmin.from('invoices').update({
           paid: true,
           payment_date: new Date().toISOString(),
           stripe_payment_intent_id: paymentIntent.id
         }).eq('id', invoiceId)
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object
      const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('stripe_subscription_id', subscription.id).single();
      
      if(profile) {
          const status = subscription.status === 'active' ? 'Pro' : 'Free';
          await supabaseAdmin.from('profiles').update({ 
              plan: status,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
          }).eq('id', profile.id)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      await supabaseAdmin.from('profiles').update({ plan: 'Free' }).eq('stripe_subscription_id', subscription.id)
      break
    }
  }

  return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
})
