-- 1. Create the missing brands table
CREATE TABLE IF NOT EXISTS public.brands (
  id SERIAL PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_si TEXT,
  name_ta TEXT,
  code TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add missing columns to items table
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS brand_id INTEGER REFERENCES public.brands(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS warehouse_id INTEGER REFERENCES public.warehouses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS selling_price DECIMAL(10,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS minimum_stock DECIMAL(10,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS maximum_stock DECIMAL(10,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS current_quantity DECIMAL(10,2) DEFAULT 0.0;

-- 3. Enable RLS and setup policies for brands
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All" ON public.brands;
CREATE POLICY "Allow All" ON public.brands FOR ALL USING (true);
