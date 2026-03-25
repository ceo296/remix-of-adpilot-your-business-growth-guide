import { useState } from 'react';
import { 
  Newspaper, Radio, Monitor, Layers, Mail, MessageCircle, FileText, 
  Check, Sparkles, Image, Type, Camera, ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { MediaType } from './StudioMediaTypeStep';

export type ProductScope = 'full' | 'visual-only' | 'copy-only' | 'text-full' | 'text-have-script';

interface StudioProductPickerProps {
  onComplete: (mediaTypes: MediaType[], scope: ProductScope) => void;
  detectedIndustry?: string | null;
}

// Primary products - most used, shown prominently
const PRIMARY_PRODUCTS = [
  { 
    id: 'ad' as MediaType, 
    label: 'מודעה', 
    description: 'עיתונות, מגזינים ועלונים',
    icon: Newspaper,
    gradient: 'from-blue-500 to-cyan-500',
    needsScope: true,
    hero: true,
  },
  { 
    id: 'whatsapp' as MediaType, 
    label: 'וואטסאפ', 
    description: 'הודעה שיווקית לוואטסאפ',
    icon: MessageCircle,
    gradient: 'from-green-500 to-emerald-600',
    needsScope: false,
  },
  { 
    id: 'email' as MediaType, 
    label: 'מייל שיווקי', 
    description: 'דיוור אלקטרוני מעוצב',
    icon: Mail,
    gradient: 'from-orange-500 to-amber-500',
    needsScope: false,
  },
];

// Secondary products - less common
const SECONDARY_PRODUCTS = [
  { 
    id: 'radio' as MediaType, 
    label: 'תשדיר רדיו', 
    description: 'ספוט פרסומי לרדיו',
    icon: Radio,
    gradient: 'from-violet-500 to-purple-600',
    needsScope: false,
    hasRadioScope: true,
  },
  { 
    id: 'article' as MediaType, 
    label: 'כתבה', 
    description: 'כתבת תוכן שיווקית',
    icon: FileText,
    gradient: 'from-pink-500 to-rose-500',
    needsScope: false,
  },
  { 
    id: 'banner' as MediaType, 
    label: 'באנרים', 
    description: 'אתרים ודיגיטל',
    icon: Monitor,
    gradient: 'from-emerald-500 to-teal-500',
    needsScope: true,
  },
];

const CAMPAIGN_360 = { 
  id: 'all' as MediaType, 
  label: 'קמפיין 360°', 
  description: 'הכל ביחד — מודעה, באנר, רדיו, כתבה, מייל ווואטסאפ',
  icon: Layers,
  gradient: 'from-primary to-red-500',
  needsScope: false,
  recommended: true,
};

const ALL_PRODUCTS = [...PRIMARY_PRODUCTS, ...SECONDARY_PRODUCTS, CAMPAIGN_360];

const SCOPE_OPTIONS = [
  {
    id: 'full' as ProductScope,
    title: 'תעשו לי הכל',
    description: 'ויז\'ואל + קופי — מההתחלה ועד הסוף',
    Icon: Sparkles,
    colorClass: 'border-primary/60',
    selectedClass: 'border-primary bg-primary/10 ring-2 ring-primary/30',
    iconBg: 'bg-primary text-primary-foreground',
  },
  {
    id: 'visual-only' as ProductScope,
    title: 'צריך רק ויז\'ואל',
    description: 'יש לי את הטקסטים — תיצרו לי עיצוב',
    Icon: Image,
    colorClass: 'border-emerald-500/40',
    selectedClass: 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30',
    iconBg: 'bg-emerald-500 text-white',
  },
  {
    id: 'copy-only' as ProductScope,
    title: 'צריך רק טקסטים',
    description: 'יש לי תמונה/הדמיה — תכתבו לי קופי שמוכר',
    Icon: Type,
    colorClass: 'border-amber-500/40',
    selectedClass: 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30',
    iconBg: 'bg-amber-500 text-white',
  },
];

const RADIO_SCOPE_OPTIONS = [
  {
    id: 'text-full' as ProductScope,
    title: 'תעשו לי הכל',
    description: 'גם כתיבת תסריט וגם כוונות ביצוע',
    Icon: Sparkles,
    colorClass: 'border-primary/60',
    selectedClass: 'border-primary bg-primary/10 ring-2 ring-primary/30',
    iconBg: 'bg-primary text-primary-foreground',
  },
  {
    id: 'text-have-script' as ProductScope,
    title: 'יש לי טקסט',
    description: 'אצטרך רק הקלטה וכוונות ביצוע',
    Icon: FileText,
    colorClass: 'border-violet-500/40',
    selectedClass: 'border-violet-500 bg-violet-500/10 ring-2 ring-violet-500/30',
    iconBg: 'bg-violet-500 text-white',
  },
];

// Industries where product/project images are critical
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

export const StudioProductPicker = ({ onComplete, detectedIndustry }: StudioProductPickerProps) => {
  const [selectedProduct, setSelectedProduct] = useState<MediaType | null>(null);
  const [selectedScope, setSelectedScope] = useState<ProductScope | null>(null);

  const product = PRODUCTS.find(p => p.id === selectedProduct);
  const showScopeOptions = product?.needsScope;
  const showRadioScope = product?.hasRadioScope;
  const showFollowUp = showScopeOptions || showRadioScope;
  const isImageCritical = detectedIndustry && IMAGE_CRITICAL_INDUSTRIES.includes(detectedIndustry);

  const handleProductSelect = (id: MediaType) => {
    setSelectedProduct(id);
    setSelectedScope(null);
    
    const prod = PRODUCTS.find(p => p.id === id);
    // For products that don't need scope, auto-complete
    if (!prod?.needsScope && !prod?.hasRadioScope) {
      onComplete([id], 'full');
    }
  };

  const handleScopeSelect = (scope: ProductScope) => {
    setSelectedScope(scope);
  };

  const handleContinue = () => {
    if (selectedProduct && selectedScope) {
      onComplete([selectedProduct], selectedScope);
    }
  };

  const handleBack = () => {
    setSelectedProduct(null);
    setSelectedScope(null);
  };

  // Phase 2: Scope selection
  if (showFollowUp && selectedProduct) {
    const scopeOptions = showRadioScope ? RADIO_SCOPE_OPTIONS : SCOPE_OPTIONS;
    const productInfo = PRODUCTS.find(p => p.id === selectedProduct)!;

    return (
      <div className="w-full max-w-2xl mx-auto py-8 animate-fade-in">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 rotate-180" />
          <span>חזרה לבחירת מוצר</span>
        </button>

        <div className="text-center mb-8">
          <div className={cn(
            "w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg",
            productInfo.gradient
          )}>
            <productInfo.icon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {showRadioScope ? 'מה יש לך מוכן?' : 'מה אתה צריך מאיתנו?'}
          </h2>
          <p className="text-muted-foreground">
            {showRadioScope 
              ? 'ספר לנו מה כבר יש לך ונתאים את התהליך'
              : 'בחר מה אתה צריך מאיתנו'
            }
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {scopeOptions.map(({ id, title, description, Icon, colorClass, selectedClass, iconBg }) => {
            const isSelected = selectedScope === id;
            return (
              <button
                key={id}
                onClick={() => handleScopeSelect(id)}
                className={cn(
                  "relative flex items-center gap-5 p-5 rounded-2xl border-2 transition-all duration-300 text-right group",
                  isSelected ? `${selectedClass} shadow-lg` : `${colorClass} bg-card hover:shadow-md`
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all",
                  isSelected ? `${iconBg} shadow-md` : 'bg-muted text-muted-foreground'
                )}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-0.5">{title}</h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Industry nudge */}
        {isImageCritical && detectedIndustry && (selectedScope === 'full' || selectedScope === 'visual-only') && (
          <div className="mt-6 p-4 rounded-xl border-2 border-amber-500/30 bg-amber-500/10 animate-fade-in">
            <div className="flex items-start gap-3">
              <Camera className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1 text-right">
                <p className="text-sm font-medium text-foreground leading-relaxed">
                  {INDUSTRY_NUDGE_TEXT[detectedIndustry] || '💡 בתחום שלך, תמונות אמיתיות תמיד מוכרות יותר'}
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedScope && (
          <div className="mt-8 flex justify-center animate-fade-in">
            <Button onClick={handleContinue} variant="gradient" size="lg" className="min-w-[200px]">
              <Sparkles className="h-5 w-5 ml-2" />
              המשך לבריף
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Phase 1: Product selection
  return (
    <div className="w-full max-w-2xl mx-auto py-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">מה תרצה ליצור?</h2>
        <p className="text-muted-foreground">בחר את סוג הקמפיין שאתה צריך</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {PRODUCTS.map((product) => (
          <button
            key={product.id}
            onClick={() => handleProductSelect(product.id)}
            className={cn(
              "relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-border bg-card",
              "transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:scale-[1.02]",
              "group text-center",
              product.id === 'all' && 'col-span-2'
            )}
          >
            <div className={cn(
              "w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md transition-transform group-hover:scale-110",
              product.gradient
            )}>
              <product.icon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold mb-0.5">{product.label}</h3>
              <p className="text-xs text-muted-foreground leading-snug">{product.description}</p>
            </div>
            {product.recommended && (
              <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px]">
                מומלץ
              </Badge>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
