import { getInvestments, getLoans, getSkills, getWeeklyReviews } from './storage';
import { differenceInDays, parseISO, startOfWeek, endOfWeek, format } from 'date-fns';

export interface Reminder {
  id: string;
  type: 'sip' | 'emi' | 'skill' | 'review';
  title: string;
  message: string;
  dueDate?: string;
  priority: 'high' | 'medium' | 'low';
}

export function getReminders(): Reminder[] {
  const reminders: Reminder[] = [];
  const today = new Date();

  // SIP Due Reminders
  const investments = getInvestments();
  investments.forEach(inv => {
    if (inv.type === 'sip' && inv.nextSipDate) {
      const dueDate = parseISO(inv.nextSipDate);
      const daysUntil = differenceInDays(dueDate, today);
      if (daysUntil <= 3 && daysUntil >= -1) {
        reminders.push({
          id: `sip-${inv.id}`,
          type: 'sip',
          title: 'SIP Due',
          message: daysUntil === 0 ? `${inv.name} SIP due today` : daysUntil < 0 ? `${inv.name} SIP overdue` : `${inv.name} SIP due in ${daysUntil} days`,
          dueDate: inv.nextSipDate,
          priority: daysUntil <= 0 ? 'high' : 'medium',
        });
      }
    }
  });

  // EMI Payment Reminders
  const loans = getLoans();
  loans.forEach(loan => {
    if (loan.dueDate && loan.remainingBalance > 0) {
      const dueDay = parseInt(loan.dueDate);
      const currentDay = today.getDate();
      const daysUntil = dueDay - currentDay;
      
      if (daysUntil <= 7 && daysUntil >= -3) {
        reminders.push({
          id: `emi-${loan.id}`,
          type: 'emi',
          title: 'EMI Payment',
          message: daysUntil === 0 ? `${loan.type} EMI due today` : daysUntil < 0 ? `${loan.type} EMI overdue` : `${loan.type} EMI due in ${daysUntil} days`,
          dueDate: loan.dueDate,
          priority: daysUntil <= 0 ? 'high' : daysUntil <= 3 ? 'medium' : 'low',
        });
      }
    }
  });

  // Skill Inactivity Reminders
  const skills = getSkills();
  skills.forEach(skill => {
    if (skill.isCurrentlyLearning && skill.lastUpdated) {
      const lastUpdate = parseISO(skill.lastUpdated);
      const daysSince = differenceInDays(today, lastUpdate);
      if (daysSince >= 3) {
        reminders.push({
          id: `skill-${skill.id}`,
          type: 'skill',
          title: 'Skill Inactive',
          message: `Haven't practiced ${skill.name} in ${daysSince} days`,
          priority: daysSince >= 7 ? 'high' : 'medium',
        });
      }
    }
  });

  // Weekly Review Reminder
  const weeklyReviews = getWeeklyReviews();
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const hasReviewThisWeek = weeklyReviews.some(r => r.weekStart === weekStart);
  const dayOfWeek = today.getDay();
  
  if (!hasReviewThisWeek && (dayOfWeek === 0 || dayOfWeek === 6)) {
    reminders.push({
      id: 'weekly-review',
      type: 'review',
      title: 'Weekly Review',
      message: 'Time for your weekly review',
      priority: 'medium',
    });
  }

  return reminders.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}
