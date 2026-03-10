import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Brain, Palette, Sparkles, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, label: 'מנתח את הבריף והאסטרטגיה', icon: Brain, duration: 3000 },
  { id: 2, label: 'שולף רפרנסים מותאמים מהמוח', icon: Sparkles, duration: 5000 },
  { id: 3, label: 'מייצר 3 כיווני קריאייטיב', icon: Palette, duration: 7000 },
];

export const AutopilotLoadingProgress = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let elapsed = 0;

    STEPS.forEach((step, index) => {
      timers.push(setTimeout(() => setCurrentStep(index), elapsed));
      elapsed += step.duration;
    });

    // Smooth progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return 92; // hold near end
        return prev + 0.5;
      });
    }, 100);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Progress bar */}
        <div className="space-y-3">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
        </div>

        {/* Steps */}
        <div className="space-y-4 text-right" dir="rtl">
          {STEPS.map((step, index) => {
            const isActive = currentStep === index;
            const isDone = currentStep > index;
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl transition-all duration-500',
                  isActive && 'bg-primary/10 scale-[1.02]',
                  isDone && 'opacity-60',
                  !isActive && !isDone && 'opacity-30'
                )}
              >
                <div className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                  isDone ? 'bg-emerald-500/20' : isActive ? 'bg-primary/20' : 'bg-muted'
                )}>
                  {isDone ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : isActive ? (
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <span className={cn(
                  'text-sm font-medium',
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
