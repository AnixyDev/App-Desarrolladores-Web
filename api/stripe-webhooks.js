// /api/stripe-webhooks.js
import { createClient } from '@supabase/supabase-js';
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
// This secret is used to verify that the webhook request is coming from Stripe.
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);


// Helper function to buffer the request body
async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// Disable the default body parser for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const userId = session.client_reference_id;
      const { itemKey, invoice_id } = session.metadata;

      console.log(`Processing successful checkout for user ${userId}, item: ${itemKey}, mode: ${session.mode}`);

      try {
        if (session.mode === 'subscription') {
            const plan = itemKey === 'proPlan' ? 'Pro' : itemKey === 'teamsPlan' ? 'Teams' : null;
            if (plan) {
                await supabaseAdmin.from('profiles').update({ plan }).eq('id', userId);
            }
        } else if (session.mode === 'payment') {
            if (itemKey.startsWith('credits')) {
                const amount = parseInt(itemKey.replace('credits', ''), 10);
                const { data: profile } = await supabaseAdmin.from('profiles').select('ai_credits').eq('id', userId).single();
                if (profile) {
                    await supabaseAdmin.from('profiles').update({ ai_credits: (profile.ai_credits || 0) + amount }).eq('id', userId);
                }
            } else if (itemKey === 'invoice_payment' && invoice_id !== 'N/A') {
                await supabaseAdmin.from('invoices').update({ paid: true, payment_date: new Date().toISOString() }).eq('id', invoice_id).eq('user_id', userId);
            } else if (itemKey === 'featuredJob') {
                console.log(`User ${userId} paid for a featured job post.`);
            }
        }
      } catch (dbError) {
          console.error('Database update failed after payment:', dbError);
          return res.status(500).json({ error: 'Database update failed.' });
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).json({ received: true });
}
