import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

// Fix for "Cannot find name 'Deno'" in Supabase Edge Functions environment
declare const Deno: any;

// Configuración de encabezados CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Manejo de peticiones Preflight (OPTIONS)
  // Esto es vital para evitar el error de "bloqueo por CORS" en el navegador
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200, 
      headers: corsHeaders 
    })
  }

  try {
    // Inicialización de Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Inicialización del cliente Supabase con el token del usuario
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    
    // Obtener el usuario autenticado
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    // Extraer datos del cuerpo de la petición
    const { priceId, mode, metadata, amount, productName } = await req.json()

    // Origen oficial de la aplicación
    const origin = 'https://devfreelancer.app'

    // Obtener o crear el Customer ID de Stripe
    let customerId;
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('stripe_customer_id, full_name')
      .eq('id', user.id)
      .single()

    customerId = profile?.stripe_customer_id
    
    if (!customerId) {
      // Crear cliente en Stripe si no existe
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.full_name || user.user_metadata?.full_name,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      
      // Actualizar el perfil usando Service Role para bypass de RLS
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!, 
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )
      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Configurar los items del checkout
    // Si hay priceId usamos el producto predefinido (suscripciones), sino usamos precio dinámico (facturas/créditos)
    const line_items = priceId ? [{ price: priceId, quantity: 1 }] : [{
        price_data: {
            currency: 'eur',
            product_data: { name: productName || 'Servicio DevFreelancer' },
            unit_amount: amount,
        },
        quantity: 1,
    }]

    // Crear la sesión de Checkout de Stripe
    const session = await stripe.checkout.sessions.create({
      line_items,
      mode,
      customer: customerId,
      success_url: `${origin}/billing?payment=success&session_id={CHECKOUT_SESSION_ID}&item=${metadata?.itemKey || ''}${metadata?.invoice_id ? `&invoice_id=${metadata.invoice_id}` : ''}`,
      cancel_url: `${origin}/billing?payment=cancelled`,
      metadata: { 
        supabase_user_id: user.id,
        ...metadata 
      },
      allow_promotion_codes: mode === 'subscription',
      billing_address_collection: 'required',
    })

    // Respuesta de éxito
    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('Checkout Error:', error.message)
    // Es crítico devolver los encabezados CORS incluso en el error
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})