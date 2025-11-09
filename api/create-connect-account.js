// /api/create-connect-account.js
// Esta función crea una cuenta de Stripe Connect y un enlace para que el usuario se registre.
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. Crear una cuenta de Stripe Express para el usuario.
    // En una app real, podrías pasar el email del usuario y pre-rellenar datos.
    const account = await stripe.accounts.create({
      type: 'express',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // 2. Crear un enlace de onboarding para esa cuenta.
    // El usuario será redirigido a este enlace para completar el formulario de Stripe.
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${req.headers.origin}/billing`, // A dónde volver si el enlace expira
      // A dónde volver cuando el usuario complete el onboarding.
      // Añadimos un parámetro para que el frontend sepa que el usuario está volviendo.
      return_url: `${req.headers.origin}/?stripe_return=true#/billing`,
      type: 'account_onboarding',
    });

    // 3. Devolver la URL del enlace de onboarding al frontend.
    res.status(200).json({ url: accountLink.url });

  } catch (err) {
    console.error('Error al crear la cuenta de Stripe Connect:', err);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}