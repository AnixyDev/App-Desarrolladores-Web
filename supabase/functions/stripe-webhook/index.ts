
// supabase/functions/stripe-webhook/index.ts
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
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  // Admin Client para escribir en la DB ignorando RLS si es necesario
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const userId = session.metadata?.supabase_user_id
      
      // Lógica: Actualizar suscripción o añadir créditos
      if (session.mode === 'subscription') {
        await supabaseAdmin.from('profiles').update({
          stripe_subscription_id: session.subscription,
          plan: 'Pro' // Aquí deberías mapear priceId a nombre del plan
        }).eq('id', userId)
      } else if (session.mode === 'payment') {
        // Ejemplo: Añadir créditos si es un pago único
        if (session.metadata?.itemKey === 'aiCredits500') {
           // Usamos RPC (stored procedure) para incrementar de forma atómica
           await supabaseAdmin.rpc('increment_credits', { user_id: userId, amount: 500 })
        }
      }
      break
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      // Sincronizar estado
      const userId = subscription.metadata?.supabase_user_id 
      // Nota: Stripe a veces no envía metadata en la subscription obj, hay que recuperarla del customer o buscar el usuario por stripe_customer_id
      const customerId = subscription.customer
      
      const status = subscription.status === 'active' ? 'Pro' : 'Free'
      
      await supabaseAdmin.from('profiles')
        .update({ plan: status })
        .eq('stripe_customer_id', customerId)
      break
    }
  }

  return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
})
