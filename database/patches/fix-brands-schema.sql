-- Fix the brands table to match the frontend expectations
ALTER TABLE public.brands RENAME COLUMN name_en TO name;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.brands DROP COLUMN IF EXISTS name_si;
ALTER TABLE public.brands DROP COLUMN IF EXISTS name_ta;
