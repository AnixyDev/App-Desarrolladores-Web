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

// En producción, estos IDs deben ser los Price IDs reales de tu Dashboard de Stripe (Live Mode)
const productPrices: { [key: string]: string } = {
    proPlan: process.env.PRO_PLAN_PRICE_ID || '', 
    teamsPlan: process.env.TEAMS_PLAN_PRICE_ID || '', 
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

    switch(itemKey) {
        case 'proPlan':
        case 'teamsPlan':
            if (!productPrices[itemKey]) {
                return res.status(500).json({ error: `Price ID for ${itemKey} not configured on server.` });
            }
            mode = 'subscription';
            line_items.push({ price: productPrices[itemKey], quantity: 1 });
            break;
        case 'credits50':
            line_items.push({ price_data: { currency: 'eur', product_data: { name: '50 AI Credits' }, unit_amount: 500 }, quantity: 1 });
            break;
        case 'credits200':
            line_items.push({ price_data: { currency: 'eur', product_data: { name: '200 AI Credits' }, unit_amount: 1500 }, quantity: 1 });
            break;
        case 'credits1000':
            line_items.push({ price_data: { currency: 'eur', product_data: { name: '1000 AI Credits' }, unit_amount: 5000 }, quantity: 1 });
            break;
        case 'featuredJob':
             line_items.push({ price_data: { currency: 'eur', product_data: { name: 'Featured Job Post' }, unit_amount: 595 }, quantity: 1 });
            break;
        case 'invoice_payment':
            if (!invoiceId || !amount_cents || !description) {
                return res.status(400).json({ error: 'Invoice details are required for payment.' });
            }
            line_items.push({ price_data: { currency: 'eur', product_data: { name: `Payment for Invoice ${description}` }, unit_amount: amount_cents }, quantity: 1 });
            metadata.invoice_id = invoiceId;
            break;
        default:
            return res.status(400).json({ error: 'Invalid item key.' });
    }

    const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('stripe_customer_id').eq('id', user.id).single();
    
    let customerId = profile?.stripe_customer_id;

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