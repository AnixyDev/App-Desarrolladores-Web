import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Inicialización de Stripe con la clave secreta y versión específica requerida
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover' as any,
});

export async function POST(req: Request) {
  try {
    // Extraemos los datos obligatorios del cuerpo de la petición
    const { amount, userId, itemKey, metadata } = await req.json();

    // Validación básica de entrada
    if (!amount || !userId || !itemKey) {
      return NextResponse.json(
        { error: 'Faltan parámetros obligatorios (amount, userId, itemKey)' },
        { status: 400 }
      );
    }

    // Creación del PaymentIntent
    // 'automatic_payment_methods' permite que Stripe muestre dinámicamente métodos como Tarjeta o Revolut Pay
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // El valor ya viene en céntimos desde el frontend
      currency: 'eur',
      metadata: {
        supabase_user_id: userId,
        itemKey: itemKey,
        ...metadata, // Incluimos metadatos adicionales como invoice_id si existen
      },
      automatic_payment_methods: { 
        enabled: true 
      },
    });

    // Retornamos el clientSecret necesario para montar el PaymentElement en el cliente
    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret 
    });

  } catch (error: any) {
    // Registro detallado del error en servidor y respuesta segura al cliente
    console.error('Stripe PaymentIntent Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno al procesar el pago' }, 
      { status: 500 }
    );
  }
}
