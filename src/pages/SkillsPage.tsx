import { useState } from 'react';
import { Brain, Plus, X, Edit2, Loader2, Youtube, FileText, Clock, Calendar, TrendingUp, BookOpen, ExternalLink } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useUserSkills, UserSkill, SkillInput } from '@/hooks/useUserSkills';
import { toast } from 'sonner';

export function SkillsPage() {
  const { skills, loading, addSkill, updateSkill, deleteSkill } = useUserSkills();
  const [isOpen, setIsOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<UserSkill | null>(null);
  const [form, setForm] = useState<SkillInput>({
    name: '',
    youtube_link: '',
    notes: '',
    progress: 0,
    is_currently_learning: true,
    daily_minutes: 30,
    monthly_hours: 10,
  });

  const resetForm = () => {
    setForm({
      name: '',
      youtube_link: '',
      notes: '',
      progress: 0,
      is_currently_learning: true,
      daily_minutes: 30,
      monthly_hours: 10,
    });
    setEditingSkill(null);
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Please enter a skill name');
      return;
    }

    if (editingSkill) {
      const { error } = await updateSkill(editingSkill.id, form);
      if (!error) {
        toast.success('Skill updated!');
        resetForm();
      }
    } else {
      const { error } = await addSkill(form);
      if (!error) {
        toast.success('Skill added!');
        resetForm();
      }
    }
  };

  const handleEdit = (skill: UserSkill) => {
    setEditingSkill(skill);
    setForm({
      name: skill.name,
      youtube_link: skill.youtube_link || '',
      notes: skill.notes || '',
      progress: skill.progress,
      is_currently_learning: skill.is_currently_learning,
      daily_minutes: skill.daily_minutes,
      monthly_hours: skill.monthly_hours,
    });
    setIsOpen(true);
  };

  const handleProgressUpdate = async (skill: UserSkill, newProgress: number) => {
    await updateSkill(skill.id, { progress: Math.min(100, Math.max(0, newProgress)) });
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteSkill(id);
    if (!error) {
      toast.success('Skill removed!');
    }
  };

  const currentlyLearning = skills.filter(s => s.is_currently_learning);
  const completedSkills = skills.filter(s => s.progress === 100);
  const inProgressSkills = skills.filter(s => s.is_currently_learning && s.progress < 100);

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
        description="Track your learning journey"
        icon={Brain}
        iconColor="text-skills"
        action={
          <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus size={16} />
                Add Skill
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingSkill ? 'Edit Skill' : 'Add New Skill'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Skill Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Machine Learning, React, Piano"
                    required
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <Youtube size={14} className="text-red-500" />
                    YouTube Learning Link
                  </Label>
                  <Input
                    value={form.youtube_link}
                    onChange={(e) => setForm({ ...form, youtube_link: e.target.value })}
                    placeholder="https://youtube.com/..."
                    type="url"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <FileText size={14} />
                    Notes
                  </Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="What you want to learn, resources, goals..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <TrendingUp size={14} />
                    Progress: {form.progress}%
                  </Label>
                  <Input
                    type="range"
                    min="0"
                    max="100"
                    value={form.progress}
                    onChange={(e) => setForm({ ...form, progress: parseInt(e.target.value) })}
                    className="cursor-pointer"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Clock size={14} />
                      Minutes/Day
                    </Label>
                    <Input
                      type="number"
                      value={form.daily_minutes}
                      onChange={(e) => setForm({ ...form, daily_minutes: parseInt(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Calendar size={14} />
                      Hours/Month
                    </Label>
                    <Input
                      type="number"
                      value={form.monthly_hours}
                      onChange={(e) => setForm({ ...form, monthly_hours: parseInt(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Currently Learning</Label>
                  <Switch
                    checked={form.is_currently_learning}
                    onCheckedChange={(checked) => setForm({ ...form, is_currently_learning: checked })}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingSkill ? 'Update Skill' : 'Add Skill'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-skills/30 bg-skills/5">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-skills">{skills.length}</p>
            <p className="text-xs text-muted-foreground">Total Skills</p>
          </CardContent>
        </Card>
        <Card className="border-income/30 bg-income/5">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-income">{inProgressSkills.length}</p>
            <p className="text-xs text-muted-foreground">Learning</p>
          </CardContent>
        </Card>
        <Card className="border-founder/30 bg-founder/5">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-founder">{completedSkills.length}</p>
            <p className="text-xs text-muted-foreground">Mastered</p>
          </CardContent>
        </Card>
      </div>

      {/* Skills Display */}
      {skills.length === 0 ? (
        <EmptyState
          icon={Brain}
          title="No skills yet"
          description="Start tracking your learning journey by adding skills"
          actionLabel="Add Your First Skill"
          onAction={() => setIsOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {/* Currently Learning */}
          {currentlyLearning.length > 0 && (
            <Card className="border-skills/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen size={16} className="text-skills" />
                  Currently Learning ({currentlyLearning.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentlyLearning.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onProgressUpdate={handleProgressUpdate}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Completed Skills */}
          {completedSkills.length > 0 && (
            <Card className="border-founder/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp size={16} className="text-founder" />
                  Mastered Skills ({completedSkills.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {completedSkills.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onProgressUpdate={handleProgressUpdate}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Not Currently Learning */}
          {skills.filter(s => !s.is_currently_learning && s.progress < 100).length > 0 && (
            <Card className="border-muted">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
                  <Clock size={16} />
                  Paused ({skills.filter(s => !s.is_currently_learning && s.progress < 100).length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {skills.filter(s => !s.is_currently_learning && s.progress < 100).map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onProgressUpdate={handleProgressUpdate}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

interface SkillCardProps {
  skill: UserSkill;
  onEdit: (skill: UserSkill) => void;
  onDelete: (id: string) => void;
  onProgressUpdate: (skill: UserSkill, progress: number) => void;
}

function SkillCard({ skill, onEdit, onDelete, onProgressUpdate }: SkillCardProps) {
  return (
    <div className="p-4 rounded-lg border border-border/50 bg-card/50 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            {skill.name}
            {skill.progress === 100 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-founder/20 text-founder">Mastered</span>
            )}
            {skill.is_currently_learning && skill.progress < 100 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-income/20 text-income">Learning</span>
            )}
          </h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {skill.daily_minutes} min/day
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {skill.monthly_hours} hrs/month
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(skill)}>
            <Edit2 size={14} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-expense hover:text-expense" onClick={() => onDelete(skill.id)}>
            <X size={14} />
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{skill.progress}%</span>
        </div>
        <Progress value={skill.progress} className="h-2" />
        <div className="flex gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onProgressUpdate(skill, skill.progress + 5)}
          >
            +5%
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onProgressUpdate(skill, skill.progress + 10)}
          >
            +10%
          </Button>
        </div>
      </div>

      {/* YouTube Link */}
      {skill.youtube_link && (
        <a
          href={skill.youtube_link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-red-500 hover:text-red-400 transition-colors"
        >
          <Youtube size={16} />
          <span className="truncate flex-1">Learning Resource</span>
          <ExternalLink size={12} />
        </a>
      )}

      {/* Notes */}
      {skill.notes && (
        <div className="p-2 rounded bg-muted/50 text-sm text-muted-foreground">
          <p className="flex items-start gap-2">
            <FileText size={14} className="mt-0.5 shrink-0" />
            <span className="line-clamp-2">{skill.notes}</span>
          </p>
        </div>
      )}
    </div>
  );
}
