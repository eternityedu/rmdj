import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface FinancialEntry {
  id: string;
  user_id: string;
  amount: number;
  entry_type: 'income' | 'expense' | 'investment' | 'goal' | 'loan' | 'ip';
  category: string;
  source: string | null;
  date: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export function useFinancialEntries() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('financial_entries')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      toast.error('Failed to fetch entries');
    } else {
      setEntries(data as FinancialEntry[]);
    }
    setLoading(false);
  };

  const addEntry = async (entry: Omit<FinancialEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('financial_entries')
      .insert([{ ...entry, user_id: user.id }])
      .select()
      .single();

    if (error) {
      toast.error('Failed to add entry');
      return { error };
    }
    
    setEntries(prev => [data as FinancialEntry, ...prev]);
    return { error: null };
  };

  const updateEntry = async (id: string, updates: Partial<FinancialEntry>) => {
    const { error } = await supabase
      .from('financial_entries')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update entry');
      return { error };
    }
    
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    return { error: null };
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase
      .from('financial_entries')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete entry');
      return { error };
    }
    
    setEntries(prev => prev.filter(e => e.id !== id));
    return { error: null };
  };

  useEffect(() => {
    fetchEntries();
  }, [user]);

  // Calculate stats
  const totalIncome = entries.filter(e => e.entry_type === 'income').reduce((acc, e) => acc + Number(e.amount), 0);
  const totalExpenses = entries.filter(e => e.entry_type === 'expense').reduce((acc, e) => acc + Number(e.amount), 0);
  const totalInvestments = entries.filter(e => e.entry_type === 'investment').reduce((acc, e) => acc + Number(e.amount), 0);
  const totalGoals = entries.filter(e => e.entry_type === 'goal').reduce((acc, e) => acc + Number(e.amount), 0);
  const totalLoans = entries.filter(e => e.entry_type === 'loan').reduce((acc, e) => acc + Number(e.amount), 0);
  const totalIP = entries.filter(e => e.entry_type === 'ip').reduce((acc, e) => acc + Number(e.amount), 0);
  
  const netWorth = totalIncome - totalExpenses - totalInvestments - totalGoals - totalLoans - totalIP;
  const totalAdded = totalIncome;
  const totalSpent = totalExpenses + totalInvestments + totalGoals + totalLoans + totalIP;

  return {
    entries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    refresh: fetchEntries,
    stats: {
      totalIncome,
      totalExpenses,
      totalInvestments,
      totalGoals,
      totalLoans,
      totalIP,
      netWorth,
      totalAdded,
      totalSpent,
    }
  };
}
