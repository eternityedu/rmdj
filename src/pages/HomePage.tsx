import { useState, useEffect } from 'react';
import { Home, TrendingUp, TrendingDown, Brain, Building2, AlertCircle, Crown, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinancialEntries } from '@/hooks/useFinancialEntries';
import { useUserSkills } from '@/hooks/useUserSkills';
import { format } from 'date-fns';

export function HomePage() {
  const { entries, stats, loading: moneyLoading } = useFinancialEntries();
  const { skills, loading: skillsLoading } = useUserSkills();
  const [insights, setInsights] = useState<Array<{ id: string; message: string; type: 'up' | 'down' | 'neutral' }>>([]);

  useEffect(() => {
    // Generate insights
    const newInsights = [];
    
    if (stats.totalExpenses > stats.totalIncome * 0.8 && stats.totalIncome > 0) {
      newInsights.push({ id: '1', message: 'Spending is high - watch your expenses', type: 'down' as const });
    }
    
    if (skills.length > 0) {
      newInsights.push({ id: '2', message: `${skills.length} skills tracked`, type: 'up' as const });
    }
    
    if (stats.netWorth < 10000 && entries.length > 0) {
      newInsights.push({ id: '3', message: 'Net worth is below average', type: 'neutral' as const });
    }
    
    if (stats.totalInvestments > 0) {
      newInsights.push({ id: '4', message: 'Investments are growing', type: 'up' as const });
    }

    setInsights(newInsights);
  }, [stats, skills, entries]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (moneyLoading || skillsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  // Calculate current month stats
  const currentMonth = format(new Date(), 'yyyy-MM');
  const monthlyIncome = entries
    .filter(e => e.entry_type === 'income' && e.date.startsWith(currentMonth))
    .reduce((acc, e) => acc + Number(e.amount), 0);
  const monthlyExpenses = entries
    .filter(e => e.entry_type === 'expense' && e.date.startsWith(currentMonth))
    .reduce((acc, e) => acc + Number(e.amount), 0);

  return (
    <div className="space-y-4 animate-fade-in pb-20 lg:pb-6">
      <PageHeader
        title="Dashboard"
        description="Your personal command center"
        icon={Home}
        iconColor="text-primary"
      />

      {/* Net Worth Banner */}
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <CardContent className="p-6 relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Net Worth</p>
              <p className="text-3xl lg:text-5xl font-bold gradient-text mono">{formatCurrency(stats.netWorth)}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={stats.netWorth >= 0 ? 'text-income' : 'text-expense'}>
                  {stats.netWorth >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                </span>
                <span className="text-sm text-muted-foreground">Total Added - Total Spent</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="text-founder" size={24} />
              <span className="text-sm text-muted-foreground">Founder Mode Active</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Total Added"
          value={formatCurrency(stats.totalAdded)}
          icon={TrendingUp}
          colorClass="text-income"
          trend="up"
          trendValue="All income"
        />
        <StatCard
          title="Total Spent"
          value={formatCurrency(stats.totalSpent)}
          icon={TrendingDown}
          colorClass="text-expense"
          trend="down"
          trendValue="All outflows"
        />
        <StatCard
          title="Skills"
          value={skills.length}
          subtitle="Tracked"
          icon={Brain}
          colorClass="text-skills"
        />
        <StatCard
          title="Entries"
          value={entries.length}
          subtitle="Financial records"
          icon={Building2}
          colorClass="text-investment"
        />
      </div>

      {/* Monthly Overview */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp size={16} className="text-income" />
              Income
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xl lg:text-3xl font-bold text-income mono">{formatCurrency(monthlyIncome)}</p>
            <p className="text-sm text-muted-foreground mt-1">{format(new Date(), 'MMMM yyyy')}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown size={16} className="text-expense" />
              Expenses
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xl lg:text-3xl font-bold text-expense mono">{formatCurrency(monthlyExpenses)}</p>
            <p className="text-sm text-muted-foreground mt-1">{format(new Date(), 'MMMM yyyy')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle size={16} className="text-founder" />
              Smart Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
                >
                  <span className={
                    insight.type === 'up' ? 'text-income' :
                    insight.type === 'down' ? 'text-expense' : 'text-muted-foreground'
                  }>
                    {insight.type === 'up' ? '↑' : insight.type === 'down' ? '↓' : '→'}
                  </span>
                  <span className="text-sm">{insight.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loans Overview */}
      {stats.totalLoans > 0 && (
        <Card className="border-expense/20 bg-expense/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Outstanding Loans</p>
                <p className="text-2xl font-bold text-expense mono">{formatCurrency(stats.totalLoans)}</p>
              </div>
              <div className="p-3 rounded-xl bg-expense/10">
                <TrendingDown size={24} className="text-expense" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
