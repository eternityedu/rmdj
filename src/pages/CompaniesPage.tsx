import { useState, useRef } from 'react';
import { Building2, Plus, Edit2, Trash2, TrendingUp, TrendingDown, Upload, X, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useCompanies, Company } from '@/hooks/useCompanies';

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
  const { companies, loading, addCompany, updateCompany, deleteCompany } = useCompanies();
  const [isOpen, setIsOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    status: 'idea' as Company['status'],
    revenue: '',
    expenses: '',
    notes: '',
    logo: '',
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoPreview(base64);
        setForm({ ...form, logo: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoPreview(null);
    setForm({ ...form, logo: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const companyData = {
      name: form.name,
      description: form.description || null,
      status: form.status,
      revenue: parseFloat(form.revenue) || 0,
      expenses: parseFloat(form.expenses) || 0,
      notes: form.notes || null,
      logo: form.logo || null,
    };

    if (editingCompany) {
      await updateCompany(editingCompany.id, companyData);
    } else {
      await addCompany(companyData);
    }

    setSaving(false);
    resetForm();
  };

  const resetForm = () => {
    setForm({ name: '', description: '', status: 'idea', revenue: '', expenses: '', notes: '', logo: '' });
    setLogoPreview(null);
    setEditingCompany(null);
    setIsOpen(false);
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setForm({
      name: company.name,
      description: company.description || '',
      status: company.status,
      revenue: company.revenue.toString(),
      expenses: company.expenses.toString(),
      notes: company.notes || '',
      logo: company.logo || '',
    });
    setLogoPreview(company.logo || null);
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteCompany(id);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in pb-20 lg:pb-6">
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
            <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCompany ? 'Edit Company' : 'Add Company'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Logo Upload */}
                <div>
                  <Label>Company Logo</Label>
                  <div className="mt-2 flex items-center gap-4">
                    {logoPreview ? (
                      <div className="relative">
                        <img src={logoPreview} alt="Logo preview" className="h-16 w-16 rounded-lg object-cover border border-border" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={removeLogo}
                        >
                          <X size={12} />
                        </Button>
                      </div>
                    ) : (
                      <div 
                        className="h-16 w-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload size={20} className="text-muted-foreground" />
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    {!logoPreview && (
                      <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                        Upload Logo
                      </Button>
                    )}
                  </div>
                </div>
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
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
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
                    <div className="flex items-center gap-3">
                      {company.logo ? (
                        <img src={company.logo} alt={company.name} className="h-10 w-10 rounded-lg object-cover border border-border shrink-0" />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Building2 size={18} className="text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-base">{company.name}</CardTitle>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs mt-1 ${statusColors[company.status]}`}>
                          {statusLabels[company.status]}
                        </span>
                      </div>
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
