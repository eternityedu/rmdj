import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  getDay, 
  subMonths, 
  addMonths,
  isSameMonth,
  isToday,
  isFuture
} from 'date-fns';
import { getProductivityData, ProductivityEntry } from '@/lib/productivity';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface ProductivityHeatmapProps {
  onDateSelect?: (date: string) => void;
}

export function ProductivityHeatmap({ onDateSelect }: ProductivityHeatmapProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const productivityData = useMemo(() => getProductivityData(), []);

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  // Create placeholder cells for alignment
  const placeholders = Array(startDayOfWeek).fill(null);

  const getProductivityForDate = (date: Date): ProductivityEntry | null => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return productivityData.find(p => p.date === dateStr) || null;
  };

  const getColorClass = (productivity: number | null): string => {
    if (productivity === null) return 'bg-muted/30';
    if (productivity === 0) return 'bg-muted/50';
    if (productivity < 25) return 'bg-red-500/30';
    if (productivity < 50) return 'bg-orange-500/40';
    if (productivity < 75) return 'bg-yellow-500/50';
    if (productivity < 100) return 'bg-green-500/50';
    return 'bg-green-500/80';
  };

  const getStreakCount = (): number => {
    const today = format(new Date(), 'yyyy-MM-dd');
    let streak = 0;
    let currentDay = new Date();
    
    while (true) {
      const dateStr = format(currentDay, 'yyyy-MM-dd');
      const entry = productivityData.find(p => p.date === dateStr);
      
      if (entry && entry.productivityPercentage >= 50) {
        streak++;
        currentDay = subMonths(currentDay, 0);
        currentDay.setDate(currentDay.getDate() - 1);
      } else if (dateStr === today) {
        // Skip today if no data yet
        currentDay.setDate(currentDay.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  const getMonthStats = () => {
    const monthEntries = productivityData.filter(p => {
      const entryDate = new Date(p.date);
      return isSameMonth(entryDate, currentDate);
    });

    const totalDays = monthEntries.length;
    const avgProductivity = totalDays > 0 
      ? Math.round(monthEntries.reduce((sum, e) => sum + e.productivityPercentage, 0) / totalDays)
      : 0;
    const perfectDays = monthEntries.filter(e => e.productivityPercentage === 100).length;

    return { totalDays, avgProductivity, perfectDays };
  };

  const streak = getStreakCount();
  const monthStats = getMonthStats();

  return (
    <Card className="border-daily/20">
      <CardHeader className="pb-2 px-3 pt-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Flame size={16} className="text-orange-500" />
            Productivity
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToPreviousMonth}>
              <ChevronLeft size={14} />
            </Button>
            <span className="text-xs font-medium min-w-[90px] text-center">
              {format(currentDate, 'MMM yyyy')}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToNextMonth}>
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-lg font-bold text-daily">{streak}</p>
            <p className="text-[10px] text-muted-foreground">Day Streak</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-lg font-bold text-income">{monthStats.avgProductivity}%</p>
            <p className="text-[10px] text-muted-foreground">Avg This Month</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-lg font-bold text-founder">{monthStats.perfectDays}</p>
            <p className="text-[10px] text-muted-foreground">Perfect Days</p>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((day, i) => (
            <div key={i} className="text-[10px] text-muted-foreground text-center font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Placeholder cells */}
          {placeholders.map((_, i) => (
            <div key={`placeholder-${i}`} className="aspect-square" />
          ))}
          
          {/* Day cells */}
          {daysInMonth.map((day) => {
            const productivity = getProductivityForDate(day);
            const isTodayDate = isToday(day);
            const isFutureDate = isFuture(day);
            const dateStr = format(day, 'yyyy-MM-dd');
            
            return (
              <button
                key={dateStr}
                onClick={() => !isFutureDate && onDateSelect?.(dateStr)}
                disabled={isFutureDate}
                className={`
                  aspect-square rounded-md flex flex-col items-center justify-center text-[10px] transition-all
                  ${getColorClass(isFutureDate ? null : (productivity?.productivityPercentage ?? null))}
                  ${isTodayDate ? 'ring-2 ring-daily ring-offset-1 ring-offset-background' : ''}
                  ${isFutureDate ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105 active:scale-95 cursor-pointer'}
                `}
              >
                <span className="font-medium">{format(day, 'd')}</span>
                {productivity && !isFutureDate && (
                  <span className="text-[8px] opacity-75">
                    {productivity.completedTasks}/{productivity.totalTasks}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-1 mt-3 text-[10px] text-muted-foreground">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-muted/50" />
          <div className="w-3 h-3 rounded-sm bg-red-500/30" />
          <div className="w-3 h-3 rounded-sm bg-orange-500/40" />
          <div className="w-3 h-3 rounded-sm bg-yellow-500/50" />
          <div className="w-3 h-3 rounded-sm bg-green-500/50" />
          <div className="w-3 h-3 rounded-sm bg-green-500/80" />
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}
