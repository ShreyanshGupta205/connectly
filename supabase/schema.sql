-- =====================================================================
-- Connectly — Supabase PostgreSQL Database Schema
-- Run this SQL in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/rbmcfsuupcojncyqmywm/sql/new
-- =====================================================================

-- 1. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT DEFAULT 'Digital Creator & Builder',
  bio TEXT DEFAULT 'Welcome to my digital space.',
  avatar_url TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  is_verified BOOLEAN DEFAULT false,
  theme_id TEXT DEFAULT 'aurora-glass',
  plan TEXT DEFAULT 'free',
  email TEXT DEFAULT '',
  category TEXT DEFAULT 'Creator',
  skills TEXT[] DEFAULT '{}',
  links JSONB DEFAULT '[]'::jsonb,
  stats JSONB DEFAULT '{"views": 1, "likes": 0, "shares": 0, "qrScans": 0}'::jsonb,
  qr_settings JSONB DEFAULT '{"fgColor": "#8b5cf6", "bgColor": "#0d1117", "includeAvatar": true, "style": "minimal", "dotType": "rounded"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by @username
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- 2. Create Analytics Events Table
CREATE TABLE IF NOT EXISTS public.profile_analytics (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL REFERENCES public.profiles(username) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'view', 'like', 'click', 'qr'
  link_id TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_username ON public.profile_analytics(username);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.profile_analytics(created_at);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_analytics ENABLE ROW LEVEL SECURITY;

-- Allow public read of all profiles
CREATE POLICY "Public profiles are readable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- Allow profile creation & updates
CREATE POLICY "Anyone can create or edit profiles" 
ON public.profiles FOR ALL 
USING (true);

-- Allow public logging of analytics
CREATE POLICY "Analytics can be inserted by anyone" 
ON public.profile_analytics FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Analytics can be viewed by anyone" 
ON public.profile_analytics FOR SELECT 
USING (true);

-- 4. Seed Initial Demo Profiles
INSERT INTO public.profiles (username, name, tagline, bio, avatar_url, is_verified, theme_id, plan, links)
VALUES 
(
  'shreyansh',
  'Shreyansh Gupta',
  'AI Engineer & Full-Stack Builder',
  'Building next-generation web apps, AI tools, and sharing open-source code.',
  'https://api.dicebear.com/7.x/bottts/svg?seed=shreyansh',
  true,
  'aurora-glass',
  'pro',
  '[
    {"id": "link-1", "platform": "github", "title": "GitHub Portfolio", "url": "https://github.com/ShreyanshGupta205", "isVisible": true, "clicks": 420},
    {"id": "link-2", "platform": "youtube", "title": "YouTube Tech Channel", "url": "https://youtube.com/@shreyanshbuild", "isVisible": true, "clicks": 280},
    {"id": "link-3", "platform": "linkedin", "title": "LinkedIn Network", "url": "https://linkedin.com/in/shreyanshgupta205", "isVisible": true, "clicks": 190}
  ]'::jsonb
)
ON CONFLICT (username) DO NOTHING;
