import { useState } from 'react';
import { Download, FileText, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getWallet, getExpenses, getInvestments, getIncomes, getLoans, getIPs, getSkills, calculateNetWorth } from '@/lib/storage';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

export function ReportsSection() {
  const [reportType, setReportType] = useState('full');
  const [startDate, setStartDate] = useState(format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const wallet = getWallet();
    const expenses = getExpenses();
    const investments = getInvestments();
    const incomes = getIncomes();
    const loans = getLoans();
    const ips = getIPs();
    const skills = getSkills();

    // Filter by date range
    const filterByDate = <T extends { date: string }>(items: T[]): T[] => {
      return items.filter(item => item.date >= startDate && item.date <= endDate);
    };

    const filteredWallet = filterByDate(wallet);
    const filteredExpenses = filterByDate(expenses);
    const filteredIncomes = filterByDate(incomes);

    // Calculate summaries
    const totalAdded = filteredWallet.filter(w => w.type === 'added').reduce((acc, w) => acc + w.amount, 0);
    const totalSpent = filteredWallet.filter(w => w.type === 'spent').reduce((acc, w) => acc + w.amount, 0);
    const walletBalance = totalAdded - totalSpent;
    const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
    const totalIncome = filteredIncomes.reduce((acc, i) => acc + i.amount, 0);
    const totalInvestments = investments.reduce((acc, inv) => {
      if (inv.type === 'stocks') return acc + (inv.quantity || 0) * (inv.currentPrice || 0);
      if (inv.type === 'property') return acc + (inv.currentValue || 0);
      return acc + (inv.amountInvested || inv.silverAmount || 0);
    }, 0);
    const totalLoans = loans.reduce((acc, l) => acc + l.remainingBalance, 0);
    const netWorth = calculateNetWorth();

    let yPos = 20;
    const lineHeight = 7;
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('RMDJ Financial Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Period: ${format(new Date(startDate), 'dd MMM yyyy')} - ${format(new Date(endDate), 'dd MMM yyyy')}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Net Worth Banner
    doc.setFillColor(16, 185, 129);
    doc.rect(15, yPos, pageWidth - 30, 15, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`Net Worth: ${formatCurrency(netWorth)}`, pageWidth / 2, yPos + 10, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    yPos += 25;

    const addSection = (title: string, items: Array<{ label: string; value: string; color?: string }>) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 15, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      items.forEach(item => {
        doc.text(item.label, 20, yPos);
        doc.text(item.value, pageWidth - 20, yPos, { align: 'right' });
        yPos += lineHeight;
      });
      yPos += 5;
    };

    // Summary Section
    if (reportType === 'full' || reportType === 'wallet') {
      addSection('💰 Wallet Summary', [
        { label: 'Total Added', value: formatCurrency(totalAdded) },
        { label: 'Total Spent', value: formatCurrency(totalSpent) },
        { label: 'Current Balance', value: formatCurrency(walletBalance) },
      ]);
    }

    if (reportType === 'full' || reportType === 'income') {
      addSection('📈 Income Summary', [
        { label: 'Total Income (Period)', value: formatCurrency(totalIncome) },
      ]);
      
      // Income by source
      const incomeBySource: Record<string, number> = {};
      filteredIncomes.forEach(i => {
        incomeBySource[i.source] = (incomeBySource[i.source] || 0) + i.amount;
      });
      Object.entries(incomeBySource).forEach(([source, amount]) => {
        doc.text(`  ${source}`, 25, yPos);
        doc.text(formatCurrency(amount), pageWidth - 20, yPos, { align: 'right' });
        yPos += lineHeight;
      });
      yPos += 5;
    }

    if (reportType === 'full' || reportType === 'expenses') {
      addSection('💸 Expenses Summary', [
        { label: 'Total Expenses (Period)', value: formatCurrency(totalExpenses) },
      ]);

      // Expenses by category
      const expensesByCategory: Record<string, number> = {};
      filteredExpenses.forEach(e => {
        expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
      });
      Object.entries(expensesByCategory)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([category, amount]) => {
          doc.text(`  ${category}`, 25, yPos);
          doc.text(formatCurrency(amount), pageWidth - 20, yPos, { align: 'right' });
          yPos += lineHeight;
        });
      yPos += 5;
    }

    if (reportType === 'full' || reportType === 'investments') {
      addSection('📊 Investments Summary', [
        { label: 'Total Portfolio Value', value: formatCurrency(totalInvestments) },
      ]);

      // By type
      const invByType: Record<string, number> = {};
      investments.forEach(inv => {
        let value = 0;
        if (inv.type === 'stocks') value = (inv.quantity || 0) * (inv.currentPrice || 0);
        else if (inv.type === 'property') value = inv.currentValue || 0;
        else if (inv.type === 'sip') value = (inv.monthlyAmount || 0) * 12;
        else value = inv.amountInvested || inv.silverAmount || 0;
        invByType[inv.type] = (invByType[inv.type] || 0) + value;
      });
      Object.entries(invByType).forEach(([type, value]) => {
        doc.text(`  ${type.toUpperCase()}`, 25, yPos);
        doc.text(formatCurrency(value), pageWidth - 20, yPos, { align: 'right' });
        yPos += lineHeight;
      });
      yPos += 5;
    }

    if (reportType === 'full') {
      addSection('🏦 Loans Summary', [
        { label: 'Total Outstanding', value: formatCurrency(totalLoans) },
        { label: 'Active Loans', value: loans.length.toString() },
      ]);

      addSection('📝 Profit/Loss', [
        { label: 'Income - Expenses', value: formatCurrency(totalIncome - totalExpenses) },
      ]);
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Page ${i} of ${pageCount} | RMDJ Hub - Personal Finance Report`, pageWidth / 2, 290, { align: 'center' });
    }

    // Generate filename
    const fileName = `RMDJ_${reportType}_Report_${format(new Date(startDate), 'MMMyyyy')}_${format(new Date(endDate), 'MMMyyyy')}.pdf`;
    doc.save(fileName);
    toast.success('Report downloaded successfully!');
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText size={16} className="text-notes" />
            Generate Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Report</SelectItem>
                <SelectItem value="wallet">Wallet Only</SelectItem>
                <SelectItem value="expenses">Expenses Only</SelectItem>
                <SelectItem value="investments">Investments Only</SelectItem>
                <SelectItem value="income">Income Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2">
                <Calendar size={14} />
                Start Date
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Calendar size={14} />
                End Date
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={generatePDF} className="w-full gap-2">
            <Download size={16} />
            Download PDF Report
          </Button>
        </CardContent>
      </Card>

      {/* Quick Summary Preview */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Quick Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-income/10 border border-income/20">
              <p className="text-muted-foreground">Net Worth</p>
              <p className="text-lg font-bold text-income mono">{formatCurrency(calculateNetWorth())}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-muted-foreground">Wallet</p>
              <p className="text-lg font-bold text-primary mono">
                {formatCurrency(getWallet().reduce((acc, w) => w.type === 'added' ? acc + w.amount : acc - w.amount, 0))}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-investment/10 border border-investment/20">
              <p className="text-muted-foreground">Investments</p>
              <p className="text-lg font-bold text-investment mono">
                {formatCurrency(getInvestments().reduce((acc, inv) => {
                  if (inv.type === 'stocks') return acc + (inv.quantity || 0) * (inv.currentPrice || 0);
                  if (inv.type === 'property') return acc + (inv.currentValue || 0);
                  return acc + (inv.amountInvested || inv.silverAmount || 0);
                }, 0))}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-expense/10 border border-expense/20">
              <p className="text-muted-foreground">Loans</p>
              <p className="text-lg font-bold text-expense mono">
                {formatCurrency(getLoans().reduce((acc, l) => acc + l.remainingBalance, 0))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
