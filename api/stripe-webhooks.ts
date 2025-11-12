// /api/stripe-webhooks.ts
import { createClient } from '@supabase/supabase-js';
import { Stripe } from 'stripe';
import type { Readable } from 'node:stream';
// FIX: Import Buffer to make it available in this module's scope.
import { Buffer } from 'node:buffer';

interface ApiRequest extends Readable {
  headers: { [key: string]: string | string[] | undefined };
  method?: string;
}

interface ApiResponse {
  status: (statusCode: number) => {
    json: (body: any) => void;
    send: (body: any) => void;
  };
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!);

async function buffer(readable: Readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig!, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      const stripeCustomerId = session.customer;
      const { itemKey, invoice_id } = session.metadata || {};

      if (!userId || !stripeCustomerId) {
          console.error("Missing userId or stripeCustomerId in webhook");
          return res.status(400).json({ error: 'Missing user or customer ID.' });
      }

      console.log(`Processing successful checkout for user ${userId}, item: ${itemKey}, mode: ${session.mode}`);

      try {
        if (session.mode === 'subscription') {
            const plan = itemKey === 'proPlan' ? 'Pro' : itemKey === 'teamsPlan' ? 'Teams' : null;
            if (plan) {
                const { error } = await supabaseAdmin
                    .from('profiles')
                    .update({ 
                        plan: plan,
                        stripe_customer_id: stripeCustomerId as string
                    })
                    .eq('id', userId);
                if (error) throw error;
            }
        } else if (session.mode === 'payment') {
            if (itemKey?.startsWith('credits')) {
                const amount = parseInt(itemKey.replace('credits', ''), 10);
                const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('ai_credits').eq('id', userId).single();
                if (profileError) throw profileError;

                if (profile) {
                    const { error: updateError } = await supabaseAdmin.from('profiles').update({ ai_credits: (profile.ai_credits || 0) + amount }).eq('id', userId);
                    if (updateError) throw updateError;
                }
            } else if (itemKey === 'invoice_payment' && invoice_id && invoice_id !== 'N/A') {
                const { error } = await supabaseAdmin.from('invoices').update({ paid: true, payment_date: new Date().toISOString() }).eq('id', invoice_id).eq('user_id', userId);
                if (error) throw error;
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
