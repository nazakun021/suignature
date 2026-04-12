import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

// We must use the service role key to bypass RLS for server-side updates from the webhook
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function POST(req: Request) {
  if (!webhookSecret) {
    console.warn('STRIPE_WEBHOOK_SECRET not configured');
    // For local dev, if secret is absent, we might just accept it or warn.
    // In production, always require the secret.
  }

  const payload = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event;

  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } else {
      // Insecure fallback ONLY for unstructured local dev where webhook secret isn't ready
      // DO NOT USE THIS IN PROD
      event = JSON.parse(payload);
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const eventId = session.metadata?.eventId;
        
        if (eventId) {
          // Update the event to `is_paid = true`
          const { error } = await supabaseAdmin
            .from('events')
            .update({ is_paid: true })
            .eq('id', eventId);

          if (error) {
            console.error('Failed to update event status via webhook:', error);
            throw new Error('Supabase update failed');
          }
        }
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
