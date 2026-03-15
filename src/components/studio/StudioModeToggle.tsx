import { Check, Image, Type, Camera, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

export type StudioMode = 'autopilot' | 'manual' | 'upload' | null;
export type CampaignScope = 'full' | 'visual-only' | 'copy-only' | null;

interface StudioModeToggleProps {
  value: StudioMode;
  onChange: (mode: StudioMode) => void;
  onScopeSelect?: (scope: CampaignScope) => void;
  detectedIndustry?: string | null;
}

const SCOPE_OPTIONS = [
  {
    id: 'full' as CampaignScope,
    title: 'תעשו לי הכל',
    description: 'ויז\'ואל + קופי — מההתחלה ועד הסוף',
    Icon: Sparkles,
    colorClass: 'border-primary/60 bg-primary/5',
    selectedColorClass: 'border-primary bg-primary/10 ring-2 ring-primary/30',
    iconBg: 'bg-primary text-primary-foreground',
    iconBgHover: 'group-hover:bg-primary/20 group-hover:text-primary',
  },
  {
    id: 'visual-only' as CampaignScope,
    title: 'צריך רק ויז\'ואל',
    description: 'יש לי את הטקסטים — תיצרו לי עיצוב',
    Icon: Image,
    colorClass: 'border-emerald-500/40 bg-emerald-500/5',
    selectedColorClass: 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30',
    iconBg: 'bg-emerald-500 text-white',
    iconBgHover: 'group-hover:bg-emerald-500/20 group-hover:text-emerald-500',
  },
  {
    id: 'copy-only' as CampaignScope,
    title: 'צריך רק טקסטים',
    description: 'יש לי תמונה/הדמיה — תכתבו לי קופי שמוכר',
    Icon: Type,
    colorClass: 'border-amber-500/40 bg-amber-500/5',
    selectedColorClass: 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30',
    iconBg: 'bg-amber-500 text-white',
    iconBgHover: 'group-hover:bg-amber-500/20 group-hover:text-amber-500',
  },
];

// Industries where product/project images are almost always needed
const IMAGE_CRITICAL_INDUSTRIES = ['real_estate', 'food', 'jewelry', 'furniture', 'hotels', 'electronics', 'toys', 'wigs', 'beauty'];

const INDUSTRY_NUDGE_TEXT: Record<string, string> = {
  real_estate: '💡 בנדל"ן כמעט תמיד צריך הדמיות או צילום אמיתי — יש לך תמונות להעלות?',
  food: '💡 במזון חשוב להראות את המנה/המוצר — יש לך צילומי אוכל?',
  jewelry: '💡 תכשיטים נמכרים מהעין — יש לך צילומי מוצר?',
  furniture: '💡 ריהוט חייב להיראות — יש לך תמונות מוצר או הדמיות?',
  hotels: '💡 תמונות אמיתיות של החדרים עושות את ההבדל!',
  electronics: '💡 תמונת מוצר אמיתית תמיד עדיפה על הדמיה',
  toys: '💡 הראו את המוצר בפעולה! יש לכם תמונות?',
  wigs: '💡 תמונות אמיתיות של התוצאה עושות הבדל עצום',
  beauty: '💡 תמונת לפני/אחרי או מוצר אמיתי תמיד מוכרת יותר',
};

export const StudioModeToggle = ({ value, onChange, onScopeSelect, detectedIndustry }: StudioModeToggleProps) => {
  const [selectedScope, setSelectedScope] = useState<CampaignScope>(null);
  const [showIndustryNudge, setShowIndustryNudge] = useState(false);

  const isImageCritical = detectedIndustry && IMAGE_CRITICAL_INDUSTRIES.includes(detectedIndustry);

  useEffect(() => {
    if (isImageCritical && (selectedScope === 'full' || selectedScope === 'visual-only')) {
      setShowIndustryNudge(true);
    } else {
      setShowIndustryNudge(false);
    }
  }, [selectedScope, isImageCritical]);

  const handleScopeClick = (scope: CampaignScope) => {
    setSelectedScope(scope);
    onScopeSelect?.(scope);

    if (scope === 'full') {
      onChange('autopilot');
    } else if (scope === 'visual-only') {
      onChange('manual'); // has copy, needs visual
    } else if (scope === 'copy-only') {
      onChange('upload'); // has visual, needs copy
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">מה תרצה ליצור?</h2>
        <p className="text-muted-foreground">בחר מה אתה צריך מאיתנו</p>
      </div>

      {/* Selection Cards */}
      <div className="flex flex-col gap-4">
        {SCOPE_OPTIONS.map(({ id, title, description, Icon, colorClass, selectedColorClass, iconBg, iconBgHover }) => {
          const isSelected = selectedScope === id;
          return (
            <button
              key={id}
              onClick={() => handleScopeClick(id)}
              className={cn(
                "relative flex items-center gap-5 p-6 rounded-2xl border-2 transition-all duration-300 text-right group",
                isSelected ? `${selectedColorClass} shadow-lg` : `${colorClass} hover:shadow-md`
              )}
            >
              {/* Icon */}
              <div className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-all",
                isSelected ? `${iconBg} shadow-md` : `bg-muted text-muted-foreground ${iconBgHover}`
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
            </button>
          );
        })}
      </div>

      {/* Industry-specific nudge */}
      {showIndustryNudge && detectedIndustry && (
        <div className="mt-6 p-4 rounded-xl border-2 border-amber-500/30 bg-amber-500/10 animate-fade-in">
          <div className="flex items-start gap-3">
            <Camera className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1 text-right">
              <p className="text-sm font-medium text-foreground leading-relaxed">
                {INDUSTRY_NUDGE_TEXT[detectedIndustry] || '💡 בתחום שלך, תמונות אמיתיות תמיד מוכרות יותר'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                גם אם בחרת שנעשה הכל — אפשר להעלות תמונת מוצר ונשלב אותה
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
