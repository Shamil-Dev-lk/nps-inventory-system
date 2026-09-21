-- database/patches/add-face-lock-to-users.sql
-- Add Face Lock and Security PIN columns to users table for Admin Face Verification

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS face_lock_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS face_data TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS security_pin VARCHAR(20) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS face_registered_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Comment for clarity
COMMENT ON COLUMN public.users.face_lock_enabled IS 'Toggle for Admin Face Verification requirement at login';
COMMENT ON COLUMN public.users.face_data IS 'Serialized 128-dimensional normalized facial descriptor vector';
COMMENT ON COLUMN public.users.security_pin IS '6-digit Admin recovery Security PIN for camera hardware fallback';
