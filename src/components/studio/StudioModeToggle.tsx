import { Wand2, Check, Lightbulb, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StudioMode = 'manual' | 'autopilot' | 'upload' | null;

interface StudioModeToggleProps {
  value: StudioMode;
  onChange: (mode: StudioMode) => void;
}

const OPTIONS = [
  {
    id: 'autopilot' as StudioMode,
    title: 'תכינו לי קמפיין מלא',
    description: 'אין לי חומרים — תבנו לי אסטרטגיה, קריאייטיב ותוכנית מדיה מההתחלה',
    Icon: Wand2,
    badge: 'מומלץ ✨',
  },
  {
    id: 'manual' as StudioMode,
    title: 'יש לי רעיון, אצטרך עזרה',
    description: 'אני יודע מה אני רוצה — אכתוב את הרעיון ואקבל עיצובים בהתאמה',
    Icon: Lightbulb,
    badge: null,
  },
  {
    id: 'upload' as StudioMode,
    title: 'יש לי חומרים מוכנים',
    description: 'יש לי ויז\'ואל ו/או קופי — רק צריך להעלות, להתאים ולהפיץ',
    Icon: Upload,
    badge: null,
  },
];

export const StudioModeToggle = ({ value, onChange }: StudioModeToggleProps) => {
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">מה יש לך מוכן?</h2>
        <p className="text-muted-foreground">בחר את נקודת ההתחלה שלך</p>
      </div>

      {/* Selection Cards */}
      <div className="flex flex-col gap-4">
        {OPTIONS.map(({ id, title, description, Icon, badge }) => {
          const isSelected = value === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={cn(
                "relative flex items-center gap-5 p-6 rounded-2xl border-2 transition-all duration-300 text-right group",
                isSelected
                  ? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20"
                  : "border-border bg-card hover:border-primary/50 hover:shadow-md"
              )}
            >
              {/* Icon */}
              <div className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-all",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
              )}>
                <Icon className="h-7 w-7" />
              </div>

              {/* Text */}
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}

              {/* Badge */}
              {badge && (
                <span className="absolute -top-3 right-6 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
