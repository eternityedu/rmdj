import { useState, useMemo } from 'react';
import { Calendar, Plus, CheckCircle2, Circle, Trash2, Edit2, Repeat, CalendarDays, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useDailyTasks, DailyTaskUI } from '@/hooks/useDailyTasks';
import { ProductivityHeatmap } from '@/components/ProductivityHeatmap';
import { format, addDays, addMonths } from 'date-fns';

const priorityColors = { 
  high: 'text-expense border-expense/30', 
  medium: 'text-founder border-founder/30', 
  low: 'text-muted-foreground border-muted' 
};

export function DailyPage() {
  const { tasks, loading, addTask, updateTask, toggleTask, deleteTask, getTodayTasks } = useDailyTasks();
  const [isOpen, setIsOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTaskUI | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ 
    title: '', 
    priority: 'medium' as 'high' | 'medium' | 'low', 
    category: '',
    isEveryday: false,
    duration: 'single' as 'single' | 'week' | 'month',
  });
  const today = format(new Date(), 'yyyy-MM-dd');

  // Get today's tasks using the hook's method
  const todayTasks = useMemo(() => getTodayTasks(today), [getTodayTasks, today]);
  
  const completed = todayTasks.filter(t => t.is_completed).length;
  const progress = todayTasks.length > 0 ? Math.round((completed / todayTasks.length) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Calculate end date based on duration
    let endDate: string | undefined = undefined;
    if (!form.isEveryday) {
      if (form.duration === 'week') {
        endDate = format(addDays(new Date(), 6), 'yyyy-MM-dd');
      } else if (form.duration === 'month') {
        endDate = format(addMonths(new Date(), 1), 'yyyy-MM-dd');
      }
    }

    if (editingTask) {
      await updateTask(editingTask.id, {
        title: form.title,
        is_everyday: form.isEveryday,
        duration: form.duration,
      });
    } else {
      await addTask({
        title: form.title,
        is_everyday: form.isEveryday,
        duration: form.duration,
        start_date: today,
        end_date: endDate,
        priority: form.priority,
        category: form.category || 'General',
      });
    }
    
    setSaving(false);
    resetForm();
  };

  const resetForm = () => {
    setForm({ title: '', priority: 'medium', category: '', isEveryday: false, duration: 'single' });
    setEditingTask(null);
    setIsOpen(false);
  };

  const handleEdit = (task: DailyTaskUI) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      priority: task.priority || 'medium',
      category: task.category || '',
      isEveryday: task.is_everyday,
      duration: task.duration,
    });
    setIsOpen(true);
  };

  const handleToggle = async (id: string) => { 
    await toggleTask(id); 
  };
  
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteTask(id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

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
                    onValueChange={(v) => setForm({ ...form, priority: v as 'high' | 'medium' | 'low' })}
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
                
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
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
              todayTasks.sort((a, b) => (a.is_completed ? 1 : 0) - (b.is_completed ? 1 : 0)).map(task => (
                <div 
                  key={task.id} 
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer active:scale-[0.98] transition-transform min-h-[52px] ${task.is_completed ? 'bg-muted/20 opacity-60' : 'bg-muted/30'} ${priorityColors[task.priority || 'medium']}`} 
                  onClick={() => handleToggle(task.id)}
                >
                  {task.is_completed ? <CheckCircle2 size={18} className="text-income shrink-0" /> : <Circle size={18} className="shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <span className={`${task.is_completed ? 'line-through' : ''} block truncate`}>{task.title}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{task.category}</span>
                      {task.is_everyday && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-daily/20 text-daily flex items-center gap-1">
                          <Repeat size={10} />
                          Everyday
                        </span>
                      )}
                      {!task.is_everyday && task.duration && task.duration !== 'single' && (
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
