import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, TrendingUp, Coins, Building, BarChart3, Bitcoin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getInvestments, addInvestment, updateInvestment, deleteInvestment, generateId } from '@/lib/storage';
import { Investment } from '@/types';
import { format } from 'date-fns';

interface InvestmentsSectionProps {
  onUpdate: () => void;
}

const investmentTypes = [
  { value: 'sip', label: 'SIP/Mutual Funds', icon: TrendingUp },
  { value: 'gold', label: 'Gold', icon: Coins },
  { value: 'silver', label: 'Silver', icon: Coins },
  { value: 'property', label: 'Property', icon: Building },
  { value: 'stocks', label: 'Stocks', icon: BarChart3 },
  { value: 'crypto', label: 'Crypto', icon: Bitcoin },
];

export function InvestmentsSection({ onUpdate }: InvestmentsSectionProps) {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [selectedType, setSelectedType] = useState('sip');
  const [form, setForm] = useState<Partial<Investment>>({
    type: 'sip',
    name: '',
    monthlyAmount: 0,
    expectedReturn: 0,
    nextSipDate: '',
    quantityGrams: 0,
    amountInvested: 0,
    profitBooked: 0,
    silverAmount: 0,
    silverGrowth: 0,
    location: '',
    buyValue: 0,
    currentValue: 0,
    rentalIncome: 0,
    buyPrice: 0,
    quantity: 0,
    currentPrice: 0,
    cryptoName: '',
    cryptoQuantity: 0,
    cryptoBuyPrice: 0,
    cryptoCurrentPrice: 0,
  });

  useEffect(() => {
    loadInvestments();
  }, []);

  const loadInvestments = () => {
    setInvestments(getInvestments());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const investmentData: Investment = {
      id: editingInvestment?.id || generateId(),
      type: form.type as Investment['type'],
      name: form.name || '',
      monthlyAmount: form.monthlyAmount,
      expectedReturn: form.expectedReturn,
      nextSipDate: form.nextSipDate,
      quantityGrams: form.quantityGrams,
      amountInvested: form.amountInvested,
      profitBooked: form.profitBooked,
      silverAmount: form.silverAmount,
      silverGrowth: form.silverGrowth,
      location: form.location,
      buyValue: form.buyValue,
      currentValue: form.currentValue,
      rentalIncome: form.rentalIncome,
      buyPrice: form.buyPrice,
      quantity: form.quantity,
      currentPrice: form.currentPrice,
      cryptoName: form.cryptoName,
      cryptoQuantity: form.cryptoQuantity,
      cryptoBuyPrice: form.cryptoBuyPrice,
      cryptoCurrentPrice: form.cryptoCurrentPrice,
      createdAt: editingInvestment?.createdAt || new Date().toISOString(),
    };

    if (editingInvestment) {
      updateInvestment(editingInvestment.id, investmentData);
    } else {
      addInvestment(investmentData);
    }

    loadInvestments();
    onUpdate();
    resetForm();
  };

  const resetForm = () => {
    setForm({
      type: 'sip',
      name: '',
      monthlyAmount: 0,
      expectedReturn: 0,
      nextSipDate: '',
      quantityGrams: 0,
      amountInvested: 0,
      profitBooked: 0,
      silverAmount: 0,
      silverGrowth: 0,
      location: '',
      buyValue: 0,
      currentValue: 0,
      rentalIncome: 0,
      buyPrice: 0,
      quantity: 0,
      currentPrice: 0,
    });
    setEditingInvestment(null);
    setIsOpen(false);
  };

  const handleEdit = (investment: Investment) => {
    setEditingInvestment(investment);
    setForm({ ...investment });
    setSelectedType(investment.type);
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteInvestment(id);
    loadInvestments();
    onUpdate();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getInvestmentValue = (inv: Investment): number => {
    switch (inv.type) {
      case 'stocks': return (inv.quantity || 0) * (inv.currentPrice || 0);
      case 'property': return inv.currentValue || 0;
      case 'crypto': return (inv.cryptoQuantity || 0) * (inv.cryptoCurrentPrice || 0);
      case 'gold': return inv.amountInvested || 0;
      case 'silver': return inv.silverAmount || 0;
      case 'sip': return (inv.monthlyAmount || 0) * 12;
      default: return 0;
    }
  };

  const getInvestmentPL = (inv: Investment): number => {
    switch (inv.type) {
      case 'stocks': {
        const invested = (inv.quantity || 0) * (inv.buyPrice || 0);
        const current = (inv.quantity || 0) * (inv.currentPrice || 0);
        return current - invested;
      }
      case 'property': return (inv.currentValue || 0) - (inv.buyValue || 0);
      case 'crypto': {
        const invested = (inv.cryptoQuantity || 0) * (inv.cryptoBuyPrice || 0);
        const current = (inv.cryptoQuantity || 0) * (inv.cryptoCurrentPrice || 0);
        return current - invested;
      }
      default: return 0;
    }
  };

  const renderFormFields = () => {
    switch (form.type) {
      case 'sip':
        return (
          <>
            <div>
              <Label>Fund Name</Label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., HDFC Top 100"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Monthly Amount (₹)</Label>
                <Input
                  type="number"
                  value={form.monthlyAmount || ''}
                  onChange={e => setForm({ ...form, monthlyAmount: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label>Expected Return (%)</Label>
                <Input
                  type="number"
                  value={form.expectedReturn || ''}
                  onChange={e => setForm({ ...form, expectedReturn: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div>
              <Label>Next SIP Date</Label>
              <Input
                type="date"
                value={form.nextSipDate || ''}
                onChange={e => setForm({ ...form, nextSipDate: e.target.value })}
              />
            </div>
          </>
        );
      case 'gold':
        return (
          <>
            <div>
              <Label>Name/Description</Label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Sovereign Gold Bonds"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantity (grams)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.quantityGrams || ''}
                  onChange={e => setForm({ ...form, quantityGrams: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Amount Invested (₹)</Label>
                <Input
                  type="number"
                  value={form.amountInvested || ''}
                  onChange={e => setForm({ ...form, amountInvested: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>
            <div>
              <Label>Profit Booked (₹)</Label>
              <Input
                type="number"
                value={form.profitBooked || ''}
                onChange={e => setForm({ ...form, profitBooked: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </>
        );
      case 'silver':
        return (
          <>
            <div>
              <Label>Name/Description</Label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Silver ETF"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Amount Invested (₹)</Label>
                <Input
                  type="number"
                  value={form.silverAmount || ''}
                  onChange={e => setForm({ ...form, silverAmount: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label>Growth (%)</Label>
                <Input
                  type="number"
                  value={form.silverGrowth || ''}
                  onChange={e => setForm({ ...form, silverGrowth: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </>
        );
      case 'property':
        return (
          <>
            <div>
              <Label>Property Name</Label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., 2BHK Pune"
                required
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={form.location || ''}
                onChange={e => setForm({ ...form, location: e.target.value })}
                placeholder="e.g., Baner, Pune"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Buy Value (₹)</Label>
                <Input
                  type="number"
                  value={form.buyValue || ''}
                  onChange={e => setForm({ ...form, buyValue: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label>Current Value (₹)</Label>
                <Input
                  type="number"
                  value={form.currentValue || ''}
                  onChange={e => setForm({ ...form, currentValue: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div>
              <Label>Rental Income (₹/month)</Label>
              <Input
                type="number"
                value={form.rentalIncome || ''}
                onChange={e => setForm({ ...form, rentalIncome: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </>
        );
      case 'stocks':
        return (
          <>
            <div>
              <Label>Stock Name</Label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., RELIANCE"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Buy Price (₹)</Label>
                <Input
                  type="number"
                  value={form.buyPrice || ''}
                  onChange={e => setForm({ ...form, buyPrice: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={form.quantity || ''}
                  onChange={e => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>
            <div>
              <Label>Current Price (₹)</Label>
              <Input
                type="number"
                value={form.currentPrice || ''}
                onChange={e => setForm({ ...form, currentPrice: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </>
        );
      case 'crypto':
        return (
          <>
            <div>
              <Label>Crypto Name</Label>
              <Input
                value={form.cryptoName || form.name}
                onChange={e => setForm({ ...form, name: e.target.value, cryptoName: e.target.value })}
                placeholder="e.g., BTC"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Buy Price (₹)</Label>
                <Input
                  type="number"
                  value={form.cryptoBuyPrice || ''}
                  onChange={e => setForm({ ...form, cryptoBuyPrice: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  step="0.00001"
                  value={form.cryptoQuantity || ''}
                  onChange={e => setForm({ ...form, cryptoQuantity: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>
            <div>
              <Label>Current Price (₹)</Label>
              <Input
                type="number"
                value={form.cryptoCurrentPrice || ''}
                onChange={e => setForm({ ...form, cryptoCurrentPrice: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const totalValue = investments.reduce((acc, inv) => acc + getInvestmentValue(inv), 0);

  return (
    <div className="space-y-4">
      {/* Add Investment */}
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus size={16} />
              Add Investment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingInvestment ? 'Edit Investment' : 'Add Investment'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Investment Type</Label>
                <Select 
                  value={form.type} 
                  onValueChange={(v) => setForm({ ...form, type: v as Investment['type'] })}
                  disabled={!!editingInvestment}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {investmentTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {renderFormFields()}
              <Button type="submit" className="w-full">
                {editingInvestment ? 'Update Investment' : 'Add Investment'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Total Value */}
      <Card className="border-investment/20 bg-investment/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
            <p className="text-2xl font-bold text-investment mono">{formatCurrency(totalValue)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Investment Categories */}
      <Tabs value={selectedType} onValueChange={setSelectedType}>
        <TabsList className="flex-wrap h-auto gap-2 bg-muted/30 p-1">
          {investmentTypes.map(type => {
            const Icon = type.icon;
            const count = investments.filter(i => i.type === type.value).length;
            return (
              <TabsTrigger key={type.value} value={type.value} className="gap-2">
                <Icon size={14} />
                {type.label} ({count})
              </TabsTrigger>
            );
          })}
        </TabsList>

        {investmentTypes.map(type => (
          <TabsContent key={type.value} value={type.value} className="mt-4">
            <div className="space-y-3">
              {investments.filter(i => i.type === type.value).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No {type.label.toLowerCase()} investments yet
                </p>
              ) : (
                investments
                  .filter(i => i.type === type.value)
                  .map((inv) => {
                    const value = getInvestmentValue(inv);
                    const pl = getInvestmentPL(inv);
                    return (
                      <Card key={inv.id} className="border-border/50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{inv.name}</h4>
                              {inv.location && (
                                <p className="text-xs text-muted-foreground">{inv.location}</p>
                              )}
                              <p className="text-lg font-bold mono text-investment mt-1">
                                {formatCurrency(value)}
                              </p>
                              {(inv.type === 'stocks' || inv.type === 'property' || inv.type === 'crypto') && (
                                <p className={`text-sm mono ${pl >= 0 ? 'text-income' : 'text-expense'}`}>
                                  {pl >= 0 ? '+' : ''}{formatCurrency(pl)} P/L
                                </p>
                              )}
                              {inv.type === 'sip' && inv.nextSipDate && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Next SIP: {format(new Date(inv.nextSipDate), 'dd MMM yyyy')}
                                </p>
                              )}
                              {inv.type === 'property' && inv.rentalIncome && inv.rentalIncome > 0 && (
                                <p className="text-xs text-income mt-1">
                                  Rental: {formatCurrency(inv.rentalIncome)}/month
                                </p>
                              )}
                              {inv.type === 'gold' && inv.quantityGrams && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {inv.quantityGrams}g | Profit booked: {formatCurrency(inv.profitBooked || 0)}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(inv)}>
                                <Edit2 size={14} />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(inv.id)}>
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
