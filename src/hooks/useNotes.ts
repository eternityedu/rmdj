import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Note {
  id: string;
  title: string;
  content: string | null;
  tags: string[];
  keywords: string[];
  category: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export function useNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    if (!user) {
      setNotes([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setNotes(data as Note[] || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const addNote = async (note: Omit<Note, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title: note.title,
          content: note.content,
          tags: note.tags,
          keywords: note.keywords,
          category: note.category,
          is_pinned: note.is_pinned,
        })
        .select()
        .single();

      if (error) throw error;
      setNotes(prev => [data as Note, ...prev]);
      return data as Note;
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
      return null;
    }
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setNotes(prev => prev.map(n => n.id === id ? data as Note : n));
      return data as Note;
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Failed to update note');
      return null;
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setNotes(prev => prev.filter(n => n.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
      return false;
    }
  };

  return {
    notes,
    loading,
    addNote,
    updateNote,
    deleteNote,
    refetch: fetchNotes,
  };
}
