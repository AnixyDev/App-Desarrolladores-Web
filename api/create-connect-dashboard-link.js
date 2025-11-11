// /api/create-connect-dashboard-link.js
import { createClient } from '@supabase/supabase-js';
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; 
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
        return res.status(401).json({ error: `Authentication error: ${userError?.message || 'User not found'}` });
    }

    // Get the user's Stripe Connect account ID from their profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !profile.stripe_account_id) {
      return res.status(404).json({ error: 'No se encontró una cuenta de Stripe conectada para este usuario.' });
    }

    // Create a login link for the connected account
    const loginLink = await stripe.accounts.createLoginLink(profile.stripe_account_id);
    
    // Return the URL to the frontend
    res.status(200).json({ url: loginLink.url });

  } catch (err) {
    console.error('Error al crear el enlace al panel de Stripe Connect:', err);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}
