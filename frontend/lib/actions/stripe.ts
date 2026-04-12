'use server';

import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { redirect } from 'next/navigation';

export async function createCheckoutSession(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) {
    throw new Error('Database not configured');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('You must be logged in');
  }

  const eventId = formData.get('eventId') as string;
  const orgSlug = formData.get('orgSlug') as string;

  if (!eventId || !orgSlug) {
    throw new Error('Missing eventId or orgSlug');
  }

  // 1. Verify user is admin of the organization
  const { data: orgMember } = await supabase
    .from('organizations')
    .select('id, name, organization_members(role)')
    .eq('slug', orgSlug)
    .single();

  if (!orgMember || !orgMember.organization_members || orgMember.organization_members.length === 0) {
    throw new Error('You don\'t have permission for this organization');
  }

  // 2. Fetch Event details
  const { data: eventData } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (!eventData) {
    throw new Error('Event not found');
  }

  if (eventData.is_paid) {
    throw new Error('Event is already paid');
  }

  // 3. Create Stripe Checkout Session (Pay-Per-Event Fixed Fee: 20 USD)
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `suignature Event Setup: ${eventData.name}`,
            description: `Unlock unlimited guaranteed proof-of-work issuances for this specific event using Shinami's sponsored transactions.`,
          },
          unit_amount: 2000, // $20.00
        },
        quantity: 1,
      },
    ],
    metadata: {
      eventId: eventData.id,
      orgId: eventData.org_id,
      userId: user.id
    },
    // We construct absolute URLs for the success/cancel pages
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/org/${orgSlug}/dashboard?payment_success=true&event=${eventId}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/org/${orgSlug}/dashboard?payment_canceled=true`,
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session');
  }

  redirect(session.url);
}
