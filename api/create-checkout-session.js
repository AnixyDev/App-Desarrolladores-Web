// /api/create-checkout-session.js
import { createClient } from '@supabase/supabase-js';
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; 
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const priceMap = {
    proPlan: 'price_1SOgUF8oC5awQy15dOEM5jGS', // Example price ID
    teamsPlan: 'price_1SOggV8oC5awQy15YW1wAgcg', // Example price ID
    credits50: 'price_1SOgpD8oC5awQy15iZf9L6oM', // Example price ID for 50 credits
    credits200: 'price_1SOgqP8oC5awQy15aQf1vN3v', // Example price ID for 200 credits
    credits1000: 'price_1SOguC8oC5awQy15LGchpkVG', // Example price ID for 1000 credits
    featuredJob: 'price_1SOlOv8oC5awQy15Q2aXoEg7', // Example price ID
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

    if (userError) {
        return res.status(401).json({ error: `Authentication error: ${userError.message}` });
    }
    
    let line_items;
    
    if (itemKey === 'invoice_payment' && invoiceId && amount_cents) {
        line_items = [{
            price_data: {
                currency: 'eur',
                product_data: {
                    name: `Factura ${description || invoiceId}`,
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

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${req.headers.origin}/`,
      cancel_url: `${req.headers.origin}/`,
      client_reference_id: user.id, // CRUCIAL for webhooks
      metadata: {
        itemKey: itemKey || 'invoice_payment',
        invoice_id: invoiceId || 'N/A',
      }
    });

    res.status(200).json({ sessionId: session.id, url: session.url });

  } catch (err) {
    console.error('Error al crear la sesión de Stripe:', err);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}