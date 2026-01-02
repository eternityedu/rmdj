import { useState, useEffect } from 'react';
import { Plus, Lightbulb, BadgeDollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getIPs, addIP, generateId } from '@/lib/storage';
import { IntellectualProperty } from '@/types';
import { format } from 'date-fns';

interface IPSectionProps {
  onUpdate: () => void;
}

export function IPSection({ onUpdate }: IPSectionProps) {
  const [ips, setIPs] = useState<IntellectualProperty[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    purpose: '',
    marketValue: '',
    costToBuy: '',
  });

  useEffect(() => {
    loadIPs();
  }, []);

  const loadIPs = () => {
    setIPs(getIPs());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ip: IntellectualProperty = {
      id: generateId(),
      name: form.name,
      purpose: form.purpose,
      marketValue: parseFloat(form.marketValue) || 0,
      costToBuy: parseFloat(form.costToBuy) || 0,
      createdAt: new Date().toISOString(),
    };
    addIP(ip);
    loadIPs();
    onUpdate();
    setForm({ name: '', purpose: '', marketValue: '', costToBuy: '' });
    setIsOpen(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalMarketValue = ips.reduce((acc, ip) => acc + ip.marketValue, 0);
  const totalCost = ips.reduce((acc, ip) => acc + ip.costToBuy, 0);

  return (
    <div className="space-y-4">
      {/* Add IP */}
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus size={16} />
              Add IP
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Intellectual Property</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>IP Name</Label>
                <Input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Patent, Trademark, Copyright"
                  required
                />
              </div>
              <div>
                <Label>Purpose</Label>
                <Textarea
                  value={form.purpose}
                  onChange={e => setForm({ ...form, purpose: e.target.value })}
                  placeholder="What is this IP for?"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Market Value (₹)</Label>
                  <Input
                    type="number"
                    value={form.marketValue}
                    onChange={e => setForm({ ...form, marketValue: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Cost to Acquire (₹)</Label>
                  <Input
                    type="number"
                    value={form.costToBuy}
                    onChange={e => setForm({ ...form, costToBuy: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">Add IP</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="border-daily/20 bg-daily/5">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Market Value</p>
            <p className="text-2xl font-bold text-daily mono">{formatCurrency(totalMarketValue)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Cost</p>
            <p className="text-2xl font-bold mono">{formatCurrency(totalCost)}</p>
          </CardContent>
        </Card>
      </div>

      {/* IP List */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb size={16} className="text-daily" />
            Intellectual Properties ({ips.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ips.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No intellectual properties added yet</p>
            ) : (
              ips.map((ip) => (
                <div
                  key={ip.id}
                  className="p-4 rounded-lg bg-muted/30 border border-border/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium flex items-center gap-2">
                        <BadgeDollarSign size={16} className="text-daily" />
                        {ip.name}
                      </h4>
                      {ip.purpose && (
                        <p className="text-sm text-muted-foreground mt-1">{ip.purpose}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Added {format(new Date(ip.createdAt), 'dd MMM yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-daily mono">{formatCurrency(ip.marketValue)}</p>
                      <p className="text-xs text-muted-foreground">Cost: {formatCurrency(ip.costToBuy)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
