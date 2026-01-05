import { WalletEntry, Expense, Investment, Income, Loan, IntellectualProperty, Skill, Note, Company, VisionItem, DailyOverview, WeeklyReview, DailyTask, SkillTask, PomodoroSession, AppSettings, NetWorthLog } from '@/types';

const STORAGE_KEYS = {
  wallet: 'rmdj_wallet',
  expenses: 'rmdj_expenses',
  investments: 'rmdj_investments',
  income: 'rmdj_income',
  loans: 'rmdj_loans',
  ip: 'rmdj_ip',
  skills: 'rmdj_skills',
  skillTasks: 'rmdj_skill_tasks',
  notes: 'rmdj_notes',
  companies: 'rmdj_companies',
  vision: 'rmdj_vision',
  dailyOverview: 'rmdj_daily_overview',
  weeklyReviews: 'rmdj_weekly_reviews',
  dailyTasks: 'rmdj_daily_tasks',
  pomodoroSessions: 'rmdj_pomodoro_sessions',
  settings: 'rmdj_settings',
  tasks: 'rmdj_tasks',
  goals: 'rmdj_goals',
  netWorthLog: 'rmdj_net_worth_log',
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

function getObjectFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveObjectToStorage<T>(key: string, data: T): void {
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

// Skill Tasks
export const getSkillTasks = (): SkillTask[] => getFromStorage(STORAGE_KEYS.skillTasks, []);
export const saveSkillTasks = (data: SkillTask[]) => saveToStorage(STORAGE_KEYS.skillTasks, data);
export const addSkillTask = (task: SkillTask) => {
  const tasks = getSkillTasks();
  saveSkillTasks([...tasks, task]);
};
export const toggleSkillTask = (id: string) => {
  const tasks = getSkillTasks();
  saveSkillTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
};
export const deleteSkillTask = (id: string) => {
  const tasks = getSkillTasks();
  saveSkillTasks(tasks.filter(t => t.id !== id));
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
export const updateVisionItem = (id: string, item: Partial<VisionItem>) => {
  const vision = getVision();
  saveVision(vision.map(v => v.id === id ? { ...v, ...item } : v));
};

// Daily Overview - Persistent storage by date
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
export const getDailyOverviewByDate = (date: string): DailyOverview | null => {
  const overviews = getDailyOverviews();
  return overviews.find(o => o.date === date) || null;
};

// Weekly Reviews - Persistent storage by week
export const getWeeklyReviews = (): WeeklyReview[] => getFromStorage(STORAGE_KEYS.weeklyReviews, []);
export const saveWeeklyReview = (review: WeeklyReview) => {
  const reviews = getWeeklyReviews();
  const existing = reviews.findIndex(r => r.weekStart === review.weekStart);
  if (existing >= 0) {
    reviews[existing] = review;
  } else {
    reviews.push(review);
  }
  saveToStorage(STORAGE_KEYS.weeklyReviews, reviews);
};
export const getWeeklyReviewByWeek = (weekStart: string): WeeklyReview | null => {
  const reviews = getWeeklyReviews();
  return reviews.find(r => r.weekStart === weekStart) || null;
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
export const deleteDailyTask = (id: string) => {
  const tasks = getDailyTasks();
  saveDailyTasks(tasks.filter(t => t.id !== id));
};

// Pomodoro Sessions
export const getPomodoroSessions = (): PomodoroSession[] => getFromStorage(STORAGE_KEYS.pomodoroSessions, []);
export const savePomodoroSessions = (data: PomodoroSession[]) => saveToStorage(STORAGE_KEYS.pomodoroSessions, data);
export const addPomodoroSession = (session: PomodoroSession) => {
  const sessions = getPomodoroSessions();
  savePomodoroSessions([...sessions, session]);
};

// Settings
const defaultSettings: AppSettings = {
  otherCategoryName: 'Other',
};
export const getSettings = (): AppSettings => getObjectFromStorage(STORAGE_KEYS.settings, defaultSettings);
export const saveSettings = (settings: AppSettings) => saveObjectToStorage(STORAGE_KEYS.settings, settings);

// Net Worth Log
export const getNetWorthLog = (): NetWorthLog[] => getFromStorage(STORAGE_KEYS.netWorthLog, []);
export const saveNetWorthLog = (data: NetWorthLog[]) => saveToStorage(STORAGE_KEYS.netWorthLog, data);
export const addNetWorthLogEntry = (entry: NetWorthLog) => {
  const log = getNetWorthLog();
  saveNetWorthLog([...log, entry]);
};

// Reset all data
export const resetAllData = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};

// Calculate net worth - total money added minus all expenses and investment costs
export const calculateNetWorth = () => {
  const wallet = getWallet();
  const expenses = getExpenses();
  const investments = getInvestments();
  const ips = getIPs();
  const loans = getLoans();

  // Total money added to wallet
  const walletAdded = wallet
    .filter(w => w.type === 'added')
    .reduce((acc, w) => acc + w.amount, 0);

  // Total spent from wallet entries
  const walletSpent = wallet
    .filter(w => w.type === 'spent')
    .reduce((acc, w) => acc + w.amount, 0);

  // Total expenses
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

  // Total investment costs (money put into investments)
  const totalInvestmentCosts = investments.reduce((acc, inv) => {
    switch (inv.type) {
      case 'stocks': return acc + (inv.quantity || 0) * (inv.buyPrice || 0);
      case 'property': return acc + (inv.buyValue || 0);
      case 'crypto': return acc + (inv.cryptoQuantity || 0) * (inv.cryptoBuyPrice || 0);
      case 'gold': return acc + (inv.amountInvested || 0);
      case 'silver': return acc + (inv.silverAmount || 0);
      case 'sip': return acc + (inv.monthlyAmount || 0) * 12;
      default: return acc;
    }
  }, 0);

  // Total IP costs
  const totalIPCosts = ips.reduce((acc, ip) => acc + ip.costToBuy, 0);

  // Total loan remaining
  const totalLoans = loans.reduce((acc, loan) => acc + loan.remainingBalance, 0);

  // Net Worth = Total Added - Wallet Spent - Expenses - Investment Costs - IP Costs - Loans
  return walletAdded - walletSpent - totalExpenses - totalInvestmentCosts - totalIPCosts - totalLoans;
};

// Get investment current value (not cost)
export const getInvestmentCurrentValue = () => {
  const investments = getInvestments();
  return investments.reduce((acc, inv) => {
    switch (inv.type) {
      case 'stocks': return acc + (inv.quantity || 0) * (inv.currentPrice || 0);
      case 'property': return acc + (inv.currentValue || 0);
      case 'crypto': return acc + (inv.cryptoQuantity || 0) * (inv.cryptoCurrentPrice || 0);
      case 'gold': return acc + (inv.amountInvested || 0);
      case 'silver': return acc + (inv.silverAmount || 0);
      case 'sip': return acc + (inv.monthlyAmount || 0) * 12;
      default: return acc;
    }
  }, 0);
};

// Update daily task
export const updateDailyTask = (id: string, task: Partial<DailyTask>) => {
  const tasks = getDailyTasks();
  saveDailyTasks(tasks.map(t => t.id === id ? { ...t, ...task } : t));
};

// Generate ID
export const generateId = () => Math.random().toString(36).substr(2, 9);
