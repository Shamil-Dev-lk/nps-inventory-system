-- 1. Create the assets table to fix the schema cache error
CREATE TABLE IF NOT EXISTS public.assets (
  id SERIAL PRIMARY KEY,
  asset_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS) and setup policies for the frontend to access it
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All" ON public.assets;
CREATE POLICY "Allow All" ON public.assets FOR ALL USING (true);

-- 3. Insert some helpful sample data
INSERT INTO public.assets (asset_code, name, status) VALUES
  ('AST-001', 'Forklift - Toyota 8FGU25', 'active'),
  ('AST-002', 'Delivery Truck - Isuzu N-Series', 'active'),
  ('AST-003', 'Warehouse Generator', 'maintenance')
ON CONFLICT (asset_code) DO NOTHING;
