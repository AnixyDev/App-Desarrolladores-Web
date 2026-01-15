import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'

declare const Deno: any;

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2022-11-15',
})
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')
  const body = await req.text()

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature!, endpointSecret!)
  } catch (err: any) {
    console.error(`❌ Error de firma: ${err.message}`)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any
      const userId = session.metadata?.supabase_user_id
      const itemKey = session.metadata?.itemKey

      if (userId) {
        // 1. Dashboard de Admin
        try {
          await supabaseAdmin.from('platform_payments').insert({
            user_id: userId,
            user_email: session.customer_details?.email,
            plan_name: itemKey || 'Desconocido',
            amount_cents: session.amount_total,
            stripe_session_id: session.id
          })
        } catch (dbError) {
          console.error('Error Dashboard:', dbError);
        }

        // 2. Lógica de Suscripciones - AQUÍ SE ACTUALIZA TU PLAN
        if (session.mode === 'subscription') {
          const planName = itemKey?.includes('teams') ? 'Teams' : 'Pro';
          await supabaseAdmin.from('profiles').update({
            stripe_subscription_id: session.subscription,
            stripe_customer_id: session.customer,
            plan: planName,
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }).eq('id', userId)
          console.log(`✅ Plan Pro/Teams activado para ${userId}`);
        } 
        
        // 3. Lógica de Créditos IA
        else if (session.mode === 'payment') {
          if (itemKey?.startsWith('aiCredits')) {
             let amount = 0;
             if(itemKey === 'aiCredits100') amount = 100;
             if(itemKey === 'aiCredits500') amount = 500;
             if(itemKey === 'aiCredits1000') amount = 1000;
             
             if(amount > 0) {
               await supabaseAdmin.rpc('increment_credits', { user_id: userId, amount: amount })
             }
          }
          
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

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as any
      await supabaseAdmin.from('profiles').update({ plan: 'Free' }).eq('stripe_subscription_id', subscription.id)
      break
    }
  }

  return new Response(JSON.stringify({ received: true }), { 
    headers: { 'Content-Type': 'application/json' },
    status: 200 
  })
})