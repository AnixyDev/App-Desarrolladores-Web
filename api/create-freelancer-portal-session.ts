// /api/create-freelancer-portal-session.ts
import { createClient } from '@supabase/supabase-js';
import { Stripe } from 'stripe';

interface ApiRequest {
  method?: string;
  headers: { [key: string]: string | string[] | undefined };
}

interface ApiResponse {
  status: (statusCode: number) => {
    json: (body: any) => void;
  };
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; 
const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!);

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    // FIX: Handle case where authHeader can be string[]
    if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
        return res.status(401).json({ error: `Authentication error: ${userError?.message || 'User not found'}` });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !profile.stripe_customer_id) {
      return res.status(404).json({ error: 'No se encontró un perfil de cliente de Stripe. Asegúrate de tener un plan activo.' });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${req.headers.origin}/#/billing`,
    });
    
    res.status(200).json({ url: portalSession.url });

  } catch (err: any) {
    console.error('Error al crear la sesión del portal del freelancer:', err);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}
