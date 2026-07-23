-- 1. Create the purchase_requests table (using INTEGER/SERIAL for IDs to match the database)
CREATE TABLE IF NOT EXISTS public.purchase_requests (
  id SERIAL PRIMARY KEY,
  pr_number TEXT UNIQUE, 
  department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
  project_id INTEGER REFERENCES public.projects(id) ON DELETE SET NULL,
  required_date DATE,
  purpose TEXT,
  priority TEXT DEFAULT 'normal',
  remarks TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create the purchase_request_items table
CREATE TABLE IF NOT EXISTS public.purchase_request_items (
  id SERIAL PRIMARY KEY,
  purchase_request_id INTEGER NOT NULL REFERENCES public.purchase_requests(id) ON DELETE CASCADE,
  item_id INTEGER REFERENCES public.items(id) ON DELETE RESTRICT,
  quantity NUMERIC NOT NULL,
  estimated_unit_price NUMERIC,
  specification TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Sequence and Trigger for auto-generating PR Numbers (e.g. PR-2024-0001)
CREATE SEQUENCE IF NOT EXISTS pr_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_pr_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.pr_number IS NULL THEN
    NEW.pr_number := 'PR-' || to_char(CURRENT_DATE, 'YYYY') || '-' || lpad(nextval('pr_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_pr_number ON public.purchase_requests;
CREATE TRIGGER trg_generate_pr_number
BEFORE INSERT ON public.purchase_requests
FOR EACH ROW
EXECUTE FUNCTION generate_pr_number();

-- 4. Set NOT NULL on pr_number now that the trigger guarantees it
ALTER TABLE public.purchase_requests ALTER COLUMN pr_number SET NOT NULL;

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_request_items ENABLE ROW LEVEL SECURITY;

-- 6. Setup Policies for frontend access
DROP POLICY IF EXISTS "Allow All" ON public.purchase_requests;
CREATE POLICY "Allow All" ON public.purchase_requests FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow All" ON public.purchase_request_items;
CREATE POLICY "Allow All" ON public.purchase_request_items FOR ALL USING (true);
