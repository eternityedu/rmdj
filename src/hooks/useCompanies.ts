import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Company {
  id: string;
  name: string;
  description: string | null;
  status: 'idea' | 'planning' | 'building' | 'launched' | 'scaling';
  revenue: number;
  expenses: number;
  notes: string | null;
  logo: string | null;
  created_at: string;
  updated_at: string;
}

export function useCompanies() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = useCallback(async () => {
    if (!user) {
      setCompanies([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompanies(data as Company[] || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const addCompany = async (company: Omit<Company, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('companies')
        .insert({
          user_id: user.id,
          name: company.name,
          description: company.description,
          status: company.status,
          revenue: company.revenue,
          expenses: company.expenses,
          notes: company.notes,
          logo: company.logo,
        })
        .select()
        .single();

      if (error) throw error;
      setCompanies(prev => [data as Company, ...prev]);
      return data as Company;
    } catch (error) {
      console.error('Error adding company:', error);
      toast.error('Failed to add company');
      return null;
    }
  };

  const updateCompany = async (id: string, updates: Partial<Company>) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setCompanies(prev => prev.map(c => c.id === id ? data as Company : c));
      return data as Company;
    } catch (error) {
      console.error('Error updating company:', error);
      toast.error('Failed to update company');
      return null;
    }
  };

  const deleteCompany = async (id: string) => {
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setCompanies(prev => prev.filter(c => c.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('Failed to delete company');
      return false;
    }
  };

  return {
    companies,
    loading,
    addCompany,
    updateCompany,
    deleteCompany,
    refetch: fetchCompanies,
  };
}
