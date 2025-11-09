// /api/create-portal-session.js
// Esta función crea una sesión del Portal de Cliente de Stripe.
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { clientEmail, clientName, clientId } = req.body;

    if (!clientEmail || !clientName || !clientId) {
      return res.status(400).json({ error: 'Faltan datos del cliente.' });
    }
    
    // 1. Buscar si ya existe un cliente en Stripe con ese email
    let customers = await stripe.customers.list({
      email: clientEmail,
      limit: 1,
    });
    
    let customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      // 2. Si no existe, crearlo
      customer = await stripe.customers.create({
        email: clientEmail,
        name: clientName,
        // Almacenamos nuestro ID interno en los metadatos de Stripe para futuras referencias
        metadata: {
          app_client_id: clientId,
        },
      });
    }

    // 3. Crear una sesión del Portal de Cliente
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      // La URL a la que volverá el cliente tras gestionar sus datos.
      // Añadimos un parámetro para que el frontend sepa que el proceso fue exitoso.
      return_url: `${req.headers.origin}/?stripe_portal_return=true#/clients/${clientId}`,
    });
    
    // 4. Devolver la URL de la sesión del portal al frontend.
    res.status(200).json({ url: portalSession.url });

  } catch (err) {
    console.error('Error al crear la sesión del portal de Stripe:', err);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}