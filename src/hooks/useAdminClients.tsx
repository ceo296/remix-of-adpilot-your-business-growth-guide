import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSelectedClient } from './useSelectedClient';
import type { Tables } from '@/integrations/supabase/types';

type ClientProfile = Tables<'client_profiles'>;

export const useAdminClients = () => {
  const { user } = useAuth();
  const { selectedClientId, setSelectedClientId } = useSelectedClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      setIsAdmin(!!data);
    };
    checkAdmin();
  }, [user]);

  const fetchClients = useCallback(async () => {
    if (!user || !isAdmin) {
      setClients([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('is_agency_profile', false)
        .order('business_name');

      if (error) throw error;
      setClients(data || []);
      
      // Auto-select first client if none selected
      if (data && data.length > 0) {
        const currentExists = data.some(c => c.id === selectedClientId);
        if (!selectedClientId || !currentExists) {
          setSelectedClientId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchClients();
    }
  }, [isAdmin, fetchClients]);

  const selectedClient = clients.find(c => c.id === selectedClientId) || null;

  const resetClient = async (clientId: string) => {
    if (!isAdmin) throw new Error('Only admins can reset clients');
    
    const { error } = await supabase
      .from('client_profiles')
      .update({
        onboarding_completed: false,
        primary_x_factor: null,
        winning_feature: null,
        advantage_type: null,
        x_factors: [],
        target_audience: null,
        competitors: [],
        competitor_positions: [],
        past_materials: [],
        my_position_x: 0,
        my_position_y: 0,
        advantage_slider: 50,
      })
      .eq('id', clientId);
    
    if (error) throw error;
    await fetchClients();
  };

  const createClient = async (businessName: string) => {
    if (!isAdmin || !user) throw new Error('Only admins can create clients');
    
    const { data, error } = await supabase
      .from('client_profiles')
      .insert({
        business_name: businessName,
        user_id: user.id,
        onboarding_completed: false,
      })
      .select()
      .single();
    
    if (error) throw error;
    await fetchClients();
    return data;
  };

  return {
    isAdmin,
    clients,
    selectedClient,
    selectedClientId,
    setSelectedClientId,
    loading,
    resetClient,
    createClient,
    refetch: fetchClients,
  };
};
