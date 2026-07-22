-- ==========================================
-- 1. FIX DEPARTMENTS AND PROJECTS SCHEMA
-- ==========================================

-- Fix departments table to match the frontend
ALTER TABLE public.departments RENAME COLUMN name TO name_en;
ALTER TABLE public.departments
  ADD COLUMN IF NOT EXISTS code TEXT,
  ADD COLUMN IF NOT EXISTS name_si TEXT,
  ADD COLUMN IF NOT EXISTS name_ta TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Fix projects table to match the frontend
ALTER TABLE public.projects RENAME COLUMN name TO name_en;
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS project_code TEXT,
  ADD COLUMN IF NOT EXISTS name_si TEXT,
  ADD COLUMN IF NOT EXISTS name_ta TEXT,
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'planning',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;


-- Fix suppliers table to match the frontend
ALTER TABLE public.suppliers RENAME COLUMN name TO company_name;
ALTER TABLE public.suppliers RENAME COLUMN phone TO telephone;
ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS supplier_code TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.suppliers DROP COLUMN IF EXISTS is_active;

-- ==========================================
-- 2. COMPREHENSIVE SAMPLE DATA SEED SCRIPT
-- ==========================================

-- Departments
INSERT INTO public.departments (name_en, code, description) VALUES
  ('Information Technology', 'IT', 'Handles all tech infra'),
  ('Human Resources', 'HR', 'Employee management'),
  ('Finance & Accounts', 'FIN', 'Handles billing and payroll'),
  ('Operations', 'OPS', 'Day to day operations')
ON CONFLICT DO NOTHING;

-- Projects
INSERT INTO public.projects (name_en, project_code, start_date, status, description) VALUES
  ('Headquarters Expansion', 'PRJ-001', '2024-01-01', 'ongoing', 'Building the new wing'),
  ('Network Upgrade 2024', 'PRJ-002', '2024-03-15', 'ongoing', 'Upgrading core switches'),
  ('Annual Audit', 'PRJ-003', '2023-12-01', 'completed', 'Year end auditing')
ON CONFLICT DO NOTHING;

-- Warehouses
INSERT INTO public.warehouses (name_en, code, location) VALUES
  ('Main Warehouse', 'WH-MAIN', 'Building A, Ground Floor'),
  ('IT Store Room', 'WH-IT', 'Building B, 3rd Floor'),
  ('Transit Hub', 'WH-TRANSIT', 'Loading Dock')
ON CONFLICT DO NOTHING;

-- Brands 
INSERT INTO public.brands (name_en, code, description) VALUES
  ('Dell', 'DELL', 'Computers and Monitors'),
  ('Apple', 'AAPL', 'MacBooks and iPads'),
  ('Logitech', 'LOGI', 'Peripherals'),
  ('Samsung', 'SAMSUNG', 'Displays and Storage'),
  ('Double A', 'D-A', 'Printing Paper')
ON CONFLICT DO NOTHING;

-- Suppliers
INSERT INTO public.suppliers (supplier_code, company_name, contact_person, email, telephone, status) VALUES
  ('SUP-001', 'TechData Wholesale', 'John Smith', 'john@techdata.example.com', '011-2345678', 'active'),
  ('SUP-002', 'OfficeMax Supplies', 'Jane Doe', 'jane@officemax.example.com', '011-9876543', 'active'),
  ('SUP-003', 'Lanka Furniture Co', 'Kamal Perera', 'sales@lankafurn.example.com', '011-5551234', 'active')
ON CONFLICT DO NOTHING;

-- Categories
INSERT INTO public.categories (name_en, code, description) VALUES 
  ('Electronics', 'ELEC', 'Computers, printers, and accessories'),
  ('Office Supplies', 'OFF', 'Paper, pens, and stationery'),
  ('Furniture', 'FURN', 'Desks, chairs, and cabinets')
ON CONFLICT DO NOTHING;
