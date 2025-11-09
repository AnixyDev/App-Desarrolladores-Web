// /api/create-connect-account.js
import { createClient } from '@supabase/supabase-js';
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);


export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. Authenticate the user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError) {
        return res.status(401).json({ error: `Authentication error: ${userError.message}` });
    }

    // 2. Create a Stripe Express account for the user.
    const account = await stripe.accounts.create({
      type: 'express',
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
       metadata: {
        user_id: user.id,
      }
    });

    // 3. Create an onboarding link for that account.
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${req.headers.origin}/#/billing`, 
      return_url: `${req.headers.origin}/?stripe_return=true#/billing`,
      type: 'account_onboarding',
    });

    // 4. Return the onboarding link URL to the frontend.
    res.status(200).json({ url: accountLink.url });

  } catch (err) {
    console.error('Error creating Stripe Connect account:', err);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}