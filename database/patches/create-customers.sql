-- 1. Create the customers table to fix the schema cache error
CREATE TABLE IF NOT EXISTS public.customers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  nic TEXT,
  designation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS) and setup policies for the frontend to access it
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All" ON public.customers;
CREATE POLICY "Allow All" ON public.customers FOR ALL USING (true);

-- 3. Insert some helpful sample data so the dashboard isn't completely empty!
INSERT INTO public.customers (name, email, phone, nic, designation) VALUES
  ('John Doe', 'john@example.com', '0771234567', '853456789V', 'Manager'),
  ('Jane Smith', 'jane@example.com', '0719876543', '901234567V', 'Director')
ON CONFLICT DO NOTHING;
