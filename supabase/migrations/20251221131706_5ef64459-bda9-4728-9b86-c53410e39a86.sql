-- Create client_profiles table for storing business DNA
CREATE TABLE public.client_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Info
  business_name TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  
  -- Brand Identity
  primary_color TEXT DEFAULT '#E31E24',
  secondary_color TEXT DEFAULT '#000000',
  background_color TEXT DEFAULT '#FFFFFF',
  header_font TEXT DEFAULT 'Assistant',
  body_font TEXT DEFAULT 'Heebo',
  
  -- Strategic MRI - X Factors
  x_factors TEXT[] DEFAULT '{}',
  primary_x_factor TEXT,
  
  -- Strategic MRI - Reality Check
  advantage_type TEXT, -- 'hard' or 'soft'
  advantage_slider INTEGER DEFAULT 50,
  winning_feature TEXT,
  
  -- Strategic MRI - Arena (Competitors)
  competitors TEXT[] DEFAULT '{}',
  my_position_x INTEGER DEFAULT 0,
  my_position_y INTEGER DEFAULT 0,
  competitor_positions JSONB DEFAULT '[]',
  
  -- Strategic MRI - Target Audience
  target_audience TEXT, -- 'end_user' or 'decision_maker'
  
  -- Past Materials stored in storage bucket
  past_materials JSONB DEFAULT '[]',
  
  -- Profile completion status
  onboarding_completed BOOLEAN DEFAULT FALSE,
  
  -- Agency mode - for agencies managing multiple clients
  is_agency_profile BOOLEAN DEFAULT FALSE,
  agency_owner_id UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint for user profile
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.client_profiles
FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = agency_owner_id);

-- Users can create their own profile
CREATE POLICY "Users can create own profile"
ON public.client_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.client_profiles
FOR UPDATE
USING (auth.uid() = user_id OR auth.uid() = agency_owner_id);

-- Users can delete their own profile (for agency mode)
CREATE POLICY "Users can delete own profile"
ON public.client_profiles
FOR DELETE
USING (auth.uid() = user_id OR auth.uid() = agency_owner_id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all client profiles"
ON public.client_profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create updated_at trigger
CREATE TRIGGER update_client_profiles_updated_at
BEFORE UPDATE ON public.client_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create campaigns table for storing campaign data
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_profile_id UUID NOT NULL REFERENCES public.client_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Campaign details
  name TEXT NOT NULL,
  goal TEXT, -- 'sale', 'branding', 'launch', 'event'
  vibe TEXT, -- 'aggressive', 'prestige', 'heimish'
  
  -- Dates
  start_date DATE,
  end_date DATE,
  
  -- Media selections (array of media_inventory ids)
  selected_media JSONB DEFAULT '[]',
  
  -- Generated creatives references
  creatives JSONB DEFAULT '[]',
  
  -- Status
  status TEXT DEFAULT 'draft', -- 'draft', 'active', 'completed', 'paused'
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Users can CRUD their own campaigns
CREATE POLICY "Users can view own campaigns"
ON public.campaigns
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create campaigns"
ON public.campaigns
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns"
ON public.campaigns
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own campaigns"
ON public.campaigns
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all campaigns
CREATE POLICY "Admins can view all campaigns"
ON public.campaigns
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create updated_at trigger for campaigns
CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();