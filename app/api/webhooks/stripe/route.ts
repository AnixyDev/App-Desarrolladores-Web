
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Initialize Supabase Admin (Service Role) to bypass RLS for webhook updates
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const sig = headers().get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    // 1. Verify Signature (Security Critical)
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error(`❌ Webhook Error: ${(err as Error).message}`);
    return new NextResponse(`Webhook Error: ${(err as Error).message}`, { status: 400 });
  }

  // 2. Handle Event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;

        if (session.mode === 'subscription' && userId) {
          // Update profile with subscription status
          await supabaseAdmin
            .from('profiles')
            .update({
              stripe_subscription_id: session.subscription as string,
              plan_status: 'active', // Determine plan based on price ID logic if needed
              stripe_customer_id: session.customer as string,
            })
            .eq('id', userId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const status = subscription.status === 'active' ? 'active' : 'inactive';
        
        // Sync status to DB
        await supabaseAdmin
          .from('profiles')
          .update({ 
            plan_status: status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
          })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await supabaseAdmin
          .from('profiles')
          .update({ plan_status: 'cancelled' })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }
      
      // Handle invoice.payment_succeeded to create a fiscal entry in the future
      case 'invoice.payment_succeeded':
        // Logic to insert into fiscal_entries automatically for the SaaS subscription fee
        break;

      default:
        console.warn(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }

  return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
}
