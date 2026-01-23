import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type Website = Database['public']['Tables']['websites']['Row'];

export const useWebsites = () => {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchWebsites = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('websites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebsites(data || []);
    } catch (error) {
      console.error('Error fetching websites:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebsites();
  }, [user]);

  return {
    websites,
    loading,
    refetch: fetchWebsites,
  };
};
