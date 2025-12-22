import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useClientProfile } from './useClientProfile';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

type ClientProfile = Tables<'client_profiles'>;

export const useAgencyClients = () => {
  const { user } = useAuth();
  const { profile: agencyProfile, loading: profileLoading } = useClientProfile();
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isAgency = agencyProfile?.is_agency_profile ?? false;

  const fetchClients = useCallback(async () => {
    if (!user || !agencyProfile) {
      setClients([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      if (isAgency) {
        // Agency: fetch all clients owned by this agency
        const { data, error } = await supabase
          .from('client_profiles')
          .select('*')
          .eq('agency_owner_id', user.id)
          .order('business_name');

        if (error) throw error;
        setClients(data || []);
        
        // Auto-select first client if none selected
        if (!selectedClientId && data && data.length > 0) {
          setSelectedClientId(data[0].id);
        }
      } else {
        // Regular user: their own profile is the only "client"
        setClients([agencyProfile]);
        setSelectedClientId(agencyProfile.id);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  }, [user, agencyProfile, isAgency, selectedClientId]);

  useEffect(() => {
    if (!profileLoading) {
      fetchClients();
    }
  }, [profileLoading, fetchClients]);

  const addClient = async (clientData: {
    business_name: string;
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    website_url?: string;
  }) => {
    if (!user || !isAgency) {
      throw new Error('Only agencies can add clients');
    }

    const { data: newClient, error } = await supabase
      .from('client_profiles')
      .insert({
        ...clientData,
        user_id: user.id,
        agency_owner_id: user.id,
        is_agency_profile: false,
        onboarding_completed: true,
      })
      .select()
      .single();

    if (error) throw error;
    
    setClients(prev => [...prev, newClient]);
    return newClient;
  };

  const updateClient = async (clientId: string, updates: Partial<ClientProfile>) => {
    if (!user) throw new Error('Not authenticated');

    const { data: updatedClient, error } = await supabase
      .from('client_profiles')
      .update(updates)
      .eq('id', clientId)
      .select()
      .single();

    if (error) throw error;
    
    setClients(prev => prev.map(c => c.id === clientId ? updatedClient : c));
    return updatedClient;
  };

  const deleteClient = async (clientId: string) => {
    if (!user || !isAgency) {
      throw new Error('Only agencies can delete clients');
    }

    const { error } = await supabase
      .from('client_profiles')
      .delete()
      .eq('id', clientId)
      .eq('agency_owner_id', user.id);

    if (error) throw error;
    
    setClients(prev => prev.filter(c => c.id !== clientId));
    
    // Select another client if the deleted one was selected
    if (selectedClientId === clientId) {
      const remaining = clients.filter(c => c.id !== clientId);
      setSelectedClientId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const selectedClient = clients.find(c => c.id === selectedClientId) || null;

  return {
    isAgency,
    clients,
    selectedClient,
    selectedClientId,
    setSelectedClientId,
    loading: loading || profileLoading,
    addClient,
    updateClient,
    deleteClient,
    refetch: fetchClients,
  };
};
