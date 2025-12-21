import { Lightbulb, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StudioMode = 'manual' | 'autopilot';

interface StudioModeToggleProps {
  value: StudioMode;
  onChange: (mode: StudioMode) => void;
}

export const StudioModeToggle = ({ value, onChange }: StudioModeToggleProps) => {
  return (
    <div className="flex gap-2 p-1 bg-muted rounded-xl">
      <button
        onClick={() => onChange('manual')}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium transition-all",
          value === 'manual'
            ? "bg-background shadow-md text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Lightbulb className="h-5 w-5" />
        <span>יש לי רעיון</span>
      </button>
      <button
        onClick={() => onChange('autopilot')}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium transition-all",
          value === 'autopilot'
            ? "bg-gradient-to-l from-primary to-primary/80 shadow-md text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Sparkles className="h-5 w-5" />
        <span>תפתיעו אותי</span>
      </button>
    </div>
  );
};
