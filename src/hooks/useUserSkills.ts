import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface UserSkill {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export function useUserSkills() {
  const { user } = useAuth();
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSkills = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('user_skills')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch skills');
    } else {
      setSkills(data as UserSkill[]);
    }
    setLoading(false);
  };

  const addSkill = async (name: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('user_skills')
      .insert([{ name, user_id: user.id }])
      .select()
      .single();

    if (error) {
      toast.error('Failed to add skill');
      return { error };
    }
    
    setSkills(prev => [data as UserSkill, ...prev]);
    return { error: null };
  };

  const updateSkill = async (id: string, name: string) => {
    const { error } = await supabase
      .from('user_skills')
      .update({ name })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update skill');
      return { error };
    }
    
    setSkills(prev => prev.map(s => s.id === id ? { ...s, name } : s));
    return { error: null };
  };

  const deleteSkill = async (id: string) => {
    const { error } = await supabase
      .from('user_skills')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete skill');
      return { error };
    }
    
    setSkills(prev => prev.filter(s => s.id !== id));
    return { error: null };
  };

  useEffect(() => {
    fetchSkills();
  }, [user]);

  return { skills, loading, addSkill, updateSkill, deleteSkill, refresh: fetchSkills };
}
