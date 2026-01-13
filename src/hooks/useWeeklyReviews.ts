import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface WeeklyReview {
  id: string;
  week_start: string;
  week_end: string;
  wins: string[];
  challenges: string[];
  improvements: string[];
  next_week_goals: string[];
  created_at: string;
  updated_at: string;
}

export function useWeeklyReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<WeeklyReview[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    if (!user) {
      setReviews([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('weekly_reviews')
        .select('*')
        .order('week_start', { ascending: false });

      if (error) throw error;
      setReviews(data as WeeklyReview[] || []);
    } catch (error) {
      console.error('Error fetching weekly reviews:', error);
      toast.error('Failed to load weekly reviews');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const getReviewByWeek = (weekStart: string) => {
    return reviews.find(r => r.week_start === weekStart) || null;
  };

  const saveReview = async (review: Omit<WeeklyReview, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('weekly_reviews')
        .upsert({
          user_id: user.id,
          week_start: review.week_start,
          week_end: review.week_end,
          wins: review.wins,
          challenges: review.challenges,
          improvements: review.improvements,
          next_week_goals: review.next_week_goals,
        }, {
          onConflict: 'user_id,week_start'
        })
        .select()
        .single();

      if (error) throw error;
      
      setReviews(prev => {
        const existing = prev.findIndex(r => r.week_start === review.week_start);
        if (existing >= 0) {
          return prev.map(r => r.week_start === review.week_start ? data as WeeklyReview : r);
        }
        return [data as WeeklyReview, ...prev];
      });
      
      return data as WeeklyReview;
    } catch (error) {
      console.error('Error saving weekly review:', error);
      toast.error('Failed to save weekly review');
      return null;
    }
  };

  return {
    reviews,
    loading,
    getReviewByWeek,
    saveReview,
    refetch: fetchReviews,
  };
}
