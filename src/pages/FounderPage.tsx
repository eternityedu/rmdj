import { useState, useEffect } from 'react';
import { Crown, Target, Brain, Play, Lightbulb, BookOpen, ChevronDown, ChevronUp, Trophy, AlertTriangle, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getVision, addVisionItem, getSkills, getDailyOverviews, saveDailyOverview, getWeeklyReviews, saveWeeklyReview, generateId } from '@/lib/storage';
import { VisionItem, DailyOverview, WeeklyReview } from '@/types';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { FocusMode } from '@/components/FocusMode';

export function FounderPage() {
  const [vision, setVision] = useState<VisionItem[]>([]);
  const [todayOverview, setTodayOverview] = useState<DailyOverview | null>(null);
  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReview[]>([]);
  const [isVisionOpen, setIsVisionOpen] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(true);
  const [visionForm, setVisionForm] = useState({ title: '', description: '', category: 'mit' as VisionItem['category'], progress: '0' });
  const [overviewForm, setOverviewForm] = useState({ studyTime: '', companyProgress: '', healthScore: '', disciplineScore: '', notes: '' });
  const [reviewForm, setReviewForm] = useState({ wins: '', challenges: '', nextWeekGoals: '' });

  const today = new Date();
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const currentWeekReview = weeklyReviews.find(r => r.weekStart === weekStart);

  useEffect(() => { 
    setVision(getVision()); 
    setWeeklyReviews(getWeeklyReviews());
    const overviews = getDailyOverviews();
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    setTodayOverview(overviews.find(o => o.date === todayStr) || null);
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
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    saveDailyOverview({
      date: todayStr,
      studyTime: parseInt(overviewForm.studyTime) || 0,
      companyProgress: overviewForm.companyProgress,
      healthScore: parseInt(overviewForm.healthScore) || 5,
      disciplineScore: parseInt(overviewForm.disciplineScore) || 5,
      notes: overviewForm.notes,
    });
    setTodayOverview(getDailyOverviews().find(o => o.date === todayStr) || null);
  };

  const handleReviewSave = () => {
    const review: WeeklyReview = {
      id: generateId(),
      weekStart,
      weekEnd,
      wins: reviewForm.wins.split('\n').filter(s => s.trim()),
      challenges: reviewForm.challenges.split('\n').filter(s => s.trim()),
      improvements: [],
      nextWeekGoals: reviewForm.nextWeekGoals.split('\n').filter(s => s.trim()),
    };
    saveWeeklyReview(review);
    setWeeklyReviews(getWeeklyReviews());
    setReviewForm({ wins: '', challenges: '', nextWeekGoals: '' });
  };

  const skills = getSkills();
  const learningCount = skills.filter(s => s.isCurrentlyLearning).length;
  const avgSkillLevel = skills.length > 0 ? Math.round(skills.reduce((a, s) => a + s.level, 0) / skills.length) : 0;

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const categoryColors: Record<string, string> = { mit: 'bg-primary/20 text-primary', sids: 'bg-founder/20 text-founder', rmdj: 'bg-income/20 text-income', personal: 'bg-notes/20 text-notes' };

  const handleDeepWorkClick = () => {
    if (!isTimerActive) {
      setIsTimerActive(true);
      setIsFocusModeOpen(true);
    } else {
      setIsFocusModeOpen(true);
    }
  };

  const handleFocusModeClose = () => {
    setIsFocusModeOpen(false);
    setIsTimerActive(false);
  };

  return (
    <div className="space-y-4 animate-fade-in pb-20 lg:pb-6">
      <PageHeader title="Founder" description="Your personal CEO command center" icon={Crown} iconColor="text-founder" />

      {/* Focus Mode Overlay */}
      <FocusMode 
        isOpen={isFocusModeOpen} 
        onClose={handleFocusModeClose}
        initialSeconds={timerSeconds}
      />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-founder/20 bg-founder/5 cursor-pointer hover:bg-founder/10 transition-colors active:scale-95" onClick={handleDeepWorkClick}>
          <CardContent className="p-3 text-center">
            <Play size={20} className={`mx-auto mb-1 ${isTimerActive ? 'text-income' : 'text-founder'}`} />
            <p className="text-xs font-medium">{isTimerActive ? 'Resume Focus' : 'Deep Work'}</p>
            <p className="text-base font-bold mono text-founder">{formatTime(timerSeconds)}</p>
          </CardContent>
        </Card>
        <Dialog open={isVisionOpen} onOpenChange={setIsVisionOpen}>
          <DialogTrigger asChild>
            <Card className="border-primary/20 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors active:scale-95">
              <CardContent className="p-3 text-center">
                <Target size={20} className="mx-auto mb-1 text-primary" />
                <p className="text-xs font-medium">Add Vision</p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add Vision Goal</DialogTitle></DialogHeader>
            <form onSubmit={handleVisionSubmit} className="space-y-4">
              <div><Label>Title</Label><Input className="h-12" value={visionForm.title} onChange={e => setVisionForm({ ...visionForm, title: e.target.value })} required /></div>
              <div><Label>Description</Label><Textarea value={visionForm.description} onChange={e => setVisionForm({ ...visionForm, description: e.target.value })} rows={3} /></div>
              <div><Label>Category</Label><select className="w-full h-12 px-3 rounded-lg bg-muted border border-border" value={visionForm.category} onChange={e => setVisionForm({ ...visionForm, category: e.target.value as VisionItem['category'] })}><option value="mit">MIT Prep</option><option value="sids">S.I.D.S</option><option value="rmdj">RMDJ</option><option value="personal">Personal</option></select></div>
              <Button type="submit" className="w-full h-12">Add Goal</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-skills/20 bg-skills/5"><CardContent className="p-3 text-center"><Brain size={18} className="mx-auto mb-1 text-skills" /><p className="text-xs text-muted-foreground">Skills</p><p className="text-lg font-bold text-skills">{learningCount} active</p></CardContent></Card>
        <Card className="border-notes/20 bg-notes/5"><CardContent className="p-3 text-center"><BookOpen size={18} className="mx-auto mb-1 text-notes" /><p className="text-xs text-muted-foreground">Avg Level</p><p className="text-lg font-bold text-notes">{avgSkillLevel}%</p></CardContent></Card>
      </div>

      {/* Weekly Review */}
      <Collapsible open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <Card className="border-founder/20">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-2 cursor-pointer">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2"><Trophy size={16} className="text-founder" />Weekly Review</span>
                {isReviewOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <p className="text-xs text-muted-foreground">Week: {format(startOfWeek(today, { weekStartsOn: 1 }), 'MMM d')} - {format(endOfWeek(today, { weekStartsOn: 1 }), 'MMM d')}</p>
              
              {currentWeekReview ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-income/10 border border-income/20">
                    <p className="text-xs font-medium text-income mb-2 flex items-center gap-1"><Trophy size={12} />Wins</p>
                    <ul className="text-sm space-y-1">{currentWeekReview.wins.map((w, i) => <li key={i} className="flex items-start gap-2"><span className="text-income">•</span>{w}</li>)}</ul>
                  </div>
                  <div className="p-3 rounded-lg bg-expense/10 border border-expense/20">
                    <p className="text-xs font-medium text-expense mb-2 flex items-center gap-1"><AlertTriangle size={12} />Challenges</p>
                    <ul className="text-sm space-y-1">{currentWeekReview.challenges.map((c, i) => <li key={i} className="flex items-start gap-2"><span className="text-expense">•</span>{c}</li>)}</ul>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-xs font-medium text-primary mb-2 flex items-center gap-1"><ArrowRight size={12} />Next Week Goals</p>
                    <ul className="text-sm space-y-1">{currentWeekReview.nextWeekGoals.map((g, i) => <li key={i} className="flex items-start gap-2"><span className="text-primary">•</span>{g}</li>)}</ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div><Label className="text-xs">Wins (one per line)</Label><Textarea className="text-sm" placeholder="What went well this week?" value={reviewForm.wins} onChange={e => setReviewForm({ ...reviewForm, wins: e.target.value })} rows={3} /></div>
                  <div><Label className="text-xs">Challenges (one per line)</Label><Textarea className="text-sm" placeholder="What obstacles did you face?" value={reviewForm.challenges} onChange={e => setReviewForm({ ...reviewForm, challenges: e.target.value })} rows={3} /></div>
                  <div><Label className="text-xs">Next Week Goals (one per line)</Label><Textarea className="text-sm" placeholder="What will you accomplish next week?" value={reviewForm.nextWeekGoals} onChange={e => setReviewForm({ ...reviewForm, nextWeekGoals: e.target.value })} rows={3} /></div>
                  <Button onClick={handleReviewSave} className="w-full h-11">Save Review</Button>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Vision Board */}
      <Card className="border-border/50">
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Lightbulb size={16} className="text-founder" />Vision Board</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {vision.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Add your long-term vision goals</p> : vision.map(v => (
              <div key={v.id} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between mb-2"><span className="font-medium text-sm">{v.title}</span><span className={`px-2 py-0.5 rounded-full text-[10px] ${categoryColors[v.category]}`}>{v.category.toUpperCase()}</span></div>
                {v.description && <p className="text-xs text-muted-foreground mb-2">{v.description}</p>}
                <Progress value={v.progress} className="h-1.5" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Overview */}
      <Card className="border-border/50">
        <CardHeader className="pb-2"><CardTitle className="text-base">Daily Overview</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Study (mins)</Label><Input type="number" className="h-11" value={overviewForm.studyTime} onChange={e => setOverviewForm({ ...overviewForm, studyTime: e.target.value })} /></div>
            <div><Label className="text-xs">Health (1-10)</Label><Input type="number" min="1" max="10" className="h-11" value={overviewForm.healthScore} onChange={e => setOverviewForm({ ...overviewForm, healthScore: e.target.value })} /></div>
          </div>
          <div><Label className="text-xs">Discipline (1-10)</Label><Input type="number" min="1" max="10" className="h-11" value={overviewForm.disciplineScore} onChange={e => setOverviewForm({ ...overviewForm, disciplineScore: e.target.value })} /></div>
          <div><Label className="text-xs">Company Progress</Label><Input className="h-11" value={overviewForm.companyProgress} onChange={e => setOverviewForm({ ...overviewForm, companyProgress: e.target.value })} placeholder="What did you achieve?" /></div>
          <div><Label className="text-xs">Notes</Label><Textarea value={overviewForm.notes} onChange={e => setOverviewForm({ ...overviewForm, notes: e.target.value })} rows={2} /></div>
          <Button onClick={handleOverviewSave} className="w-full h-11">Save Overview</Button>
        </CardContent>
      </Card>
    </div>
  );
}
