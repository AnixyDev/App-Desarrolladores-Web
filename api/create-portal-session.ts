// /api/create-portal-session.ts
import { Stripe } from 'stripe';

interface ApiRequest {
  method?: string;
  body: {
    clientEmail: string;
    clientName: string;
    clientId: string;
  };
  headers: { [key: string]: string | string[] | undefined };
}

interface ApiResponse {
  status: (statusCode: number) => {
    json: (body: any) => void;
  };
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { clientEmail, clientName, clientId } = req.body;

    if (!clientEmail || !clientName || !clientId) {
      return res.status(400).json({ error: 'Faltan datos del cliente.' });
    }
    
    let customers = await stripe.customers.list({
      email: clientEmail,
      limit: 1,
    });
    
    let customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: clientEmail,
        name: clientName,
        metadata: {
          app_client_id: clientId,
        },
      });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${req.headers.origin}/?stripe_portal_return=true#/clients/${clientId}`,
    });
    
    res.status(200).json({ url: portalSession.url });

  } catch (err: any) {
    console.error('Error al crear la sesión del portal de Stripe:', err);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}
