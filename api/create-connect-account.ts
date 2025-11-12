// /api/create-connect-account.ts
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
        return res.status(401).json({ error: `Authentication error: ${userError.message}` });
    }

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

    const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ stripe_account_id: account.id })
        .eq('id', user.id);

    if (updateError) {
        console.error('Error updating profile with Stripe Account ID:', updateError);
    }

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${req.headers.origin}/#/billing`, 
      return_url: `${req.headers.origin}/?stripe_return=true#/billing`,
      type: 'account_onboarding',
    });

    res.status(200).json({ url: accountLink.url });

  } catch (err: any) {
    console.error('Error creating Stripe Connect account:', err);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}
