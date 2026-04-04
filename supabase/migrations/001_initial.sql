-- Bedrock: Environmental Exposure Intelligence Platform
-- Initial database schema

-- User profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  user_type TEXT DEFAULT 'consumer' CHECK (user_type IN ('consumer', 'inspector', 'agent', 'broker', 'municipal', 'researcher')),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  reports_purchased INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Exposure assessments (cached per address)
CREATE TABLE public.exposure_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address_raw TEXT NOT NULL,
  address_normalized TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  fips_county TEXT,
  fips_state TEXT,
  census_tract TEXT,
  census_block_group TEXT,
  water_system_id TEXT,

  -- Composite score (0-100, higher = more exposure burden)
  composite_score NUMERIC(5,2),
  composite_confidence TEXT CHECK (composite_confidence IN ('high', 'moderate', 'low')),

  -- Layer sub-scores (0-100 each)
  water_score NUMERIC(5,2),
  water_confidence TEXT,
  soil_score NUMERIC(5,2),
  soil_confidence TEXT,
  air_score NUMERIC(5,2),
  air_confidence TEXT,
  proximity_score NUMERIC(5,2),
  proximity_confidence TEXT,
  ej_score NUMERIC(5,2),
  ej_confidence TEXT,

  -- Raw data payloads (JSONB)
  raw_water_data JSONB,
  raw_soil_data JSONB,
  raw_air_data JSONB,
  raw_proximity_data JSONB,
  raw_ej_data JSONB,

  -- Metadata
  layers_available TEXT[] DEFAULT '{}',
  data_freshness TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(address_normalized)
);

CREATE INDEX idx_exposure_coords ON public.exposure_assessments(latitude, longitude);
CREATE INDEX idx_exposure_address ON public.exposure_assessments(address_normalized);
CREATE INDEX idx_exposure_water_system ON public.exposure_assessments(water_system_id);

-- Generated reports
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  assessment_id UUID REFERENCES public.exposure_assessments(id),
  report_type TEXT NOT NULL CHECK (report_type IN ('free', 'consumer', 'pro')),

  narrative_summary TEXT,
  full_narrative TEXT,

  recommendations JSONB,
  recommendation_sources JSONB,

  layers_included TEXT[],
  resolution_notes JSONB,
  disclaimers TEXT[],

  pdf_url TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reports_user ON public.reports(user_id);
CREATE INDEX idx_reports_assessment ON public.reports(assessment_id);

-- Search log
CREATE TABLE public.search_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  address_searched TEXT NOT NULL,
  assessment_id UUID REFERENCES public.exposure_assessments(id),
  ip_hash TEXT,
  searched_at TIMESTAMPTZ DEFAULT now()
);

-- Recommendation templates
CREATE TABLE public.recommendation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layer TEXT NOT NULL CHECK (layer IN ('water', 'soil', 'air', 'proximity', 'ej', 'general')),
  trigger_condition TEXT NOT NULL,
  risk_tier TEXT NOT NULL CHECK (risk_tier IN ('LOW', 'MODERATE', 'ELEVATED', 'HIGH')),
  finding_template TEXT NOT NULL,
  recommendation_template TEXT NOT NULL,
  source_citation TEXT NOT NULL,
  disclaimer TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exposure_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users read own reports" ON public.reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Assessments are public read" ON public.exposure_assessments FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Anyone can insert assessments" ON public.exposure_assessments FOR INSERT TO authenticated, anon WITH CHECK (true);
CREATE POLICY "Templates are public read" ON public.recommendation_templates FOR SELECT TO authenticated, anon USING (true);
