import { useState, useEffect, useRef } from 'react';
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
  const logoFixAttempted = useRef(false);

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

  // Auto-fix: if logo_url is base64, convert and upload to Storage
  useEffect(() => {
    if (!profile || !user || logoFixAttempted.current) return;
    const logoUrl = profile.logo_url;
    if (!logoUrl || !logoUrl.startsWith('data:')) return;
    
    logoFixAttempted.current = true;
    console.log('[useClientProfile] Detected base64 logo, auto-uploading to Storage...');
    
    (async () => {
      try {
        const { ensureImageDataUrl } = await import('@/lib/logo-utils');
        let dataUrl = await ensureImageDataUrl(logoUrl);
        
        const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!match) return;
        
        const mimeType = match[1];
        const base64Data = match[2];
        const extension = mimeType.split('/')[1] || 'png';
        const fileName = `${user.id}/logo-fix-${Date.now()}.${extension}`;
        
        const byteCharacters = atob(base64Data);
        const byteArray = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteArray[i] = byteCharacters.charCodeAt(i);
        }
        const blob = new Blob([byteArray], { type: mimeType });
        
        const { data, error: uploadError } = await supabase.storage
          .from('brand-assets')
          .upload(fileName, blob, { contentType: mimeType, upsert: true });
        
        if (uploadError) {
          console.error('[useClientProfile] Logo upload failed:', uploadError);
          return;
        }
        
        const { data: urlData } = supabase.storage
          .from('brand-assets')
          .getPublicUrl(data.path);
        
        const publicUrl = urlData.publicUrl;
        console.log('[useClientProfile] Logo uploaded to Storage:', publicUrl);
        
        // Update DB
        await supabase
          .from('client_profiles')
          .update({ logo_url: publicUrl })
          .eq('id', profile.id);
        
        setProfile(prev => prev ? { ...prev, logo_url: publicUrl } : prev);
        console.log('[useClientProfile] Profile logo_url updated to Storage URL');
      } catch (err) {
        console.error('[useClientProfile] Auto-fix logo failed:', err);
      }
    })();
  }, [profile, user]);

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
