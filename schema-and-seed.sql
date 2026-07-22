-- ==========================================
-- ANTIGRAVITY - Database Schema and Seed
-- Run this entire script in your Supabase SQL Editor
-- ==========================================

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS public.categories (
    id SERIAL PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_si TEXT,
    name_ta TEXT,
    description TEXT,
    code TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sub_categories (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES public.categories(id),
    name_en TEXT NOT NULL,
    name_si TEXT,
    name_ta TEXT,
    code TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.departments (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.projects (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.suppliers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.units (
    id SERIAL PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_si TEXT,
    name_ta TEXT,
    symbol TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.warehouses (
    id SERIAL PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_si TEXT,
    name_ta TEXT,
    code TEXT,
    location TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.items (
    id SERIAL PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_si TEXT,
    name_ta TEXT,
    code TEXT NOT NULL,
    category_id INTEGER REFERENCES public.categories(id),
    sub_category_id INTEGER REFERENCES public.sub_categories(id),
    unit_id INTEGER REFERENCES public.units(id),
    reorder_level INTEGER DEFAULT 0,
    price DECIMAL(10,2) DEFAULT 0.0,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stock (
    id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES public.items(id),
    warehouse_id INTEGER REFERENCES public.warehouses(id),
    quantity INTEGER DEFAULT 0,
    unit_price DECIMAL(10,2) DEFAULT 0.0,
    batch_number TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY,
    name TEXT,
    roles JSONB DEFAULT '["super-admin"]'::jsonb,
    permissions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. Insert Sample Data
-- ==========================================

INSERT INTO public.categories (name_en, code, description) VALUES 
('Electronics', 'ELEC', 'Computers, printers, and accessories'),
('Office Supplies', 'OFF', 'Paper, pens, and stationery'),
('Furniture', 'FURN', 'Desks, chairs, and cabinets')
ON CONFLICT DO NOTHING;

INSERT INTO public.departments (name, description) VALUES 
('IT Department', 'Information Technology'),
('Administration', 'Main Office Admin'),
('Finance', 'Accounting and Finance')
ON CONFLICT DO NOTHING;

INSERT INTO public.units (name_en, symbol) VALUES 
('Pieces', 'pcs'),
('Boxes', 'box'),
('Kilograms', 'kg'),
('Rims', 'rim')
ON CONFLICT DO NOTHING;

INSERT INTO public.warehouses (name_en, code, location) VALUES 
('Main Store', 'WH-MAIN', 'Ground Floor, Main Building'),
('IT Store', 'WH-IT', 'Second Floor, Server Room')
ON CONFLICT DO NOTHING;

INSERT INTO public.suppliers (name, contact_person, email, phone) VALUES 
('Tech Supply Co.', 'John Smith', 'john@techsupply.com', '0112345678'),
('Office World', 'Jane Doe', 'jane@officeworld.com', '0119876543')
ON CONFLICT DO NOTHING;

-- Insert Items (assuming category IDs 1,2,3 and unit IDs 1,2,3,4 exist)
INSERT INTO public.items (name_en, code, category_id, unit_id, reorder_level, price) VALUES 
('Dell OptiPlex 7090 Desktop', 'ITM-001', 1, 1, 5, 85000.00),
('A4 Paper (500 Sheets)', 'ITM-002', 2, 4, 20, 1500.00),
('Ergonomic Office Chair', 'ITM-003', 3, 1, 2, 25000.00)
ON CONFLICT DO NOTHING;

-- Insert Stock (assuming item IDs 1,2,3 and warehouse IDs 1,2 exist)
INSERT INTO public.stock (item_id, warehouse_id, quantity, unit_price, location) VALUES 
(1, 2, 12, 85000.00, 'Rack A1'),
(2, 1, 45, 1500.00, 'Rack B4'),
(3, 1, 8, 25000.00, 'Furniture Zone')
ON CONFLICT DO NOTHING;

-- ==========================================
-- 3. Setup Row Level Security (RLS) to Allow Everything for now
-- ==========================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow All" ON public.categories;
CREATE POLICY "Allow All" ON public.categories FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow All" ON public.sub_categories;
CREATE POLICY "Allow All" ON public.sub_categories FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow All" ON public.departments;
CREATE POLICY "Allow All" ON public.departments FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow All" ON public.projects;
CREATE POLICY "Allow All" ON public.projects FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow All" ON public.suppliers;
CREATE POLICY "Allow All" ON public.suppliers FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow All" ON public.units;
CREATE POLICY "Allow All" ON public.units FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow All" ON public.warehouses;
CREATE POLICY "Allow All" ON public.warehouses FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow All" ON public.items;
CREATE POLICY "Allow All" ON public.items FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow All" ON public.stock;
CREATE POLICY "Allow All" ON public.stock FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow All" ON public.user_profiles;
CREATE POLICY "Allow All" ON public.user_profiles FOR ALL USING (true);
