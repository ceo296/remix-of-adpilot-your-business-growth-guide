import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import type { HonorificType } from '@/types/wizard';

type ClientProfile = Tables<'client_profiles'>;
type ClientProfileInsert = TablesInsert<'client_profiles'>;
type ClientProfileUpdate = TablesUpdate<'client_profiles'>;

export const useClientProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_agency_profile', false)
        .order('onboarding_completed', { ascending: true })
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      setProfile(data?.[0] || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const createProfile = async (data: Omit<ClientProfileInsert, 'user_id'>) => {
    if (!user) throw new Error('No user logged in');

    const { data: newProfile, error } = await supabase
      .from('client_profiles')
      .insert({ ...data, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    setProfile(newProfile);
    return newProfile;
  };

  const updateProfile = async (data: ClientProfileUpdate) => {
    if (!user || !profile) throw new Error('No profile to update');

    const { data: updatedProfile, error } = await supabase
      .from('client_profiles')
      .update(data)
      .eq('id', profile.id)
      .select()
      .single();

    if (error) throw error;
    setProfile(updatedProfile);
    return updatedProfile;
  };

  const isOnboardingComplete = profile?.onboarding_completed ?? false;
  const honorificPreference = (profile?.honorific_preference as HonorificType) ?? 'neutral';

  return {
    profile,
    loading,
    error,
    isOnboardingComplete,
    honorificPreference,
    createProfile,
    updateProfile,
    refetch: fetchProfile,
  };
};
