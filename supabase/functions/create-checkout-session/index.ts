
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

declare const Deno: any;

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    
    // Obtener usuario autenticado
    const { data: { user } } = await supabaseClient.auth.getUser()
    
    // NOTA: Para el portal de clientes (pagar factura), a veces el usuario NO está logueado en la app principal.
    // En un caso real, deberíamos permitir pagos sin auth si tenemos un token seguro de factura.
    // Por simplicidad aquí, asumimos que si hay un user lo usamos, si no, creamos un cliente "guest" o pedimos email en el checkout.
    
    const { priceId, mode, metadata, amount, productName } = await req.json()

    let customerId;
    let customerEmail;

    if (user) {
        customerEmail = user.email;
        // Obtener perfil para ver si ya tiene customer_id
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('stripe_customer_id, full_name')
          .eq('id', user.id)
          .single()

        customerId = profile?.stripe_customer_id

        // Crear cliente en Stripe si no existe y es usuario registrado
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: user.email,
            name: profile?.full_name,
            metadata: { supabase_user_id: user.id },
          })
          customerId = customer.id
          
          const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '', 
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
          )
          await supabaseAdmin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
        }
    }

    // Construir line_items
    let line_items;
    if (priceId) {
        // Producto predefinido (Suscripción o Créditos)
        line_items = [{ price: priceId, quantity: 1 }];
    } else if (amount && productName) {
        // Precio dinámico (Factura)
        line_items = [{
            price_data: {
                currency: 'eur',
                product_data: {
                    name: productName,
                },
                unit_amount: amount, // en céntimos
            },
            quantity: 1,
        }];
    } else {
        throw new Error('Falta priceId o amount/productName');
    }

    const sessionConfig: any = {
      line_items: line_items,
      mode: mode,
      success_url: `${req.headers.get('origin')}/?payment=success&session_id={CHECKOUT_SESSION_ID}&item=${metadata.itemKey}${metadata.invoice_id ? `&invoice_id=${metadata.invoice_id}` : ''}`,
      cancel_url: `${req.headers.get('origin')}/?payment=cancelled`,
      metadata: { 
          supabase_user_id: user?.id, // Puede ser undefined si es guest
          ...metadata 
      },
      allow_promotion_codes: mode === 'subscription', // Solo permitir cupones en suscripciones
    };

    if (customerId) {
        sessionConfig.customer = customerId;
    } else {
        // Si no es cliente registrado, Stripe recolectará el email o usará customer_email si lo pasamos
        sessionConfig.customer_creation = 'if_required'; 
    }
    
    // Configuración fiscal
    if (mode === 'subscription' || amount) {
        sessionConfig.billing_address_collection = 'required';
        sessionConfig.tax_id_collection = { enabled: true };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
