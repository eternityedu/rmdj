import { useState, useEffect } from 'react';
import { Crown, Target, Brain, Zap, Plus, Play, Lightbulb, BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getVision, addVisionItem, getSkills, getDailyOverviews, saveDailyOverview, generateId } from '@/lib/storage';
import { VisionItem, DailyOverview } from '@/types';
import { format } from 'date-fns';

export function FounderPage() {
  const [vision, setVision] = useState<VisionItem[]>([]);
  const [todayOverview, setTodayOverview] = useState<DailyOverview | null>(null);
  const [isVisionOpen, setIsVisionOpen] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [visionForm, setVisionForm] = useState({ title: '', description: '', category: 'mit' as VisionItem['category'], progress: '0' });
  const [overviewForm, setOverviewForm] = useState({ studyTime: '', companyProgress: '', healthScore: '', disciplineScore: '', notes: '' });

  useEffect(() => { 
    setVision(getVision()); 
    const overviews = getDailyOverviews();
    const today = format(new Date(), 'yyyy-MM-dd');
    setTodayOverview(overviews.find(o => o.date === today) || null);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive) interval = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isTimerActive]);

  const handleVisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addVisionItem({ id: generateId(), title: visionForm.title, description: visionForm.description, category: visionForm.category, progress: parseInt(visionForm.progress) });
    setVision(getVision());
    setVisionForm({ title: '', description: '', category: 'mit', progress: '0' });
    setIsVisionOpen(false);
  };

  const handleOverviewSave = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    saveDailyOverview({
      date: today,
      studyTime: parseInt(overviewForm.studyTime) || 0,
      companyProgress: overviewForm.companyProgress,
      healthScore: parseInt(overviewForm.healthScore) || 5,
      disciplineScore: parseInt(overviewForm.disciplineScore) || 5,
      notes: overviewForm.notes,
    });
    setTodayOverview(getDailyOverviews().find(o => o.date === today) || null);
  };

  const skills = getSkills();
  const learningCount = skills.filter(s => s.isCurrentlyLearning).length;
  const avgSkillLevel = skills.length > 0 ? Math.round(skills.reduce((a, s) => a + s.level, 0) / skills.length) : 0;

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const categoryColors: Record<string, string> = { mit: 'bg-primary/20 text-primary', sids: 'bg-founder/20 text-founder', rmdj: 'bg-income/20 text-income', personal: 'bg-notes/20 text-notes' };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Founder" description="Your personal CEO command center" icon={Crown} iconColor="text-founder" />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-founder/20 bg-founder/5 cursor-pointer hover:bg-founder/10 transition-colors" onClick={() => setIsTimerActive(!isTimerActive)}>
          <CardContent className="p-4 text-center">
            <Play size={24} className={`mx-auto mb-2 ${isTimerActive ? 'text-income' : 'text-founder'}`} />
            <p className="text-sm font-medium">{isTimerActive ? 'Stop' : 'Deep Work'}</p>
            <p className="text-lg font-bold mono text-founder">{formatTime(timerSeconds)}</p>
          </CardContent>
        </Card>
        <Dialog open={isVisionOpen} onOpenChange={setIsVisionOpen}>
          <DialogTrigger asChild>
            <Card className="border-primary/20 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors">
              <CardContent className="p-4 text-center"><Target size={24} className="mx-auto mb-2 text-primary" /><p className="text-sm font-medium">Add Vision</p></CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Add Vision Goal</DialogTitle></DialogHeader>
            <form onSubmit={handleVisionSubmit} className="space-y-4">
              <div><Label>Title</Label><Input value={visionForm.title} onChange={e => setVisionForm({ ...visionForm, title: e.target.value })} required /></div>
              <div><Label>Description</Label><Textarea value={visionForm.description} onChange={e => setVisionForm({ ...visionForm, description: e.target.value })} rows={3} /></div>
              <div><Label>Category</Label><select className="w-full p-2 rounded-lg bg-muted border border-border" value={visionForm.category} onChange={e => setVisionForm({ ...visionForm, category: e.target.value as VisionItem['category'] })}><option value="mit">MIT Prep</option><option value="sids">S.I.D.S</option><option value="rmdj">RMDJ</option><option value="personal">Personal</option></select></div>
              <Button type="submit" className="w-full">Add Goal</Button>
            </form>
          </DialogContent>
        </Dialog>
        <Card className="border-skills/20 bg-skills/5"><CardContent className="p-4 text-center"><Brain size={24} className="mx-auto mb-2 text-skills" /><p className="text-sm font-medium">Skills</p><p className="text-lg font-bold text-skills">{learningCount} active</p></CardContent></Card>
        <Card className="border-notes/20 bg-notes/5"><CardContent className="p-4 text-center"><BookOpen size={24} className="mx-auto mb-2 text-notes" /><p className="text-sm font-medium">Avg Level</p><p className="text-lg font-bold text-notes">{avgSkillLevel}%</p></CardContent></Card>
      </div>

      {/* Vision Board */}
      <Card className="border-border/50"><CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Lightbulb size={16} className="text-founder" />Vision Board</CardTitle></CardHeader>
        <CardContent><div className="space-y-3">{vision.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Add your long-term vision goals</p> : vision.map(v => (
          <div key={v.id} className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center justify-between mb-2"><span className="font-medium">{v.title}</span><span className={`px-2 py-0.5 rounded-full text-xs ${categoryColors[v.category]}`}>{v.category.toUpperCase()}</span></div>
            {v.description && <p className="text-sm text-muted-foreground mb-2">{v.description}</p>}
            <Progress value={v.progress} className="h-2" />
          </div>
        ))}</div></CardContent>
      </Card>

      {/* Daily Overview */}
      <Card className="border-border/50"><CardHeader className="pb-2"><CardTitle className="text-base">Daily Overview</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Study Time (mins)</Label><Input type="number" value={overviewForm.studyTime} onChange={e => setOverviewForm({ ...overviewForm, studyTime: e.target.value })} /></div>
            <div><Label>Health (1-10)</Label><Input type="number" min="1" max="10" value={overviewForm.healthScore} onChange={e => setOverviewForm({ ...overviewForm, healthScore: e.target.value })} /></div>
            <div><Label>Discipline (1-10)</Label><Input type="number" min="1" max="10" value={overviewForm.disciplineScore} onChange={e => setOverviewForm({ ...overviewForm, disciplineScore: e.target.value })} /></div>
          </div>
          <div><Label>Company Progress</Label><Input value={overviewForm.companyProgress} onChange={e => setOverviewForm({ ...overviewForm, companyProgress: e.target.value })} placeholder="What did you achieve today?" /></div>
          <div><Label>Notes</Label><Textarea value={overviewForm.notes} onChange={e => setOverviewForm({ ...overviewForm, notes: e.target.value })} rows={2} /></div>
          <Button onClick={handleOverviewSave} className="w-full">Save Overview</Button>
        </CardContent>
      </Card>
    </div>
  );
}
