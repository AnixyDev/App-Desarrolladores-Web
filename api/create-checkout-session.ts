// /api/create-checkout-session.ts
import { createClient } from '@supabase/supabase-js';
import { Stripe } from 'stripe';

interface ApiRequest {
  method?: string;
  body: {
    itemKey: string;
    invoiceId?: string;
    amount_cents?: number;
    description?: string;
  };
  headers: { [key: string]: string | string[] | undefined };
}

interface ApiResponse {
  status: (statusCode: number) => {
    json: (body: any) => void;
  };
}

// Validación estricta de clave secreta
if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is missing in server environment.");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase Service Role credentials missing in server environment.");
}

const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!);

// Precios definidos según el archivo CSV proporcionado (Producción)
const STRIPE_PRICES: { [key: string]: string } = {
    proPlan: 'price_1SOgUF8oC5awQy15dOEM5jGS',     // Pro Plan: 3,95 € / mes
    teamsPlan: 'price_1SOggV8oC5awQy15YW1wAgcg',   // Plan de equipos: 35,95 € / mes
    // teamsPlanYearly: 'price_1SOggV8oC5awQy15Ppz7bUj0', // Opción anual (295,00 €)
    credits100: 'price_1SOgpy8oC5awQy15TW22fBot',  // Credito 100: 1,95 €
    credits500: 'price_1SOgr18oC5awQy15o1gTM2VM',  // Credito 500: 3,95 €
    credits1000: 'price_1SOguC8oC5awQy15LGchpkVG', // Crédito 1000: 5,95 €
    featuredJob: 'price_1SOlOv8oC5awQy15Q2aXoEg7', // Oferta de empleo destacada: 5,95 €
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
        return res.status(401).json({ error: 'Authentication error: User not found' });
    }

    const { itemKey, invoiceId, amount_cents, description } = req.body;
    
    // Determinar el origen dinámicamente para soportar entornos de producción y preview
    const origin = req.headers.origin || 'https://devfreelancer.app';

    let session;
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const metadata: { [key: string]: string; } = { itemKey, user_id: user.id };
    let mode: 'subscription' | 'payment' = 'payment';

    // Lógica para seleccionar el precio correcto
    if (STRIPE_PRICES[itemKey]) {
        // Si existe un Price ID predefinido en nuestra lista constante
        const priceId = STRIPE_PRICES[itemKey];
        
        if (itemKey === 'proPlan' || itemKey === 'teamsPlan') {
            mode = 'subscription';
        }
        
        line_items.push({ price: priceId, quantity: 1 });

    } else if (itemKey === 'invoice_payment') {
        // Pagos dinámicos (Facturas personalizadas)
        if (!invoiceId || !amount_cents || !description) {
            return res.status(400).json({ error: 'Invoice details are required for payment.' });
        }
        line_items.push({ 
            price_data: { 
                currency: 'eur', 
                product_data: { name: `Pago de Factura ${description}` }, 
                unit_amount: amount_cents 
            }, 
            quantity: 1 
        });
        metadata.invoice_id = invoiceId;
    } else {
        return res.status(400).json({ error: 'Invalid item key.' });
    }

    // Obtener perfil con manejo de errores robusto
    const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single();

    if (profileError) {
        console.error(`Error CRÍTICO al obtener el perfil para el usuario ${user.id}:`, profileError.message);
        return res.status(500).json({ error: 'Fallo interno al preparar la sesión de checkout (Error de DB).' });
    }

    if (!profile) {
        console.error(`Error: Perfil no encontrado para el ID de usuario ${user.id}.`);
        return res.status(404).json({ error: 'No se encontró el perfil de usuario. Imposible crear sesión.' });
    }
    
    let customerId = profile.stripe_customer_id;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
        line_items,
        mode,
        success_url: `${origin}/#/billing?session_id={CHECKOUT_SESSION_ID}&stripe_return=true`,
        cancel_url: `${origin}/#/billing?canceled=true`,
        client_reference_id: user.id,
        metadata,
        // Forzamos recolección de dirección para facturación real si es necesario
        billing_address_collection: 'auto',
        allow_promotion_codes: true,
    };

    if (customerId) {
        sessionParams.customer = customerId;
    } else {
        sessionParams.customer_email = user.email;
        if (mode === 'subscription') {
            sessionParams.customer_creation = 'always';
        }
    }

    session = await stripe.checkout.sessions.create(sessionParams);

    res.status(200).json({ url: session.url });

  } catch (err: any) {
    console.error('Stripe session creation error:', err);
    res.status(500).json({ error: 'Payment initialization failed. Please try again.' });
  }
}