import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Target, Plane, ShoppingBag, GraduationCap, Wallet, MoreHorizontal, CheckCircle2, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { getSavingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, generateId } from '@/lib/storage';
import { SavingsGoal } from '@/types';
import { format, differenceInDays, isPast } from 'date-fns';
import { toast } from 'sonner';

interface GoalsSectionProps {
  onUpdate: () => void;
}

const categoryIcons = {
  emergency: Target,
  vacation: Plane,
  purchase: ShoppingBag,
  education: GraduationCap,
  retirement: Wallet,
  other: MoreHorizontal,
};

const categoryColors = {
  emergency: 'text-expense',
  vacation: 'text-notes',
  purchase: 'text-founder',
  education: 'text-daily',
  retirement: 'text-investment',
  other: 'text-muted-foreground',
};

const categoryLabels = {
  emergency: 'Emergency Fund',
  vacation: 'Vacation',
  purchase: 'Major Purchase',
  education: 'Education',
  retirement: 'Retirement',
  other: 'Other',
};

export function GoalsSection({ onUpdate }: GoalsSectionProps) {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [addFundsOpen, setAddFundsOpen] = useState<string | null>(null);
  const [addFundsAmount, setAddFundsAmount] = useState('');
  const [form, setForm] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    deadline: '',
    category: 'emergency' as SavingsGoal['category'],
    description: '',
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = () => {
    setGoals(getSavingsGoals());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const goalData: SavingsGoal = {
      id: editingGoal?.id || generateId(),
      name: form.name,
      targetAmount: parseFloat(form.targetAmount) || 0,
      currentAmount: parseFloat(form.currentAmount) || 0,
      deadline: form.deadline,
      category: form.category,
      description: form.description,
      createdAt: editingGoal?.createdAt || new Date().toISOString(),
      isCompleted: false,
    };

    // Check if goal is now completed
    if (goalData.currentAmount >= goalData.targetAmount) {
      goalData.isCompleted = true;
    }

    if (editingGoal) {
      updateSavingsGoal(editingGoal.id, goalData);
      toast.success('Goal updated successfully');
    } else {
      addSavingsGoal(goalData);
      toast.success('Goal created successfully');
    }

    loadGoals();
    onUpdate();
    resetForm();
  };

  const resetForm = () => {
    setForm({
      name: '',
      targetAmount: '',
      currentAmount: '',
      deadline: '',
      category: 'emergency',
      description: '',
    });
    setEditingGoal(null);
    setIsOpen(false);
  };

  const handleEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setForm({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      deadline: goal.deadline,
      category: goal.category,
      description: goal.description || '',
    });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteSavingsGoal(id);
    loadGoals();
    onUpdate();
    toast.success('Goal deleted');
  };

  const handleAddFunds = (goalId: string) => {
    const amount = parseFloat(addFundsAmount);
    if (!amount || amount <= 0) return;

    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const newAmount = goal.currentAmount + amount;
    const isCompleted = newAmount >= goal.targetAmount;

    updateSavingsGoal(goalId, { 
      currentAmount: newAmount,
      isCompleted,
    });

    if (isCompleted) {
      toast.success(`Congratulations! You've reached your "${goal.name}" goal!`);
    } else {
      toast.success(`Added ₹${amount.toLocaleString('en-IN')} to ${goal.name}`);
    }

    loadGoals();
    onUpdate();
    setAddFundsOpen(null);
    setAddFundsAmount('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getProgress = (goal: SavingsGoal) => {
    return Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
  };

  const getDaysRemaining = (deadline: string) => {
    const days = differenceInDays(new Date(deadline), new Date());
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  const getMonthlyTarget = (goal: SavingsGoal) => {
    const remaining = goal.targetAmount - goal.currentAmount;
    if (remaining <= 0) return 0;
    const days = differenceInDays(new Date(goal.deadline), new Date());
    if (days <= 0) return remaining;
    const months = Math.ceil(days / 30);
    return Math.ceil(remaining / months);
  };

  const totalTargetAmount = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const totalCurrentAmount = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const activeGoals = goals.filter(g => !g.isCompleted);
  const completedGoals = goals.filter(g => g.isCompleted);

  return (
    <div className="space-y-4">
      {/* Add Goal Button */}
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsOpen(open); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus size={16} />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingGoal ? 'Edit Goal' : 'Create Savings Goal'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Goal Name</Label>
                <Input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Emergency Fund, Europe Trip"
                  required
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as SavingsGoal['category'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emergency">Emergency Fund</SelectItem>
                    <SelectItem value="vacation">Vacation</SelectItem>
                    <SelectItem value="purchase">Major Purchase</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="retirement">Retirement</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Target Amount (₹)</Label>
                  <Input
                    type="number"
                    value={form.targetAmount}
                    onChange={e => setForm({ ...form, targetAmount: e.target.value })}
                    placeholder="100000"
                    required
                  />
                </div>
                <div>
                  <Label>Current Amount (₹)</Label>
                  <Input
                    type="number"
                    value={form.currentAmount}
                    onChange={e => setForm({ ...form, currentAmount: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <Label>Target Date</Label>
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={e => setForm({ ...form, deadline: e.target.value })}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  required
                />
              </div>
              <div>
                <Label>Description (optional)</Label>
                <Textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Why is this goal important to you?"
                  rows={2}
                />
              </div>
              <Button type="submit" className="w-full">
                {editingGoal ? 'Update Goal' : 'Create Goal'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Target</p>
            <p className="text-xl font-bold text-investment mono">{formatCurrency(totalTargetAmount)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Saved</p>
            <p className="text-xl font-bold text-income mono">{formatCurrency(totalCurrentAmount)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Active Goals</p>
            <p className="text-xl font-bold text-daily">{activeGoals.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="text-xl font-bold text-income">{completedGoals.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Goals */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Active Goals ({activeGoals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeGoals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No active goals. Create one to start saving!</p>
            ) : (
              activeGoals.map((goal) => {
                const Icon = categoryIcons[goal.category];
                const progress = getProgress(goal);
                const isOverdue = isPast(new Date(goal.deadline));
                
                return (
                  <div
                    key={goal.id}
                    className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-background ${categoryColors[goal.category]}`}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <h4 className="font-medium">{goal.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {categoryLabels[goal.category]}
                            {goal.description && ` • ${goal.description}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(goal)}>
                          <Edit2 size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(goal.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="mono font-medium">{formatCurrency(goal.currentAmount)}</span>
                        <span className="text-muted-foreground mono">{formatCurrency(goal.targetAmount)}</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className={progress >= 100 ? 'text-income' : ''}>{progress}% complete</span>
                        <span className={isOverdue ? 'text-expense' : ''}>{getDaysRemaining(goal.deadline)}</span>
                      </div>
                    </div>

                    {/* Monthly Target & Add Funds */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp size={14} className="text-muted-foreground" />
                        <span className="text-muted-foreground">Save {formatCurrency(getMonthlyTarget(goal))}/month to reach goal</span>
                      </div>
                      
                      {addFundsOpen === goal.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={addFundsAmount}
                            onChange={e => setAddFundsAmount(e.target.value)}
                            placeholder="Amount"
                            className="w-24 h-8"
                          />
                          <Button size="sm" onClick={() => handleAddFunds(goal.id)}>Add</Button>
                          <Button size="sm" variant="ghost" onClick={() => { setAddFundsOpen(null); setAddFundsAmount(''); }}>✕</Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setAddFundsOpen(goal.id)}>
                          <Plus size={14} className="mr-1" />
                          Add Funds
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <Card className="border-income/20 bg-income/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 size={16} className="text-income" />
              Completed Goals ({completedGoals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completedGoals.map((goal) => {
                const Icon = categoryIcons[goal.category];
                
                return (
                  <div
                    key={goal.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-income/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-income/10 text-income`}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{goal.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          Completed • {formatCurrency(goal.targetAmount)}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(goal.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}