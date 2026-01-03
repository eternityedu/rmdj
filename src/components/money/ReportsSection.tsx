import { useState } from 'react';
import { Download, FileText, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getWallet, getExpenses, getInvestments, getIncomes, getLoans, calculateNetWorth } from '@/lib/storage';
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
    try {
      const doc = new jsPDF();
      const wallet = getWallet();
      const expenses = getExpenses();
      const investments = getInvestments();
      const incomes = getIncomes();
      const loans = getLoans();

      // Filter by date range
      const filterByDate = <T extends { date: string }>(items: T[]): T[] => {
        return items.filter(item => item.date >= startDate && item.date <= endDate);
      };

      const filteredWallet = filterByDate(wallet);
      const filteredExpenses = filterByDate(expenses);
      const filteredIncomes = filterByDate(incomes);

      // Calculate ALL values correctly
      const totalWalletAdded = filteredWallet.filter(w => w.type === 'added').reduce((acc, w) => acc + w.amount, 0);
      const totalWalletSpent = filteredWallet.filter(w => w.type === 'spent').reduce((acc, w) => acc + w.amount, 0);
      const walletBalance = wallet.reduce((acc, w) => w.type === 'added' ? acc + w.amount : acc - w.amount, 0); // Current balance from all entries
      
      const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
      const totalIncome = filteredIncomes.reduce((acc, i) => acc + i.amount, 0);
      
      const totalInvestments = investments.reduce((acc, inv) => {
        if (inv.type === 'stocks') return acc + (inv.quantity || 0) * (inv.currentPrice || 0);
        if (inv.type === 'property') return acc + (inv.currentValue || 0);
        if (inv.type === 'sip') return acc + (inv.monthlyAmount || 0) * 12;
        if (inv.type === 'gold') return acc + (inv.amountInvested || 0);
        return acc + (inv.amountInvested || inv.silverAmount || 0);
      }, 0);
      
      const totalLoans = loans.reduce((acc, l) => acc + l.remainingBalance, 0);
      const netWorth = calculateNetWorth();
      const netProfit = totalIncome - totalExpenses;

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

      const addSection = (title: string, items: Array<{ label: string; value: string }>) => {
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

      // ==================== SUMMARY SECTION (ALL REPORTS) ====================
      if (reportType === 'full') {
        // Main Financial Summary Box
        doc.setFillColor(240, 240, 240);
        doc.rect(15, yPos, pageWidth - 30, 50, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('FINANCIAL SUMMARY', 20, yPos + 8);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const summaryItems = [
          { label: 'Total Income Earned:', value: formatCurrency(totalIncome) },
          { label: 'Total Expenses Spent:', value: formatCurrency(totalExpenses) },
          { label: 'Current Wallet Balance:', value: formatCurrency(walletBalance) },
          { label: 'Net Profit/Loss:', value: formatCurrency(netProfit) },
        ];
        
        let summaryY = yPos + 16;
        summaryItems.forEach(item => {
          doc.text(item.label, 25, summaryY);
          doc.text(item.value, pageWidth - 25, summaryY, { align: 'right' });
          summaryY += 8;
        });
        yPos += 58;
      }

      // Wallet Section
      if (reportType === 'full' || reportType === 'wallet') {
        addSection('WALLET SUMMARY', [
          { label: 'Total Money Added (Period)', value: formatCurrency(totalWalletAdded) },
          { label: 'Total Money Spent (Period)', value: formatCurrency(totalWalletSpent) },
          { label: 'Current Wallet Balance', value: formatCurrency(walletBalance) },
        ]);
      }

      // Income Section
      if (reportType === 'full' || reportType === 'income') {
        addSection('INCOME SUMMARY', [
          { label: 'Total Income (Period)', value: formatCurrency(totalIncome) },
        ]);
        
        // Income by source
        const incomeBySource: Record<string, number> = {};
        filteredIncomes.forEach(i => {
          incomeBySource[i.source] = (incomeBySource[i.source] || 0) + i.amount;
        });
        if (Object.keys(incomeBySource).length > 0) {
          doc.setFontSize(9);
          doc.text('By Source:', 20, yPos);
          yPos += 6;
          Object.entries(incomeBySource).forEach(([source, amount]) => {
            doc.text(`  ${source.charAt(0).toUpperCase() + source.slice(1)}`, 25, yPos);
            doc.text(formatCurrency(amount), pageWidth - 20, yPos, { align: 'right' });
            yPos += lineHeight;
          });
          yPos += 5;
        }
      }

      // Expenses Section
      if (reportType === 'full' || reportType === 'expenses') {
        addSection('EXPENSES SUMMARY', [
          { label: 'Total Expenses (Period)', value: formatCurrency(totalExpenses) },
        ]);

        // Expenses by category
        const expensesByCategory: Record<string, number> = {};
        filteredExpenses.forEach(e => {
          expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
        });
        if (Object.keys(expensesByCategory).length > 0) {
          doc.setFontSize(9);
          doc.text('Top Categories:', 20, yPos);
          yPos += 6;
          Object.entries(expensesByCategory)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .forEach(([category, amount]) => {
              doc.text(`  ${category}`, 25, yPos);
              doc.text(formatCurrency(amount), pageWidth - 20, yPos, { align: 'right' });
              yPos += lineHeight;
            });
          yPos += 5;
        }
      }

      // Investments Section
      if (reportType === 'full' || reportType === 'investments') {
        addSection('INVESTMENTS SUMMARY', [
          { label: 'Total Portfolio Value', value: formatCurrency(totalInvestments) },
        ]);

        // By type
        const invByType: Record<string, number> = {};
        investments.forEach(inv => {
          let value = 0;
          if (inv.type === 'stocks') value = (inv.quantity || 0) * (inv.currentPrice || 0);
          else if (inv.type === 'property') value = inv.currentValue || 0;
          else if (inv.type === 'sip') value = (inv.monthlyAmount || 0) * 12;
          else if (inv.type === 'gold') value = inv.amountInvested || 0;
          else value = inv.amountInvested || inv.silverAmount || 0;
          if (value > 0) invByType[inv.type] = (invByType[inv.type] || 0) + value;
        });
        if (Object.keys(invByType).length > 0) {
          doc.setFontSize(9);
          doc.text('By Type:', 20, yPos);
          yPos += 6;
          Object.entries(invByType).forEach(([type, value]) => {
            doc.text(`  ${type.toUpperCase()}`, 25, yPos);
            doc.text(formatCurrency(value), pageWidth - 20, yPos, { align: 'right' });
            yPos += lineHeight;
          });
          yPos += 5;
        }
      }

      // Loans Section (Full report only)
      if (reportType === 'full') {
        addSection('LOANS SUMMARY', [
          { label: 'Total Outstanding Balance', value: formatCurrency(totalLoans) },
          { label: 'Active Loans', value: loans.length.toString() },
        ]);

        // Individual loans
        if (loans.length > 0) {
          doc.setFontSize(9);
          loans.forEach(loan => {
            doc.text(`  ${loan.type}`, 25, yPos);
            doc.text(`EMI: ${formatCurrency(loan.emi)} | Balance: ${formatCurrency(loan.remainingBalance)}`, pageWidth - 20, yPos, { align: 'right' });
            yPos += lineHeight;
          });
          yPos += 5;
        }

        // Final Net Calculation
        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFillColor(59, 130, 246);
        doc.rect(15, yPos, pageWidth - 30, 25, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('NET CALCULATION', 20, yPos + 8);
        doc.setFontSize(10);
        doc.text(`Income - Expenses = ${formatCurrency(netProfit)}`, 20, yPos + 18);
        doc.text(`Net Worth = ${formatCurrency(netWorth)}`, pageWidth - 20, yPos + 18, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        yPos += 35;
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
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  // Calculate current values for preview
  const wallet = getWallet();
  const incomes = getIncomes();
  const expenses = getExpenses();
  const investments = getInvestments();
  const loans = getLoans();
  
  const walletBalance = wallet.reduce((acc, w) => w.type === 'added' ? acc + w.amount : acc - w.amount, 0);
  const totalIncome = incomes.reduce((acc, i) => acc + i.amount, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalInvestments = investments.reduce((acc, inv) => {
    if (inv.type === 'stocks') return acc + (inv.quantity || 0) * (inv.currentPrice || 0);
    if (inv.type === 'property') return acc + (inv.currentValue || 0);
    if (inv.type === 'sip') return acc + (inv.monthlyAmount || 0) * 12;
    if (inv.type === 'gold') return acc + (inv.amountInvested || 0);
    return acc + (inv.amountInvested || inv.silverAmount || 0);
  }, 0);
  const totalLoans = loans.reduce((acc, l) => acc + l.remainingBalance, 0);

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
          <CardTitle className="text-base">Quick Summary (All Time)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-income/10 border border-income/20">
              <p className="text-muted-foreground text-xs">Net Worth</p>
              <p className="text-lg font-bold text-income mono">{formatCurrency(calculateNetWorth())}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-muted-foreground text-xs">Wallet Balance</p>
              <p className="text-lg font-bold text-primary mono">{formatCurrency(walletBalance)}</p>
            </div>
            <div className="p-3 rounded-lg bg-founder/10 border border-founder/20">
              <p className="text-muted-foreground text-xs">Total Income</p>
              <p className="text-lg font-bold text-founder mono">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="p-3 rounded-lg bg-expense/10 border border-expense/20">
              <p className="text-muted-foreground text-xs">Total Expenses</p>
              <p className="text-lg font-bold text-expense mono">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="p-3 rounded-lg bg-investment/10 border border-investment/20">
              <p className="text-muted-foreground text-xs">Investments</p>
              <p className="text-lg font-bold text-investment mono">{formatCurrency(totalInvestments)}</p>
            </div>
            <div className="p-3 rounded-lg bg-notes/10 border border-notes/20">
              <p className="text-muted-foreground text-xs">Loans Outstanding</p>
              <p className="text-lg font-bold text-notes mono">{formatCurrency(totalLoans)}</p>
            </div>
          </div>
          
          {/* Net Profit/Loss */}
          <div className={`mt-3 p-3 rounded-lg ${totalIncome - totalExpenses >= 0 ? 'bg-income/10 border border-income/20' : 'bg-expense/10 border border-expense/20'}`}>
            <p className="text-muted-foreground text-xs">Net Profit/Loss (Income - Expenses)</p>
            <p className={`text-xl font-bold mono ${totalIncome - totalExpenses >= 0 ? 'text-income' : 'text-expense'}`}>
              {formatCurrency(totalIncome - totalExpenses)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
