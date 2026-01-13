import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface VisionItem {
  id: string;
  title: string;
  description: string | null;
  category: 'mit' | 'sids' | 'rmdj' | 'personal';
  target_date: string | null;
  progress: number;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export function useVision() {
  const { user } = useAuth();
  const [visionItems, setVisionItems] = useState<VisionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVisionItems = useCallback(async () => {
    if (!user) {
      setVisionItems([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('vision_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVisionItems(data as VisionItem[] || []);
    } catch (error) {
      console.error('Error fetching vision items:', error);
      toast.error('Failed to load vision items');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchVisionItems();
  }, [fetchVisionItems]);

  const addVisionItem = async (item: Omit<VisionItem, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('vision_items')
        .insert({
          user_id: user.id,
          title: item.title,
          description: item.description,
          category: item.category,
          target_date: item.target_date,
          progress: item.progress,
          is_completed: item.is_completed,
        })
        .select()
        .single();

      if (error) throw error;
      setVisionItems(prev => [data as VisionItem, ...prev]);
      return data as VisionItem;
    } catch (error) {
      console.error('Error adding vision item:', error);
      toast.error('Failed to add vision goal');
      return null;
    }
  };

  const updateVisionItem = async (id: string, updates: Partial<VisionItem>) => {
    try {
      const { data, error } = await supabase
        .from('vision_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setVisionItems(prev => prev.map(v => v.id === id ? data as VisionItem : v));
      return data as VisionItem;
    } catch (error) {
      console.error('Error updating vision item:', error);
      toast.error('Failed to update vision goal');
      return null;
    }
  };

  const deleteVisionItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vision_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setVisionItems(prev => prev.filter(v => v.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting vision item:', error);
      toast.error('Failed to delete vision goal');
      return false;
    }
  };

  return {
    visionItems,
    loading,
    addVisionItem,
    updateVisionItem,
    deleteVisionItem,
    refetch: fetchVisionItems,
  };
}
