import { useState, useEffect } from 'react';
import { Plus, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getIncomes, addIncome, generateId } from '@/lib/storage';
import { Income } from '@/types';
import { format } from 'date-fns';

interface IncomeSectionProps {
  onUpdate: () => void;
}

const sourceLabels: Record<string, string> = {
  business: 'Business',
  salary: 'Salary',
  rental: 'Rental',
  youtube: 'YouTube',
  other: 'Other',
};

const sourceColors: Record<string, string> = {
  business: 'bg-primary/20 text-primary',
  salary: 'bg-income/20 text-income',
  rental: 'bg-founder/20 text-founder',
  youtube: 'bg-expense/20 text-expense',
  other: 'bg-muted text-muted-foreground',
};

export function IncomeSection({ onUpdate }: IncomeSectionProps) {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    source: 'salary' as Income['source'],
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
  });

  useEffect(() => {
    loadIncomes();
  }, []);

  const loadIncomes = () => {
    setIncomes(getIncomes());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const income: Income = {
      id: generateId(),
      source: form.source,
      amount: parseFloat(form.amount) || 0,
      date: form.date,
      description: form.description,
    };
    addIncome(income);
    loadIncomes();
    onUpdate();
    setForm({ source: 'salary', amount: '', date: format(new Date(), 'yyyy-MM-dd'), description: '' });
    setIsOpen(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Monthly summary
  const getMonthlySummary = () => {
    const monthlyData: Record<string, number> = {};
    incomes.forEach(income => {
      const month = income.date.substring(0, 7);
      monthlyData[month] = (monthlyData[month] || 0) + income.amount;
    });
    return Object.entries(monthlyData)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 6)
      .map(([month, amount]) => ({
        month: format(new Date(month + '-01'), 'MMM yyyy'),
        amount,
      }));
  };

  // Source summary
  const getSourceSummary = () => {
    const sourceData: Record<string, number> = {};
    incomes.forEach(income => {
      sourceData[income.source] = (sourceData[income.source] || 0) + income.amount;
    });
    return Object.entries(sourceData)
      .sort(([, a], [, b]) => b - a)
      .map(([source, amount]) => ({
        source,
        amount,
      }));
  };

  const currentMonth = format(new Date(), 'yyyy-MM');
  const monthlyTotal = incomes
    .filter(i => i.date.startsWith(currentMonth))
    .reduce((acc, i) => acc + i.amount, 0);

  const totalIncome = incomes.reduce((acc, i) => acc + i.amount, 0);
  const monthlySummary = getMonthlySummary();
  const sourceSummary = getSourceSummary();

  return (
    <div className="space-y-4">
      {/* Add Income */}
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus size={16} />
              Add Income
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Income</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Source</Label>
                <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v as Income['source'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="salary">Salary</SelectItem>
                    <SelectItem value="rental">Rental</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
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
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
              <Button type="submit" className="w-full">Add Income</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="border-income/20 bg-income/5">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">This Month</p>
            <p className="text-2xl font-bold text-income mono">{formatCurrency(monthlyTotal)}</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Income</p>
            <p className="text-2xl font-bold text-primary mono">{formatCurrency(totalIncome)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Source Summary */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">By Source</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sourceSummary.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No income data yet</p>
            ) : (
              sourceSummary.map((item) => (
                <div
                  key={item.source}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${sourceColors[item.source]}`}>
                      {sourceLabels[item.source]}
                    </span>
                  </div>
                  <span className="font-medium text-income mono">{formatCurrency(item.amount)}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Summary */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Monthly Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {monthlySummary.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No income data yet</p>
            ) : (
              monthlySummary.map((item) => (
                <div
                  key={item.month}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                >
                  <span className="text-sm">{item.month}</span>
                  <span className="font-medium text-income mono">{formatCurrency(item.amount)}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Income */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Income</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {incomes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No income records yet</p>
            ) : (
              incomes
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 20)
                .map((income) => (
                  <div
                    key={income.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-income/10">
                        <TrendingUp size={16} className="text-income" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{sourceLabels[income.source]}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(income.date), 'dd MMM yyyy')}
                          {income.description && ` • ${income.description}`}
                        </p>
                      </div>
                    </div>
                    <span className="font-medium text-income mono">+{formatCurrency(income.amount)}</span>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
