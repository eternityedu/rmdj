import { useState, useEffect } from 'react';
import { Wallet, Plus, Edit2, Trash2, TrendingUp, TrendingDown, PiggyBank, CreditCard, Building, FileText, RefreshCw, Download } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WalletSection } from '@/components/money/WalletSection';
import { ExpensesSection } from '@/components/money/ExpensesSection';
import { InvestmentsSection } from '@/components/money/InvestmentsSection';
import { IncomeSection } from '@/components/money/IncomeSection';
import { LoansSection } from '@/components/money/LoansSection';
import { ReportsSection } from '@/components/money/ReportsSection';
import { IPSection } from '@/components/money/IPSection';
import { getWallet, getExpenses, getInvestments, getIncomes, getLoans, getIPs, resetAllData } from '@/lib/storage';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function MoneyPage() {
  const [activeTab, setActiveTab] = useState('wallet');
  const [stats, setStats] = useState({
    totalAdded: 0,
    totalSpent: 0,
    balance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
  });
  const [isResetOpen, setIsResetOpen] = useState(false);

  useEffect(() => {
    loadStats();
  }, [activeTab]);

  const loadStats = () => {
    const wallet = getWallet();
    const expenses = getExpenses();
    const incomes = getIncomes();

    const totalAdded = wallet
      .filter(w => w.type === 'added')
      .reduce((acc, w) => acc + w.amount, 0);
    
    const totalSpent = wallet
      .filter(w => w.type === 'spent')
      .reduce((acc, w) => acc + w.amount, 0);

    const currentMonth = format(new Date(), 'yyyy-MM');
    const monthlyIncome = incomes
      .filter(i => i.date.startsWith(currentMonth))
      .reduce((acc, i) => acc + i.amount, 0);

    const monthlyExpenses = expenses
      .filter(e => e.date.startsWith(currentMonth))
      .reduce((acc, e) => acc + e.amount, 0);

    setStats({
      totalAdded,
      totalSpent,
      balance: totalAdded - totalSpent,
      monthlyIncome,
      monthlyExpenses,
    });
  };

  const handleResetData = () => {
    resetAllData();
    loadStats();
    setIsResetOpen(false);
    toast.success('All data has been reset');
    window.location.reload();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Money Manager"
        description="Complete financial control center"
        icon={Wallet}
        iconColor="text-money"
        action={
          <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-2">
                <RefreshCw size={14} />
                Reset Data
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset All Data?</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                This will permanently delete all your financial data including wallet entries, expenses, investments, income, loans, and IP records. This action cannot be undone.
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsResetOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleResetData}>Reset Everything</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Added"
          value={formatCurrency(stats.totalAdded)}
          icon={TrendingUp}
          colorClass="text-income"
        />
        <StatCard
          title="Total Spent"
          value={formatCurrency(stats.totalSpent)}
          icon={TrendingDown}
          colorClass="text-expense"
        />
        <StatCard
          title="Balance"
          value={formatCurrency(stats.balance)}
          icon={Wallet}
          colorClass={stats.balance >= 0 ? 'text-money' : 'text-expense'}
        />
        <StatCard
          title="Monthly Income"
          value={formatCurrency(stats.monthlyIncome)}
          icon={PiggyBank}
          colorClass="text-income"
        />
        <StatCard
          title="Monthly Expense"
          value={formatCurrency(stats.monthlyExpenses)}
          icon={CreditCard}
          colorClass="text-expense"
        />
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-2 bg-muted/30 p-1">
          <TabsTrigger value="wallet" className="gap-2 data-[state=active]:bg-money data-[state=active]:text-primary-foreground">
            <Wallet size={14} /> Wallet
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-2 data-[state=active]:bg-expense data-[state=active]:text-primary-foreground">
            <CreditCard size={14} /> Expenses
          </TabsTrigger>
          <TabsTrigger value="investments" className="gap-2 data-[state=active]:bg-investment data-[state=active]:text-primary-foreground">
            <TrendingUp size={14} /> Investments
          </TabsTrigger>
          <TabsTrigger value="income" className="gap-2 data-[state=active]:bg-income data-[state=active]:text-primary-foreground">
            <PiggyBank size={14} /> Income
          </TabsTrigger>
          <TabsTrigger value="loans" className="gap-2 data-[state=active]:bg-founder data-[state=active]:text-primary-foreground">
            <Building size={14} /> Loans
          </TabsTrigger>
          <TabsTrigger value="ip" className="gap-2 data-[state=active]:bg-daily data-[state=active]:text-primary-foreground">
            <FileText size={14} /> IP
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2 data-[state=active]:bg-notes data-[state=active]:text-primary-foreground">
            <Download size={14} /> Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wallet">
          <WalletSection onUpdate={loadStats} />
        </TabsContent>
        <TabsContent value="expenses">
          <ExpensesSection onUpdate={loadStats} />
        </TabsContent>
        <TabsContent value="investments">
          <InvestmentsSection onUpdate={loadStats} />
        </TabsContent>
        <TabsContent value="income">
          <IncomeSection onUpdate={loadStats} />
        </TabsContent>
        <TabsContent value="loans">
          <LoansSection onUpdate={loadStats} />
        </TabsContent>
        <TabsContent value="ip">
          <IPSection onUpdate={loadStats} />
        </TabsContent>
        <TabsContent value="reports">
          <ReportsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
