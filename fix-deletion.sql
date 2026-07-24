-- Fix foreign key constraints to allow deleting items and other parent records
-- Copy and paste this entirely into the Supabase SQL Editor and click RUN

-- 1. Fix Stock table referencing Items
ALTER TABLE public.stock DROP CONSTRAINT IF EXISTS stock_item_id_fkey;
ALTER TABLE public.stock ADD CONSTRAINT stock_item_id_fkey 
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE;

-- 2. Fix other potential constraints that block deletion
ALTER TABLE public.stock_transactions DROP CONSTRAINT IF EXISTS stock_transactions_item_id_fkey;
ALTER TABLE public.stock_transactions ADD CONSTRAINT stock_transactions_item_id_fkey 
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE;

ALTER TABLE public.purchase_request_items DROP CONSTRAINT IF EXISTS purchase_request_items_item_id_fkey;
ALTER TABLE public.purchase_request_items ADD CONSTRAINT purchase_request_items_item_id_fkey 
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE;

ALTER TABLE public.purchase_order_items DROP CONSTRAINT IF EXISTS purchase_order_items_item_id_fkey;
ALTER TABLE public.purchase_order_items ADD CONSTRAINT purchase_order_items_item_id_fkey 
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE;
