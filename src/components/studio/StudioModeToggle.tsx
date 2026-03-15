import { Wand2, Check, Image, Type, AlertTriangle, Camera } from 'lucide-react';
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
    Icon: Wand2,
    badge: 'מומלץ ✨',
  },
  {
    id: 'visual-only' as CampaignScope,
    title: 'צריך רק ויז\'ואל',
    description: 'יש לי את הטקסטים — תיצרו לי עיצוב',
    Icon: Image,
    badge: null,
  },
  {
    id: 'copy-only' as CampaignScope,
    title: 'צריך רק טקסטים',
    description: 'יש לי תמונה/הדמיה — תכתבו לי קופי שמוכר',
    Icon: Type,
    badge: null,
  },
];

// Industries where product/project images are almost always needed
const IMAGE_CRITICAL_INDUSTRIES = ['real_estate', 'food', 'jewelry', 'furniture', 'hotels', 'electronics', 'toys', 'wigs', 'beauty'];

const INDUSTRY_NUDGE_TEXT: Record<string, string> = {
  real_estate: '💡 בנדל"ן כמעט תמיד צריך הדמיות או צילום אמיתי של הפרויקט — יש לך תמונות להעלות?',
  food: '💡 במזון חשוב להראות את המנה/המוצר — יש לך צילומי אוכל להעלות?',
  jewelry: '💡 תכשיטים נמכרים מהעין — יש לך צילומי מוצר להעלות?',
  furniture: '💡 ריהוט חייב להיראות — יש לך תמונות מוצר או הדמיות?',
  hotels: '💡 מלון/נופש — תמונות אמיתיות של החדרים והאווירה עושות את ההבדל!',
  electronics: '💡 אלקטרוניקה — תמונת מוצר אמיתית תמיד עדיפה על הדמיה',
  toys: '💡 צעצועים — הראו את המוצר בפעולה! יש לכם תמונות?',
  wigs: '💡 פאות — תמונות אמיתיות של התוצאה עושות הבדל עצום',
  beauty: '💡 יופי/טיפוח — תמונת לפני/אחרי או מוצר אמיתי תמיד מוכרת יותר',
};

export const StudioModeToggle = ({ value, onChange, onScopeSelect, detectedIndustry }: StudioModeToggleProps) => {
  const [selectedScope, setSelectedScope] = useState<CampaignScope>(null);
  const [showIndustryNudge, setShowIndustryNudge] = useState(false);

  const isImageCritical = detectedIndustry && IMAGE_CRITICAL_INDUSTRIES.includes(detectedIndustry);

  // Show nudge when selecting full or visual-only for image-critical industries
  useEffect(() => {
    if (isImageCritical && (selectedScope === 'full' || selectedScope === 'visual-only')) {
      setShowIndustryNudge(true);
    } else {
      setShowIndustryNudge(false);
    }
  }, [selectedScope, isImageCritical]);

  const handleScopeClick = (scope: CampaignScope) => {
    setSelectedScope(scope);
    if (onScopeSelect) {
      onScopeSelect(scope);
    }

    // Map scope to mode + asset choice
    if (scope === 'full') {
      onChange('autopilot');
    } else if (scope === 'visual-only') {
      // User has copy, needs visual
      onChange('manual');
    } else if (scope === 'copy-only') {
      // User has visual, needs copy
      onChange('upload');
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
        {SCOPE_OPTIONS.map(({ id, title, description, Icon, badge }) => {
          const isSelected = selectedScope === id;
          return (
            <button
              key={id}
              onClick={() => handleScopeClick(id)}
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

      {/* Industry-specific nudge for image-critical sectors */}
      {showIndustryNudge && detectedIndustry && (
        <div className="mt-6 p-4 rounded-xl border-2 border-amber-500/30 bg-amber-500/10 animate-fade-in">
          <div className="flex items-start gap-3">
            <Camera className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1 text-right">
              <p className="text-sm font-medium text-foreground leading-relaxed">
                {INDUSTRY_NUDGE_TEXT[detectedIndustry] || '💡 בתחום שלך, תמונות אמיתיות של המוצר תמיד מוכרות יותר'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                גם אם בחרת שנעשה הכל — אפשר להעלות תמונת מוצר ואנחנו נשלב אותה בעיצוב
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
