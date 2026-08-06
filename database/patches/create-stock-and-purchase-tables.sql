-- =========================================================
-- Complete Database Schema for Stock, Purchases, Assets, and Receipts
-- Execute this SQL in your Supabase SQL Editor to create missing tables
-- =========================================================

-- 1. Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Assets Table
CREATE TABLE IF NOT EXISTS public.assets (
    id BIGSERIAL PRIMARY KEY,
    asset_code VARCHAR(100) UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    serial_number VARCHAR(100),
    purchase_date DATE,
    purchase_cost DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    location VARCHAR(255),
    assigned_to VARCHAR(255),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Stock Issues Table
CREATE TABLE IF NOT EXISTS public.stock_issues (
    id BIGSERIAL PRIMARY KEY,
    issue_number VARCHAR(100) UNIQUE,
    issue_date DATE DEFAULT CURRENT_DATE,
    warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE SET NULL,
    issue_to_type VARCHAR(50) DEFAULT 'department',
    department_id BIGINT REFERENCES public.departments(id) ON DELETE SET NULL,
    project_id BIGINT REFERENCES public.projects(id) ON DELETE SET NULL,
    officer_id BIGINT,
    customer_id BIGINT REFERENCES public.customers(id) ON DELETE SET NULL,
    purpose TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    approved_by BIGINT,
    issued_by BIGINT,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock Issue Items Table
CREATE TABLE IF NOT EXISTS public.stock_issue_items (
    id BIGSERIAL PRIMARY KEY,
    stock_issue_id BIGINT REFERENCES public.stock_issues(id) ON DELETE CASCADE,
    item_id BIGINT REFERENCES public.items(id) ON DELETE CASCADE,
    quantity DECIMAL(15,3) NOT NULL DEFAULT 1,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. GRN (Goods Received Notes) Table
CREATE TABLE IF NOT EXISTS public.grns (
    id BIGSERIAL PRIMARY KEY,
    grn_number VARCHAR(100) UNIQUE,
    received_date DATE DEFAULT CURRENT_DATE,
    supplier_id BIGINT REFERENCES public.suppliers(id) ON DELETE SET NULL,
    warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE SET NULL,
    po_number VARCHAR(100),
    invoice_number VARCHAR(100),
    total_amount DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'received',
    received_by BIGINT,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GRN Items Table
CREATE TABLE IF NOT EXISTS public.grn_items (
    id BIGSERIAL PRIMARY KEY,
    grn_id BIGINT REFERENCES public.grns(id) ON DELETE CASCADE,
    item_id BIGINT REFERENCES public.items(id) ON DELETE CASCADE,
    ordered_quantity DECIMAL(15,3) DEFAULT 0,
    received_quantity DECIMAL(15,3) NOT NULL DEFAULT 0,
    accepted_quantity DECIMAL(15,3) NOT NULL DEFAULT 0,
    unit_price DECIMAL(15,2) DEFAULT 0,
    total_price DECIMAL(15,2) DEFAULT 0,
    batch_number VARCHAR(100),
    expiry_date DATE,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Stock Transfers Table
CREATE TABLE IF NOT EXISTS public.stock_transfers (
    id BIGSERIAL PRIMARY KEY,
    transfer_number VARCHAR(100) UNIQUE,
    transfer_date DATE DEFAULT CURRENT_DATE,
    from_warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE SET NULL,
    to_warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE SET NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'completed',
    transferred_by BIGINT,
    received_by BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock Transfer Items Table
CREATE TABLE IF NOT EXISTS public.stock_transfer_items (
    id BIGSERIAL PRIMARY KEY,
    stock_transfer_id BIGINT REFERENCES public.stock_transfers(id) ON DELETE CASCADE,
    item_id BIGINT REFERENCES public.items(id) ON DELETE CASCADE,
    quantity DECIMAL(15,3) NOT NULL DEFAULT 1,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Stock Adjustments Table
CREATE TABLE IF NOT EXISTS public.stock_adjustments (
    id BIGSERIAL PRIMARY KEY,
    adjustment_number VARCHAR(100) UNIQUE,
    adjustment_date DATE DEFAULT CURRENT_DATE,
    warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE SET NULL,
    item_id BIGINT REFERENCES public.items(id) ON DELETE CASCADE,
    adjustment_type VARCHAR(50) DEFAULT 'increase',
    quantity DECIMAL(15,3) NOT NULL DEFAULT 0,
    reason TEXT,
    adjusted_by BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Stock Returns Table
CREATE TABLE IF NOT EXISTS public.stock_returns (
    id BIGSERIAL PRIMARY KEY,
    return_number VARCHAR(100) UNIQUE,
    return_date DATE DEFAULT CURRENT_DATE,
    department_id BIGINT REFERENCES public.departments(id) ON DELETE SET NULL,
    returned_by_id BIGINT,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'received',
    received_by BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock Return Items Table
CREATE TABLE IF NOT EXISTS public.stock_return_items (
    id BIGSERIAL PRIMARY KEY,
    stock_return_id BIGINT REFERENCES public.stock_returns(id) ON DELETE CASCADE,
    item_id BIGINT REFERENCES public.items(id) ON DELETE CASCADE,
    quantity DECIMAL(15,3) NOT NULL DEFAULT 1,
    condition VARCHAR(100) DEFAULT 'good',
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Stock Taking / Inventory Audit Table
CREATE TABLE IF NOT EXISTS public.stock_taking (
    id BIGSERIAL PRIMARY KEY,
    reference_number VARCHAR(100) UNIQUE,
    taking_date DATE DEFAULT CURRENT_DATE,
    warehouse_id BIGINT REFERENCES public.warehouses(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'completed',
    conducted_by BIGINT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock Taking Items Table
CREATE TABLE IF NOT EXISTS public.stock_taking_items (
    id BIGSERIAL PRIMARY KEY,
    stock_taking_id BIGINT REFERENCES public.stock_taking(id) ON DELETE CASCADE,
    item_id BIGINT REFERENCES public.items(id) ON DELETE CASCADE,
    expected_quantity DECIMAL(15,3) DEFAULT 0,
    counted_quantity DECIMAL(15,3) DEFAULT 0,
    difference DECIMAL(15,3) DEFAULT 0,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Purchase Orders Table
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id BIGSERIAL PRIMARY KEY,
    po_number VARCHAR(100) UNIQUE,
    order_date DATE DEFAULT CURRENT_DATE,
    delivery_date DATE,
    supplier_id BIGINT REFERENCES public.suppliers(id) ON DELETE SET NULL,
    total_amount DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    terms TEXT,
    created_by BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase Order Items Table
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id BIGSERIAL PRIMARY KEY,
    purchase_order_id BIGINT REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    item_id BIGINT REFERENCES public.items(id) ON DELETE CASCADE,
    quantity DECIMAL(15,3) NOT NULL DEFAULT 1,
    unit_price DECIMAL(15,2) DEFAULT 0,
    total_price DECIMAL(15,2) DEFAULT 0,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Purchase Requests Table
CREATE TABLE IF NOT EXISTS public.purchase_requests (
    id BIGSERIAL PRIMARY KEY,
    pr_number VARCHAR(100) UNIQUE,
    request_date DATE DEFAULT CURRENT_DATE,
    department_id BIGINT REFERENCES public.departments(id) ON DELETE SET NULL,
    requested_by BIGINT,
    priority VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'pending',
    approval_remarks TEXT,
    purpose TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase Request Items Table
CREATE TABLE IF NOT EXISTS public.purchase_request_items (
    id BIGSERIAL PRIMARY KEY,
    purchase_request_id BIGINT REFERENCES public.purchase_requests(id) ON DELETE CASCADE,
    item_id BIGINT REFERENCES public.items(id) ON DELETE CASCADE,
    quantity DECIMAL(15,3) NOT NULL DEFAULT 1,
    estimated_price DECIMAL(15,2) DEFAULT 0,
    specification TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and add open policies for testing/demo mode
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_issue_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grn_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_taking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_taking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_request_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to prevent duplicate policy errors
DROP POLICY IF EXISTS "Allow all access to customers" ON public.customers;
DROP POLICY IF EXISTS "Allow all access to assets" ON public.assets;
DROP POLICY IF EXISTS "Allow all access to stock_issues" ON public.stock_issues;
DROP POLICY IF EXISTS "Allow all access to stock_issue_items" ON public.stock_issue_items;
DROP POLICY IF EXISTS "Allow all access to grns" ON public.grns;
DROP POLICY IF EXISTS "Allow all access to grn_items" ON public.grn_items;
DROP POLICY IF EXISTS "Allow all access to stock_transfers" ON public.stock_transfers;
DROP POLICY IF EXISTS "Allow all access to stock_transfer_items" ON public.stock_transfer_items;
DROP POLICY IF EXISTS "Allow all access to stock_adjustments" ON public.stock_adjustments;
DROP POLICY IF EXISTS "Allow all access to stock_returns" ON public.stock_returns;
DROP POLICY IF EXISTS "Allow all access to stock_return_items" ON public.stock_return_items;
DROP POLICY IF EXISTS "Allow all access to stock_taking" ON public.stock_taking;
DROP POLICY IF EXISTS "Allow all access to stock_taking_items" ON public.stock_taking_items;
DROP POLICY IF EXISTS "Allow all access to purchase_orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Allow all access to purchase_order_items" ON public.purchase_order_items;
DROP POLICY IF EXISTS "Allow all access to purchase_requests" ON public.purchase_requests;
DROP POLICY IF EXISTS "Allow all access to purchase_request_items" ON public.purchase_request_items;

-- Create policies
CREATE POLICY "Allow all access to customers" ON public.customers FOR ALL USING (true);
CREATE POLICY "Allow all access to assets" ON public.assets FOR ALL USING (true);
CREATE POLICY "Allow all access to stock_issues" ON public.stock_issues FOR ALL USING (true);
CREATE POLICY "Allow all access to stock_issue_items" ON public.stock_issue_items FOR ALL USING (true);
CREATE POLICY "Allow all access to grns" ON public.grns FOR ALL USING (true);
CREATE POLICY "Allow all access to grn_items" ON public.grn_items FOR ALL USING (true);
CREATE POLICY "Allow all access to stock_transfers" ON public.stock_transfers FOR ALL USING (true);
CREATE POLICY "Allow all access to stock_transfer_items" ON public.stock_transfer_items FOR ALL USING (true);
CREATE POLICY "Allow all access to stock_adjustments" ON public.stock_adjustments FOR ALL USING (true);
CREATE POLICY "Allow all access to stock_returns" ON public.stock_returns FOR ALL USING (true);
CREATE POLICY "Allow all access to stock_return_items" ON public.stock_return_items FOR ALL USING (true);
CREATE POLICY "Allow all access to stock_taking" ON public.stock_taking FOR ALL USING (true);
CREATE POLICY "Allow all access to stock_taking_items" ON public.stock_taking_items FOR ALL USING (true);
CREATE POLICY "Allow all access to purchase_orders" ON public.purchase_orders FOR ALL USING (true);
CREATE POLICY "Allow all access to purchase_order_items" ON public.purchase_order_items FOR ALL USING (true);
CREATE POLICY "Allow all access to purchase_requests" ON public.purchase_requests FOR ALL USING (true);
CREATE POLICY "Allow all access to purchase_request_items" ON public.purchase_request_items FOR ALL USING (true);

-- Grant full permissions on all public tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
