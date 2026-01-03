import { getInvestments, getLoans, getSkills, getWeeklyReviews, getDailyOverviews } from './storage';
import { differenceInDays, parseISO, startOfWeek, format, isToday } from 'date-fns';

export interface Reminder {
  id: string;
  type: 'sip' | 'emi' | 'skill' | 'review' | 'daily';
  title: string;
  message: string;
  dueDate?: string;
  priority: 'high' | 'medium' | 'low';
}

export function getReminders(): Reminder[] {
  const reminders: Reminder[] = [];
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // SIP Due Reminders - persistent check
  const investments = getInvestments();
  investments.forEach(inv => {
    if (inv.type === 'sip' && inv.nextSipDate) {
      const dueDate = parseISO(inv.nextSipDate);
      const daysUntil = differenceInDays(dueDate, today);
      // Show reminders from 7 days before to 7 days after due date
      if (daysUntil <= 7 && daysUntil >= -7) {
        reminders.push({
          id: `sip-${inv.id}`,
          type: 'sip',
          title: 'SIP Due',
          message: daysUntil === 0 
            ? `${inv.name} SIP due today!` 
            : daysUntil < 0 
              ? `${inv.name} SIP overdue by ${Math.abs(daysUntil)} days!` 
              : `${inv.name} SIP due in ${daysUntil} days`,
          dueDate: inv.nextSipDate,
          priority: daysUntil <= 0 ? 'high' : daysUntil <= 3 ? 'medium' : 'low',
        });
      }
    }
  });

  // EMI Payment Reminders - persistent, check every day
  const loans = getLoans();
  loans.forEach(loan => {
    if (loan.dueDate && loan.remainingBalance > 0) {
      const dueDay = parseInt(loan.dueDate);
      const currentDay = today.getDate();
      let daysUntil = dueDay - currentDay;
      
      // Handle month wrap-around
      if (daysUntil < -15) daysUntil += 30; // Next month's due date
      if (daysUntil > 15) daysUntil -= 30; // Last month's due date
      
      // Show reminders from 7 days before to 7 days after
      if (daysUntil <= 7 && daysUntil >= -7) {
        reminders.push({
          id: `emi-${loan.id}`,
          type: 'emi',
          title: 'EMI Payment',
          message: daysUntil === 0 
            ? `${loan.type} EMI (₹${loan.emi.toLocaleString()}) due today!` 
            : daysUntil < 0 
              ? `${loan.type} EMI overdue by ${Math.abs(daysUntil)} days!` 
              : `${loan.type} EMI due in ${daysUntil} days`,
          dueDate: loan.dueDate,
          priority: daysUntil <= 0 ? 'high' : daysUntil <= 3 ? 'medium' : 'low',
        });
      }
    }
  });

  // Skill Inactivity Reminders - daily persistent reminder
  const skills = getSkills();
  skills.forEach(skill => {
    if (skill.isCurrentlyLearning && skill.lastUpdated) {
      const lastUpdate = parseISO(skill.lastUpdated);
      const daysSince = differenceInDays(today, lastUpdate);
      // Remind every day if inactive for 3+ days
      if (daysSince >= 3) {
        reminders.push({
          id: `skill-${skill.id}`,
          type: 'skill',
          title: 'Skill Inactive',
          message: `Haven't practiced ${skill.name} in ${daysSince} days. Time to learn!`,
          priority: daysSince >= 7 ? 'high' : 'medium',
        });
      }
    }
  });

  // Weekly Review Reminder - show on weekends until completed
  const weeklyReviews = getWeeklyReviews();
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const hasReviewThisWeek = weeklyReviews.some(r => r.weekStart === weekStart);
  const dayOfWeek = today.getDay();
  
  // Remind on Friday, Saturday, Sunday if not done
  if (!hasReviewThisWeek && (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6)) {
    reminders.push({
      id: 'weekly-review',
      type: 'review',
      title: 'Weekly Review',
      message: dayOfWeek === 0 
        ? 'Last day to complete your weekly review!' 
        : 'Time for your weekly review',
      priority: dayOfWeek === 0 ? 'high' : 'medium',
    });
  }

  // Daily Overview Reminder - remind if today's overview not filled
  const dailyOverviews = getDailyOverviews();
  const hasTodayOverview = dailyOverviews.some(o => o.date === todayStr);
  const currentHour = today.getHours();
  
  // Remind after 6 PM if not filled
  if (!hasTodayOverview && currentHour >= 18) {
    reminders.push({
      id: 'daily-overview',
      type: 'daily',
      title: 'Daily Overview',
      message: 'Fill in your daily overview before the day ends!',
      priority: currentHour >= 21 ? 'high' : 'medium',
    });
  }

  return reminders.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}
