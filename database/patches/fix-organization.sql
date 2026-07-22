-- ==========================================
-- Fix Missing Organizations Table
-- ==========================================

CREATE TABLE IF NOT EXISTS public.organizations (
    id SERIAL PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_si TEXT,
    name_ta TEXT,
    short_name TEXT,
    district TEXT,
    province TEXT,
    address TEXT,
    telephone TEXT,
    fax TEXT,
    mobile TEXT,
    email TEXT,
    website TEXT,
    chairman_name TEXT,
    secretary_name TEXT,
    working_hours_start TEXT,
    working_hours_end TEXT,
    official_logo_url TEXT,
    government_logo_url TEXT,
    favicon_url TEXT,
    primary_color TEXT DEFAULT '#1f2937',
    secondary_color TEXT DEFAULT '#4f46e5',
    accent_color TEXT DEFAULT '#ef4444',
    system_name TEXT DEFAULT 'ANTIGRAVITY',
    system_subtitle TEXT,
    footer_text TEXT,
    copyright TEXT,
    currency TEXT DEFAULT 'LKR',
    currency_symbol TEXT DEFAULT 'Rs.',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All" ON public.organizations;
CREATE POLICY "Allow All" ON public.organizations FOR ALL USING (true);

-- Insert Default Organization
INSERT INTO public.organizations (
    name_en, 
    short_name, 
    district, 
    province,
    primary_color,
    secondary_color,
    accent_color,
    system_name,
    currency,
    currency_symbol
) VALUES (
    'Nikaweratiya Pradeshiya Sabha',
    'Nikaweratiya PS',
    'Kurunegala',
    'North Western',
    '#1f2937',
    '#4f46e5',
    '#ef4444',
    'ANTIGRAVITY',
    'LKR',
    'Rs.'
) ON CONFLICT DO NOTHING;
