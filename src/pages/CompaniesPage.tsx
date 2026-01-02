import { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { getCompanies, saveCompanies, generateId } from '@/lib/storage';
import { Company } from '@/types';

const statusColors = {
  idea: 'bg-muted text-muted-foreground',
  planning: 'bg-notes/20 text-notes',
  building: 'bg-founder/20 text-founder',
  launched: 'bg-income/20 text-income',
  scaling: 'bg-primary/20 text-primary',
};

const statusLabels = {
  idea: 'Idea',
  planning: 'Planning',
  building: 'Building',
  launched: 'Launched',
  scaling: 'Scaling',
};

export function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    status: 'idea' as Company['status'],
    revenue: '',
    expenses: '',
    notes: '',
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = () => {
    setCompanies(getCompanies());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const companyData: Company = {
      id: editingCompany?.id || generateId(),
      name: form.name,
      description: form.description,
      status: form.status,
      revenue: parseFloat(form.revenue) || 0,
      expenses: parseFloat(form.expenses) || 0,
      notes: form.notes,
      createdAt: editingCompany?.createdAt || new Date().toISOString(),
    };

    if (editingCompany) {
      const updated = companies.map(c => c.id === editingCompany.id ? companyData : c);
      saveCompanies(updated);
    } else {
      saveCompanies([...companies, companyData]);
    }

    loadCompanies();
    resetForm();
  };

  const resetForm = () => {
    setForm({ name: '', description: '', status: 'idea', revenue: '', expenses: '', notes: '' });
    setEditingCompany(null);
    setIsOpen(false);
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setForm({
      name: company.name,
      description: company.description,
      status: company.status,
      revenue: company.revenue.toString(),
      expenses: company.expenses.toString(),
      notes: company.notes,
    });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    saveCompanies(companies.filter(c => c.id !== id));
    loadCompanies();
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
        title="Companies"
        description="Manage your ventures and projects"
        icon={Building2}
        iconColor="text-investment"
        action={
          <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus size={16} />
                Add Company
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingCompany ? 'Edit Company' : 'Add Company'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Company Name</Label>
                  <Input
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="RMDJ Industries"
                    required
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="What does this company do?"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Company['status'] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="idea">Idea</SelectItem>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="building">Building</SelectItem>
                      <SelectItem value="launched">Launched</SelectItem>
                      <SelectItem value="scaling">Scaling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Revenue (₹)</Label>
                    <Input
                      type="number"
                      value={form.revenue}
                      onChange={e => setForm({ ...form, revenue: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Expenses (₹)</Label>
                    <Input
                      type="number"
                      value={form.expenses}
                      onChange={e => setForm({ ...form, expenses: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    placeholder="Additional notes..."
                    rows={2}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingCompany ? 'Update Company' : 'Add Company'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No companies yet"
          description="Start building your empire. Add your first company or project idea."
          actionLabel="Add Company"
          onAction={() => setIsOpen(true)}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => {
            const profit = company.revenue - company.expenses;
            return (
              <Card key={company.id} className="border-border/50 hover:border-investment/30 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{company.name}</CardTitle>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs mt-1 ${statusColors[company.status]}`}>
                        {statusLabels[company.status]}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(company)}>
                        <Edit2 size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(company.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {company.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{company.description}</p>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Revenue</p>
                      <p className="font-medium text-income mono">{formatCurrency(company.revenue)}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Expenses</p>
                      <p className="font-medium text-expense mono">{formatCurrency(company.expenses)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <span className="text-xs text-muted-foreground">Profit/Loss</span>
                    <span className={`flex items-center gap-1 font-medium mono ${profit >= 0 ? 'text-income' : 'text-expense'}`}>
                      {profit >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {formatCurrency(Math.abs(profit))}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
