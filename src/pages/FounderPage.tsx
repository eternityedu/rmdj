import { useState, useEffect } from 'react';
import { Crown, Target, Lightbulb, BookOpen, ChevronDown, ChevronUp, Trophy, AlertTriangle, ArrowRight, Calendar, ChevronLeft, ChevronRight, Timer, Check, Eye, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useVision } from '@/hooks/useVision';
import { useDailyOverviews } from '@/hooks/useDailyOverviews';
import { useWeeklyReviews } from '@/hooks/useWeeklyReviews';
import { useUserSkills } from '@/hooks/useUserSkills';
import { getPomodoroSessions } from '@/lib/storage';
import { format, startOfWeek, endOfWeek, addDays, subDays, addWeeks, subWeeks, isToday, isSameWeek } from 'date-fns';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import { toast } from 'sonner';

export function FounderPage() {
  const { visionItems, loading: visionLoading, addVisionItem, updateVisionItem } = useVision();
  const { overviews, loading: overviewsLoading, getOverviewByDate, saveOverview } = useDailyOverviews();
  const { reviews, loading: reviewsLoading, getReviewByWeek, saveReview } = useWeeklyReviews();
  const { skills } = useUserSkills();
  
  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);
  const [isVisionOpen, setIsVisionOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(true);
  const [isDailyOpen, setIsDailyOpen] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isWeeklyHistoryOpen, setIsWeeklyHistoryOpen] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedWeekStart, setSelectedWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  
  const [visionForm, setVisionForm] = useState({ title: '', description: '', category: 'mit' as 'mit' | 'sids' | 'rmdj' | 'personal', targetDate: '' });
  const [overviewForm, setOverviewForm] = useState({ studyTime: '', companyProgress: '', healthScore: '', disciplineScore: '', notes: '' });
  const [reviewForm, setReviewForm] = useState({ wins: '', challenges: '', nextWeekGoals: '' });

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const weekStart = format(selectedWeekStart, 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(selectedWeekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd');

  // Load daily overview when date changes
  useEffect(() => {
    const overview = getOverviewByDate(selectedDateStr);
    if (overview) {
      setOverviewForm({
        studyTime: overview.study_time.toString(),
        companyProgress: overview.company_progress || '',
        healthScore: overview.health_score.toString(),
        disciplineScore: overview.discipline_score.toString(),
        notes: overview.notes || '',
      });
    } else {
      setOverviewForm({ studyTime: '', companyProgress: '', healthScore: '', disciplineScore: '', notes: '' });
    }
  }, [selectedDateStr, overviews, getOverviewByDate]);

  // Load weekly review when week changes
  useEffect(() => {
    const review = getReviewByWeek(weekStart);
    if (review) {
      setReviewForm({
        wins: review.wins.join('\n'),
        challenges: review.challenges.join('\n'),
        nextWeekGoals: review.next_week_goals.join('\n'),
      });
    } else {
      setReviewForm({ wins: '', challenges: '', nextWeekGoals: '' });
    }
  }, [weekStart, reviews, getReviewByWeek]);

  const handleVisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addVisionItem({ 
      title: visionForm.title, 
      description: visionForm.description || null, 
      category: visionForm.category, 
      progress: 0,
      target_date: visionForm.targetDate || null,
      is_completed: false,
    });
    setVisionForm({ title: '', description: '', category: 'mit', targetDate: '' });
    setIsVisionOpen(false);
    toast.success('Vision goal added!');
  };

  const handleToggleVisionComplete = async (id: string, completed: boolean) => {
    await updateVisionItem(id, { is_completed: !completed, progress: !completed ? 100 : 0 });
    toast.success(!completed ? 'Vision completed!' : 'Vision marked incomplete');
  };

  const handleOverviewSave = async () => {
    await saveOverview({
      date: selectedDateStr,
      study_time: parseInt(overviewForm.studyTime) || 0,
      company_progress: overviewForm.companyProgress || null,
      health_score: parseInt(overviewForm.healthScore) || 5,
      discipline_score: parseInt(overviewForm.disciplineScore) || 5,
      notes: overviewForm.notes || null,
    });
    toast.success('Daily overview saved!');
  };

  const handleReviewSave = async () => {
    await saveReview({
      week_start: weekStart,
      week_end: weekEnd,
      wins: reviewForm.wins.split('\n').filter(s => s.trim()),
      challenges: reviewForm.challenges.split('\n').filter(s => s.trim()),
      improvements: [],
      next_week_goals: reviewForm.nextWeekGoals.split('\n').filter(s => s.trim()),
    });
    toast.success('Weekly review saved!');
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    setSelectedDate(direction === 'prev' ? subDays(selectedDate, 1) : addDays(selectedDate, 1));
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setSelectedWeekStart(direction === 'prev' ? subWeeks(selectedWeekStart, 1) : addWeeks(selectedWeekStart, 1));
  };

  const learningCount = skills.filter(s => s.is_currently_learning).length;
  const avgSkillLevel = skills.length > 0 ? Math.round(skills.reduce((a, s) => a + (s.progress || 0), 0) / skills.length) : 0;

  const todaySessions = getPomodoroSessions().filter(
    s => s.type === 'work' && s.completed && s.startTime.startsWith(format(new Date(), 'yyyy-MM-dd'))
  );

  const categoryColors: Record<string, string> = { mit: 'bg-primary/20 text-primary', sids: 'bg-founder/20 text-founder', rmdj: 'bg-income/20 text-income', personal: 'bg-notes/20 text-notes' };

  const isCurrentWeek = isSameWeek(selectedWeekStart, new Date(), { weekStartsOn: 1 });
  const currentDailyOverview = getOverviewByDate(selectedDateStr);
  const currentWeeklyReview = getReviewByWeek(weekStart);

  const loading = visionLoading || overviewsLoading || reviewsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in pb-20 lg:pb-6">
      <PageHeader title="Founder" description="Your personal CEO command center" icon={Crown} iconColor="text-founder" />

      <PomodoroTimer isOpen={isPomodoroOpen} onClose={() => setIsPomodoroOpen(false)} />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-founder/20 bg-founder/5 cursor-pointer hover:bg-founder/10 transition-colors active:scale-95" onClick={() => setIsPomodoroOpen(true)}>
          <CardContent className="p-3 text-center">
            <Timer size={20} className="mx-auto mb-1 text-founder" />
            <p className="text-xs font-medium">Pomodoro</p>
            <p className="text-base font-bold mono text-founder">{todaySessions.length} sessions</p>
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
              <div><Label>Target Date (optional)</Label><Input type="date" className="h-12" value={visionForm.targetDate} onChange={e => setVisionForm({ ...visionForm, targetDate: e.target.value })} /></div>
              <div><Label>Category</Label><select className="w-full h-12 px-3 rounded-lg bg-muted border border-border" value={visionForm.category} onChange={e => setVisionForm({ ...visionForm, category: e.target.value as 'mit' | 'sids' | 'rmdj' | 'personal' })}><option value="mit">MIT Prep</option><option value="sids">S.I.D.S</option><option value="rmdj">RMDJ</option><option value="personal">Personal</option></select></div>
              <Button type="submit" className="w-full h-12">Add Goal</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-skills/20 bg-skills/5"><CardContent className="p-3 text-center"><BookOpen size={18} className="mx-auto mb-1 text-skills" /><p className="text-xs text-muted-foreground">Skills</p><p className="text-lg font-bold text-skills">{learningCount} active</p></CardContent></Card>
        <Card className="border-notes/20 bg-notes/5"><CardContent className="p-3 text-center"><Target size={18} className="mx-auto mb-1 text-notes" /><p className="text-xs text-muted-foreground">Avg Level</p><p className="text-lg font-bold text-notes">{avgSkillLevel}%</p></CardContent></Card>
      </div>

      {/* Daily Overview */}
      <Collapsible open={isDailyOpen} onOpenChange={setIsDailyOpen}>
        <Card className="border-daily/20">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-2 cursor-pointer">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2"><Calendar size={16} className="text-daily" />Daily Overview</span>
                {isDailyOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateDay('prev')}><ChevronLeft size={16} /></Button>
                <div className="text-center">
                  <p className="text-sm font-medium">{format(selectedDate, 'EEEE')}</p>
                  <p className="text-xs text-muted-foreground">{format(selectedDate, 'MMM d, yyyy')}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateDay('next')} disabled={isToday(selectedDate)}><ChevronRight size={16} /></Button>
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={() => setIsHistoryOpen(true)}><Eye size={14} className="mr-2" />View All Daily Overviews ({overviews.length})</Button>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Study (mins)</Label><Input type="number" className="h-11" value={overviewForm.studyTime} onChange={e => setOverviewForm({ ...overviewForm, studyTime: e.target.value })} /></div>
                  <div><Label className="text-xs">Health (1-10)</Label><Input type="number" min="1" max="10" className="h-11" value={overviewForm.healthScore} onChange={e => setOverviewForm({ ...overviewForm, healthScore: e.target.value })} /></div>
                </div>
                <div><Label className="text-xs">Discipline (1-10)</Label><Input type="number" min="1" max="10" className="h-11" value={overviewForm.disciplineScore} onChange={e => setOverviewForm({ ...overviewForm, disciplineScore: e.target.value })} /></div>
                <div><Label className="text-xs">Company Progress</Label><Input className="h-11" value={overviewForm.companyProgress} onChange={e => setOverviewForm({ ...overviewForm, companyProgress: e.target.value })} placeholder="What did you achieve?" /></div>
                <div><Label className="text-xs">Notes</Label><Textarea value={overviewForm.notes} onChange={e => setOverviewForm({ ...overviewForm, notes: e.target.value })} rows={2} /></div>
                <Button onClick={handleOverviewSave} className="w-full h-11">{currentDailyOverview ? 'Update Overview' : 'Save Overview'}</Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* History Dialogs */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Daily Overview History</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {overviews.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No daily overviews yet</p>
            ) : (
              overviews.map(overview => (
                <div key={overview.id} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <p className="font-medium text-sm mb-2">{format(new Date(overview.date), 'EEEE, MMM d, yyyy')}</p>
                  <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                    <div><span className="text-muted-foreground">Study:</span> {overview.study_time}m</div>
                    <div><span className="text-muted-foreground">Health:</span> {overview.health_score}/10</div>
                    <div><span className="text-muted-foreground">Discipline:</span> {overview.discipline_score}/10</div>
                  </div>
                  {overview.company_progress && <p className="text-xs"><span className="text-muted-foreground">Progress:</span> {overview.company_progress}</p>}
                  {overview.notes && <p className="text-xs mt-1"><span className="text-muted-foreground">Notes:</span> {overview.notes}</p>}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

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
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateWeek('prev')}><ChevronLeft size={16} /></Button>
                <div className="text-center">
                  <p className="text-sm font-medium">{isCurrentWeek ? 'This Week' : 'Past Week'}</p>
                  <p className="text-xs text-muted-foreground">{format(selectedWeekStart, 'MMM d')} - {format(endOfWeek(selectedWeekStart, { weekStartsOn: 1 }), 'MMM d')}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateWeek('next')} disabled={isCurrentWeek}><ChevronRight size={16} /></Button>
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={() => setIsWeeklyHistoryOpen(true)}><Eye size={14} className="mr-2" />View All Weekly Reviews ({reviews.length})</Button>
              <div className="space-y-3">
                <div><Label className="text-xs flex items-center gap-1"><Trophy size={12} className="text-income" />Wins</Label><Textarea value={reviewForm.wins} onChange={e => setReviewForm({ ...reviewForm, wins: e.target.value })} rows={2} placeholder="One win per line" /></div>
                <div><Label className="text-xs flex items-center gap-1"><AlertTriangle size={12} className="text-expense" />Challenges</Label><Textarea value={reviewForm.challenges} onChange={e => setReviewForm({ ...reviewForm, challenges: e.target.value })} rows={2} placeholder="One challenge per line" /></div>
                <div><Label className="text-xs flex items-center gap-1"><ArrowRight size={12} className="text-primary" />Next Week Goals</Label><Textarea value={reviewForm.nextWeekGoals} onChange={e => setReviewForm({ ...reviewForm, nextWeekGoals: e.target.value })} rows={2} placeholder="One goal per line" /></div>
                <Button onClick={handleReviewSave} className="w-full h-11">{currentWeeklyReview ? 'Update Review' : 'Save Review'}</Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Weekly History Dialog */}
      <Dialog open={isWeeklyHistoryOpen} onOpenChange={setIsWeeklyHistoryOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Weekly Review History</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {reviews.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No weekly reviews yet</p>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <p className="font-medium text-sm mb-2">{format(new Date(review.week_start), 'MMM d')} - {format(new Date(review.week_end), 'MMM d, yyyy')}</p>
                  {review.wins.length > 0 && <div className="text-xs mb-1"><span className="text-income">Wins:</span> {review.wins.join(', ')}</div>}
                  {review.challenges.length > 0 && <div className="text-xs mb-1"><span className="text-expense">Challenges:</span> {review.challenges.join(', ')}</div>}
                  {review.next_week_goals.length > 0 && <div className="text-xs"><span className="text-primary">Goals:</span> {review.next_week_goals.join(', ')}</div>}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Vision Board */}
      <Card className="border-primary/20">
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Lightbulb size={16} className="text-primary" />Vision Board</CardTitle></CardHeader>
        <CardContent>
          {visionItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No vision goals yet. Add your first goal above!</p>
          ) : (
            <div className="space-y-3">
              {visionItems.map(item => (
                <div key={item.id} className={`p-3 rounded-lg border ${item.is_completed ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${categoryColors[item.category]}`}>{item.category.toUpperCase()}</span>
                        {item.target_date && <span className="text-xs text-muted-foreground">{format(new Date(item.target_date), 'MMM d')}</span>}
                      </div>
                      <h4 className={`font-medium ${item.is_completed ? 'line-through' : ''}`}>{item.title}</h4>
                      {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
                      <Progress value={item.progress} className="mt-2 h-1.5" />
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleToggleVisionComplete(item.id, item.is_completed)}>
                      <Check size={16} className={item.is_completed ? 'text-income' : 'text-muted-foreground'} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
