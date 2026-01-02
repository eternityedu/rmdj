import { useState, useEffect } from 'react';
import { Home, TrendingUp, TrendingDown, Wallet, Brain, Building2, AlertCircle, Crown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getWallet, getExpenses, getInvestments, getLoans, getSkills, getCompanies, calculateNetWorth } from '@/lib/storage';
import { format } from 'date-fns';

export function HomePage() {
  const [stats, setStats] = useState({
    netWorth: 0,
    walletBalance: 0,
    totalInvestments: 0,
    totalLoans: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    skillsLearning: 0,
    companiesActive: 0,
  });
  const [insights, setInsights] = useState<Array<{ id: string; message: string; type: 'up' | 'down' | 'neutral' }>>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    const wallet = getWallet();
    const expenses = getExpenses();
    const investments = getInvestments();
    const loans = getLoans();
    const skills = getSkills();
    const companies = getCompanies();

    const walletBalance = wallet.reduce((acc, entry) => {
      return entry.type === 'added' ? acc + entry.amount : acc - entry.amount;
    }, 0);

    const currentMonth = format(new Date(), 'yyyy-MM');
    const monthlyExpenses = expenses
      .filter(e => e.date.startsWith(currentMonth))
      .reduce((acc, e) => acc + e.amount, 0);

    const monthlyIncome = wallet
      .filter(w => w.type === 'added' && w.date.startsWith(currentMonth))
      .reduce((acc, w) => acc + w.amount, 0);

    const totalInvestments = investments.reduce((acc, inv) => {
      if (inv.type === 'stocks') return acc + (inv.quantity || 0) * (inv.currentPrice || 0);
      if (inv.type === 'property') return acc + (inv.currentValue || 0);
      if (inv.type === 'sip') return acc + (inv.monthlyAmount || 0) * 12;
      return acc + (inv.amountInvested || inv.silverAmount || 0);
    }, 0);

    const totalLoans = loans.reduce((acc, loan) => acc + loan.remainingBalance, 0);

    // Generate insights
    const newInsights = [];
    if (monthlyExpenses > monthlyIncome * 0.8) {
      newInsights.push({ id: '1', message: 'Spending is high this month - watch your expenses', type: 'down' as const });
    }
    if (skills.filter(s => s.isCurrentlyLearning).length > 0) {
      newInsights.push({ id: '2', message: `${skills.filter(s => s.isCurrentlyLearning).length} skills in active learning`, type: 'up' as const });
    }
    if (walletBalance < 10000) {
      newInsights.push({ id: '3', message: 'Wallet balance is below average', type: 'neutral' as const });
    }
    if (companies.filter(c => c.status === 'building' || c.status === 'launched').length > 0) {
      newInsights.push({ id: '4', message: 'Companies progressing well', type: 'up' as const });
    }

    setInsights(newInsights);
    setStats({
      netWorth: calculateNetWorth(),
      walletBalance,
      totalInvestments,
      totalLoans,
      monthlyIncome,
      monthlyExpenses,
      skillsLearning: skills.filter(s => s.isCurrentlyLearning).length,
      companiesActive: companies.filter(c => c.status !== 'idea').length,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
                <span className="text-sm text-muted-foreground">Assets - Liabilities</span>
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
          title="Wallet Balance"
          value={formatCurrency(stats.walletBalance)}
          icon={Wallet}
          colorClass="text-money"
          trend={stats.walletBalance > 0 ? 'up' : 'down'}
          trendValue="Available funds"
        />
        <StatCard
          title="Investments"
          value={formatCurrency(stats.totalInvestments)}
          icon={TrendingUp}
          colorClass="text-investment"
          trend="up"
          trendValue="Total portfolio"
        />
        <StatCard
          title="Skills Learning"
          value={stats.skillsLearning}
          subtitle="Currently active"
          icon={Brain}
          colorClass="text-skills"
        />
        <StatCard
          title="Companies"
          value={stats.companiesActive}
          subtitle="In progress"
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
              Monthly Income
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xl lg:text-3xl font-bold text-income mono">{formatCurrency(stats.monthlyIncome)}</p>
            <p className="text-sm text-muted-foreground mt-1">{format(new Date(), 'MMMM yyyy')}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown size={16} className="text-expense" />
              Monthly Expenses
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xl lg:text-3xl font-bold text-expense mono">{formatCurrency(stats.monthlyExpenses)}</p>
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
