// Wallet & Money Types
export interface WalletEntry {
  id: string;
  type: 'added' | 'spent';
  source: 'rental' | 'savings' | 'profit' | 'bond' | 'salary' | 'business' | 'other';
  amount: number;
  date: string;
  description: string;
  category?: string;
}

export interface Expense {
  id: string;
  category: string;
  tags: string[];
  amount: number;
  date: string;
  type: 'one-time' | 'recurring';
  isRecurring: boolean;
  includesGST: boolean;
  description: string;
}

export interface Investment {
  id: string;
  type: 'sip' | 'gold' | 'silver' | 'property' | 'stocks' | 'crypto';
  name: string;
  // SIP/Mutual Funds
  monthlyAmount?: number;
  expectedReturn?: number;
  nextSipDate?: string;
  // Gold
  quantityGrams?: number;
  amountInvested?: number;
  profitBooked?: number;
  // Silver
  silverAmount?: number;
  silverGrowth?: number;
  // Property
  location?: string;
  buyValue?: number;
  currentValue?: number;
  rentalIncome?: number;
  // Stocks
  buyPrice?: number;
  quantity?: number;
  currentPrice?: number;
  // Crypto
  cryptoName?: string;
  cryptoQuantity?: number;
  cryptoBuyPrice?: number;
  cryptoCurrentPrice?: number;
  createdAt: string;
}

export interface Income {
  id: string;
  source: 'business' | 'salary' | 'rental' | 'youtube' | 'other';
  amount: number;
  date: string;
  description: string;
}

export interface Loan {
  id: string;
  type: string;
  principal: number;
  interestRate: number;
  emi: number;
  dueDate: string;
  startDate: string;
  remainingBalance: number;
  totalPaid: number;
}

export interface IntellectualProperty {
  id: string;
  name: string;
  purpose: string;
  marketValue: number;
  costToBuy: number;
  createdAt: string;
}

// Skills Types
export interface Skill {
  id: string;
  name: string;
  category: 'robotics' | 'automation' | 'coding' | 'ai-ml' | 'math' | 'physics' | 'chemistry' | 'business' | 'communication';
  level: number; // 0-100
  timeSpentToday: number; // minutes
  totalHours: number;
  tags: string[];
  notes: string;
  resourceLink?: string;
  isCurrentlyLearning: boolean;
  weeklyHours: number[];
  lastUpdated: string;
}

// Founder Types
export interface VisionItem {
  id: string;
  title: string;
  description: string;
  category: 'mit' | 'sids' | 'rmdj' | 'personal';
  deadline?: string;
  progress: number;
}

export interface DailyOverview {
  date: string;
  studyTime: number;
  companyProgress: string;
  healthScore: number;
  notes: string;
  disciplineScore: number;
}

export interface WeeklyReview {
  id: string;
  weekStart: string;
  weekEnd: string;
  wins: string[];
  challenges: string[];
  improvements: string[];
  nextWeekGoals: string[];
}

// Notes Types
export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  keywords: string[];
  category: string;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
}

// Daily Types
export interface DailyTask {
  id: string;
  title: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  category: string;
  date: string;
}

// Companies Types
export interface Company {
  id: string;
  name: string;
  description: string;
  status: 'idea' | 'planning' | 'building' | 'launched' | 'scaling';
  revenue: number;
  expenses: number;
  notes: string;
  createdAt: string;
}

// Reminder Types
export interface Reminder {
  id: string;
  type: 'sip' | 'emi' | 'skill' | 'review';
  title: string;
  dueDate: string;
  isRead: boolean;
}

// Insight Types
export interface Insight {
  id: string;
  type: 'spending' | 'investment' | 'skill' | 'wallet';
  message: string;
  trend: 'up' | 'down' | 'neutral';
  createdAt: string;
}
