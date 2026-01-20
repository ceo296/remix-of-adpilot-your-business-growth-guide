import { Lightbulb, Sparkles, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StudioMode = 'manual' | 'autopilot' | null;

interface StudioModeToggleProps {
  value: StudioMode;
  onChange: (mode: StudioMode) => void;
}

export const StudioModeToggle = ({ value, onChange }: StudioModeToggleProps) => {
  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">איך נתחיל?</h2>
        <p className="text-muted-foreground">
          בחר את הדרך המתאימה לך ליצירת הקמפיין
        </p>
      </div>

      {/* Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Manual Option */}
        <button
          onClick={() => onChange('manual')}
          className={cn(
            "relative flex flex-col items-center p-8 rounded-2xl border-2 transition-all duration-300 text-center group",
            value === 'manual'
              ? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20"
              : "border-border bg-card hover:border-primary/50 hover:shadow-md"
          )}
        >
          {/* Icon */}
          <div className={cn(
            "w-20 h-20 rounded-2xl flex items-center justify-center mb-5 transition-all",
            value === 'manual'
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
          )}>
            <Lightbulb className="h-10 w-10" />
          </div>
          
          {/* Title */}
          <h3 className="text-xl font-bold mb-3">יש לי רעיון</h3>
          
          {/* Description */}
          <p className="text-muted-foreground text-sm leading-relaxed">
            אני יודע מה אני רוצה - אכתוב את הרעיון שלי ואקבל עיצובים בהתאמה
          </p>

          {/* Selected indicator */}
          {value === 'manual' && (
            <div className="absolute top-4 left-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <ArrowLeft className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
        </button>

        {/* Autopilot Option */}
        <button
          onClick={() => onChange('autopilot')}
          className={cn(
            "relative flex flex-col items-center p-8 rounded-2xl border-2 transition-all duration-300 text-center group",
            value === 'autopilot'
              ? "border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg ring-2 ring-primary/20"
              : "border-border bg-card hover:border-primary/50 hover:shadow-md"
          )}
        >
          {/* Icon */}
          <div className={cn(
            "w-20 h-20 rounded-2xl flex items-center justify-center mb-5 transition-all",
            value === 'autopilot'
              ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
              : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
          )}>
            <Sparkles className="h-10 w-10" />
          </div>
          
          {/* Title */}
          <h3 className="text-xl font-bold mb-3">תפתיעו אותי</h3>
          
          {/* Description */}
          <p className="text-muted-foreground text-sm leading-relaxed">
            אין לי רעיון ספציפי - תנו ל-AI ליצור קונספטים מותאמים אישית על סמך המותג שלי
          </p>

          {/* Selected indicator */}
          {value === 'autopilot' && (
            <div className="absolute top-4 left-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <ArrowLeft className="h-4 w-4 text-primary-foreground" />
            </div>
          )}

          {/* Badge */}
          <span className="absolute -top-3 right-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
            מומלץ ✨
          </span>
        </button>
      </div>
    </div>
  );
};
