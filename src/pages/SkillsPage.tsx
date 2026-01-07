import { useState } from 'react';
import { Brain, Plus, X, Edit2, Check, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { useUserSkills } from '@/hooks/useUserSkills';
import { toast } from 'sonner';

export function SkillsPage() {
  const { skills, loading, addSkill, updateSkill, deleteSkill } = useUserSkills();
  const [newSkill, setNewSkill] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddSkill = async () => {
    if (!newSkill.trim()) return;
    
    setIsAdding(true);
    const { error } = await addSkill(newSkill.trim());
    setIsAdding(false);
    
    if (!error) {
      setNewSkill('');
      toast.success('Skill added!');
    }
  };

  const handleUpdateSkill = async (id: string) => {
    if (!editingName.trim()) return;
    
    const { error } = await updateSkill(id, editingName.trim());
    if (!error) {
      setEditingId(null);
      setEditingName('');
      toast.success('Skill updated!');
    }
  };

  const handleDeleteSkill = async (id: string) => {
    const { error } = await deleteSkill(id);
    if (!error) {
      toast.success('Skill removed!');
    }
  };

  const startEditing = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in pb-20 lg:pb-6">
      <PageHeader
        title="Skills"
        description="Your custom skill tags"
        icon={Brain}
        iconColor="text-skills"
      />

      {/* Add Skill Input */}
      <Card className="border-skills/20">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add a new skill..."
              onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
              className="flex-1"
            />
            <Button onClick={handleAddSkill} disabled={isAdding || !newSkill.trim()} className="gap-2">
              {isAdding ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Skills Display */}
      {skills.length === 0 ? (
        <EmptyState
          icon={Brain}
          title="No skills yet"
          description="Add your custom skills to track your expertise"
          actionLabel="Add Your First Skill"
          onAction={() => document.querySelector('input')?.focus()}
        />
      ) : (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain size={16} className="text-skills" />
              Your Skills ({skills.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  className="group flex items-center gap-2 px-3 py-2 rounded-full bg-skills/10 border border-skills/30 text-sm transition-all hover:bg-skills/20"
                >
                  {editingId === skill.id ? (
                    <>
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="h-6 w-32 px-2 text-sm"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateSkill(skill.id)}
                      />
                      <button
                        onClick={() => handleUpdateSkill(skill.id)}
                        className="p-1 rounded hover:bg-skills/30"
                      >
                        <Check size={14} className="text-income" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 rounded hover:bg-skills/30"
                      >
                        <X size={14} className="text-muted-foreground" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-foreground">{skill.name}</span>
                      <button
                        onClick={() => startEditing(skill.id, skill.name)}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-skills/30"
                      >
                        <Edit2 size={12} className="text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleDeleteSkill(skill.id)}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-expense/30"
                      >
                        <X size={12} className="text-expense" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
