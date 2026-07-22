-- Add missing columns to the items table
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS brand_id INTEGER REFERENCES public.brands(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS warehouse_id INTEGER REFERENCES public.warehouses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS selling_price DECIMAL(10,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS minimum_stock DECIMAL(10,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS maximum_stock DECIMAL(10,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS current_quantity DECIMAL(10,2) DEFAULT 0.0;

-- Note: The 'current_quantity' column is usually managed via the 'stock' table 
-- by summing up quantities, but since the UI explicitly sends 'current_quantity' 
-- during item creation (as Opening Stock), we must add it to the schema.
