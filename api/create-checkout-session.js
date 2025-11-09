// /api/create-checkout-session.js
// IMPORTANTE: Para que esto funcione, necesitas instalar la librería de Stripe en tu proyecto:
// > npm install stripe
// Y configurar la variable de entorno `STRIPE_SECRET_KEY` en Vercel.

const Stripe = require('stripe');

// La clave secreta NUNCA debe estar aquí. Se lee de las variables de entorno.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Aquí debes mapear los `itemKey` del frontend a los IDs de precios REALES (live) de tu dashboard de Stripe.
// Estos son los datos que me proporcionarías en el archivo .csv.
// He dejado los de prueba como ejemplo. ¡DEBES REEMPLAZARLOS!
const LIVE_PRICE_IDS = {
    proPlan: 'price_1SOgUF8oC5awQy15dOEM5jGS',
    teamsPlan: 'price_1SOggV8oC5awQy15YW1wAgcg',
    aiCredits100: 'price_1SOgpy8oC5awQy15TW22fBot',
    aiCredits500: 'price_1SOgr18oC5awQy15o1gTM2VM',
    aiCredits1000: 'price_1SOguC8oC5awQy15LGchpkVG',
    featuredJobPost: 'price_1SOlOv8oC5awQy15Q2aXoEg7',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { itemKey, extraParams } = req.body;
    
    if (!itemKey) {
        return res.status(400).json({ error: 'Falta el itemKey' });
    }

    // Construye las URLs de éxito y cancelación.
    const successUrl = new URL(`${req.headers.origin}/?payment=success&item=${itemKey}`);
    const cancelUrl = new URL(`${req.headers.origin}/?payment=cancelled`);

    // Añade los parámetros extra a la URL de éxito para que el frontend pueda procesarlos.
    if (extraParams) {
        for (const key in extraParams) {
            successUrl.searchParams.append(key, extraParams[key]);
        }
    }
    
    let line_items = [];
    const mode = (itemKey === 'proPlan' || itemKey === 'teamsPlan') ? 'subscription' : 'payment';

    // --- Lógica de Creación de la Sesión ---
    if (itemKey === 'invoicePayment') {
        // Lógica para pagos dinámicos (facturas)
        // EN UNA APP REAL: Aquí buscarías la factura en tu base de datos usando `extraParams.invoice_id`
        // para obtener el importe y la descripción real.
        // Para esta simulación, usaremos datos de ejemplo.
        const amount_cents = 145200; // Ejemplo: 145.20 EUR
        const description = `Pago de Factura #${extraParams.invoice_id || '0000'}`;
        
        line_items.push({
            price_data: {
                currency: 'eur',
                product_data: {
                    name: description,
                },
                unit_amount: amount_cents,
            },
            quantity: 1,
        });

    } else {
        // Lógica para productos predefinidos
        const priceId = LIVE_PRICE_IDS[itemKey];
        if (!priceId) {
            return res.status(400).json({ error: 'Producto no válido.' });
        }
        line_items.push({
            price: priceId,
            quantity: 1,
        });
    }

    // Crea la sesión de Checkout en Stripe
    const session = await stripe.checkout.sessions.create({
        line_items,
        mode,
        success_url: successUrl.toString() + '#/', // Añadimos el hash para la compatibilidad con HashRouter
        cancel_url: cancelUrl.toString() + '#/',
        // billing_address_collection: 'required', // Opcional: para recoger dirección de facturación
    });
    
    // Devuelve el ID de la sesión al frontend
    res.status(200).json({ sessionId: session.id });

  } catch (err) {
    console.error('Error al crear la sesión de Stripe:', err);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}
