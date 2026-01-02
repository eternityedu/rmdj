import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getExpenses, addExpense, updateExpense, deleteExpense, generateId } from '@/lib/storage';
import { Expense } from '@/types';
import { format } from 'date-fns';

interface ExpensesSectionProps {
  onUpdate: () => void;
}

const categories = [
  'Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 
  'Education', 'Business', 'Travel', 'Subscriptions', 'Other'
];

export function ExpensesSection({ onUpdate }: ExpensesSectionProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [form, setForm] = useState({
    category: 'Food',
    tags: '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    isRecurring: false,
    includesGST: false,
  });

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = () => {
    setExpenses(getExpenses());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expenseData: Expense = {
      id: editingExpense?.id || generateId(),
      category: form.category,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      amount: parseFloat(form.amount) || 0,
      date: form.date,
      type: form.isRecurring ? 'recurring' : 'one-time',
      isRecurring: form.isRecurring,
      includesGST: form.includesGST,
      description: form.description,
    };

    if (editingExpense) {
      updateExpense(editingExpense.id, expenseData);
    } else {
      addExpense(expenseData);
    }

    loadExpenses();
    onUpdate();
    resetForm();
  };

  const resetForm = () => {
    setForm({
      category: 'Food',
      tags: '',
      amount: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
      isRecurring: false,
      includesGST: false,
    });
    setEditingExpense(null);
    setIsOpen(false);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setForm({
      category: expense.category,
      tags: expense.tags.join(', '),
      amount: expense.amount.toString(),
      date: expense.date,
      description: expense.description,
      isRecurring: expense.isRecurring,
      includesGST: expense.includesGST,
    });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteExpense(id);
    loadExpenses();
    onUpdate();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredExpenses = expenses.filter(e => {
    if (filterCategory !== 'all' && e.category !== filterCategory) return false;
    if (filterDate && !e.date.startsWith(filterDate)) return false;
    return true;
  });

  const totalFiltered = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="space-y-4">
      {/* Add & Filter */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[150px]">
              <Filter size={14} className="mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="month"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="w-[150px]"
          />
          {(filterCategory !== 'all' || filterDate) && (
            <Button variant="ghost" size="sm" onClick={() => { setFilterCategory('all'); setFilterDate(''); }}>
              Clear
            </Button>
          )}
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus size={16} />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Tags (comma separated)</Label>
                <Input
                  value={form.tags}
                  onChange={e => setForm({ ...form, tags: e.target.value })}
                  placeholder="e.g., office, personal"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Recurring</Label>
                <Switch
                  checked={form.isRecurring}
                  onCheckedChange={(checked) => setForm({ ...form, isRecurring: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Includes GST</Label>
                <Switch
                  checked={form.includesGST}
                  onCheckedChange={(checked) => setForm({ ...form, includesGST: checked })}
                />
              </div>
              <Button type="submit" className="w-full">
                {editingExpense ? 'Update Expense' : 'Add Expense'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Total */}
      <Card className="border-expense/20 bg-expense/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filterCategory !== 'all' || filterDate ? 'Filtered Total' : 'Total Expenses'}
            </p>
            <p className="text-2xl font-bold text-expense mono">{formatCurrency(totalFiltered)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Expenses ({filteredExpenses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No expenses found</p>
            ) : (
              filteredExpenses
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{expense.category}</span>
                        {expense.isRecurring && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-founder/20 text-founder">
                            Recurring
                          </span>
                        )}
                        {expense.includesGST && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-notes/20 text-notes">
                            GST
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(expense.date), 'dd MMM yyyy')}
                        {expense.description && ` • ${expense.description}`}
                      </p>
                      {expense.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {expense.tags.map((tag, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-expense mono">{formatCurrency(expense.amount)}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(expense)}>
                        <Edit2 size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(expense.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
