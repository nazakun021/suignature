-- Supabase Schema for Suignature Phase 2b & 2c

-- 1. Create `organizations` table
CREATE TABLE public.organizations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  logo_url text,
  website text,
  stripe_customer_id text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create `organization_members` table
CREATE TABLE public.organization_members (
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id text REFERENCES public.users(id) ON DELETE CASCADE,
  role text DEFAULT 'admin' NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (org_id, user_id)
);

-- 3. Create `events` table (Phase 2c)
CREATE TABLE public.events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  is_paid boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS) Policies

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Organizations RLS
CREATE POLICY "Public can view all organizations" 
  ON public.organizations FOR SELECT 
  USING (true);

-- Must be a member to edit an organization
CREATE POLICY "Members can update their organization" 
  ON public.organizations FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE org_id = id AND user_id = auth.uid()::text
    )
  );

-- Org Members RLS
CREATE POLICY "Members can view other members of their org" 
  ON public.organization_members FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members as om 
      WHERE om.org_id = org_id AND om.user_id = auth.uid()::text
    )
  );

-- Events RLS
CREATE POLICY "Public can view events" 
  ON public.events FOR SELECT 
  USING (true);

CREATE POLICY "Members can manage events"
  ON public.events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE org_id = public.events.org_id AND user_id = auth.uid()::text
    )
  );
