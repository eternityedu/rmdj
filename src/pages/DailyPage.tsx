import { useState, useEffect } from 'react';
import { Calendar, Plus, CheckCircle2, Circle } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getDailyTasks, addDailyTask, toggleDailyTask, generateId } from '@/lib/storage';
import { DailyTask } from '@/types';
import { format } from 'date-fns';

const priorityColors = { high: 'text-expense border-expense/30', medium: 'text-founder border-founder/30', low: 'text-muted-foreground border-muted' };

export function DailyPage() {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ title: '', priority: 'medium' as DailyTask['priority'], category: '' });
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => { loadTasks(); }, []);
  const loadTasks = () => setTasks(getDailyTasks());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addDailyTask({ id: generateId(), title: form.title, completed: false, priority: form.priority, category: form.category || 'General', date: today });
    loadTasks();
    setForm({ title: '', priority: 'medium', category: '' });
    setIsOpen(false);
  };

  const handleToggle = (id: string) => { toggleDailyTask(id); loadTasks(); };

  const todayTasks = tasks.filter(t => t.date === today);
  const completed = todayTasks.filter(t => t.completed).length;
  const progress = todayTasks.length > 0 ? Math.round((completed / todayTasks.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Daily" description={format(new Date(), 'EEEE, dd MMMM yyyy')} icon={Calendar} iconColor="text-daily"
        action={<Dialog open={isOpen} onOpenChange={setIsOpen}><DialogTrigger asChild><Button size="sm" className="gap-2"><Plus size={16} />Add Task</Button></DialogTrigger>
          <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Add Daily Task</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>Task</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
              <div><Label>Priority</Label><Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as DailyTask['priority'] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent></Select></div>
              <div><Label>Category</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="General" /></div>
              <Button type="submit" className="w-full">Add Task</Button>
            </form>
          </DialogContent></Dialog>}
      />
      <Card className="border-daily/20 bg-daily/5"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Today's Progress</p><p className="text-2xl font-bold text-daily">{completed}/{todayTasks.length} tasks</p></div><div className="text-3xl font-bold mono text-daily">{progress}%</div></div></CardContent></Card>
      <Card className="border-border/50"><CardHeader className="pb-2"><CardTitle className="text-base">Today's Tasks</CardTitle></CardHeader>
        <CardContent><div className="space-y-2">{todayTasks.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No tasks for today</p> : 
          todayTasks.sort((a, b) => (a.completed ? 1 : 0) - (b.completed ? 1 : 0)).map(task => (
            <div key={task.id} className={`flex items-center gap-3 p-3 rounded-lg border ${task.completed ? 'bg-muted/20 opacity-60' : 'bg-muted/30'} ${priorityColors[task.priority]}`} onClick={() => handleToggle(task.id)}>
              {task.completed ? <CheckCircle2 size={18} className="text-income" /> : <Circle size={18} />}
              <span className={task.completed ? 'line-through' : ''}>{task.title}</span>
              <span className="ml-auto text-xs text-muted-foreground">{task.category}</span>
            </div>
          ))}
        </div></CardContent>
      </Card>
    </div>
  );
}
