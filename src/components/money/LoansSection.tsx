import { useState, useEffect } from 'react';
import { Plus, Edit2, AlertTriangle, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { getLoans, addLoan, updateLoan, generateId } from '@/lib/storage';
import { Loan } from '@/types';
import { format, differenceInMonths } from 'date-fns';

interface LoansSectionProps {
  onUpdate: () => void;
}

export function LoansSection({ onUpdate }: LoansSectionProps) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [form, setForm] = useState({
    type: '',
    principal: '',
    interestRate: '',
    emi: '',
    dueDate: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = () => {
    setLoans(getLoans());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const principal = parseFloat(form.principal) || 0;
    const emi = parseFloat(form.emi) || 0;
    
    const loanData: Loan = {
      id: editingLoan?.id || generateId(),
      type: form.type,
      principal,
      interestRate: parseFloat(form.interestRate) || 0,
      emi,
      dueDate: form.dueDate,
      startDate: form.startDate,
      remainingBalance: editingLoan?.remainingBalance || principal,
      totalPaid: editingLoan?.totalPaid || 0,
    };

    if (editingLoan) {
      updateLoan(editingLoan.id, loanData);
    } else {
      addLoan(loanData);
    }

    loadLoans();
    onUpdate();
    resetForm();
  };

  const resetForm = () => {
    setForm({
      type: '',
      principal: '',
      interestRate: '',
      emi: '',
      dueDate: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
    });
    setEditingLoan(null);
    setIsOpen(false);
  };

  const handleEdit = (loan: Loan) => {
    setEditingLoan(loan);
    setForm({
      type: loan.type,
      principal: loan.principal.toString(),
      interestRate: loan.interestRate.toString(),
      emi: loan.emi.toString(),
      dueDate: loan.dueDate,
      startDate: loan.startDate,
    });
    setIsOpen(true);
  };

  const payEMI = (loanId: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    const newPaid = loan.totalPaid + loan.emi;
    const newBalance = Math.max(0, loan.remainingBalance - loan.emi);

    updateLoan(loanId, {
      totalPaid: newPaid,
      remainingBalance: newBalance,
    });
    loadLoans();
    onUpdate();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalOutstanding = loans.reduce((acc, l) => acc + l.remainingBalance, 0);
  const totalPrincipal = loans.reduce((acc, l) => acc + l.principal, 0);
  const monthlyEMI = loans.reduce((acc, l) => acc + l.emi, 0);

  return (
    <div className="space-y-4">
      {/* Add Loan */}
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus size={16} />
              Add Loan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingLoan ? 'Edit Loan' : 'Add Loan'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Loan Type</Label>
                <Input
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  placeholder="e.g., Home Loan, Car Loan, Personal Loan"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Principal (₹)</Label>
                  <Input
                    type="number"
                    value={form.principal}
                    onChange={e => setForm({ ...form, principal: e.target.value })}
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <Label>Interest Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.interestRate}
                    onChange={e => setForm({ ...form, interestRate: e.target.value })}
                    placeholder="0"
                    required
                  />
                </div>
              </div>
              <div>
                <Label>EMI Amount (₹)</Label>
                <Input
                  type="number"
                  value={form.emi}
                  onChange={e => setForm({ ...form, emi: e.target.value })}
                  placeholder="0"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm({ ...form, startDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>EMI Due Date</Label>
                  <Input
                    type="date"
                    value={form.dueDate}
                    onChange={e => setForm({ ...form, dueDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                {editingLoan ? 'Update Loan' : 'Add Loan'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="border-expense/20 bg-expense/5">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Outstanding</p>
            <p className="text-2xl font-bold text-expense mono">{formatCurrency(totalOutstanding)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Principal</p>
            <p className="text-2xl font-bold mono">{formatCurrency(totalPrincipal)}</p>
          </CardContent>
        </Card>
        <Card className="border-founder/20 bg-founder/5">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Monthly EMI</p>
            <p className="text-2xl font-bold text-founder mono">{formatCurrency(monthlyEMI)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Loans List */}
      <div className="space-y-4">
        {loans.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No loans added yet</p>
            </CardContent>
          </Card>
        ) : (
          loans.map((loan) => {
            const paidPercent = loan.principal > 0 
              ? Math.round(((loan.principal - loan.remainingBalance) / loan.principal) * 100) 
              : 0;
            const dueDate = new Date(loan.dueDate);
            const today = new Date();
            const isDueSoon = dueDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) && dueDate >= today;
            const isOverdue = dueDate < today;

            return (
              <Card key={loan.id} className={`border-border/50 ${isOverdue ? 'border-expense/50' : isDueSoon ? 'border-founder/50' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {loan.type}
                        {(isDueSoon || isOverdue) && (
                          <AlertTriangle size={14} className={isOverdue ? 'text-expense' : 'text-founder'} />
                        )}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {loan.interestRate}% interest • Started {format(new Date(loan.startDate), 'MMM yyyy')}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(loan)}>
                      <Edit2 size={14} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Paid</span>
                      <span className="font-medium mono">{paidPercent}%</span>
                    </div>
                    <Progress value={paidPercent} className="h-2" />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="p-2 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Remaining</p>
                      <p className="font-medium text-expense mono">{formatCurrency(loan.remainingBalance)}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">EMI</p>
                      <p className="font-medium mono">{formatCurrency(loan.emi)}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Total Paid</p>
                      <p className="font-medium text-income mono">{formatCurrency(loan.totalPaid)}</p>
                    </div>
                  </div>

                  {/* Due Date & Pay EMI */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={14} className="text-muted-foreground" />
                      <span className={isOverdue ? 'text-expense' : isDueSoon ? 'text-founder' : 'text-muted-foreground'}>
                        Due: {format(dueDate, 'dd MMM yyyy')}
                        {isOverdue && ' (Overdue!)'}
                        {isDueSoon && !isOverdue && ' (Due Soon)'}
                      </span>
                    </div>
                    {loan.remainingBalance > 0 && (
                      <Button size="sm" variant="outline" onClick={() => payEMI(loan.id)}>
                        Pay EMI
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
