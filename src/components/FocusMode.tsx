import { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, Focus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FocusModeProps {
  isOpen: boolean;
  onClose: () => void;
  initialSeconds?: number;
}

export function FocusMode({ isOpen, onClose, initialSeconds = 0 }: FocusModeProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && isRunning) {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, isRunning]);

  const formatTime = (s: number) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    setSeconds(0);
    setIsRunning(false);
  };

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

      {/* Focus icon */}
      <div className="mb-8 p-6 rounded-full bg-founder/10 animate-pulse">
        <Focus size={48} className="text-founder" />
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-foreground mb-2">Deep Work Session</h1>
      <p className="text-muted-foreground mb-12">Stay focused. Eliminate distractions.</p>

      {/* Timer */}
      <div className="text-7xl md:text-8xl font-bold mono text-founder mb-12 tracking-wider">
        {formatTime(seconds)}
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
          className={`h-20 w-20 rounded-full ${isRunning ? 'bg-expense hover:bg-expense/90' : 'bg-income hover:bg-income/90'}`}
          onClick={() => setIsRunning(!isRunning)}
        >
          {isRunning ? <Pause size={32} /> : <Play size={32} />}
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-14 px-6 rounded-full"
          onClick={onClose}
        >
          End Session
        </Button>
      </div>

      {/* Motivational quotes */}
      <p className="absolute bottom-8 text-sm text-muted-foreground italic text-center px-8">
        "The successful warrior is the average man, with laser-like focus." — Bruce Lee
      </p>
    </div>
  );
}
