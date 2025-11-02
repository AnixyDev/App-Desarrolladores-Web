// Archivo: /api/create-checkout-session.js

const Stripe = require('stripe');

// La función que Vercel ejecutará
module.exports = async function handler(req, res) {
  // Solo permitir peticiones POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }
  
  // Comprobación explícita de la clave secreta
  if (!process.env.STRIPE_SECRET_KEY) {
      console.error('ERROR CRÍTICO: La variable de entorno STRIPE_SECRET_KEY no está configurada en Vercel.');
      return res.status(500).json({ error: { message: 'La configuración de pagos en el servidor está incompleta. Contacta al administrador.' } });
  }

  try {
    // Carga tu CLAVE SECRETA de forma segura desde las variables de entorno de Vercel
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    const { priceId, mode, itemKey } = req.body;

    // Validación de entrada mejorada
    if (!priceId || !mode || !itemKey) {
        return res.status(400).json({ error: { message: 'Falta priceId, mode, o itemKey en la petición.' } });
    }

    // Permitir CORS para peticiones pre-flight (OPTIONS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Construcción de URLs dinámica y robusta para cualquier entorno
    const host = req.headers.host || 'localhost:3000';
    const protocol = /^localhost/.test(host) ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    console.log(`Creando sesión de Stripe para ${itemKey} en el entorno con URL base: ${baseUrl}`);
    
    // Se añade el 'itemKey' a la URL de éxito para identificar la compra en el frontend
    const success_url = `${baseUrl}?payment=success&item=${itemKey}`;
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
      metadata: { // Metadatos útiles para seguimiento en el dashboard de Stripe
          itemKey: itemKey
      }
    });

    res.status(200).json({ sessionId: session.id });

  } catch (error) {
    console.error('Stripe Error:', error.message);
    res.status(500).json({ error: { message: error.message } });
  }
}