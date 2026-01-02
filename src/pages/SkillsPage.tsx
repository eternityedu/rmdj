import { useState, useEffect } from 'react';
import { Brain, Plus, Edit2, BookOpen, Clock, Target, ExternalLink } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/ui/empty-state';
import { getSkills, saveSkills, generateId } from '@/lib/storage';
import { Skill } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const categories = [
  { value: 'robotics', label: 'Robotics', color: 'text-investment' },
  { value: 'automation', label: 'Automation', color: 'text-founder' },
  { value: 'coding', label: 'Coding/CS50', color: 'text-skills' },
  { value: 'ai-ml', label: 'AI & ML', color: 'text-primary' },
  { value: 'math', label: 'Math', color: 'text-notes' },
  { value: 'physics', label: 'Physics', color: 'text-daily' },
  { value: 'chemistry', label: 'Chemistry', color: 'text-expense' },
  { value: 'business', label: 'Business', color: 'text-income' },
  { value: 'communication', label: 'Communication', color: 'text-muted-foreground' },
];

const categoryColors: Record<string, string> = {
  robotics: 'bg-investment/20 text-investment border-investment/30',
  automation: 'bg-founder/20 text-founder border-founder/30',
  coding: 'bg-skills/20 text-skills border-skills/30',
  'ai-ml': 'bg-primary/20 text-primary border-primary/30',
  math: 'bg-notes/20 text-notes border-notes/30',
  physics: 'bg-daily/20 text-daily border-daily/30',
  chemistry: 'bg-expense/20 text-expense border-expense/30',
  business: 'bg-income/20 text-income border-income/30',
  communication: 'bg-muted text-muted-foreground border-muted',
};

export function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [form, setForm] = useState({
    name: '',
    category: 'coding' as Skill['category'],
    level: '0',
    timeSpentToday: '0',
    totalHours: '0',
    tags: '',
    notes: '',
    resourceLink: '',
    isCurrentlyLearning: false,
  });

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = () => {
    setSkills(getSkills());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const skillData: Skill = {
      id: editingSkill?.id || generateId(),
      name: form.name,
      category: form.category,
      level: parseInt(form.level) || 0,
      timeSpentToday: parseInt(form.timeSpentToday) || 0,
      totalHours: parseFloat(form.totalHours) || 0,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      notes: form.notes,
      resourceLink: form.resourceLink,
      isCurrentlyLearning: form.isCurrentlyLearning,
      weeklyHours: editingSkill?.weeklyHours || [0, 0, 0, 0, 0, 0, 0],
      lastUpdated: new Date().toISOString(),
    };

    if (editingSkill) {
      const updated = skills.map(s => s.id === editingSkill.id ? skillData : s);
      saveSkills(updated);
    } else {
      saveSkills([...skills, skillData]);
    }

    loadSkills();
    resetForm();
  };

  const resetForm = () => {
    setForm({
      name: '',
      category: 'coding',
      level: '0',
      timeSpentToday: '0',
      totalHours: '0',
      tags: '',
      notes: '',
      resourceLink: '',
      isCurrentlyLearning: false,
    });
    setEditingSkill(null);
    setIsOpen(false);
  };

  const handleEdit = (skill: Skill) => {
    setEditingSkill(skill);
    setForm({
      name: skill.name,
      category: skill.category,
      level: skill.level.toString(),
      timeSpentToday: skill.timeSpentToday.toString(),
      totalHours: skill.totalHours.toString(),
      tags: skill.tags.join(', '),
      notes: skill.notes,
      resourceLink: skill.resourceLink || '',
      isCurrentlyLearning: skill.isCurrentlyLearning,
    });
    setIsOpen(true);
  };

  const updateTimeSpent = (skillId: string, minutes: number) => {
    const updated = skills.map(s => {
      if (s.id === skillId) {
        return {
          ...s,
          timeSpentToday: s.timeSpentToday + minutes,
          totalHours: s.totalHours + minutes / 60,
          lastUpdated: new Date().toISOString(),
        };
      }
      return s;
    });
    saveSkills(updated);
    loadSkills();
  };

  const filteredSkills = selectedCategory === 'all' 
    ? skills 
    : skills.filter(s => s.category === selectedCategory);

  const learningSkills = skills.filter(s => s.isCurrentlyLearning);

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
                <DialogTitle>{editingSkill ? 'Edit Skill' : 'Add Skill'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Skill Name</Label>
                  <Input
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Python Programming"
                    required
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as Skill['category'] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Skill Level: {form.level}%</Label>
                  <Input
                    type="range"
                    min="0"
                    max="100"
                    value={form.level}
                    onChange={e => setForm({ ...form, level: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Today (mins)</Label>
                    <Input
                      type="number"
                      value={form.timeSpentToday}
                      onChange={e => setForm({ ...form, timeSpentToday: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Total Hours</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={form.totalHours}
                      onChange={e => setForm({ ...form, totalHours: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <Label>Tags (comma separated)</Label>
                  <Input
                    value={form.tags}
                    onChange={e => setForm({ ...form, tags: e.target.value })}
                    placeholder="e.g., MIT, priority, daily"
                  />
                </div>
                <div>
                  <Label>Resource Link</Label>
                  <Input
                    type="url"
                    value={form.resourceLink}
                    onChange={e => setForm({ ...form, resourceLink: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    placeholder="Learning notes..."
                    rows={3}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Currently Learning</Label>
                  <Switch
                    checked={form.isCurrentlyLearning}
                    onCheckedChange={(checked) => setForm({ ...form, isCurrentlyLearning: checked })}
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

      {/* Currently Learning */}
      {learningSkills.length > 0 && (
        <Card className="border-skills/20 bg-skills/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen size={16} className="text-skills" />
              Currently Learning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {learningSkills.map(skill => (
                <div
                  key={skill.id}
                  className="px-3 py-1.5 rounded-full bg-skills/10 border border-skills/30 text-sm flex items-center gap-2"
                >
                  <span>{skill.name}</span>
                  <span className="text-skills mono text-xs">{skill.level}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Filter */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="w-full overflow-x-auto flex gap-1 bg-transparent p-0 no-scrollbar">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            All
          </TabsTrigger>
          {categories.map(cat => (
            <TabsTrigger 
              key={cat.value} 
              value={cat.value}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-4">
          {filteredSkills.length === 0 ? (
            <EmptyState
              icon={Brain}
              title="No skills yet"
              description="Start tracking your learning journey. Add your first skill."
              actionLabel="Add Skill"
              onAction={() => setIsOpen(true)}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredSkills.map((skill) => (
                <Card key={skill.id} className={`border-border/50 hover:border-skills/30 transition-colors ${skill.isCurrentlyLearning ? 'ring-1 ring-skills/30' : ''}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {skill.name}
                          {skill.isCurrentlyLearning && (
                            <span className="w-2 h-2 rounded-full bg-skills animate-pulse" />
                          )}
                        </CardTitle>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs mt-1 border ${categoryColors[skill.category]}`}>
                          {categories.find(c => c.value === skill.category)?.label}
                        </span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(skill)}>
                        <Edit2 size={14} />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Skill Level</span>
                        <span className="font-medium text-skills mono">{skill.level}%</span>
                      </div>
                      <Progress value={skill.level} className="h-2" />
                    </div>

                    {/* Time Stats */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 rounded-lg bg-muted/30 flex items-center gap-2">
                        <Clock size={14} className="text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Today</p>
                          <p className="font-medium mono">{skill.timeSpentToday}m</p>
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/30 flex items-center gap-2">
                        <Target size={14} className="text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="font-medium mono">{skill.totalHours.toFixed(1)}h</p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Add Time */}
                    <div className="flex gap-1">
                      {[15, 30, 60].map(mins => (
                        <Button
                          key={mins}
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => updateTimeSpent(skill.id, mins)}
                        >
                          +{mins}m
                        </Button>
                      ))}
                    </div>

                    {/* Tags */}
                    {skill.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {skill.tags.map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Resource Link */}
                    {skill.resourceLink && (
                      <a
                        href={skill.resourceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink size={12} />
                        Resource Link
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
