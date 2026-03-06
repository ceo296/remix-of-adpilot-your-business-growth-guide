import { useState } from 'react';
import { Check, Palette, Grid3X3, Sparkles, Unlock, X, ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type DesignApproach = 'brand-follower' | 'visual-refresh' | 'structural-flex' | 'creative-freedom';

interface ApproachOption {
  id: DesignApproach;
  label: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  tint: string;
  borderTint: string;
  requiresPastMaterials: boolean;
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
    tint: 'bg-emerald-500/8',
    borderTint: 'border-emerald-500/30 hover:border-emerald-400/60',
    requiresPastMaterials: true,
  },
  {
    id: 'visual-refresh',
    label: 'רענון ויזואלי',
    subtitle: 'Visual Refresh',
    description: 'שפה עיצובית חדשה אבל אותו מבנה גריד — מראה חדש, מבנה מוכר',
    icon: <Palette className="w-5 h-5" />,
    gradient: 'from-blue-500 via-indigo-500 to-purple-500',
    iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    tint: 'bg-blue-500/8',
    borderTint: 'border-blue-500/30 hover:border-blue-400/60',
    requiresPastMaterials: true,
  },
  {
    id: 'structural-flex',
    label: 'גמישות מבנית',
    subtitle: 'Structural Flexibility',
    description: 'שומרים על ה-DNA המותגי (צבעים, פונטים) אבל עם מבנה גריד חדש',
    icon: <Sparkles className="w-5 h-5" />,
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    tint: 'bg-amber-500/8',
    borderTint: 'border-amber-500/30 hover:border-amber-400/60',
    requiresPastMaterials: false,
  },
  {
    id: 'creative-freedom',
    label: 'חופש יצירתי',
    subtitle: 'Creative Freedom',
    description: 'חופש מלא — ה-AI יוצר עיצוב חדש לחלוטין, מבנה וסגנון',
    icon: <Unlock className="w-5 h-5" />,
    gradient: 'from-pink-500 via-rose-500 to-red-500',
    iconBg: 'bg-gradient-to-br from-pink-500 to-rose-600',
    tint: 'bg-pink-500/8',
    borderTint: 'border-pink-500/30 hover:border-pink-400/60',
    requiresPastMaterials: false,
  },
];

export interface PastMaterialReference {
  url: string;
  name?: string;
  adAnalysis?: any;
}

interface StudioDesignApproachStepProps {
  value: DesignApproach | null;
  onChange: (approach: DesignApproach) => void;
  hasPastMaterials: boolean;
  pastMaterials?: any[];
  selectedReference?: PastMaterialReference | null;
  onSelectReference?: (ref: PastMaterialReference | null) => void;
}

export const StudioDesignApproachStep = ({ 
  value, 
  onChange, 
  hasPastMaterials,
  pastMaterials = [],
  selectedReference = null,
  onSelectReference,
}: StudioDesignApproachStepProps) => {
  const [showMaterialsDialog, setShowMaterialsDialog] = useState(false);
  const [pendingApproach, setPendingApproach] = useState<DesignApproach | null>(null);

  const analyzedMaterials = pastMaterials.filter((m: any) => m.adAnalysis && m.url);

  const handleOptionClick = (approachId: DesignApproach) => {
    if (approachId === 'brand-follower' || approachId === 'visual-refresh') {
      // Open dialog to pick reference material
      setPendingApproach(approachId);
      setShowMaterialsDialog(true);
    } else {
      // Clear any previously selected reference
      onSelectReference?.(null);
      onChange(approachId);
    }
  };

  const handleSelectMaterial = (material: any) => {
    const ref: PastMaterialReference = {
      url: material.url,
      name: material.name || material.fileName || 'חומר עבר',
      adAnalysis: material.adAnalysis,
    };
    onSelectReference?.(ref);
    if (pendingApproach) {
      onChange(pendingApproach);
    }
    setShowMaterialsDialog(false);
  };

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
          const isDisabled = !hasPastMaterials && approach.requiresPastMaterials;
          
          return (
            <button
              key={approach.id}
              onClick={() => !isDisabled && handleOptionClick(approach.id)}
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
              <div className={cn(
                'relative h-full rounded-[14px] p-5 text-right transition-all',
                approach.tint,
                isSelected ? 'bg-card/95' : 'bg-card group-hover:bg-card/95'
              )}>
                {isSelected && (
                  <div className={`absolute top-4 left-4 w-6 h-6 rounded-full ${approach.iconBg} flex items-center justify-center shadow-lg animate-scale-in`}>
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </div>
                )}
                
                {/* Icon */}
                <div className={`absolute top-4 right-4 w-8 h-8 rounded-lg ${approach.iconBg} flex items-center justify-center text-white`}>
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

                  {/* Show selected reference thumbnail */}
                  {isSelected && selectedReference && (approach.id === 'brand-follower' || approach.id === 'visual-refresh') && (
                    <div className="mt-3 flex items-center gap-2">
                      <img 
                        src={selectedReference.url} 
                        alt="חומר ייחוס" 
                        className="w-10 h-10 rounded-lg object-cover border border-primary/30"
                      />
                      <span className="text-xs text-primary font-medium">
                        {selectedReference.name || 'חומר ייחוס נבחר'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMaterialsDialog(true);
                          setPendingApproach(approach.id);
                        }}
                        className="text-xs text-muted-foreground hover:text-primary underline mr-auto"
                      >
                        שנה
                      </button>
                    </div>
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

      {/* Past Materials Selection Dialog */}
      <Dialog open={showMaterialsDialog} onOpenChange={setShowMaterialsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-right">
              בחר את הקו העיצובי להמשך
            </DialogTitle>
            <p className="text-sm text-muted-foreground text-right">
              {pendingApproach === 'brand-follower' 
                ? 'המערכת תיצמד למבנה ולסגנון של החומר שתבחר — ותשנה רק את התוכן לפי הבריף החדש'
                : 'המערכת תשמור על מבנה הגריד אבל תרענן את השפה הוויזואלית'}
            </p>
          </DialogHeader>

          {analyzedMaterials.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground">לא נמצאו חומרי עבר מנותחים</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {analyzedMaterials.map((material: any, index: number) => {
                const isRefSelected = selectedReference?.url === material.url;
                return (
                  <button
                    key={index}
                    onClick={() => handleSelectMaterial(material)}
                    className={cn(
                      'group relative rounded-xl overflow-hidden border-2 transition-all duration-200 hover:scale-[1.03]',
                      isRefSelected 
                        ? 'border-primary ring-2 ring-primary/30 shadow-lg' 
                        : 'border-border hover:border-primary/40 hover:shadow-md'
                    )}
                  >
                    <div className="aspect-[3/4] relative">
                      <img
                        src={material.url}
                        alt={material.name || `חומר עבר ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      {/* Selected badge */}
                      {isRefSelected && (
                        <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-lg">
                          <Check className="w-4 h-4 text-primary-foreground" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    
                    {/* Label */}
                    <div className="p-2 bg-card text-right">
                      <p className="text-xs font-medium text-foreground truncate">
                        {material.name || material.fileName || `עיצוב ${index + 1}`}
                      </p>
                      {material.adAnalysis?.headlinePosition && (
                        <p className="text-[10px] text-muted-foreground">
                          כותרת: {material.adAnalysis.headlinePosition === 'top' ? 'למעלה' : 'למטה'}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
