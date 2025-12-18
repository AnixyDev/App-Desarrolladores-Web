import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover' as any, // La versión específica mencionada en el dashboard
});

export async function POST(req: Request) {
  try {
    const { amount, userId, itemKey } = await req.json();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // en céntimos
      currency: 'eur',
      metadata: {
        supabase_user_id: userId,
        itemKey: itemKey,
      },
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error('Error Stripe:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}