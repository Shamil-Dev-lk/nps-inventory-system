-- ==========================================
-- Fix Missing Organization Columns
-- Run this script in your Supabase SQL Editor
-- ==========================================

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS default_language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS date_format TEXT DEFAULT 'YYYY-MM-DD',
ADD COLUMN IF NOT EXISTS enable_ai_features BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_email_notifications BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS footer_color TEXT,
ADD COLUMN IF NOT EXISTS footer_size TEXT,
ADD COLUMN IF NOT EXISTS footer_font TEXT,
ADD COLUMN IF NOT EXISTS print_settings JSONB DEFAULT '{}'::jsonb;
