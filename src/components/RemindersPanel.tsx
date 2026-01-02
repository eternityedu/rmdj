import { useState, useEffect } from 'react';
import { Bell, Calendar, Wallet, Brain, ClipboardList, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { getReminders, Reminder } from '@/lib/reminders';
import { cn } from '@/lib/utils';

export function RemindersPanel() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setReminders(getReminders());
  }, [open]);

  const getIcon = (type: Reminder['type']) => {
    switch (type) {
      case 'sip': return Calendar;
      case 'emi': return Wallet;
      case 'skill': return Brain;
      case 'review': return ClipboardList;
    }
  };

  const getColor = (type: Reminder['type']) => {
    switch (type) {
      case 'sip': return 'text-investment';
      case 'emi': return 'text-expense';
      case 'skill': return 'text-skills';
      case 'review': return 'text-founder';
    }
  };

  const getPriorityColor = (priority: Reminder['priority']) => {
    switch (priority) {
      case 'high': return 'bg-expense/20 text-expense border-expense/30';
      case 'medium': return 'bg-founder/20 text-founder border-founder/30';
      case 'low': return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10">
          <Bell size={20} />
          {reminders.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-expense text-[10px] font-bold flex items-center justify-center text-white">
              {reminders.length > 9 ? '9+' : reminders.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[90vw] max-w-sm p-0">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <Bell size={18} className="text-founder" />
            Reminders
          </SheetTitle>
        </SheetHeader>
        <div className="p-4 space-y-3 max-h-[calc(100vh-120px)] overflow-y-auto">
          {reminders.length === 0 ? (
            <div className="text-center py-8">
              <Bell size={32} className="mx-auto text-muted-foreground mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">No pending reminders</p>
            </div>
          ) : (
            reminders.map((reminder) => {
              const Icon = getIcon(reminder.type);
              return (
                <div
                  key={reminder.id}
                  className={cn(
                    "p-3 rounded-lg border",
                    getPriorityColor(reminder.priority)
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-lg bg-background/50", getColor(reminder.type))}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{reminder.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{reminder.message}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {reminder.priority}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
