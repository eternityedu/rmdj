import { useState, useEffect } from 'react';
import { Crown, Target, Lightbulb, BookOpen, ChevronDown, ChevronUp, Trophy, AlertTriangle, ArrowRight, Calendar, ChevronLeft, ChevronRight, Timer, Check, Eye } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getVision, addVisionItem, updateVisionItem, getSkills, getDailyOverviews, saveDailyOverview, getDailyOverviewByDate, getWeeklyReviews, saveWeeklyReview, getWeeklyReviewByWeek, generateId, getPomodoroSessions } from '@/lib/storage';
import { VisionItem, DailyOverview, WeeklyReview } from '@/types';
import { format, startOfWeek, endOfWeek, addDays, subDays, addWeeks, subWeeks, isToday, isSameWeek } from 'date-fns';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import { toast } from 'sonner';

export function FounderPage() {
  const [vision, setVision] = useState<VisionItem[]>([]);
  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);
  const [isVisionOpen, setIsVisionOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(true);
  const [isDailyOpen, setIsDailyOpen] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isWeeklyHistoryOpen, setIsWeeklyHistoryOpen] = useState(false);
  
  // Date navigation
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedWeekStart, setSelectedWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  
  // Form states
  const [visionForm, setVisionForm] = useState({ title: '', description: '', category: 'mit' as VisionItem['category'], targetDate: '' });
  const [overviewForm, setOverviewForm] = useState({ studyTime: '', companyProgress: '', healthScore: '', disciplineScore: '', notes: '' });
  const [reviewForm, setReviewForm] = useState({ wins: '', challenges: '', nextWeekGoals: '' });
  
  // Current data
  const [currentDailyOverview, setCurrentDailyOverview] = useState<DailyOverview | null>(null);
  const [currentWeeklyReview, setCurrentWeeklyReview] = useState<WeeklyReview | null>(null);
  const [allDailyOverviews, setAllDailyOverviews] = useState<DailyOverview[]>([]);
  const [allWeeklyReviews, setAllWeeklyReviews] = useState<WeeklyReview[]>([]);

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const weekStart = format(selectedWeekStart, 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(selectedWeekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd');

  useEffect(() => { 
    loadVision();
    loadAllData();
  }, []);

  useEffect(() => {
    loadDailyOverview();
  }, [selectedDate]);

  useEffect(() => {
    loadWeeklyReview();
  }, [selectedWeekStart]);

  const loadVision = () => setVision(getVision());
  
  const loadAllData = () => {
    setAllDailyOverviews(getDailyOverviews());
    setAllWeeklyReviews(getWeeklyReviews());
  };

  const loadDailyOverview = () => {
    const overview = getDailyOverviewByDate(selectedDateStr);
    setCurrentDailyOverview(overview);
    if (overview) {
      setOverviewForm({
        studyTime: overview.studyTime.toString(),
        companyProgress: overview.companyProgress,
        healthScore: overview.healthScore.toString(),
        disciplineScore: overview.disciplineScore.toString(),
        notes: overview.notes,
      });
    } else {
      setOverviewForm({ studyTime: '', companyProgress: '', healthScore: '', disciplineScore: '', notes: '' });
    }
  };

  const loadWeeklyReview = () => {
    const review = getWeeklyReviewByWeek(weekStart);
    setCurrentWeeklyReview(review);
    if (review) {
      setReviewForm({
        wins: review.wins.join('\n'),
        challenges: review.challenges.join('\n'),
        nextWeekGoals: review.nextWeekGoals.join('\n'),
      });
    } else {
      setReviewForm({ wins: '', challenges: '', nextWeekGoals: '' });
    }
  };

  const handleVisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addVisionItem({ 
      id: generateId(), 
      title: visionForm.title, 
      description: visionForm.description, 
      category: visionForm.category, 
      progress: 0,
      targetDate: visionForm.targetDate || undefined,
      completed: false,
    });
    loadVision();
    setVisionForm({ title: '', description: '', category: 'mit', targetDate: '' });
    setIsVisionOpen(false);
    toast.success('Vision goal added!');
  };

  const handleToggleVisionComplete = (id: string, completed: boolean) => {
    updateVisionItem(id, { completed: !completed, progress: !completed ? 100 : 0 });
    loadVision();
    toast.success(!completed ? 'Vision completed!' : 'Vision marked incomplete');
  };

  const handleOverviewSave = () => {
    const overview: DailyOverview = {
      date: selectedDateStr,
      studyTime: parseInt(overviewForm.studyTime) || 0,
      companyProgress: overviewForm.companyProgress,
      healthScore: parseInt(overviewForm.healthScore) || 5,
      disciplineScore: parseInt(overviewForm.disciplineScore) || 5,
      notes: overviewForm.notes,
    };
    saveDailyOverview(overview);
    setCurrentDailyOverview(overview);
    loadAllData();
    toast.success('Daily overview saved!');
  };

  const handleReviewSave = () => {
    const review: WeeklyReview = {
      id: currentWeeklyReview?.id || generateId(),
      weekStart,
      weekEnd,
      wins: reviewForm.wins.split('\n').filter(s => s.trim()),
      challenges: reviewForm.challenges.split('\n').filter(s => s.trim()),
      improvements: [],
      nextWeekGoals: reviewForm.nextWeekGoals.split('\n').filter(s => s.trim()),
    };
    saveWeeklyReview(review);
    setCurrentWeeklyReview(review);
    loadAllData();
    toast.success('Weekly review saved!');
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    setSelectedDate(direction === 'prev' ? subDays(selectedDate, 1) : addDays(selectedDate, 1));
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setSelectedWeekStart(direction === 'prev' ? subWeeks(selectedWeekStart, 1) : addWeeks(selectedWeekStart, 1));
  };

  const skills = getSkills();
  const learningCount = skills.filter(s => s.isCurrentlyLearning).length;
  const avgSkillLevel = skills.length > 0 ? Math.round(skills.reduce((a, s) => a + s.level, 0) / skills.length) : 0;

  const todaySessions = getPomodoroSessions().filter(
    s => s.type === 'work' && s.completed && s.startTime.startsWith(format(new Date(), 'yyyy-MM-dd'))
  );

  const categoryColors: Record<string, string> = { mit: 'bg-primary/20 text-primary', sids: 'bg-founder/20 text-founder', rmdj: 'bg-income/20 text-income', personal: 'bg-notes/20 text-notes' };

  const isCurrentWeek = isSameWeek(selectedWeekStart, new Date(), { weekStartsOn: 1 });

  return (
    <div className="space-y-4 animate-fade-in pb-20 lg:pb-6">
      <PageHeader title="Founder" description="Your personal CEO command center" icon={Crown} iconColor="text-founder" />

      {/* Pomodoro Timer Overlay */}
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
              <div><Label>Category</Label><select className="w-full h-12 px-3 rounded-lg bg-muted border border-border" value={visionForm.category} onChange={e => setVisionForm({ ...visionForm, category: e.target.value as VisionItem['category'] })}><option value="mit">MIT Prep</option><option value="sids">S.I.D.S</option><option value="rmdj">RMDJ</option><option value="personal">Personal</option></select></div>
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

      {/* Daily Overview with Date Navigation */}
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
              {/* Date Navigation */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateDay('prev')}>
                  <ChevronLeft size={16} />
                </Button>
                <div className="text-center">
                  <p className="text-sm font-medium">{format(selectedDate, 'EEEE')}</p>
                  <p className="text-xs text-muted-foreground">{format(selectedDate, 'MMM d, yyyy')}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateDay('next')} disabled={isToday(selectedDate)}>
                  <ChevronRight size={16} />
                </Button>
              </div>

              {/* View History Button */}
              <Button variant="outline" size="sm" className="w-full" onClick={() => setIsHistoryOpen(true)}>
                <Eye size={14} className="mr-2" />
                View All Daily Overviews ({allDailyOverviews.length})
              </Button>

              {/* Form - Always editable */}
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

      {/* Daily Overview History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Daily Overview History</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {allDailyOverviews.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No daily overviews yet</p>
            ) : (
              [...allDailyOverviews].reverse().map(overview => (
                <div key={overview.date} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <p className="font-medium text-sm mb-2">{format(new Date(overview.date), 'EEEE, MMM d, yyyy')}</p>
                  <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                    <div><span className="text-muted-foreground">Study:</span> {overview.studyTime}m</div>
                    <div><span className="text-muted-foreground">Health:</span> {overview.healthScore}/10</div>
                    <div><span className="text-muted-foreground">Discipline:</span> {overview.disciplineScore}/10</div>
                  </div>
                  {overview.companyProgress && <p className="text-xs"><span className="text-muted-foreground">Progress:</span> {overview.companyProgress}</p>}
                  {overview.notes && <p className="text-xs mt-1"><span className="text-muted-foreground">Notes:</span> {overview.notes}</p>}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Weekly Review with Week Navigation */}
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
              {/* Week Navigation */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateWeek('prev')}>
                  <ChevronLeft size={16} />
                </Button>
                <div className="text-center">
                  <p className="text-sm font-medium">{isCurrentWeek ? 'This Week' : 'Past Week'}</p>
                  <p className="text-xs text-muted-foreground">{format(selectedWeekStart, 'MMM d')} - {format(endOfWeek(selectedWeekStart, { weekStartsOn: 1 }), 'MMM d')}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateWeek('next')} disabled={isCurrentWeek}>
                  <ChevronRight size={16} />
                </Button>
              </div>

              {/* View History Button */}
              <Button variant="outline" size="sm" className="w-full" onClick={() => setIsWeeklyHistoryOpen(true)}>
                <Eye size={14} className="mr-2" />
                View All Weekly Reviews ({allWeeklyReviews.length})
              </Button>

              {/* Display saved review OR form */}
              {currentWeeklyReview ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-income/10 border border-income/20">
                    <p className="text-xs font-medium text-income mb-2 flex items-center gap-1"><Trophy size={12} />Wins</p>
                    <ul className="text-sm space-y-1">{currentWeeklyReview.wins.map((w, i) => <li key={i} className="flex items-start gap-2"><span className="text-income">•</span>{w}</li>)}</ul>
                  </div>
                  <div className="p-3 rounded-lg bg-expense/10 border border-expense/20">
                    <p className="text-xs font-medium text-expense mb-2 flex items-center gap-1"><AlertTriangle size={12} />Challenges</p>
                    <ul className="text-sm space-y-1">{currentWeeklyReview.challenges.map((c, i) => <li key={i} className="flex items-start gap-2"><span className="text-expense">•</span>{c}</li>)}</ul>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-xs font-medium text-primary mb-2 flex items-center gap-1"><ArrowRight size={12} />Next Week Goals</p>
                    <ul className="text-sm space-y-1">{currentWeeklyReview.nextWeekGoals.map((g, i) => <li key={i} className="flex items-start gap-2"><span className="text-primary">•</span>{g}</li>)}</ul>
                  </div>
                  <Button variant="outline" onClick={() => setCurrentWeeklyReview(null)} className="w-full">Edit Review</Button>
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

      {/* Weekly Review History Dialog */}
      <Dialog open={isWeeklyHistoryOpen} onOpenChange={setIsWeeklyHistoryOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Weekly Review History</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {allWeeklyReviews.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No weekly reviews yet</p>
            ) : (
              [...allWeeklyReviews].reverse().map(review => (
                <div key={review.id} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <p className="font-medium text-sm mb-3">{format(new Date(review.weekStart), 'MMM d')} - {format(new Date(review.weekEnd), 'MMM d, yyyy')}</p>
                  
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-income font-medium">Wins:</span>
                      <ul className="ml-3">{review.wins.map((w, i) => <li key={i}>• {w}</li>)}</ul>
                    </div>
                    <div>
                      <span className="text-expense font-medium">Challenges:</span>
                      <ul className="ml-3">{review.challenges.map((c, i) => <li key={i}>• {c}</li>)}</ul>
                    </div>
                    <div>
                      <span className="text-primary font-medium">Next Week Goals:</span>
                      <ul className="ml-3">{review.nextWeekGoals.map((g, i) => <li key={i}>• {g}</li>)}</ul>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Vision Board */}
      <Card className="border-border/50">
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Lightbulb size={16} className="text-founder" />Vision Board</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {vision.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Add your long-term vision goals</p> : vision.map(v => (
              <div key={v.id} className={`p-3 rounded-lg border ${v.completed ? 'bg-income/10 border-income/30' : 'bg-muted/30 border-border/50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleToggleVisionComplete(v.id, !!v.completed)} className="flex-shrink-0">
                      {v.completed ? (
                        <Check size={18} className="text-income" />
                      ) : (
                        <div className="w-[18px] h-[18px] rounded-full border-2 border-muted-foreground" />
                      )}
                    </button>
                    <span className={`font-medium text-sm ${v.completed ? 'line-through text-muted-foreground' : ''}`}>{v.title}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${categoryColors[v.category]}`}>{v.category.toUpperCase()}</span>
                </div>
                {v.description && <p className="text-xs text-muted-foreground mb-2 ml-6">{v.description}</p>}
                {v.targetDate && <p className="text-xs text-muted-foreground ml-6">Target: {format(new Date(v.targetDate), 'MMM d, yyyy')}</p>}
                {!v.completed && <Progress value={v.progress} className="h-1.5 mt-2" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
