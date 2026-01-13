import { useState } from 'react';
import { StickyNote, Plus, Search, Pin, Edit2, Trash2, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useNotes, Note } from '@/hooks/useNotes';
import { format } from 'date-fns';

export function NotesPage() {
  const { notes, loading, addNote, updateNote, deleteNote } = useNotes();
  const [isOpen, setIsOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', tags: '', keywords: '', category: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const noteData = {
      title: form.title,
      content: form.content || null,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      keywords: [...form.keywords.split(',').map(k => k.trim()).filter(Boolean), 'Organization'],
      category: form.category || 'General',
      is_pinned: editingNote?.is_pinned || false,
    };

    if (editingNote) {
      await updateNote(editingNote.id, noteData);
    } else {
      await addNote(noteData);
    }

    setSaving(false);
    resetForm();
  };

  const resetForm = () => { 
    setForm({ title: '', content: '', tags: '', keywords: '', category: '' }); 
    setEditingNote(null); 
    setIsOpen(false); 
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setForm({ 
      title: note.title, 
      content: note.content || '', 
      tags: note.tags.join(', '), 
      keywords: note.keywords.filter(k => k !== 'Organization').join(', '), 
      category: note.category 
    });
    setIsOpen(true);
  };

  const togglePin = async (id: string) => { 
    const note = notes.find(n => n.id === id); 
    if (note) { 
      await updateNote(id, { is_pinned: !note.is_pinned }); 
    } 
  };

  const handleDelete = async (id: string) => { 
    await deleteNote(id); 
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (n.content || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase())) ||
    n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  ).sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0) || b.updated_at.localeCompare(a.updated_at));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in pb-20 lg:pb-6">
      <PageHeader title="Notes" description="Capture your thoughts and ideas" icon={StickyNote} iconColor="text-notes"
        action={
          <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild><Button size="sm" className="gap-2"><Plus size={16} />Add Note</Button></DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingNote ? 'Edit Note' : 'Add Note'}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
                <div><Label>Content</Label><Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={5} /></div>
                <div><Label>Category</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="General" /></div>
                <div><Label>Tags</Label><Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="comma separated" /></div>
                <div><Label>Keywords</Label><Input value={form.keywords} onChange={e => setForm({ ...form, keywords: e.target.value })} placeholder="searchable keywords" /></div>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                  {editingNote ? 'Update' : 'Add'} Note
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} /><Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search notes, keywords, tags..." className="pl-10" /></div>
      {filteredNotes.length === 0 ? <EmptyState icon={StickyNote} title="No notes yet" description="Start capturing your ideas" actionLabel="Add Note" onAction={() => setIsOpen(true)} /> : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map(note => (
            <Card key={note.id} className={`border-border/50 hover:border-notes/30 transition-colors ${note.is_pinned ? 'ring-1 ring-notes/30' : ''}`}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-medium flex items-center gap-2">{note.is_pinned && <Pin size={12} className="text-notes" />}{note.title}</h3>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePin(note.id)}><Pin size={12} /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(note)}><Edit2 size={12} /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(note.id)}><Trash2 size={12} /></Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">{note.content}</p>
                <div className="flex flex-wrap gap-1">{note.tags.map((tag, i) => <span key={i} className="px-2 py-0.5 rounded-full bg-notes/10 text-notes text-xs">{tag}</span>)}</div>
                <p className="text-xs text-muted-foreground">{format(new Date(note.updated_at), 'dd MMM yyyy')}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
