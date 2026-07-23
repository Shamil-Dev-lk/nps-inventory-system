-- database/patches/create-roles-table.sql

-- 1. Create the roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insert some default roles if they don't exist
INSERT INTO public.roles (name, description, permissions)
VALUES 
  ('Super Admin', 'Full system access', '["view-users","create-users","edit-users","delete-users","view-roles","create-roles","edit-roles","delete-roles","view-purchase-requests","create-purchase-requests","edit-purchase-requests","delete-purchase-requests","approve-purchase-requests"]')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.roles (name, description, permissions)
VALUES 
  ('Department Head', 'Can approve requests for their department', '["view-purchase-requests","create-purchase-requests","approve-purchase-requests"]')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.roles (name, description, permissions)
VALUES 
  ('Staff', 'Basic access to create requests', '["view-purchase-requests","create-purchase-requests"]')
ON CONFLICT (name) DO NOTHING;

-- 3. Enable RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- 4. Setup Policies for frontend access
DROP POLICY IF EXISTS "Allow All" ON public.roles;
CREATE POLICY "Allow All" ON public.roles FOR ALL USING (true);
