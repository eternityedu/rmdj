import { DailyTask } from '@/types';
import { format, parseISO, isWithinInterval } from 'date-fns';

export interface ProductivityEntry {
  date: string;
  totalTasks: number;
  completedTasks: number;
  productivityPercentage: number;
}

const STORAGE_KEY = 'rmdj_productivity';

// Get all productivity data
export function getProductivityData(): ProductivityEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save productivity data
export function saveProductivityData(data: ProductivityEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save productivity data:', e);
  }
}

// Get productivity for a specific date
export function getProductivityForDate(date: string): ProductivityEntry | null {
  const data = getProductivityData();
  return data.find(p => p.date === date) || null;
}

// Update or create productivity entry for a date
export function updateProductivityForDate(
  date: string, 
  totalTasks: number, 
  completedTasks: number
): void {
  const data = getProductivityData();
  const productivityPercentage = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100) 
    : 0;
  
  const existingIndex = data.findIndex(p => p.date === date);
  
  const entry: ProductivityEntry = {
    date,
    totalTasks,
    completedTasks,
    productivityPercentage
  };
  
  if (existingIndex >= 0) {
    data[existingIndex] = entry;
  } else {
    data.push(entry);
  }
  
  // Sort by date (newest first for easier access)
  data.sort((a, b) => b.date.localeCompare(a.date));
  
  saveProductivityData(data);
}

// Calculate and update productivity based on tasks for today
export function calculateAndSaveProductivity(tasks: DailyTask[], targetDate?: string): void {
  const date = targetDate || format(new Date(), 'yyyy-MM-dd');
  
  // Filter tasks that apply to this date
  const tasksForDate = tasks.filter(task => {
    // Everyday tasks always apply
    if (task.isEveryday) return true;
    
    // Tasks created on this exact date
    if (task.date === date) return true;
    
    // Tasks within their duration period
    if (task.startDate && task.endDate) {
      try {
        const start = parseISO(task.startDate);
        const end = parseISO(task.endDate);
        const targetDateObj = parseISO(date);
        return isWithinInterval(targetDateObj, { start, end });
      } catch {
        return false;
      }
    }
    
    return false;
  });
  
  const totalTasks = tasksForDate.length;
  const completedTasks = tasksForDate.filter(t => t.completed).length;
  
  updateProductivityForDate(date, totalTasks, completedTasks);
}

// Get productivity summary for a date range
export function getProductivitySummary(startDate: string, endDate: string): {
  totalDays: number;
  averageProductivity: number;
  perfectDays: number;
  zeroDays: number;
} {
  const data = getProductivityData();
  
  const relevantEntries = data.filter(entry => {
    return entry.date >= startDate && entry.date <= endDate;
  });
  
  const totalDays = relevantEntries.length;
  const averageProductivity = totalDays > 0
    ? Math.round(relevantEntries.reduce((sum, e) => sum + e.productivityPercentage, 0) / totalDays)
    : 0;
  const perfectDays = relevantEntries.filter(e => e.productivityPercentage === 100).length;
  const zeroDays = relevantEntries.filter(e => e.productivityPercentage === 0).length;
  
  return {
    totalDays,
    averageProductivity,
    perfectDays,
    zeroDays
  };
}
