import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Tables } from '@/integrations/supabase/types';

type ClientProfile = Tables<'client_profiles'>;

export const useAdminClients = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
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
      
      // Admin can see all clients
      const { data, error } = await supabase
        .from('client_profiles')
        .select('*')
        .order('business_name');

      if (error) throw error;
      setClients(data || []);
      
      // Auto-select first client if none selected
      if (!selectedClientId && data && data.length > 0) {
        setSelectedClientId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, selectedClientId]);

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

  return {
    isAdmin,
    clients,
    selectedClient,
    selectedClientId,
    setSelectedClientId,
    loading,
    resetClient,
    refetch: fetchClients,
  };
};
