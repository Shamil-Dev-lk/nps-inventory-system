-- Drop existing foreign key constraints from items and sub_categories
ALTER TABLE public.items DROP CONSTRAINT IF EXISTS items_category_id_fkey;
ALTER TABLE public.items DROP CONSTRAINT IF EXISTS items_sub_category_id_fkey;
ALTER TABLE public.items DROP CONSTRAINT IF EXISTS items_unit_id_fkey;
ALTER TABLE public.sub_categories DROP CONSTRAINT IF EXISTS sub_categories_category_id_fkey;

-- Re-add them with ON DELETE SET NULL
ALTER TABLE public.items 
  ADD CONSTRAINT items_category_id_fkey 
  FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;

ALTER TABLE public.items 
  ADD CONSTRAINT items_sub_category_id_fkey 
  FOREIGN KEY (sub_category_id) REFERENCES public.sub_categories(id) ON DELETE SET NULL;

ALTER TABLE public.items 
  ADD CONSTRAINT items_unit_id_fkey 
  FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE SET NULL;

ALTER TABLE public.sub_categories 
  ADD CONSTRAINT sub_categories_category_id_fkey 
  FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
