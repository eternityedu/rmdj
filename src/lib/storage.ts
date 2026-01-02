import { WalletEntry, Expense, Investment, Income, Loan, IntellectualProperty, Skill, Note, Company, VisionItem, DailyOverview, WeeklyReview, DailyTask } from '@/types';

const STORAGE_KEYS = {
  wallet: 'rmdj_wallet',
  expenses: 'rmdj_expenses',
  investments: 'rmdj_investments',
  income: 'rmdj_income',
  loans: 'rmdj_loans',
  ip: 'rmdj_ip',
  skills: 'rmdj_skills',
  notes: 'rmdj_notes',
  companies: 'rmdj_companies',
  vision: 'rmdj_vision',
  dailyOverview: 'rmdj_daily_overview',
  weeklyReviews: 'rmdj_weekly_reviews',
  dailyTasks: 'rmdj_daily_tasks',
  tasks: 'rmdj_tasks', // Keep data but hide UI
  goals: 'rmdj_goals', // Keep data but hide UI
};

// Generic storage functions
function getFromStorage<T>(key: string, defaultValue: T[]): T[] {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to storage:', e);
  }
}

// Wallet
export const getWallet = (): WalletEntry[] => getFromStorage(STORAGE_KEYS.wallet, []);
export const saveWallet = (data: WalletEntry[]) => saveToStorage(STORAGE_KEYS.wallet, data);
export const addWalletEntry = (entry: WalletEntry) => {
  const wallet = getWallet();
  saveWallet([...wallet, entry]);
};

// Expenses
export const getExpenses = (): Expense[] => getFromStorage(STORAGE_KEYS.expenses, []);
export const saveExpenses = (data: Expense[]) => saveToStorage(STORAGE_KEYS.expenses, data);
export const addExpense = (expense: Expense) => {
  const expenses = getExpenses();
  saveExpenses([...expenses, expense]);
};
export const updateExpense = (id: string, expense: Partial<Expense>) => {
  const expenses = getExpenses();
  saveExpenses(expenses.map(e => e.id === id ? { ...e, ...expense } : e));
};
export const deleteExpense = (id: string) => {
  const expenses = getExpenses();
  saveExpenses(expenses.filter(e => e.id !== id));
};

// Investments
export const getInvestments = (): Investment[] => getFromStorage(STORAGE_KEYS.investments, []);
export const saveInvestments = (data: Investment[]) => saveToStorage(STORAGE_KEYS.investments, data);
export const addInvestment = (investment: Investment) => {
  const investments = getInvestments();
  saveInvestments([...investments, investment]);
};
export const updateInvestment = (id: string, investment: Partial<Investment>) => {
  const investments = getInvestments();
  saveInvestments(investments.map(i => i.id === id ? { ...i, ...investment } : i));
};
export const deleteInvestment = (id: string) => {
  const investments = getInvestments();
  saveInvestments(investments.filter(i => i.id !== id));
};

// Income
export const getIncomes = (): Income[] => getFromStorage(STORAGE_KEYS.income, []);
export const saveIncomes = (data: Income[]) => saveToStorage(STORAGE_KEYS.income, data);
export const addIncome = (income: Income) => {
  const incomes = getIncomes();
  saveIncomes([...incomes, income]);
};

// Loans
export const getLoans = (): Loan[] => getFromStorage(STORAGE_KEYS.loans, []);
export const saveLoans = (data: Loan[]) => saveToStorage(STORAGE_KEYS.loans, data);
export const addLoan = (loan: Loan) => {
  const loans = getLoans();
  saveLoans([...loans, loan]);
};
export const updateLoan = (id: string, loan: Partial<Loan>) => {
  const loans = getLoans();
  saveLoans(loans.map(l => l.id === id ? { ...l, ...loan } : l));
};

// Intellectual Property
export const getIPs = (): IntellectualProperty[] => getFromStorage(STORAGE_KEYS.ip, []);
export const saveIPs = (data: IntellectualProperty[]) => saveToStorage(STORAGE_KEYS.ip, data);
export const addIP = (ip: IntellectualProperty) => {
  const ips = getIPs();
  saveIPs([...ips, ip]);
};

// Skills
export const getSkills = (): Skill[] => getFromStorage(STORAGE_KEYS.skills, []);
export const saveSkills = (data: Skill[]) => saveToStorage(STORAGE_KEYS.skills, data);
export const addSkill = (skill: Skill) => {
  const skills = getSkills();
  saveSkills([...skills, skill]);
};
export const updateSkill = (id: string, skill: Partial<Skill>) => {
  const skills = getSkills();
  saveSkills(skills.map(s => s.id === id ? { ...s, ...skill } : s));
};

// Notes
export const getNotes = (): Note[] => getFromStorage(STORAGE_KEYS.notes, []);
export const saveNotes = (data: Note[]) => saveToStorage(STORAGE_KEYS.notes, data);
export const addNote = (note: Note) => {
  const notes = getNotes();
  saveNotes([...notes, note]);
};
export const updateNote = (id: string, note: Partial<Note>) => {
  const notes = getNotes();
  saveNotes(notes.map(n => n.id === id ? { ...n, ...note } : n));
};
export const deleteNote = (id: string) => {
  const notes = getNotes();
  saveNotes(notes.filter(n => n.id !== id));
};

// Companies
export const getCompanies = (): Company[] => getFromStorage(STORAGE_KEYS.companies, []);
export const saveCompanies = (data: Company[]) => saveToStorage(STORAGE_KEYS.companies, data);
export const addCompany = (company: Company) => {
  const companies = getCompanies();
  saveCompanies([...companies, company]);
};
export const updateCompany = (id: string, company: Partial<Company>) => {
  const companies = getCompanies();
  saveCompanies(companies.map(c => c.id === id ? { ...c, ...company } : c));
};

// Vision
export const getVision = (): VisionItem[] => getFromStorage(STORAGE_KEYS.vision, []);
export const saveVision = (data: VisionItem[]) => saveToStorage(STORAGE_KEYS.vision, data);
export const addVisionItem = (item: VisionItem) => {
  const vision = getVision();
  saveVision([...vision, item]);
};

// Daily Overview
export const getDailyOverviews = (): DailyOverview[] => getFromStorage(STORAGE_KEYS.dailyOverview, []);
export const saveDailyOverview = (overview: DailyOverview) => {
  const overviews = getDailyOverviews();
  const existing = overviews.findIndex(o => o.date === overview.date);
  if (existing >= 0) {
    overviews[existing] = overview;
  } else {
    overviews.push(overview);
  }
  saveToStorage(STORAGE_KEYS.dailyOverview, overviews);
};

// Weekly Reviews
export const getWeeklyReviews = (): WeeklyReview[] => getFromStorage(STORAGE_KEYS.weeklyReviews, []);
export const saveWeeklyReview = (review: WeeklyReview) => {
  const reviews = getWeeklyReviews();
  saveToStorage(STORAGE_KEYS.weeklyReviews, [...reviews, review]);
};

// Daily Tasks
export const getDailyTasks = (): DailyTask[] => getFromStorage(STORAGE_KEYS.dailyTasks, []);
export const saveDailyTasks = (data: DailyTask[]) => saveToStorage(STORAGE_KEYS.dailyTasks, data);
export const addDailyTask = (task: DailyTask) => {
  const tasks = getDailyTasks();
  saveDailyTasks([...tasks, task]);
};
export const toggleDailyTask = (id: string) => {
  const tasks = getDailyTasks();
  saveDailyTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
};

// Reset all data
export const resetAllData = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};

// Calculate net worth
export const calculateNetWorth = () => {
  const wallet = getWallet();
  const investments = getInvestments();
  const loans = getLoans();

  const walletBalance = wallet.reduce((acc, entry) => {
    return entry.type === 'added' ? acc + entry.amount : acc - entry.amount;
  }, 0);

  const investmentValue = investments.reduce((acc, inv) => {
    if (inv.type === 'stocks') {
      return acc + (inv.quantity || 0) * (inv.currentPrice || 0);
    }
    if (inv.type === 'property') {
      return acc + (inv.currentValue || 0);
    }
    if (inv.type === 'gold') {
      return acc + (inv.amountInvested || 0);
    }
    if (inv.type === 'sip') {
      return acc + (inv.monthlyAmount || 0) * 12;
    }
    return acc + (inv.amountInvested || inv.silverAmount || 0);
  }, 0);

  const totalLoans = loans.reduce((acc, loan) => acc + loan.remainingBalance, 0);

  return walletBalance + investmentValue - totalLoans;
};

// Generate ID
export const generateId = () => Math.random().toString(36).substr(2, 9);
