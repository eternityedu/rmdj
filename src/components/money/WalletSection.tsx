import { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getWallet, addWalletEntry, generateId } from '@/lib/storage';
import { WalletEntry } from '@/types';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface WalletSectionProps {
  onUpdate: () => void;
}

const sourceColors: Record<string, string> = {
  rental: '#22c55e',
  savings: '#3b82f6',
  profit: '#10b981',
  bond: '#8b5cf6',
  salary: '#f59e0b',
  business: '#06b6d4',
  other: '#6b7280',
};

export function WalletSection({ onUpdate }: WalletSectionProps) {
  const [entries, setEntries] = useState<WalletEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    type: 'added' as 'added' | 'spent',
    source: 'salary' as WalletEntry['source'],
    amount: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = () => {
    setEntries(getWallet());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: WalletEntry = {
      id: generateId(),
      type: form.type,
      source: form.source,
      amount: parseFloat(form.amount) || 0,
      description: form.description,
      date: form.date,
    };
    addWalletEntry(entry);
    loadEntries();
    onUpdate();
    setForm({ type: 'added', source: 'salary', amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd') });
    setIsOpen(false);
  };

  // Monthly chart data
  const getMonthlyData = () => {
    const monthlyData: Record<string, { added: number; spent: number }> = {};
    entries.forEach(entry => {
      const month = entry.date.substring(0, 7);
      if (!monthlyData[month]) monthlyData[month] = { added: 0, spent: 0 };
      if (entry.type === 'added') monthlyData[month].added += entry.amount;
      else monthlyData[month].spent += entry.amount;
    });
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({
        month: format(new Date(month + '-01'), 'MMM'),
        added: data.added,
        spent: data.spent,
        balance: data.added - data.spent,
      }));
  };

  // Category pie data
  const getCategoryData = () => {
    const categoryData: Record<string, number> = {};
    entries.filter(e => e.type === 'added').forEach(entry => {
      categoryData[entry.source] = (categoryData[entry.source] || 0) + entry.amount;
    });
    return Object.entries(categoryData).map(([name, value]) => ({
      name,
      value,
      color: sourceColors[name] || '#6b7280',
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const monthlyData = getMonthlyData();
  const categoryData = getCategoryData();

  return (
    <div className="space-y-4">
      {/* Add Money Button */}
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus size={16} />
              Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Wallet Entry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as 'added' | 'spent' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="added">Money Added</SelectItem>
                    <SelectItem value="spent">Money Spent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Source</Label>
                <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v as WalletEntry['source'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rental">Rental</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="profit">Profit</SelectItem>
                    <SelectItem value="bond">Bond</SelectItem>
                    <SelectItem value="salary">Salary</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
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
              <Button type="submit" className="w-full">Add Entry</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Line Chart */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Monthly Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line type="monotone" dataKey="added" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="spent" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                No data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Income Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                No data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Entries */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {entries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No entries yet</p>
            ) : (
              entries
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 20)
                .map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${entry.type === 'added' ? 'bg-income/10' : 'bg-expense/10'}`}>
                        {entry.type === 'added' ? (
                          <TrendingUp size={16} className="text-income" />
                        ) : (
                          <TrendingDown size={16} className="text-expense" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium capitalize">{entry.source}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(entry.date), 'dd MMM yyyy')}
                          {entry.description && ` • ${entry.description}`}
                        </p>
                      </div>
                    </div>
                    <span className={`font-medium mono ${entry.type === 'added' ? 'text-income' : 'text-expense'}`}>
                      {entry.type === 'added' ? '+' : '-'}{formatCurrency(entry.amount)}
                    </span>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
