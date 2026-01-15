import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Usamos una inicialización más estándar para evitar errores de compilación en Vercel
// Si '2025-12-15.clover' te da problemas, cámbialo a una versión estable como '2023-10-16'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any, 
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, userId, itemKey, metadata } = body;

    // Validación rigurosa
    if (!amount || !userId || !itemKey) {
      return NextResponse.json(
        { error: 'Faltan parámetros obligatorios' },
        { status: 400 }
      );
    }

    // Creación del PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Aseguramos que sea un entero
      currency: 'eur',
      metadata: {
        supabase_user_id: userId,
        itemKey: itemKey,
        ...(metadata || {}), // Evitamos errores si metadata es null
      },
      automatic_payment_methods: { 
        enabled: true 
      },
    });
    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret 
    });

  } catch (error: any) {
    console.error('Stripe PaymentIntent Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno al procesar el pago' }, 
      { status: 500 }
    );
  }
} 