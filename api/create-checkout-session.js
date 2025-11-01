// Archivo: /api/create-checkout-session.js

const Stripe = require('stripe');

// La función que Vercel ejecutará
module.exports = async function handler(req, res) {
  // Solo permitir peticiones POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }
  
  // --- MEJORA: Comprobación explícita de la clave secreta ---
  if (!process.env.STRIPE_SECRET_KEY) {
      console.error('ERROR CRÍTICO: La variable de entorno STRIPE_SECRET_KEY no está configurada en Vercel.');
      return res.status(500).json({ error: { message: 'La configuración de pagos en el servidor está incompleta. Contacta al administrador.' } });
  }

  try {
    // --- MEJORA: Mover la inicialización dentro del try...catch ---
    // Carga tu CLAVE SECRETA de forma segura desde las variables de entorno de Vercel
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    const { priceId, mode } = req.body;

    // Validación de entrada
    if (!priceId || !mode) {
        return res.status(400).json({ error: { message: 'Falta priceId o mode en la petición.' } });
    }

    // Permitir CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Construcción de URLs más robusta
    const vercelUrl = process.env.VERCEL_URL;
    let baseUrl = vercelUrl ? `https://${vercelUrl}` : 'http://localhost:3000';
    if (vercelUrl && (vercelUrl.startsWith('https://') || vercelUrl.startsWith('http://'))) {
        baseUrl = vercelUrl;
    }

    const success_url = `${baseUrl}?payment=success`;
    const cancel_url = `${baseUrl}/#/billing?payment=cancelled`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: mode,
      success_url: success_url,
      cancel_url: cancel_url,
    });

    res.status(200).json({ sessionId: session.id });

  } catch (error) {
    console.error('Stripe Error:', error.message);
    res.status(500).json({ error: { message: error.message } });
  }
}
