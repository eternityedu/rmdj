import { useState } from 'react';
import { Wallet, Plus, TrendingUp, TrendingDown, PiggyBank, CreditCard, Target, Building, FileText, Edit2, Trash2, Loader2, Filter, DollarSign, Download, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useFinancialEntries, FinancialEntry } from '@/hooks/useFinancialEntries';
import { toast } from 'sonner';
import { format, subMonths, parseISO, isAfter, isBefore, startOfDay } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import jsPDF from 'jspdf';

const entryTypes = [
  { value: 'income', label: 'Income', color: 'text-income', bgColor: 'bg-income' },
  { value: 'expense', label: 'Expense', color: 'text-expense', bgColor: 'bg-expense' },
  { value: 'investment', label: 'Investment', color: 'text-investment', bgColor: 'bg-investment' },
  { value: 'goal', label: 'Goal', color: 'text-founder', bgColor: 'bg-founder' },
  { value: 'loan', label: 'Loan', color: 'text-daily', bgColor: 'bg-daily' },
  { value: 'ip', label: 'IP', color: 'text-notes', bgColor: 'bg-notes' },
];

const incomeCategories = ['Salary', 'Business', 'Freelance', 'Investments', 'Gift', 'Other'];
const expenseCategories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'Other'];
const investmentCategories = ['Stocks', 'Mutual Funds', 'Crypto', 'Gold', 'Property', 'Bonds', 'Other'];
const generalCategories = ['Personal', 'Business', 'Emergency', 'Other'];

const COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4'];

type TimeRange = '1m' | '3m' | '6m' | '1y';
type ChartFilter = 'all' | 'income' | 'expense' | 'investment' | 'goal' | 'loan' | 'ip';

export function MoneyPage() {
  const { entries, loading, stats, addEntry, updateEntry, deleteEntry, refresh } = useFinancialEntries();
  const [isOpen, setIsOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FinancialEntry | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('6m');
  const [chartFilter, setChartFilter] = useState<ChartFilter>('all');
  const [form, setForm] = useState({
    amount: '',
    entry_type: 'income' as FinancialEntry['entry_type'],
    category: '',
    source: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    note: '',
  });

  const getCategories = (type: string) => {
    switch (type) {
      case 'income': return incomeCategories;
      case 'expense': return expenseCategories;
      case 'investment': return investmentCategories;
      default: return generalCategories;
    }
  };

  const resetForm = () => {
    setForm({
      amount: '',
      entry_type: 'income',
      category: '',
      source: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      note: '',
    });
    setEditingEntry(null);
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.category) {
      toast.error('Please fill in required fields');
      return;
    }

    if (editingEntry) {
      const { error } = await updateEntry(editingEntry.id, {
        amount: parseFloat(form.amount),
        entry_type: form.entry_type,
        category: form.category,
        source: form.source || null,
        date: form.date,
        note: form.note || null,
      });
      if (!error) {
        toast.success('Entry updated!');
        resetForm();
      }
    } else {
      const { error } = await addEntry({
        amount: parseFloat(form.amount),
        entry_type: form.entry_type,
        category: form.category,
        source: form.source || null,
        date: form.date,
        note: form.note || null,
      });
      if (!error) {
        toast.success('Entry added!');
        resetForm();
      }
    }
  };

  const handleEdit = (entry: FinancialEntry) => {
    setEditingEntry(entry);
    setForm({
      amount: entry.amount.toString(),
      entry_type: entry.entry_type,
      category: entry.category,
      source: entry.source || '',
      date: entry.date,
      note: entry.note || '',
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteEntry(id);
    if (!error) {
      toast.success('Entry deleted!');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get months count based on time range
  const getMonthsCount = () => {
    switch (timeRange) {
      case '1m': return 1;
      case '3m': return 3;
      case '6m': return 6;
      case '1y': return 12;
      default: return 6;
    }
  };

  // Get time range start date
  const getTimeRangeStartDate = () => {
    return startOfDay(subMonths(new Date(), getMonthsCount()));
  };

  // Filter entries by time range
  const getFilteredEntriesByTime = () => {
    const startDate = getTimeRangeStartDate();
    return entries.filter(entry => {
      const entryDate = parseISO(entry.date);
      return isAfter(entryDate, startDate) || format(entryDate, 'yyyy-MM-dd') === format(startDate, 'yyyy-MM-dd');
    });
  };

  // Get monthly chart data with dynamic scaling
  const getMonthlyData = () => {
    const monthsCount = getMonthsCount();
    const months: Record<string, Record<string, number>> = {};
    
    for (let i = monthsCount - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const key = format(date, 'MMM yyyy');
      months[key] = { income: 0, expense: 0, investment: 0, goal: 0, loan: 0, ip: 0 };
    }

    getFilteredEntriesByTime().forEach(entry => {
      const month = format(parseISO(entry.date), 'MMM yyyy');
      if (months[month]) {
        months[month][entry.entry_type] += Number(entry.amount);
      }
    });

    return Object.entries(months).map(([month, data]) => ({ 
      month: month.split(' ')[0], // Just show month name
      ...data 
    }));
  };

  // Calculate dynamic Y-axis domain
  const getYAxisDomain = (data: any[]) => {
    let maxValue = 0;
    
    data.forEach(item => {
      if (chartFilter === 'all') {
        entryTypes.forEach(type => {
          maxValue = Math.max(maxValue, item[type.value] || 0);
        });
      } else {
        maxValue = Math.max(maxValue, item[chartFilter] || 0);
      }
    });

    if (maxValue === 0) return [0, 1000];
    
    // Round up to a nice number
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)));
    const normalized = maxValue / magnitude;
    let ceiling;
    
    if (normalized <= 1) ceiling = 1;
    else if (normalized <= 2) ceiling = 2;
    else if (normalized <= 5) ceiling = 5;
    else ceiling = 10;
    
    const maxDomain = ceiling * magnitude * 1.2; // Add 20% padding
    return [0, maxDomain];
  };

  // Format Y-axis tick
  const formatYAxisTick = (value: number) => {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
    return `₹${value}`;
  };

  // Get income sources for pie chart
  const getIncomeSourceData = () => {
    const sources: Record<string, number> = {};
    getFilteredEntriesByTime()
      .filter(e => e.entry_type === 'income')
      .forEach(entry => {
        sources[entry.category] = (sources[entry.category] || 0) + Number(entry.amount);
      });
    
    return Object.entries(sources).map(([name, value]) => ({ name, value }));
  };

  // Generate PDF Report
  const generatePDFReport = () => {
    const doc = new jsPDF();
    const timeRangeEntries = getFilteredEntriesByTime();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text('Financial Report', 20, 20);
    
    // Time range
    doc.setFontSize(10);
    doc.setTextColor(100);
    const rangeLabel = timeRange === '1m' ? 'Last Month' : timeRange === '3m' ? 'Last 3 Months' : timeRange === '6m' ? 'Last 6 Months' : 'Last Year';
    doc.text(`Period: ${rangeLabel}`, 20, 28);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, HH:mm')}`, 20, 34);
    
    // Summary section
    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text('Summary', 20, 48);
    
    doc.setFontSize(10);
    doc.setTextColor(60);
    
    // Calculate period stats
    const periodStats = {
      income: 0,
      expense: 0,
      investment: 0,
      goal: 0,
      loan: 0,
      ip: 0,
    };
    
    timeRangeEntries.forEach(entry => {
      periodStats[entry.entry_type as keyof typeof periodStats] += Number(entry.amount);
    });
    
    let y = 58;
    doc.text(`Total Income: ${formatCurrency(periodStats.income)}`, 20, y);
    doc.text(`Total Expenses: ${formatCurrency(periodStats.expense)}`, 20, y + 6);
    doc.text(`Total Investments: ${formatCurrency(periodStats.investment)}`, 20, y + 12);
    doc.text(`Total Goals: ${formatCurrency(periodStats.goal)}`, 20, y + 18);
    doc.text(`Total Loans: ${formatCurrency(periodStats.loan)}`, 20, y + 24);
    doc.text(`Total IP: ${formatCurrency(periodStats.ip)}`, 20, y + 30);
    
    const netFlow = periodStats.income - periodStats.expense - periodStats.investment - periodStats.goal - periodStats.loan - periodStats.ip;
    doc.setFontSize(11);
    doc.setTextColor(netFlow >= 0 ? 34 : 180, netFlow >= 0 ? 139 : 30, netFlow >= 0 ? 34 : 30);
    doc.text(`Net Flow: ${formatCurrency(netFlow)}`, 20, y + 40);
    
    // Entries table
    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text('Recent Entries', 20, y + 56);
    
    // Table headers
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('Date', 20, y + 66);
    doc.text('Type', 50, y + 66);
    doc.text('Category', 80, y + 66);
    doc.text('Amount', 130, y + 66);
    doc.text('Note', 160, y + 66);
    
    // Table rows
    doc.setTextColor(60);
    let tableY = y + 74;
    const maxEntries = Math.min(timeRangeEntries.length, 30);
    
    for (let i = 0; i < maxEntries; i++) {
      const entry = timeRangeEntries[i];
      if (tableY > 270) {
        doc.addPage();
        tableY = 20;
      }
      
      doc.text(format(parseISO(entry.date), 'dd/MM/yy'), 20, tableY);
      doc.text(entry.entry_type, 50, tableY);
      doc.text(entry.category.substring(0, 15), 80, tableY);
      doc.text(formatCurrency(Number(entry.amount)), 130, tableY);
      doc.text((entry.note || '-').substring(0, 20), 160, tableY);
      
      tableY += 6;
    }
    
    if (timeRangeEntries.length > maxEntries) {
      doc.text(`... and ${timeRangeEntries.length - maxEntries} more entries`, 20, tableY + 6);
    }
    
    // Save
    doc.save(`financial-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('Report downloaded!');
  };

  // Filter entries
  const filteredEntries = filterType === 'all' 
    ? entries 
    : entries.filter(e => e.entry_type === filterType);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const monthlyData = getMonthlyData();
  const incomeSourceData = getIncomeSourceData();
  const yAxisDomain = getYAxisDomain(monthlyData);

  return (
    <div className="space-y-4 animate-fade-in pb-20 lg:pb-6">
      <PageHeader
        title="Money Manager"
        description="Complete financial control center"
        icon={Wallet}
        iconColor="text-money"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={generatePDFReport}>
              <Download size={16} />
              PDF
            </Button>
            <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus size={16} />
                  Add Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingEntry ? 'Edit Entry' : 'Add Entry'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Amount *</Label>
                    <Input
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      placeholder="0"
                      required
                    />
                  </div>
                  <div>
                    <Label>Type *</Label>
                    <Select value={form.entry_type} onValueChange={(v) => setForm({ ...form, entry_type: v as FinancialEntry['entry_type'], category: '' })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {entryTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Category *</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {getCategories(form.entry_type).map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Source (optional)</Label>
                    <Input
                      value={form.source}
                      onChange={(e) => setForm({ ...form, source: e.target.value })}
                      placeholder="e.g., Company name, Bank"
                    />
                  </div>
                  <div>
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Note (optional)</Label>
                    <Textarea
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      placeholder="Additional notes..."
                      rows={2}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    {editingEntry ? 'Update Entry' : 'Add Entry'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* Top Summary */}
      <Card className="border-money/30 bg-gradient-to-r from-money/10 to-transparent">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Total Added</p>
              <p className="text-lg lg:text-2xl font-bold text-income mono">{formatCurrency(stats.totalAdded)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Spent</p>
              <p className="text-lg lg:text-2xl font-bold text-expense mono">{formatCurrency(stats.totalSpent)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Net Worth</p>
              <p className={`text-lg lg:text-2xl font-bold mono ${stats.netWorth >= 0 ? 'text-money' : 'text-expense'}`}>
                {formatCurrency(stats.netWorth)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <StatCard title="Income" value={formatCurrency(stats.totalIncome)} icon={TrendingUp} colorClass="text-income" />
        <StatCard title="Expenses" value={formatCurrency(stats.totalExpenses)} icon={TrendingDown} colorClass="text-expense" />
        <StatCard title="Investments" value={formatCurrency(stats.totalInvestments)} icon={PiggyBank} colorClass="text-investment" />
        <StatCard title="Goals" value={formatCurrency(stats.totalGoals)} icon={Target} colorClass="text-founder" />
        <StatCard title="Loans" value={formatCurrency(stats.totalLoans)} icon={Building} colorClass="text-daily" />
        <StatCard title="IP" value={formatCurrency(stats.totalIP)} icon={FileText} colorClass="text-notes" />
      </div>

      {/* Monthly Overview Chart with Controls */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base">Monthly Overview</CardTitle>
            <div className="flex flex-wrap gap-2">
              {/* Time Range Selector */}
              <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
                <SelectTrigger className="w-32 h-8">
                  <Calendar size={14} className="mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1 Month</SelectItem>
                  <SelectItem value="3m">3 Months</SelectItem>
                  <SelectItem value="6m">6 Months</SelectItem>
                  <SelectItem value="1y">1 Year</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Chart Type Filter */}
              <Select value={chartFilter} onValueChange={(v) => setChartFilter(v as ChartFilter)}>
                <SelectTrigger className="w-32 h-8">
                  <Filter size={14} className="mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                  <SelectItem value="goal">Goal</SelectItem>
                  <SelectItem value="loan">Loan</SelectItem>
                  <SelectItem value="ip">IP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickFormatter={formatYAxisTick}
                  domain={yAxisDomain}
                />
                <Tooltip 
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                {(chartFilter === 'all' || chartFilter === 'income') && (
                  <Bar dataKey="income" fill="hsl(var(--income))" name="Income" />
                )}
                {(chartFilter === 'all' || chartFilter === 'expense') && (
                  <Bar dataKey="expense" fill="hsl(var(--expense))" name="Expense" />
                )}
                {(chartFilter === 'all' || chartFilter === 'investment') && (
                  <Bar dataKey="investment" fill="hsl(var(--investment))" name="Investment" />
                )}
                {(chartFilter === 'all' || chartFilter === 'goal') && (
                  <Bar dataKey="goal" fill="hsl(var(--founder))" name="Goal" />
                )}
                {(chartFilter === 'all' || chartFilter === 'loan') && (
                  <Bar dataKey="loan" fill="hsl(var(--daily))" name="Loan" />
                )}
                {(chartFilter === 'all' || chartFilter === 'ip') && (
                  <Bar dataKey="ip" fill="hsl(var(--notes))" name="IP" />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Income Source Pie Chart & Net Worth Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Income Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {incomeSourceData.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomeSourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {incomeSourceData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No income data yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign size={16} className="text-money" />
              Net Worth Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 rounded bg-income/10">
                <span className="text-sm">Money Added</span>
                <span className="font-medium text-income">{formatCurrency(stats.totalAdded)}</span>
              </div>
              <div className="pl-4 space-y-2 border-l-2 border-muted">
                <div className="flex justify-between items-center p-2 rounded bg-expense/10">
                  <span className="text-sm">→ Expenses</span>
                  <span className="text-expense">-{formatCurrency(stats.totalExpenses)}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-investment/10">
                  <span className="text-sm">→ Investments</span>
                  <span className="text-investment">-{formatCurrency(stats.totalInvestments)}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-founder/10">
                  <span className="text-sm">→ Goals</span>
                  <span className="text-founder">-{formatCurrency(stats.totalGoals)}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-daily/10">
                  <span className="text-sm">→ Loans</span>
                  <span className="text-daily">-{formatCurrency(stats.totalLoans)}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-notes/10">
                  <span className="text-sm">→ IP</span>
                  <span className="text-notes">-{formatCurrency(stats.totalIP)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 rounded bg-money/20 border border-money/30">
                <span className="font-medium">= Current Balance</span>
                <span className={`font-bold text-lg ${stats.netWorth >= 0 ? 'text-money' : 'text-expense'}`}>
                  {formatCurrency(stats.netWorth)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Entries */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Entries</CardTitle>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32 h-8">
                <Filter size={14} className="mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {entryTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No entries yet</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredEntries.slice(0, 20).map((entry) => {
                const typeInfo = entryTypes.find(t => t.value === entry.entry_type);
                const isIncome = entry.entry_type === 'income';
                
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${typeInfo?.bgColor}`} />
                      <div>
                        <p className="font-medium text-sm">{entry.category}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{format(parseISO(entry.date), 'MMM dd, yyyy')}</span>
                          {entry.source && <span>• {entry.source}</span>}
                        </div>
                        {entry.note && <p className="text-xs text-muted-foreground mt-1">{entry.note}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold mono ${isIncome ? 'text-income' : 'text-expense'}`}>
                        {isIncome ? '+' : '-'}{formatCurrency(Number(entry.amount))}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(entry)}>
                          <Edit2 size={12} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-expense" onClick={() => handleDelete(entry.id)}>
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
