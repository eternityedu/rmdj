import { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, CheckCircle2, Circle, Trash2, Edit2, Repeat, CalendarDays } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getDailyTasks, addDailyTask, toggleDailyTask, deleteDailyTask, updateDailyTask, generateId } from '@/lib/storage';
import { calculateAndSaveProductivity } from '@/lib/productivity';
import { ProductivityHeatmap } from '@/components/ProductivityHeatmap';
import { DailyTask } from '@/types';
import { format, addDays, addMonths, isWithinInterval, parseISO } from 'date-fns';

const priorityColors = { 
  high: 'text-expense border-expense/30', 
  medium: 'text-founder border-founder/30', 
  low: 'text-muted-foreground border-muted' 
};

export function DailyPage() {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);
  const [form, setForm] = useState({ 
    title: '', 
    priority: 'medium' as DailyTask['priority'], 
    category: '',
    isEveryday: false,
    duration: 'single' as 'single' | 'week' | 'month',
  });
  const today = format(new Date(), 'yyyy-MM-dd');

  const loadTasks = useCallback(() => {
    const allTasks = getDailyTasks();
    setTasks(allTasks);
    // Update productivity whenever tasks are loaded
    calculateAndSaveProductivity(allTasks, today);
  }, [today]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTask) {
      // Update existing task
      updateDailyTask(editingTask.id, {
        title: form.title,
        priority: form.priority,
        category: form.category || 'General',
        isEveryday: form.isEveryday,
        duration: form.duration,
      });
    } else {
      // Calculate end date based on duration
      let endDate = today;
      if (form.duration === 'week') {
        endDate = format(addDays(new Date(), 6), 'yyyy-MM-dd');
      } else if (form.duration === 'month') {
        endDate = format(addMonths(new Date(), 1), 'yyyy-MM-dd');
      }

      const newTask: DailyTask = {
        id: generateId(),
        title: form.title,
        completed: false,
        priority: form.priority,
        category: form.category || 'General',
        date: today,
        isEveryday: form.isEveryday,
        duration: form.duration,
        startDate: today,
        endDate: form.isEveryday ? undefined : endDate,
      };
      addDailyTask(newTask);
    }
    
    loadTasks();
    resetForm();
  };

  const resetForm = () => {
    setForm({ title: '', priority: 'medium', category: '', isEveryday: false, duration: 'single' });
    setEditingTask(null);
    setIsOpen(false);
  };

  const handleEdit = (task: DailyTask) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      priority: task.priority,
      category: task.category,
      isEveryday: task.isEveryday || false,
      duration: task.duration || 'single',
    });
    setIsOpen(true);
  };

  const handleToggle = (id: string) => { 
    toggleDailyTask(id); 
    loadTasks(); 
  };
  
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteDailyTask(id);
    loadTasks();
  };

  // Filter tasks for today - include everyday tasks, tasks for today, and tasks within their duration period
  const todayTasks = tasks.filter(t => {
    // Everyday tasks always show
    if (t.isEveryday) return true;
    
    // Tasks created today
    if (t.date === today) return true;
    
    // Tasks within their duration period
    if (t.startDate && t.endDate) {
      try {
        const start = parseISO(t.startDate);
        const end = parseISO(t.endDate);
        const todayDate = parseISO(today);
        return isWithinInterval(todayDate, { start, end });
      } catch {
        return false;
      }
    }
    
    return false;
  });

  const completed = todayTasks.filter(t => t.completed).length;
  const progress = todayTasks.length > 0 ? Math.round((completed / todayTasks.length) * 100) : 0;

  return (
    <div className="space-y-4 animate-fade-in pb-20 lg:pb-6">
      <PageHeader 
        title="Daily" 
        description={format(new Date(), 'EEEE, dd MMMM yyyy')} 
        icon={Calendar} 
        iconColor="text-daily"
        action={
          <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsOpen(open); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus size={16} />Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingTask ? 'Edit Task' : 'Add Daily Task'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Task</Label>
                  <Input 
                    value={form.title} 
                    onChange={e => setForm({ ...form, title: e.target.value })} 
                    required 
                  />
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select 
                    value={form.priority} 
                    onValueChange={(v) => setForm({ ...form, priority: v as DailyTask['priority'] })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Category</Label>
                  <Input 
                    value={form.category} 
                    onChange={e => setForm({ ...form, category: e.target.value })} 
                    placeholder="General" 
                  />
                </div>
                
                {/* Everyday Task Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-2">
                    <Repeat size={16} className="text-daily" />
                    <Label className="cursor-pointer">Everyday Task</Label>
                  </div>
                  <Switch
                    checked={form.isEveryday}
                    onCheckedChange={(checked) => setForm({ ...form, isEveryday: checked, duration: checked ? 'single' : form.duration })}
                  />
                </div>
                
                {/* Duration Selection - only show if not everyday */}
                {!form.isEveryday && (
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <CalendarDays size={14} />
                      Duration
                    </Label>
                    <Select 
                      value={form.duration} 
                      onValueChange={(v) => setForm({ ...form, duration: v as 'single' | 'week' | 'month' })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Today Only</SelectItem>
                        <SelectItem value="week">Next 7 Days</SelectItem>
                        <SelectItem value="month">Next Month</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {form.duration === 'week' && 'Task will appear for the next 7 days'}
                      {form.duration === 'month' && 'Task will appear for the next 30 days'}
                      {form.duration === 'single' && 'Task will only appear today'}
                    </p>
                  </div>
                )}
                
                <Button type="submit" className="w-full">
                  {editingTask ? 'Update Task' : 'Add Task'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      
      {/* Productivity Heatmap */}
      <ProductivityHeatmap key={`heatmap-${tasks.length}-${completed}`} />
      
      {/* Progress Card */}
      <Card className="border-daily/20 bg-daily/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Today's Progress</p>
              <p className="text-2xl font-bold text-daily">{completed}/{todayTasks.length} tasks</p>
            </div>
            <div className="text-3xl font-bold mono text-daily">{progress}%</div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tasks List */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Today's Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {todayTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No tasks for today</p>
            ) : (
              todayTasks.sort((a, b) => (a.completed ? 1 : 0) - (b.completed ? 1 : 0)).map(task => (
                <div 
                  key={task.id} 
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer active:scale-[0.98] transition-transform min-h-[52px] ${task.completed ? 'bg-muted/20 opacity-60' : 'bg-muted/30'} ${priorityColors[task.priority]}`} 
                  onClick={() => handleToggle(task.id)}
                >
                  {task.completed ? <CheckCircle2 size={18} className="text-income shrink-0" /> : <Circle size={18} className="shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <span className={`${task.completed ? 'line-through' : ''} block truncate`}>{task.title}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{task.category}</span>
                      {task.isEveryday && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-daily/20 text-daily flex items-center gap-1">
                          <Repeat size={10} />
                          Everyday
                        </span>
                      )}
                      {!task.isEveryday && task.duration && task.duration !== 'single' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-notes/20 text-notes">
                          {task.duration === 'week' ? '7 days' : '30 days'}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 shrink-0" 
                    onClick={(e) => { e.stopPropagation(); handleEdit(task); }}
                  >
                    <Edit2 size={14} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive shrink-0" 
                    onClick={(e) => handleDelete(e, task.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}