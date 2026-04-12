-- Supabase Schema for Suignature Phase 2

-- Create users table
CREATE TABLE public.users (
  id text NOT NULL PRIMARY KEY, -- The Google subject ID (sub)
  sui_address text NOT NULL UNIQUE,
  salt text NOT NULL,
  username text UNIQUE,
  display_name text,
  bio text,
  avatar_url text,
  social_links jsonb DEFAULT '{}'::jsonb,
  role text DEFAULT 'volunteer' NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- 1. Public profiles are viewable by everyone.
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.users FOR SELECT
  USING (true);

-- 2. Users can insert their own profile.
-- (Note: In Phase 2A, the service role creates this in the backend, but we include it for completeness).
CREATE POLICY "Users can insert their own profile."
  ON public.users FOR INSERT
  WITH CHECK (auth.uid()::text = id);

-- 3. Users can update their own profile.
CREATE POLICY "Users can update own profile."
  ON public.users FOR UPDATE
  USING (auth.uid()::text = id);
