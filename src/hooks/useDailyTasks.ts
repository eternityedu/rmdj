import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format, parseISO, isWithinInterval } from 'date-fns';

export interface DailyTask {
  id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  is_everyday: boolean;
  duration: 'single' | 'week' | 'month';
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

// Extended type with priority/category for UI compatibility
export interface DailyTaskUI extends DailyTask {
  priority?: 'high' | 'medium' | 'low';
  category?: string;
}

export function useDailyTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<DailyTaskUI[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('daily_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map database fields to UI format with proper type casting
      const mappedTasks: DailyTaskUI[] = (data || []).map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        is_completed: task.is_completed,
        is_everyday: task.is_everyday,
        duration: task.duration as 'single' | 'week' | 'month',
        start_date: task.start_date,
        end_date: task.end_date,
        created_at: task.created_at,
        updated_at: task.updated_at,
        priority: 'medium' as const,
        category: 'General',
      }));
      
      setTasks(mappedTasks);
    } catch (error) {
      console.error('Error fetching daily tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (task: {
    title: string;
    description?: string;
    is_everyday: boolean;
    duration: 'single' | 'week' | 'month';
    start_date: string;
    end_date?: string;
    priority?: 'high' | 'medium' | 'low';
    category?: string;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('daily_tasks')
        .insert({
          user_id: user.id,
          title: task.title,
          description: task.description || null,
          is_completed: false,
          is_everyday: task.is_everyday,
          duration: task.duration,
          start_date: task.start_date,
          end_date: task.end_date || null,
        })
        .select()
        .single();

      if (error) throw error;
      
      const newTask: DailyTaskUI = {
        id: data.id,
        title: data.title,
        description: data.description,
        is_completed: data.is_completed,
        is_everyday: data.is_everyday,
        duration: data.duration as 'single' | 'week' | 'month',
        start_date: data.start_date,
        end_date: data.end_date,
        created_at: data.created_at,
        updated_at: data.updated_at,
        priority: task.priority || 'medium',
        category: task.category || 'General',
      };
      
      // Immediately update state with the new task at the beginning
      setTasks(prev => [newTask, ...prev]);
      return newTask;
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
      return null;
    }
  };

  const updateTask = async (id: string, updates: Partial<DailyTask>) => {
    try {
      const { data, error } = await supabase
        .from('daily_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setTasks(prev => prev.map(t => t.id === id ? { 
        ...t, 
        ...data,
        duration: data.duration as 'single' | 'week' | 'month',
      } : t));
      return data;
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
      return null;
    }
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return null;

    // Optimistic update
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, is_completed: !t.is_completed } : t
    ));

    try {
      const { error } = await supabase
        .from('daily_tasks')
        .update({ is_completed: !task.is_completed })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      // Revert on error
      setTasks(prev => prev.map(t => 
        t.id === id ? { ...t, is_completed: task.is_completed } : t
      ));
      console.error('Error toggling task:', error);
      toast.error('Failed to update task');
      return null;
    }
  };

  const deleteTask = async (id: string) => {
    // Optimistic delete
    const previousTasks = tasks;
    setTasks(prev => prev.filter(t => t.id !== id));

    try {
      const { error } = await supabase
        .from('daily_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      // Revert on error
      setTasks(previousTasks);
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
      return false;
    }
  };

  // Filter tasks for today
  const getTodayTasks = useCallback((today: string) => {
    return tasks.filter(t => {
      // Everyday tasks always show
      if (t.is_everyday) return true;
      
      // Tasks created today
      if (t.start_date === today) return true;
      
      // Tasks within their duration period
      if (t.start_date && t.end_date) {
        try {
          const start = parseISO(t.start_date);
          const end = parseISO(t.end_date);
          const todayDate = parseISO(today);
          return isWithinInterval(todayDate, { start, end });
        } catch {
          return false;
        }
      }
      
      return false;
    });
  }, [tasks]);

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    getTodayTasks,
    refetch: fetchTasks,
  };
}
