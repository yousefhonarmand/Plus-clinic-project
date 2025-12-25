import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'admin' | 'receptionist' | 'consultant' | 'doctor';

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching role:', error);
          setRole(null);
        } else {
          setRole(data?.role as AppRole || null);
        }
      } catch (err) {
        console.error('Error fetching role:', err);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  const isAdmin = role === 'admin';
  const isReceptionist = role === 'receptionist';
  const isConsultant = role === 'consultant';
  const isDoctor = role === 'doctor';
  const canViewReports = isAdmin || isReceptionist;
  const canEditAllPatients = isAdmin || isReceptionist;

  return {
    role,
    loading,
    isAdmin,
    isReceptionist,
    isConsultant,
    isDoctor,
    canViewReports,
    canEditAllPatients,
  };
}
