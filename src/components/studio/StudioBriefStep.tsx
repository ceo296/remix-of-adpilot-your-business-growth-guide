import { useState, useRef, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Target, 
  Sparkles,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Link as LinkIcon,
  Youtube,
  Facebook,
  Instagram,
  Type,
  Palette,
  ArrowLeftRight,
  History,
  Camera,
  X,
  ImagePlus,
  Clock,
  Building2,
  Eye,
  ShoppingCart,
  Rocket,
  PhoneCall,
  Crown,
  Timer,
  Heart,
  Briefcase,
  Globe,
  Stamp,
  AlertCircle,
  Brain,
  Store,
  MousePointerClick,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type CampaignStructure = 'single' | 'series';
export type CampaignGoal = 'awareness' | 'promotion' | 'launch' | 'seasonal' | 'other';
export type ColorMode = 'brand' | 'swapped' | 'continue-past';

// New guided brief types
export type AdGoal = 'brand-presence' | 'sell' | 'introduce-product' | 'invite-contact';
export type EmotionalTone = 'luxury' | 'urgency' | 'belonging' | 'professional';
export type DesiredAction = 'whatsapp-email' | 'phone-call' | 'visit-store' | 'visit-website' | 'remember-me';

export type ContactSelection = {
  phone: boolean;
  whatsapp: boolean;
  email: boolean;
  address: boolean;
  youtube: boolean;
  facebook: boolean;
  instagram: boolean;
  logoOnly: boolean;
  customText: string;
  openingHours: boolean;
  selectedBranches: string[];
};

export type ColorSelection = {
  mode: ColorMode;
  primaryColor: string | null;
  secondaryColor: string | null;
  backgroundColor: string | null;
};

export interface CampaignBrief {
  title: string;
  offer: string; // "core message" - min 12 words
  goal: CampaignGoal | null; // mapped from adGoal
  structure: CampaignStructure | null;
  contactSelection: ContactSelection;
  colorSelection: ColorSelection;
  campaignImage?: string | null;
  // New guided fields
  adGoal: AdGoal | null;
  showPriceOrBenefit: boolean | null; // null = not answered, true/false
  priceOrBenefit: string; // the actual text
  isTimeLimited: boolean | null;
  timeLimitText: string;
  emotionalTone: EmotionalTone | null;
  desiredAction: DesiredAction | null;
}

export interface ContactInfo {
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
  contact_email?: string | null;
  contact_address?: string | null;
  contact_youtube?: string | null;
  social_facebook?: string | null;
  social_instagram?: string | null;
  opening_hours?: string | null;
  branches?: string | null;
  logo_url?: string | null;
}

export interface BrandColors {
  primary_color?: string | null;
  secondary_color?: string | null;
  background_color?: string | null;
}

interface StudioBriefStepProps {
  value: CampaignBrief;
  onChange: (brief: CampaignBrief) => void;
  businessName?: string;
  contactInfo?: ContactInfo;
  brandColors?: BrandColors;
}

// Map adGoal to legacy CampaignGoal for backward compat
function mapAdGoalToLegacy(adGoal: AdGoal | null): CampaignGoal | null {
  switch (adGoal) {
    case 'brand-presence': return 'awareness';
    case 'sell': return 'promotion';
    case 'introduce-product': return 'launch';
    case 'invite-contact': return 'awareness';
    default: return null;
  }
}

const AD_GOAL_OPTIONS: { id: AdGoal; label: string; description: string; icon: React.ElementType; gradient: string; shadow: string }[] = [
  { id: 'sell', label: 'תקנו ממני', description: 'מבצע, הנחה, הצעה מוגבלת', icon: ShoppingCart, gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/30' },
  { id: 'brand-presence', label: 'תראו אותי', description: 'חיזוק המותג, יוקרה, סטייל', icon: Eye, gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/30' },
  { id: 'invite-contact', label: 'בואו נדבר או ניפגש', description: 'הזמנה לשיחה / פגישה', icon: PhoneCall, gradient: 'from-blue-500 to-cyan-600', shadow: 'shadow-blue-500/30' },
  { id: 'introduce-product', label: 'תכירו מוצר חדש', description: 'השקה או חשיפה של מוצר/שירות', icon: Rocket, gradient: 'from-orange-500 to-amber-600', shadow: 'shadow-orange-500/30' },
];

const EMOTIONAL_TONE_OPTIONS: { id: EmotionalTone; label: string; description: string; icon: React.ElementType; gradient: string; shadow: string }[] = [
  { id: 'luxury', label: 'וואו, זה נראה יוקרתי', description: 'מראה מפואר ואלגנטי', icon: Crown, gradient: 'from-amber-500 to-yellow-500', shadow: 'shadow-amber-500/30' },
  { id: 'urgency', label: 'חייב להספיק לפני שיגמר', description: 'דחיפות ומבצע מוגבל', icon: Timer, gradient: 'from-red-500 to-rose-600', shadow: 'shadow-red-500/30' },
  { id: 'belonging', label: 'זה המקום בשבילי', description: 'חיבור אישי ושייכות', icon: Heart, gradient: 'from-pink-500 to-rose-500', shadow: 'shadow-pink-500/30' },
  { id: 'professional', label: 'עושה עלי רושם מקצועי', description: 'אמינות ומקצועיות', icon: Briefcase, gradient: 'from-slate-600 to-gray-700', shadow: 'shadow-slate-500/30' },
];

const DESIRED_ACTION_OPTIONS: { id: DesiredAction; label: string; icon: React.ElementType; gradient: string; shadow: string }[] = [
  { id: 'whatsapp-email', label: 'שליחת מייל / וואטסאפ', icon: MessageCircle, gradient: 'from-green-500 to-emerald-600', shadow: 'shadow-green-500/30' },
  { id: 'phone-call', label: 'שיחה טלפונית', icon: Phone, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/30' },
  { id: 'visit-store', label: 'הגעה למקום / חנות', icon: Store, gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/30' },
  { id: 'visit-website', label: 'כניסה לאתר', icon: Globe, gradient: 'from-cyan-500 to-teal-600', shadow: 'shadow-cyan-500/30' },
  { id: 'remember-me', label: 'יזכרו אותי', icon: Brain, gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/30' },
];

export const StudioBriefStep = ({ value, onChange, businessName, contactInfo, brandColors }: StudioBriefStepProps) => {
  const campaignImageInputRef = useRef<HTMLInputElement>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  
  const updateBrief = (updates: Partial<CampaignBrief>) => {
    onChange({ ...value, ...updates });
  };

  // Core message quality analysis (min 12 words)
  const messageQuality = useMemo(() => {
    const text = value.offer.trim();
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    
    let score = 0;
    const missing: string[] = [];
    
    if (wordCount >= 12) score += 40;
    else if (wordCount >= 8) { score += 20; missing.push(`עוד ${12 - wordCount} מילים למינימום`); }
    else if (wordCount >= 4) { score += 10; missing.push(`עוד ${12 - wordCount} מילים למינימום`); }
    else if (wordCount > 0) missing.push(`צריך לפחות 12 מילים (כרגע ${wordCount})`);
    
    const hasNumbers = /\d/.test(text);
    const hasBenefit = /הנחה|מבצע|חינם|מתנה|יתרון|ייחודי|חדש|השקה|פתיחה|מחיר|₪|%/.test(text);
    
    if (hasNumbers) score += 20;
    if (hasBenefit) score += 20;
    if (wordCount >= 20) score += 20;
    else if (wordCount >= 15) score += 10;
    
    let level: 'empty' | 'weak' | 'medium' | 'strong' = 'empty';
    if (wordCount === 0) level = 'empty';
    else if (wordCount < 8) level = 'weak';
    else if (wordCount < 12) level = 'medium';
    else level = 'strong';
    
    return { score: Math.min(score, 100), level, missing, wordCount };
  }, [value.offer]);

  const handleEnhanceBrief = useCallback(async () => {
    if (messageQuality.wordCount < 3) {
      toast.error('כתוב לפחות כמה מילים ואז נעזור לך להרחיב');
      return;
    }
    setIsEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: `אתה עוזר לכתוב בריפים לקמפיינים פרסומיים. המשתמש כתב תיאור קצר מדי. עזור לו להרחיב.

התיאור שהמשתמש כתב: "${value.offer}"
${businessName ? `שם העסק: ${businessName}` : ''}
${value.adGoal ? `מטרת המודעה: ${value.adGoal}` : ''}
${value.emotionalTone ? `טון רגשי: ${value.emotionalTone}` : ''}

כתוב גרסה משופרת ומורחבת (לפחות 15 מילים) שכוללת:
1. מה בדיוק ההצעה/המוצר/השירות
2. מה היתרון המרכזי
3. פרטים ספציפיים
4. למי זה מיועד

חשוב: כתוב רק את הטקסט המשופר, בלי הקדמות. 2-4 משפטים. בעברית.`,
          skipHistory: true,
        },
      });
      
      if (error) throw error;
      const enhanced = data?.response?.trim();
      if (enhanced) {
        updateBrief({ offer: enhanced });
        toast.success('הטקסט הורחב! בדוק שהפרטים נכונים');
      }
    } catch (err) {
      toast.error('לא הצלחנו להרחיב — נסה שוב');
    } finally {
      setIsEnhancing(false);
    }
  }, [value.offer, value.adGoal, value.emotionalTone, businessName, messageQuality.wordCount]);

  const handleCampaignImage = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      updateBrief({ campaignImage: event.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const toggleContact = (key: keyof CampaignBrief['contactSelection']) => {
    onChange({
      ...value,
      contactSelection: {
        ...value.contactSelection,
        [key]: !value.contactSelection[key],
      },
    });
  };

  const setColorMode = (mode: ColorMode) => {
    if (mode === 'swapped' && brandColors) {
      onChange({
        ...value,
        colorSelection: {
          mode: 'swapped',
          primaryColor: brandColors.secondary_color || null,
          secondaryColor: brandColors.primary_color || null,
          backgroundColor: brandColors.background_color || null,
        },
      });
    } else {
      onChange({
        ...value,
        colorSelection: {
          mode,
          primaryColor: null,
          secondaryColor: null,
          backgroundColor: null,
        },
      });
    }
  };

  const branchesList = useMemo(() => {
    if (!contactInfo?.branches) return [];
    return contactInfo.branches.split('\n').map(b => b.trim()).filter(Boolean);
  }, [contactInfo?.branches]);

  const toggleBranch = (branch: string) => {
    const current = value.contactSelection.selectedBranches || [];
    const updated = current.includes(branch)
      ? current.filter(b => b !== branch)
      : [...current, branch];
    onChange({
      ...value,
      contactSelection: {
        ...value.contactSelection,
        selectedBranches: updated,
      },
    });
  };

  const hasAnyContact = contactInfo && (
    contactInfo.contact_phone || 
    contactInfo.contact_whatsapp || 
    contactInfo.contact_email || 
    contactInfo.contact_address ||
    contactInfo.contact_youtube ||
    contactInfo.social_facebook ||
    contactInfo.social_instagram ||
    contactInfo.opening_hours ||
    contactInfo.logo_url ||
    branchesList.length > 0
  );

  // Check if at least one display option is selected
  const hasSelectedContact = value.contactSelection.phone || 
    value.contactSelection.whatsapp || 
    value.contactSelection.email || 
    value.contactSelection.address || 
    value.contactSelection.youtube || 
    value.contactSelection.facebook || 
    value.contactSelection.instagram ||
    value.contactSelection.logoOnly ||
    value.contactSelection.openingHours ||
    (value.contactSelection.selectedBranches || []).length > 0;

  const hasBrandColors = brandColors && (brandColors.primary_color || brandColors.secondary_color);

  const updateCustomText = (text: string) => {
    onChange({
      ...value,
      contactSelection: {
        ...value.contactSelection,
        customText: text,
      },
    });
  };

  // Conditional visibility
  const showPriceQuestion = value.adGoal === 'sell' || value.adGoal === 'introduce-product';
  const showTimeLimitQuestion = value.showPriceOrBenefit === true;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          בוא נגדיר את המודעה
        </h2>
        <p className="text-muted-foreground">
          {businessName ? `עבור ${businessName} — ` : ''}כמה שאלות קצרות וניצור את הקריאייטיב המושלם
        </p>
      </div>

      {/* ── Question 1: Ad Goal ── */}
      <div className="space-y-4">
        <Label className="text-foreground font-semibold text-base flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary text-sm font-bold">1</span>
          מה המטרה העיקרית של המודעה היום?
        </Label>
        <div className="grid grid-cols-2 gap-4">
          {AD_GOAL_OPTIONS.map((option) => {
            const isSelected = value.adGoal === option.id;
            return (
              <div
                key={option.id}
                className={cn(
                  'relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 text-center hover:scale-[1.02]',
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-lg'
                    : 'border-border bg-card hover:border-primary/30 hover:shadow-md'
                )}
                onClick={() => updateBrief({ 
                  adGoal: option.id, 
                  goal: mapAdGoalToLegacy(option.id),
                  ...(option.id !== 'sell' && option.id !== 'introduce-product' ? { showPriceOrBenefit: null, priceOrBenefit: '', isTimeLimited: null, timeLimitText: '' } : {}),
                })}
              >
                <div className={cn(
                  'w-14 h-14 mx-auto rounded-xl flex items-center justify-center mb-3 shadow-lg transition-all bg-gradient-to-br',
                  option.gradient, option.shadow,
                  isSelected ? 'scale-110' : 'opacity-70'
                )}>
                  <option.icon className="w-7 h-7 text-white" />
                </div>
                <p className="font-bold text-foreground mb-1">{option.label}</p>
                <p className="text-xs text-muted-foreground">{option.description}</p>
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Question 2: Price/Benefit (conditional) ── */}
      {showPriceQuestion && value.adGoal && (
        <div className="space-y-4 animate-fade-in">
          <Label className="text-foreground font-semibold text-base flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary text-sm font-bold">2</span>
            האם נרצה להציג מחיר או הטבה ספציפית במודעה?
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <Card
              className={cn(
                'cursor-pointer transition-all duration-200 border-2',
                value.showPriceOrBenefit === false
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border hover:border-primary/30'
              )}
              onClick={() => updateBrief({ showPriceOrBenefit: false, priceOrBenefit: '', isTimeLimited: null, timeLimitText: '' })}
            >
              <CardContent className="p-4 text-center">
                <p className="font-bold text-sm">לא</p>
                <p className="text-xs text-muted-foreground mt-1">בלי מחיר או הטבה</p>
              </CardContent>
            </Card>
            <Card
              className={cn(
                'cursor-pointer transition-all duration-200 border-2',
                value.showPriceOrBenefit === true
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border hover:border-primary/30'
              )}
              onClick={() => updateBrief({ showPriceOrBenefit: true })}
            >
              <CardContent className="p-4 text-center">
                <p className="font-bold text-sm">כן</p>
                <p className="text-xs text-muted-foreground mt-1">יש מחיר או הטבה</p>
              </CardContent>
            </Card>
          </div>
          
          {value.showPriceOrBenefit === true && (
            <div className="animate-fade-in">
              <Input
                value={value.priceOrBenefit}
                onChange={(e) => updateBrief({ priceOrBenefit: e.target.value })}
                placeholder="מה ההטבה או המחיר? (למשל: 30% הנחה, מתנה בקנייה מעל ₪200)"
                className="text-base"
              />
            </div>
          )}
        </div>
      )}

      {/* ── Question 3: Time Limited (conditional) ── */}
      {showTimeLimitQuestion && (
        <div className="space-y-4 animate-fade-in">
          <Label className="text-foreground font-semibold text-base flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary text-sm font-bold">3</span>
            האם ההצעה מוגבלת בזמן?
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <Card
              className={cn(
                'cursor-pointer transition-all duration-200 border-2',
                value.isTimeLimited === false
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border hover:border-primary/30'
              )}
              onClick={() => updateBrief({ isTimeLimited: false, timeLimitText: '' })}
            >
              <CardContent className="p-4 text-center">
                <p className="font-bold text-sm">ללא הגבלה</p>
              </CardContent>
            </Card>
            <Card
              className={cn(
                'cursor-pointer transition-all duration-200 border-2',
                value.isTimeLimited === true
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border hover:border-primary/30'
              )}
              onClick={() => updateBrief({ isTimeLimited: true })}
            >
              <CardContent className="p-4 text-center">
                <p className="font-bold text-sm">מוגבל בזמן</p>
              </CardContent>
            </Card>
          </div>
          
          {value.isTimeLimited === true && (
            <div className="animate-fade-in">
              <Input
                value={value.timeLimitText}
                onChange={(e) => updateBrief({ timeLimitText: e.target.value })}
                placeholder="עד מתי המבצע? (למשל: עד סוף השבוע / גמר המלאי)"
                className="text-base"
              />
            </div>
          )}
        </div>
      )}

      {/* ── Question 4: Emotional Tone ── */}
      {value.adGoal && (
        <div className="space-y-4 animate-fade-in">
          <Label className="text-foreground font-semibold text-base flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary text-sm font-bold">
              {showPriceQuestion ? (showTimeLimitQuestion ? '4' : '3') : '2'}
            </span>
            איך היית רוצה שהלקוח ירגיש כשיצפה במודעה?
          </Label>
          <div className="grid grid-cols-2 gap-4">
            {EMOTIONAL_TONE_OPTIONS.map((option) => {
              const isSelected = value.emotionalTone === option.id;
              return (
                <div
                  key={option.id}
                  className={cn(
                    'relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 text-center hover:scale-[1.02]',
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-lg'
                      : 'border-border bg-card hover:border-primary/30 hover:shadow-md'
                  )}
                  onClick={() => updateBrief({ emotionalTone: option.id })}
                >
                  <div className={cn(
                    'w-14 h-14 mx-auto rounded-xl flex items-center justify-center mb-3 shadow-lg transition-all bg-gradient-to-br',
                    option.gradient, option.shadow,
                    isSelected ? 'scale-110' : 'opacity-70'
                  )}>
                    <option.icon className="w-7 h-7 text-white" />
                  </div>
                  <p className="font-bold text-sm text-foreground">{option.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Question 5: Desired Action ── */}
      {value.emotionalTone && (
        <div className="space-y-4 animate-fade-in">
          <Label className="text-foreground font-semibold text-base flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary text-sm font-bold">
              {showPriceQuestion ? (showTimeLimitQuestion ? '5' : '4') : '3'}
            </span>
            מה הפעולה שהכי חשוב שיבצעו?
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {DESIRED_ACTION_OPTIONS.map((option) => {
              const isSelected = value.desiredAction === option.id;
              return (
                <div
                  key={option.id}
                  className={cn(
                    'relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 text-center hover:scale-[1.02]',
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-lg'
                      : 'border-border bg-card hover:border-primary/30 hover:shadow-md'
                  )}
                  onClick={() => updateBrief({ desiredAction: option.id })}
                >
                  <div className={cn(
                    'w-11 h-11 mx-auto rounded-xl flex items-center justify-center mb-2 shadow-md transition-all bg-gradient-to-br',
                    option.gradient, option.shadow,
                    isSelected ? 'scale-110' : 'opacity-60'
                  )}>
                    <option.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-medium text-sm text-foreground">{option.label}</p>
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Question 6: Core Message (always visible, required) ── */}
      {value.desiredAction && (
        <div className="space-y-3 animate-fade-in">
          <Label htmlFor="campaign-offer" className="text-foreground font-semibold text-base flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary text-sm font-bold">
              {showPriceQuestion ? (showTimeLimitQuestion ? '6' : '5') : '4'}
            </span>
            מה הבשורה המרכזית שלנו הפעם? *
          </Label>
          <Textarea
            id="campaign-offer"
            value={value.offer}
            onChange={(e) => updateBrief({ offer: e.target.value })}
            placeholder="ספרו לנו על המהלך, המוצר או השירות. מה המהות שלו ומה הכי חשוב להדגיש? לדוגמה: השקת טכנולוגיה חדשה להשתלות שיניים ללא כאב שחוסכת לכם זמן יקר..."
            className={cn(
              "min-h-[130px] text-base transition-all",
              messageQuality.level === 'weak' && 'border-orange-400/60 focus:border-orange-400',
            )}
          />
          
          {/* Quality Meter */}
          {value.offer.trim().length > 0 && (
            <div className="space-y-2 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{messageQuality.wordCount} מילים</span>
                  <Badge 
                    variant={messageQuality.level === 'strong' ? 'default' : 'secondary'}
                    className={cn(
                      'text-xs',
                      messageQuality.level === 'weak' && 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                      messageQuality.level === 'medium' && 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                      messageQuality.level === 'strong' && 'bg-green-500/20 text-green-400 border-green-500/30'
                    )}
                  >
                    {messageQuality.level === 'weak' ? '⚠️ קצר מדי — צריך לפחות 12 מילים' : 
                     messageQuality.level === 'medium' ? '👍 כמעט שם — עוד קצת' : 
                     '✅ מעולה!'}
                  </Badge>
                </div>
                {messageQuality.level !== 'strong' && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleEnhanceBrief}
                    disabled={isEnhancing}
                    className="text-xs gap-1.5 h-7"
                  >
                    <Sparkles className={cn("w-3.5 h-3.5", isEnhancing && "animate-spin")} />
                    {isEnhancing ? 'מרחיב...' : 'הרחב עם AI'}
                  </Button>
                )}
              </div>
              
              <Progress 
                value={messageQuality.score} 
                className={cn(
                  "h-1.5",
                  messageQuality.level === 'weak' && '[&>div]:bg-orange-400',
                  messageQuality.level === 'medium' && '[&>div]:bg-yellow-400',
                  messageQuality.level === 'strong' && '[&>div]:bg-green-400'
                )}
              />

              {messageQuality.missing.length > 0 && messageQuality.level !== 'strong' && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {messageQuality.missing.map((hint, i) => (
                    <span key={i} className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                      💡 {hint}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Campaign Image Upload - after core message */}
      {value.desiredAction && (
        <div className="space-y-3 animate-fade-in">
          <Label className="text-foreground font-medium flex items-center gap-2">
            <ImagePlus className="w-4 h-4 text-primary" />
            יש תמונה רלוונטית לקמפיין?
          </Label>
          <input
            ref={campaignImageInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleCampaignImage(e.target.files)}
            className="hidden"
          />
          {value.campaignImage ? (
            <div className="relative inline-block group">
              <img 
                src={value.campaignImage} 
                alt="תמונת קמפיין" 
                className="w-40 h-32 object-cover rounded-xl border-2 border-primary/30 shadow-md" 
              />
              <button
                type="button"
                onClick={() => updateBrief({ campaignImage: null })}
                className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Card 
              className="border-2 border-dashed border-border hover:border-primary/40 transition-all cursor-pointer max-w-md"
              onClick={() => campaignImageInputRef.current?.click()}
            >
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <Camera className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">העלה תמונה של המוצר, החנות או כל דבר רלוונטי</p>
                  <p className="text-xs text-muted-foreground mt-0.5">אופציונלי — נשתמש בה בקריאייטיב</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Campaign Structure - after all questions */}
      {value.desiredAction && (
        <div id="campaign-structure" className="space-y-4 animate-fade-in">
          <Label className="text-foreground font-medium">מבנה הקמפיין *</Label>
          <div className="grid md:grid-cols-2 gap-4">
            <Card
              className={cn(
                'cursor-pointer transition-all duration-300 border-2',
                value.structure === 'single'
                  ? 'border-primary bg-primary/5 shadow-lg'
                  : 'border-border hover:border-primary/50'
              )}
              onClick={() => updateBrief({ structure: 'single' })}
            >
              <CardContent className="p-5 flex items-start gap-4">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                  value.structure === 'single' ? 'bg-primary/20' : 'bg-muted'
                )}>
                  <MousePointerClick className={cn('w-6 h-6', value.structure === 'single' ? 'text-primary' : 'text-muted-foreground')} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-foreground">פרסום נקודתי</h4>
                  <p className="text-sm text-muted-foreground mt-1">קריאייטיב אחד ממוקד</p>
                </div>
              </CardContent>
            </Card>
            <Card
              className={cn(
                'cursor-pointer transition-all duration-300 border-2',
                value.structure === 'series'
                  ? 'border-primary bg-primary/5 shadow-lg'
                  : 'border-border hover:border-primary/50'
              )}
              onClick={() => updateBrief({ structure: 'series' })}
            >
              <CardContent className="p-5 flex items-start gap-4">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                  value.structure === 'series' ? 'bg-primary/20' : 'bg-muted'
                )}>
                  <svg className={cn('w-6 h-6', value.structure === 'series' ? 'text-primary' : 'text-muted-foreground')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-base font-bold text-foreground">סדרה</h4>
                  <p className="text-sm text-muted-foreground mt-1">מספר קריאייטיבים בסגנון אחיד</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Brand Colors Selection */}
      {hasBrandColors && value.structure && (
        <div className="space-y-4 animate-fade-in">
          <Label className="text-foreground font-medium flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" />
            צבעי המותג לקמפיין
          </Label>
          
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-3 border-b">
                <button
                  type="button"
                  className={cn(
                    'p-4 text-center transition-all border-l',
                    value.colorSelection.mode === 'brand' ? 'bg-primary/10 border-b-2 border-b-primary' : 'hover:bg-muted/50'
                  )}
                  onClick={() => setColorMode('brand')}
                >
                  <div className="flex justify-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full border-2 border-white shadow-md" style={{ backgroundColor: brandColors?.primary_color || '#ccc' }} />
                    <div className="w-6 h-6 rounded-full border-2 border-white shadow-md mt-1" style={{ backgroundColor: brandColors?.secondary_color || '#ccc' }} />
                  </div>
                  <p className="text-sm font-medium">צבעי המותג</p>
                </button>
                <button
                  type="button"
                  className={cn(
                    'p-4 text-center transition-all border-l',
                    value.colorSelection.mode === 'swapped' ? 'bg-primary/10 border-b-2 border-b-primary' : 'hover:bg-muted/50'
                  )}
                  onClick={() => setColorMode('swapped')}
                >
                  <div className="flex justify-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full border-2 border-white shadow-md" style={{ backgroundColor: brandColors?.secondary_color || '#ccc' }} />
                    <div className="w-6 h-6 rounded-full border-2 border-white shadow-md mt-1" style={{ backgroundColor: brandColors?.primary_color || '#ccc' }} />
                  </div>
                  <p className="text-sm font-medium">החלפת צבעים</p>
                </button>
                <button
                  type="button"
                  className={cn(
                    'p-4 text-center transition-all',
                    value.colorSelection.mode === 'continue-past' ? 'bg-primary/10 border-b-2 border-b-primary' : 'hover:bg-muted/50'
                  )}
                  onClick={() => setColorMode('continue-past')}
                >
                  <div className="flex justify-center mb-2">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <History className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                  <p className="text-sm font-medium">המשך קו עיצובי</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contact Info Selection */}
      {hasAnyContact && value.structure && (
        <div className="space-y-4 animate-fade-in">
          <Label className="text-foreground font-medium flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-primary" />
            מה להציג בקמפיין?
            <span className="text-xs text-destructive font-normal">(חובה — לפחות אחד)</span>
          </Label>
          {!hasSelectedContact && value.structure && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>יש לסמן לפחות אפשרות אחת להצגה במודעה</span>
            </div>
          )}
          <Card>
            <CardContent className="p-4 space-y-3">
              {/* Logo Only option - always available */}
              <div className="flex items-center gap-3">
                <Checkbox id="contact-logo-only" checked={value.contactSelection.logoOnly} onCheckedChange={() => toggleContact('logoOnly')} />
                <label htmlFor="contact-logo-only" className="flex items-center gap-2 cursor-pointer text-sm">
                  <Stamp className="w-4 h-4 text-muted-foreground" />
                  <span>רק לוגו</span>
                  {contactInfo?.logo_url ? (
                    <span className="text-xs text-emerald-500">✅ לוגו קיים</span>
                  ) : (
                    <span className="text-xs text-destructive">❌ לא הועלה לוגו</span>
                  )}
                </label>
              </div>
              {contactInfo?.contact_phone && (
                <div className="flex items-center gap-3">
                  <Checkbox id="contact-phone" checked={value.contactSelection.phone} onCheckedChange={() => toggleContact('phone')} />
                  <label htmlFor="contact-phone" className="flex items-center gap-2 cursor-pointer text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>טלפון:</span>
                    <span className="text-muted-foreground" dir="ltr">{contactInfo.contact_phone}</span>
                  </label>
                </div>
              )}
              {contactInfo?.contact_whatsapp && (
                <div className="flex items-center gap-3">
                  <Checkbox id="contact-whatsapp" checked={value.contactSelection.whatsapp} onCheckedChange={() => toggleContact('whatsapp')} />
                  <label htmlFor="contact-whatsapp" className="flex items-center gap-2 cursor-pointer text-sm">
                    <MessageCircle className="w-4 h-4 text-muted-foreground" />
                    <span>וואטסאפ:</span>
                    <span className="text-muted-foreground" dir="ltr">{contactInfo.contact_whatsapp}</span>
                  </label>
                </div>
              )}
              {contactInfo?.contact_email && (
                <div className="flex items-center gap-3">
                  <Checkbox id="contact-email" checked={value.contactSelection.email} onCheckedChange={() => toggleContact('email')} />
                  <label htmlFor="contact-email" className="flex items-center gap-2 cursor-pointer text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>מייל:</span>
                    <span className="text-muted-foreground" dir="ltr">{contactInfo.contact_email}</span>
                  </label>
                </div>
              )}
              {contactInfo?.contact_address && (
                <div className="flex items-center gap-3">
                  <Checkbox id="contact-address" checked={value.contactSelection.address} onCheckedChange={() => toggleContact('address')} />
                  <label htmlFor="contact-address" className="flex items-center gap-2 cursor-pointer text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>כתובת:</span>
                    <span className="text-muted-foreground">{contactInfo.contact_address}</span>
                  </label>
                </div>
              )}
              {contactInfo?.opening_hours && (
                <div className="flex items-center gap-3">
                  <Checkbox id="contact-hours" checked={value.contactSelection.openingHours} onCheckedChange={() => toggleContact('openingHours')} />
                  <label htmlFor="contact-hours" className="flex items-center gap-2 cursor-pointer text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>שעות פתיחה:</span>
                    <span className="text-muted-foreground">{contactInfo.opening_hours}</span>
                  </label>
                </div>
              )}
              {branchesList.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span>סניפים להצגה במודעה:</span>
                  </div>
                  {branchesList.map((branch, idx) => (
                    <div key={idx} className="flex items-center gap-3 mr-6">
                      <Checkbox id={`branch-${idx}`} checked={(value.contactSelection.selectedBranches || []).includes(branch)} onCheckedChange={() => toggleBranch(branch)} />
                      <label htmlFor={`branch-${idx}`} className="flex items-center gap-2 cursor-pointer text-sm">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{branch}</span>
                      </label>
                    </div>
                  ))}
                </div>
              )}
              {contactInfo?.contact_youtube && (
                <div className="flex items-center gap-3">
                  <Checkbox id="contact-youtube" checked={value.contactSelection.youtube} onCheckedChange={() => toggleContact('youtube')} />
                  <label htmlFor="contact-youtube" className="flex items-center gap-2 cursor-pointer text-sm">
                    <Youtube className="w-4 h-4 text-muted-foreground" />
                    <span>יוטיוב:</span>
                    <span className="text-muted-foreground" dir="ltr">{contactInfo.contact_youtube}</span>
                  </label>
                </div>
              )}
              {contactInfo?.social_facebook && (
                <div className="flex items-center gap-3">
                  <Checkbox id="contact-facebook" checked={value.contactSelection.facebook} onCheckedChange={() => toggleContact('facebook')} />
                  <label htmlFor="contact-facebook" className="flex items-center gap-2 cursor-pointer text-sm">
                    <Facebook className="w-4 h-4 text-muted-foreground" />
                    <span>פייסבוק:</span>
                    <span className="text-muted-foreground" dir="ltr">{contactInfo.social_facebook}</span>
                  </label>
                </div>
              )}
              {contactInfo?.social_instagram && (
                <div className="flex items-center gap-3">
                  <Checkbox id="contact-instagram" checked={value.contactSelection.instagram} onCheckedChange={() => toggleContact('instagram')} />
                  <label htmlFor="contact-instagram" className="flex items-center gap-2 cursor-pointer text-sm">
                    <Instagram className="w-4 h-4 text-muted-foreground" />
                    <span>אינסטגרם:</span>
                    <span className="text-muted-foreground" dir="ltr">{contactInfo.social_instagram}</span>
                  </label>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Custom Text Field */}
          <div className="space-y-2">
            <Label htmlFor="custom-display-text" className="flex items-center gap-2 text-foreground font-medium">
              <Type className="w-4 h-4 text-primary" />
              טקסט חופשי להצגה
            </Label>
            <Input
              id="custom-display-text"
              value={value.contactSelection.customText}
              onChange={(e) => updateCustomText(e.target.value)}
              placeholder="לדוגמה: להשיג בחנויות הנבחרות, בהשגחת הרב..."
              className="text-base"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StudioBriefStep;
