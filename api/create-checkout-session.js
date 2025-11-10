// /api/create-checkout-session.js
import { createClient } from '@supabase/supabase-js';
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; 
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const priceMap = {
    proPlan: process.env.STRIPE_PRO_PLAN_PRICE_ID || 'price_1SOgUF8oC5awQy15dOEM5jGS', 
    teamsPlan: process.env.STRIPE_TEAMS_PLAN_PRICE_ID || 'price_1SOggV8oC5awQy15YW1wAgcg',
    credits50: process.env.STRIPE_CREDITS50_PRICE_ID || 'price_1SOgpD8oC5awQy15iZf9L6oM',
    credits200: process.env.STRIPE_CREDITS200_PRICE_ID || 'price_1SOgqP8oC5awQy15aQf1vN3v',
    credits1000: process.env.STRIPE_CREDITS1000_PRICE_ID || 'price_1SOguC8oC5awQy15LGchpkVG',
    featuredJob: process.env.STRIPE_FEATURED_JOB_PRICE_ID || 'price_1SOlOv8oC5awQy15Q2aXoEg7',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { itemKey, invoiceId, amount_cents, description } = req.body;
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
        return res.status(401).json({ error: `Authentication error: ${userError?.message || 'User not found'}` });
    }
    
    // --- Get or Create Stripe Customer for ALL payment types ---
    const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single();

    if (profileError && profileError.code !== 'PGRST116') { // Ignore 'not found' error
        throw profileError;
    }

    let stripeCustomerId = profile?.stripe_customer_id;
    
    if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
            email: user.email,
            name: user.user_metadata.full_name,
            metadata: { supabase_user_id: user.id },
        });
        stripeCustomerId = customer.id;

        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ stripe_customer_id: stripeCustomerId })
            .eq('id', user.id);
        
        if (updateError) {
            console.error('Error updating profile with Stripe customer ID:', updateError);
            throw new Error('Could not link Stripe customer to user profile.');
        }
    }
    
    const isSubscription = ['proPlan', 'teamsPlan'].includes(itemKey);
    let line_items;
    
    if (itemKey === 'invoice_payment' && invoiceId && amount_cents) {
        line_items = [{
            price_data: {
                currency: 'eur',
                product_data: {
                    name: `Pago de Factura ${description || invoiceId}`,
                },
                unit_amount: amount_cents,
            },
            quantity: 1,
        }];
    } else if (priceMap[itemKey]) {
        line_items = [{ price: priceMap[itemKey], quantity: 1 }];
    } else {
        return res.status(400).json({ error: 'Producto o factura no válido.' });
    }
    
    const sessionOptions = {
        payment_method_types: ['card'],
        line_items,
        mode: isSubscription ? 'subscription' : 'payment',
        success_url: `${req.headers.origin}/#/billing?payment_status=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/#/billing?payment_status=cancelled`,
        customer: stripeCustomerId, // Use the customer ID for all sessions
        client_reference_id: user.id,
        allow_promotion_codes: true,
        metadata: {
            itemKey: itemKey || 'invoice_payment',
            invoice_id: invoiceId || 'N/A',
        }
    };
    
    const session = await stripe.checkout.sessions.create(sessionOptions);

    res.status(200).json({ sessionId: session.id, url: session.url });

  } catch (err) {
    console.error('Error al crear la sesión de Stripe:', err);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}