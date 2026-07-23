-- 1. Fix the warehouses table schema to match the frontend expectations
ALTER TABLE public.warehouses RENAME COLUMN location TO address;
ALTER TABLE public.warehouses
  ADD COLUMN IF NOT EXISTS telephone TEXT,
  ADD COLUMN IF NOT EXISTS capacity NUMERIC,
  ADD COLUMN IF NOT EXISTS is_main BOOLEAN DEFAULT false;

-- 2. Fix foreign keys to allow warehouse deletion without crashing
ALTER TABLE public.stock DROP CONSTRAINT IF EXISTS stock_warehouse_id_fkey;
ALTER TABLE public.stock
  ADD CONSTRAINT stock_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON DELETE SET NULL;

-- 3. (Optional) In case items warehouse_id fk wasn't updated earlier
ALTER TABLE public.items DROP CONSTRAINT IF EXISTS items_warehouse_id_fkey;
ALTER TABLE public.items
  ADD CONSTRAINT items_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON DELETE SET NULL;
