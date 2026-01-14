import { useState, useEffect, useMemo } from 'react';
import { Home, TrendingUp, TrendingDown, Brain, Building2, AlertCircle, Crown, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinancialEntries } from '@/hooks/useFinancialEntries';
import { useUserSkills } from '@/hooks/useUserSkills';
import { useCompanies } from '@/hooks/useCompanies';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const CHART_COLORS = {
  primary: 'hsl(160, 84%, 39%)',
  accent: 'hsl(38, 92%, 50%)',
  income: 'hsl(142, 76%, 45%)',
  expense: 'hsl(0, 84%, 60%)',
  skills: 'hsl(187, 92%, 50%)',
  investment: 'hsl(199, 89%, 48%)',
  muted: 'hsl(215, 20%, 45%)',
};

export function HomePage() {
  const { entries, stats, loading: moneyLoading } = useFinancialEntries();
  const { skills, loading: skillsLoading } = useUserSkills();
  const { companies, loading: companiesLoading } = useCompanies();
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

  // Calculate chart data
  const companiesChartData = useMemo(() => {
    const totalRevenue = companies.reduce((acc, c) => acc + Number(c.revenue), 0);
    const totalExpenses = companies.reduce((acc, c) => acc + Number(c.expenses), 0);
    const profit = totalRevenue - totalExpenses;
    
    if (companies.length === 0) return [];
    
    return [
      { name: 'Revenue', value: totalRevenue, color: CHART_COLORS.income },
      { name: 'Expenses', value: totalExpenses, color: CHART_COLORS.expense },
      { name: profit >= 0 ? 'Profit' : 'Loss', value: Math.abs(profit), color: profit >= 0 ? CHART_COLORS.primary : CHART_COLORS.expense },
    ].filter(d => d.value > 0);
  }, [companies]);

  const skillsChartData = useMemo(() => {
    const mastered = skills.filter(s => s.progress >= 100).length;
    const learning = skills.filter(s => s.is_currently_learning && s.progress < 100).length;
    const paused = skills.filter(s => !s.is_currently_learning && s.progress < 100).length;
    
    if (skills.length === 0) return [];
    
    return [
      { name: 'Mastered', value: mastered, color: CHART_COLORS.primary },
      { name: 'Learning', value: learning, color: CHART_COLORS.skills },
      { name: 'Paused', value: paused, color: CHART_COLORS.muted },
    ].filter(d => d.value > 0);
  }, [skills]);

  const moneyChartData = useMemo(() => {
    if (stats.totalIncome === 0 && stats.totalExpenses === 0) return [];
    
    return [
      { name: 'Income', value: stats.totalIncome, color: CHART_COLORS.income },
      { name: 'Expenses', value: stats.totalExpenses, color: CHART_COLORS.expense },
      { name: 'Investments', value: stats.totalInvestments, color: CHART_COLORS.investment },
    ].filter(d => d.value > 0);
  }, [stats]);

  if (moneyLoading || skillsLoading || companiesLoading) {
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

      {/* Overview Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Companies Overview */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 size={16} className="text-founder" />
              Companies Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {companies.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                <Building2 size={32} className="mb-2 opacity-50" />
                No companies yet
              </div>
            ) : (
              <>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={companiesChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={55}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {companiesChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ 
                          backgroundColor: 'hsl(222, 47%, 10%)', 
                          border: '1px solid hsl(222, 47%, 16%)',
                          borderRadius: '8px',
                          color: 'hsl(210, 40%, 98%)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {companiesChartData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-muted-foreground">{entry.name}</span>
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs text-muted-foreground mt-2">
                  {companies.length} {companies.length === 1 ? 'company' : 'companies'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Skills Overview */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain size={16} className="text-skills" />
              Skills Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {skills.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                <Brain size={32} className="mb-2 opacity-50" />
                No skills yet
              </div>
            ) : (
              <>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={skillsChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={55}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {skillsChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => `${value} skill${value !== 1 ? 's' : ''}`}
                        contentStyle={{ 
                          backgroundColor: 'hsl(222, 47%, 10%)', 
                          border: '1px solid hsl(222, 47%, 16%)',
                          borderRadius: '8px',
                          color: 'hsl(210, 40%, 98%)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {skillsChartData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-muted-foreground">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs text-muted-foreground mt-2">
                  {skills.length} total skills
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Money Overview */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp size={16} className="text-income" />
              Money Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {moneyChartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                <TrendingUp size={32} className="mb-2 opacity-50" />
                No financial data yet
              </div>
            ) : (
              <>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={moneyChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={55}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {moneyChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ 
                          backgroundColor: 'hsl(222, 47%, 10%)', 
                          border: '1px solid hsl(222, 47%, 16%)',
                          borderRadius: '8px',
                          color: 'hsl(210, 40%, 98%)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {moneyChartData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-muted-foreground">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

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
