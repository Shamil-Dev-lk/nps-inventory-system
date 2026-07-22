-- 1. Ensure the 'code' column exists in the units table
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS code TEXT;

-- 2. Insert all Units of Measurement WITH their codes and symbols
INSERT INTO public.units (code, name_en, symbol) VALUES 
  ('PCS', 'Pieces', 'pcs'),
  ('KG', 'Kilogram', 'kg'),
  ('G', 'Gram', 'g'),
  ('MG', 'Milligram', 'mg'),
  ('L', 'Liter', 'L'),
  ('ML', 'Milliliter', 'ml'),
  ('M', 'Meter', 'm'),
  ('CM', 'Centimeter', 'cm'),
  ('MM', 'Millimeter', 'mm'),
  ('BOX', 'Box', 'box'),
  ('PKT', 'Pack', 'pkt'),
  ('CTN', 'Carton', 'ctn'),
  ('DZ', 'Dozen', 'dz'),
  ('RL', 'Roll', 'rl'),
  ('PR', 'Pair', 'pr'),
  ('SET', 'Set', 'set'),
  ('BTL', 'Bottle', 'btl'),
  ('GAL', 'Gallon', 'gal'),
  ('OZ', 'Ounce', 'oz'),
  ('LB', 'Pound', 'lb')
ON CONFLICT DO NOTHING;
