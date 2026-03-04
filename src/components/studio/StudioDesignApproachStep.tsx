import { Check, Palette, Grid3X3, Sparkles, Unlock } from 'lucide-react';

export type DesignApproach = 'brand-follower' | 'visual-refresh' | 'structural-flex' | 'creative-freedom';

interface ApproachOption {
  id: DesignApproach;
  label: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
}

const APPROACH_OPTIONS: ApproachOption[] = [
  {
    id: 'brand-follower',
    label: 'המשכיות מלאה',
    subtitle: 'Brand Follower',
    description: 'שומרים על הגריד והשפה העיצובית הקיימת — אותו מבנה, אותו סגנון',
    icon: <Grid3X3 className="w-5 h-5" />,
    gradient: 'from-emerald-500 via-green-500 to-teal-500',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
  },
  {
    id: 'visual-refresh',
    label: 'רענון ויזואלי',
    subtitle: 'Visual Refresh',
    description: 'שפה עיצובית חדשה אבל אותו מבנה גריד — מראה חדש, מבנה מוכר',
    icon: <Palette className="w-5 h-5" />,
    gradient: 'from-blue-500 via-indigo-500 to-purple-500',
    iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
  },
  {
    id: 'structural-flex',
    label: 'גמישות מבנית',
    subtitle: 'Structural Flexibility',
    description: 'שומרים על ה-DNA המותגי (צבעים, פונטים) אבל עם מבנה גריד חדש',
    icon: <Sparkles className="w-5 h-5" />,
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
  },
  {
    id: 'creative-freedom',
    label: 'חופש יצירתי',
    subtitle: 'Creative Freedom',
    description: 'חופש מלא — ה-AI יוצר עיצוב חדש לחלוטין, מבנה וסגנון',
    icon: <Unlock className="w-5 h-5" />,
    gradient: 'from-pink-500 via-rose-500 to-red-500',
    iconBg: 'bg-gradient-to-br from-pink-500 to-rose-600',
  },
];

interface StudioDesignApproachStepProps {
  value: DesignApproach | null;
  onChange: (approach: DesignApproach) => void;
  hasPastMaterials: boolean;
}

export const StudioDesignApproachStep = ({ value, onChange, hasPastMaterials }: StudioDesignApproachStepProps) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-3 bg-gradient-to-l from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
          איך נעצב את הקמפיין?
        </h2>
        <p className="text-muted-foreground text-lg">
          {hasPastMaterials
            ? 'בחר את מידת ההיצמדות לעיצובים הקיימים שלך'
            : 'בחר את הגישה העיצובית לקמפיין החדש'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
        {APPROACH_OPTIONS.map((approach) => {
          const isSelected = value === approach.id;
          // If no past materials, disable brand-follower and visual-refresh
          const isDisabled = !hasPastMaterials && (approach.id === 'brand-follower' || approach.id === 'visual-refresh');
          
          return (
            <button
              key={approach.id}
              onClick={() => !isDisabled && onChange(approach.id)}
              disabled={isDisabled}
              className={`
                group relative overflow-hidden rounded-2xl p-[2px] transition-all duration-300
                ${isDisabled
                  ? 'opacity-40 cursor-not-allowed bg-border'
                  : isSelected 
                    ? 'bg-gradient-to-r ' + approach.gradient + ' shadow-xl scale-[1.02]' 
                    : 'bg-border hover:bg-gradient-to-r hover:' + approach.gradient + ' hover:shadow-lg'
                }
              `}
            >
              <div className={`
                relative h-full rounded-[14px] bg-card p-5 text-right transition-all
                ${isSelected ? 'bg-card/95' : 'group-hover:bg-card/95'}
              `}>
                {isSelected && (
                  <div className={`absolute top-4 left-4 w-6 h-6 rounded-full ${approach.iconBg} flex items-center justify-center shadow-lg animate-scale-in`}>
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </div>
                )}
                
                {/* Icon */}
                <div className={`absolute top-4 right-4 w-8 h-8 rounded-lg ${approach.iconBg} flex items-center justify-center text-white opacity-80`}>
                  {approach.icon}
                </div>
                
                <div className="pr-12 pt-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <h3 className="text-xl font-bold">{approach.label}</h3>
                    <span className="text-xs text-muted-foreground font-medium tracking-wide">
                      {approach.subtitle}
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {approach.description}
                  </p>
                  
                  {isDisabled && (
                    <p className="text-xs text-destructive mt-2">
                      דורש חומרי עבר מנותחים
                    </p>
                  )}
                </div>
                
                <div className={`
                  absolute inset-0 rounded-[14px] bg-gradient-to-r ${approach.gradient} opacity-0 
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
