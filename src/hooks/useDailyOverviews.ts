import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DailyOverview {
  id: string;
  date: string;
  study_time: number;
  company_progress: string | null;
  health_score: number;
  discipline_score: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useDailyOverviews() {
  const { user } = useAuth();
  const [overviews, setOverviews] = useState<DailyOverview[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOverviews = useCallback(async () => {
    if (!user) {
      setOverviews([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('daily_overviews')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setOverviews(data as DailyOverview[] || []);
    } catch (error) {
      console.error('Error fetching daily overviews:', error);
      toast.error('Failed to load daily overviews');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOverviews();
  }, [fetchOverviews]);

  const getOverviewByDate = (date: string) => {
    return overviews.find(o => o.date === date) || null;
  };

  const saveOverview = async (overview: Omit<DailyOverview, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      // Use upsert to handle both insert and update
      const { data, error } = await supabase
        .from('daily_overviews')
        .upsert({
          user_id: user.id,
          date: overview.date,
          study_time: overview.study_time,
          company_progress: overview.company_progress,
          health_score: overview.health_score,
          discipline_score: overview.discipline_score,
          notes: overview.notes,
        }, {
          onConflict: 'user_id,date'
        })
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setOverviews(prev => {
        const existing = prev.findIndex(o => o.date === overview.date);
        if (existing >= 0) {
          return prev.map(o => o.date === overview.date ? data as DailyOverview : o);
        }
        return [data as DailyOverview, ...prev];
      });
      
      return data as DailyOverview;
    } catch (error) {
      console.error('Error saving daily overview:', error);
      toast.error('Failed to save daily overview');
      return null;
    }
  };

  return {
    overviews,
    loading,
    getOverviewByDate,
    saveOverview,
    refetch: fetchOverviews,
  };
}
