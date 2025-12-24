import { Check } from 'lucide-react';

export type StyleChoice = 'naki' | 'boet' | 'classic' | 'modern';

interface StyleOption {
  id: StyleChoice;
  label: string;
  subtitle: string;
  description: string;
  gradient: string;
  iconBg: string;
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'boet',
    label: 'בועט',
    subtitle: 'Bold & Impactful',
    description: 'ניגודיות גבוהה, טקסט עבה, אנרגיה מכירתית',
    gradient: 'from-rose-500 via-red-500 to-orange-500',
    iconBg: 'bg-gradient-to-br from-rose-500 to-red-600',
  },
  {
    id: 'naki',
    label: 'נקי',
    subtitle: 'Clean & Minimal',
    description: 'רווח לבן, פונטים דקים, אלגנטיות שקטה',
    gradient: 'from-slate-400 via-slate-300 to-zinc-200',
    iconBg: 'bg-gradient-to-br from-slate-400 to-zinc-500',
  },
  {
    id: 'modern',
    label: 'מודרני',
    subtitle: 'Soft & Warm',
    description: 'תאורה רכה, אווירה נעימה, מראה עדכני',
    gradient: 'from-pink-400 via-purple-300 to-indigo-300',
    iconBg: 'bg-gradient-to-br from-pink-400 to-purple-500',
  },
  {
    id: 'classic',
    label: 'קלאסי',
    subtitle: 'Rich & Premium',
    description: 'טקסטורות עשירות, מראה מכובד, תחושת יוקרה',
    gradient: 'from-amber-400 via-yellow-500 to-orange-400',
    iconBg: 'bg-gradient-to-br from-amber-500 to-yellow-600',
  },
];

interface StudioStyleStepProps {
  value: StyleChoice | null;
  onChange: (style: StyleChoice) => void;
}

export const StudioStyleStep = ({ value, onChange }: StudioStyleStepProps) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-3 bg-gradient-to-l from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
          בחר את הסגנון שמדבר אליך
        </h2>
        <p className="text-muted-foreground text-lg">
          הסגנון העיצובי שייצור את הרושם הנכון
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
        {STYLE_OPTIONS.map((style) => {
          const isSelected = value === style.id;
          
          return (
            <button
              key={style.id}
              onClick={() => onChange(style.id)}
              className={`
                group relative overflow-hidden rounded-2xl p-[2px] transition-all duration-300
                ${isSelected 
                  ? 'bg-gradient-to-r ' + style.gradient + ' shadow-xl scale-[1.02]' 
                  : 'bg-border hover:bg-gradient-to-r hover:' + style.gradient + ' hover:shadow-lg'
                }
              `}
            >
              <div className={`
                relative h-full rounded-[14px] bg-card p-5 text-right transition-all
                ${isSelected ? 'bg-card/95' : 'group-hover:bg-card/95'}
              `}>
                {/* Selection indicator */}
                {isSelected && (
                  <div className={`absolute top-4 left-4 w-6 h-6 rounded-full ${style.iconBg} flex items-center justify-center shadow-lg animate-scale-in`}>
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </div>
                )}
                
                {/* Gradient bar */}
                <div className={`absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b ${style.gradient} rounded-l-full opacity-80`} />
                
                <div className="pr-4">
                  <div className="flex items-baseline gap-2 mb-1">
                    <h3 className="text-xl font-bold">{style.label}</h3>
                    <span className="text-xs text-muted-foreground font-medium tracking-wide">
                      {style.subtitle}
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {style.description}
                  </p>
                </div>
                
                {/* Hover gradient overlay */}
                <div className={`
                  absolute inset-0 rounded-[14px] bg-gradient-to-r ${style.gradient} opacity-0 
                  group-hover:opacity-5 transition-opacity pointer-events-none
                `} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
