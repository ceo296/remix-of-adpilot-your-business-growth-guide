import { PenTool, Wand2, Check } from 'lucide-react';
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
              ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/30"
              : "bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600 group-hover:from-amber-200 group-hover:to-orange-200"
          )}>
            <PenTool className="h-10 w-10" />
          </div>
          
          {/* Title */}
          <h3 className="text-xl font-bold mb-3">יש לי רעיון</h3>
          
          {/* Description */}
          <p className="text-muted-foreground text-sm leading-relaxed">
            אני יודע מה אני רוצה - אכתוב את הרעיון שלי ואקבל עיצובים בהתאמה
          </p>

          {/* Selected indicator */}
          {value === 'manual' && (
            <div className="absolute top-4 left-4 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="h-4 w-4 text-white" />
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
              ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-purple-500/30"
              : "bg-gradient-to-br from-violet-100 to-purple-100 text-violet-600 group-hover:from-violet-200 group-hover:to-purple-200"
          )}>
            <Wand2 className="h-10 w-10" />
          </div>
          
          {/* Title */}
          <h3 className="text-xl font-bold mb-3">תפתיעו אותי</h3>
          
          {/* Description */}
          <p className="text-muted-foreground text-sm leading-relaxed">
            אין לי רעיון ספציפי - תיצרו לי אתם קונספטים מותאמים אישית על סמך המותג שלי
          </p>

          {/* Selected indicator */}
          {value === 'autopilot' && (
            <div className="absolute top-4 left-4 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="h-4 w-4 text-white" />
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
