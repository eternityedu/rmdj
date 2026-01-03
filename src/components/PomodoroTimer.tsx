import { useState, useEffect, useCallback } from 'react';
import { X, Play, Pause, RotateCcw, Coffee, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { addPomodoroSession, generateId, getPomodoroSessions } from '@/lib/storage';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface PomodoroTimerProps {
  isOpen: boolean;
  onClose: () => void;
}

const WORK_DURATION = 25 * 60; // 25 minutes
const BREAK_DURATION = 5 * 60; // 5 minutes

export function PomodoroTimer({ isOpen, onClose }: PomodoroTimerProps) {
  const [seconds, setSeconds] = useState(WORK_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  
  const todaySessions = getPomodoroSessions().filter(
    s => s.type === 'work' && s.completed && s.startTime.startsWith(format(new Date(), 'yyyy-MM-dd'))
  );

  const playNotificationSound = useCallback(() => {
    // Create audio context for notification sound
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 500);
    } catch (e) {
      console.log('Audio notification not supported');
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isOpen && isRunning && seconds > 0) {
      interval = setInterval(() => setSeconds(s => s - 1), 1000);
    } else if (seconds === 0) {
      playNotificationSound();
      
      if (sessionStartTime) {
        addPomodoroSession({
          id: generateId(),
          startTime: sessionStartTime,
          endTime: new Date().toISOString(),
          type: isBreak ? 'break' : 'work',
          completed: true,
        });
      }
      
      if (!isBreak) {
        toast.success('Work session complete! Time for a 5-minute break.');
        setIsBreak(true);
        setSeconds(BREAK_DURATION);
        setSessionStartTime(new Date().toISOString());
      } else {
        toast.success('Break over! Ready for another work session?');
        setIsBreak(false);
        setSeconds(WORK_DURATION);
        setIsRunning(false);
        setSessionStartTime(null);
      }
    }
    
    return () => clearInterval(interval);
  }, [isOpen, isRunning, seconds, isBreak, sessionStartTime, playNotificationSound]);

  const handleStart = () => {
    if (!isRunning) {
      setSessionStartTime(new Date().toISOString());
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setSeconds(isBreak ? BREAK_DURATION : WORK_DURATION);
    setIsRunning(false);
    setSessionStartTime(null);
  };

  const handleSkip = () => {
    if (isBreak) {
      setIsBreak(false);
      setSeconds(WORK_DURATION);
    } else {
      setIsBreak(true);
      setSeconds(BREAK_DURATION);
    }
    setIsRunning(false);
    setSessionStartTime(null);
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = isBreak 
    ? ((BREAK_DURATION - seconds) / BREAK_DURATION) * 100 
    : ((WORK_DURATION - seconds) / WORK_DURATION) * 100;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center">
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 h-12 w-12"
        onClick={onClose}
      >
        <X size={24} />
      </Button>

      {/* Session counter */}
      <div className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 rounded-full bg-muted">
        <Timer size={16} className="text-founder" />
        <span className="text-sm font-medium">{todaySessions.length} sessions today</span>
      </div>

      {/* Mode icon */}
      <div className={`mb-8 p-6 rounded-full ${isBreak ? 'bg-income/10' : 'bg-founder/10'} animate-pulse`}>
        {isBreak ? (
          <Coffee size={48} className="text-income" />
        ) : (
          <Timer size={48} className="text-founder" />
        )}
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-foreground mb-2">
        {isBreak ? 'Break Time' : 'Focus Session'}
      </h1>
      <p className="text-muted-foreground mb-8">
        {isBreak ? 'Relax and recharge' : '25 minutes of focused work'}
      </p>

      {/* Progress ring background */}
      <div className="relative mb-8">
        <svg className="w-48 h-48 transform -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="88"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted"
          />
          <circle
            cx="96"
            cy="96"
            r="88"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={2 * Math.PI * 88}
            strokeDashoffset={2 * Math.PI * 88 * (1 - progress / 100)}
            className={isBreak ? 'text-income' : 'text-founder'}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-5xl font-bold mono ${isBreak ? 'text-income' : 'text-founder'}`}>
            {formatTime(seconds)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="lg"
          className="h-14 w-14 rounded-full"
          onClick={handleReset}
        >
          <RotateCcw size={24} />
        </Button>
        <Button
          size="lg"
          className={`h-20 w-20 rounded-full ${isRunning ? 'bg-expense hover:bg-expense/90' : isBreak ? 'bg-income hover:bg-income/90' : 'bg-founder hover:bg-founder/90'}`}
          onClick={isRunning ? handlePause : handleStart}
        >
          {isRunning ? <Pause size={32} /> : <Play size={32} />}
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-14 px-6 rounded-full"
          onClick={handleSkip}
        >
          Skip
        </Button>
      </div>

      {/* Current mode indicator */}
      <div className="mt-8 flex gap-4">
        <div className={`px-4 py-2 rounded-full ${!isBreak ? 'bg-founder/20 text-founder' : 'bg-muted text-muted-foreground'}`}>
          25 min work
        </div>
        <div className={`px-4 py-2 rounded-full ${isBreak ? 'bg-income/20 text-income' : 'bg-muted text-muted-foreground'}`}>
          5 min break
        </div>
      </div>

      {/* Motivational quote */}
      <p className="absolute bottom-8 text-sm text-muted-foreground italic text-center px-8">
        "The Pomodoro Technique helps you work with time, not against it." — Francesco Cirillo
      </p>
    </div>
  );
}
