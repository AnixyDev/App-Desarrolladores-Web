import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover' as any, // La versión específica mencionada en el dashboard
});

export async function POST(req: Request) {
  try {
    // Extract metadata from the request body to allow custom data like invoice_id to be stored in Stripe.
    const { amount, userId, itemKey, metadata } = await req.json();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // en céntimos
      currency: 'eur',
      metadata: {
        supabase_user_id: userId,
        itemKey: itemKey,
        ...metadata, // Merge custom metadata into the Stripe object.
      },
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error('Error Stripe:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}