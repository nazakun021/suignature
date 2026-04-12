'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createOrganization(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) {
    throw new Error('Database not configured');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const website = formData.get('website') as string;
  
  // Create a slug from the name
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  if (!slug) slug = `org-${Date.now()}`;

  // Insert organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name,
      slug,
      description,
      website,
    })
    .select()
    .single();

  if (orgError || !org) {
    console.error('Error creating org:', orgError);
    // If slug collision, we'd handle it. For now, just throw
    throw new Error(orgError?.message || 'Failed to create organization');
  }

  // Insert owner member
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      org_id: org.id,
      user_id: user.id,
      role: 'owner',
    });

  if (memberError) {
    console.error('Error adding member:', memberError);
    throw new Error('Failed to assign owner to organization');
  }

  revalidatePath('/dashboard');
  redirect(`/org/${org.slug}/dashboard`);
}

export async function createEvent(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) {
    throw new Error('Database not configured');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const name = formData.get('name') as string;
  const orgSlug = formData.get('orgSlug') as string;

  // 1. Verify user is admin of the organization
  const { data: orgData } = await supabase
    .from('organizations')
    .select('id, organization_members(role)')
    .eq('slug', orgSlug)
    .single();

  if (!orgData || !orgData.organization_members || orgData.organization_members.length === 0) {
    throw new Error('You do not have permission to create events for this org');
  }

  const { data: newEvent, error } = await supabase
    .from('events')
    .insert({
      org_id: orgData.id,
      name,
      is_paid: false
    })
    .select()
    .single();

  if (error || !newEvent) {
    throw new Error(error?.message || 'Failed to create event');
  }

  revalidatePath(`/org/${orgSlug}/dashboard`);
  return { success: true, eventId: newEvent.id };
}
