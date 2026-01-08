-- Add new columns to user_skills table for full skill tracking
ALTER TABLE public.user_skills
ADD COLUMN IF NOT EXISTS youtube_link TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
ADD COLUMN IF NOT EXISTS is_currently_learning BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS daily_minutes INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS monthly_hours INTEGER DEFAULT 10;