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
  Zap, 
  Layers, 
  Target, 
  Lightbulb, 
  Tag, 
  Gift, 
  Megaphone, 
  Calendar,
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
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type CampaignStructure = 'single' | 'series';
export type CampaignGoal = 'awareness' | 'promotion' | 'launch' | 'seasonal' | 'other';
export type ColorMode = 'brand' | 'swapped' | 'continue-past';

export type ContactSelection = {
  phone: boolean;
  whatsapp: boolean;
  email: boolean;
  address: boolean;
  youtube: boolean;
  facebook: boolean;
  instagram: boolean;
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
  offer: string;
  goal: CampaignGoal | null;
  structure: CampaignStructure | null;
  contactSelection: ContactSelection;
  colorSelection: ColorSelection;
  campaignImage?: string | null; // data URL of uploaded campaign-specific image
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

const GOAL_OPTIONS: { id: CampaignGoal; label: string; description: string; icon: React.ElementType }[] = [
  { id: 'awareness', label: 'מודעות למותג', description: 'להציג את העסק ולהגביר נוכחות', icon: Megaphone },
  { id: 'promotion', label: 'סייל / מבצע', description: 'לקדם הצעה מיוחדת או מחיר', icon: Tag },
  { id: 'launch', label: 'השקה', description: 'להשיק מוצר, שירות או סניף חדש', icon: Sparkles },
  { id: 'seasonal', label: 'עונתי / חג', description: 'קמפיין לרגל אירוע או עונה', icon: Calendar },
];

export const StudioBriefStep = ({ value, onChange, businessName, contactInfo, brandColors }: StudioBriefStepProps) => {
  const campaignImageInputRef = useRef<HTMLInputElement>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  
  const updateBrief = (updates: Partial<CampaignBrief>) => {
    onChange({ ...value, ...updates });
  };

  // Brief quality analysis
  const briefQuality = useMemo(() => {
    const text = value.offer.trim();
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    
    // Check for specific details
    const hasNumbers = /\d/.test(text); // prices, percentages, dates
    const hasSpecificProduct = wordCount >= 3; // more than generic
    const hasBenefit = /הנחה|מבצע|חינם|מתנה|יתרון|ייחודי|חדש|השקה|פתיחה|מחיר|₪|%/.test(text);
    const hasAudience = /נשים|גברים|משפחות|ילדים|בחורים|אברכים|בעלי|לכל/.test(text);
    
    let score = 0;
    const missing: string[] = [];
    
    if (wordCount >= 8) score += 25;
    else if (wordCount >= 4) score += 10;
    else missing.push('תוסיף עוד פרטים — מה בדיוק מפרסמים?');
    
    if (hasNumbers) score += 25;
    else missing.push('הוסף מספרים: מחיר, אחוז הנחה, כמות');
    
    if (hasBenefit) score += 25;
    else missing.push('מה היתרון? הנחה? מתנה? חידוש?');
    
    if (hasAudience || wordCount >= 12) score += 25;
    else if (wordCount >= 6) missing.push('למי זה מיועד?');
    
    let level: 'empty' | 'weak' | 'medium' | 'strong' = 'empty';
    if (wordCount === 0) level = 'empty';
    else if (score <= 25) level = 'weak';
    else if (score <= 60) level = 'medium';
    else level = 'strong';
    
    return { score, level, missing, wordCount };
  }, [value.offer]);

  const handleEnhanceBrief = useCallback(async () => {
    if (briefQuality.wordCount < 2) {
      toast.error('כתוב לפחות כמה מילים על מה הקמפיין, ואז נעזור לך להרחיב');
      return;
    }
    setIsEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: `אתה עוזר לכתוב בריפים לקמפיינים פרסומיים. המשתמש כתב בריף קצר מדי. עזור לו להרחיב.

הבריף שהמשתמש כתב: "${value.offer}"
${businessName ? `שם העסק: ${businessName}` : ''}
${value.goal ? `מטרת הקמפיין: ${value.goal}` : ''}

כתוב גרסה משופרת ומורחבת של הבריף שכוללת:
1. מה בדיוק ההצעה/המוצר/השירות
2. מה היתרון המרכזי או ה-USP
3. פרטים ספציפיים (מחירים, אחוזי הנחה, תאריכים אם רלוונטי)
4. למי זה מיועד

חשוב: כתוב רק את הבריף המשופר, בלי הקדמות או הסברים. 2-4 משפטים מקסימום. בעברית.`,
          skipHistory: true,
        },
      });
      
      if (error) throw error;
      const enhanced = data?.response?.trim();
      if (enhanced) {
        updateBrief({ offer: enhanced });
        toast.success('הבריף הורחב! בדוק שהפרטים נכונים ותקן לפי הצורך');
      }
    } catch (err) {
      toast.error('לא הצלחנו להרחיב — נסה שוב');
    } finally {
      setIsEnhancing(false);
    }
  }, [value.offer, value.goal, businessName, briefQuality.wordCount]);

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
      // When swapping, set the swapped colors
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
    branchesList.length > 0
  );

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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          בוא נגדיר את הקמפיין
        </h2>
        <p className="text-muted-foreground">
          {businessName ? `עבור ${businessName} - ` : ''}ספר לנו מה רוצים לפרסם
        </p>
      </div>

      {/* Campaign Title */}
      <div className="space-y-3">
        <Label htmlFor="campaign-title" className="text-foreground font-medium flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          שם הקמפיין (לשימוש פנימי)
        </Label>
        <Input
          id="campaign-title"
          value={value.title}
          onChange={(e) => updateBrief({ title: e.target.value })}
          placeholder="לדוגמה: מבצע חנוכה 2024, השקת קולקציית חורף..."
          className="text-lg"
        />
      </div>

      {/* Campaign Offer / Message */}
      <div className="space-y-3">
        <Label htmlFor="campaign-offer" className="text-foreground font-medium flex items-center gap-2">
          <Gift className="w-4 h-4 text-primary" />
          מה ההצעה הפרסומית? *
        </Label>
        <Textarea
          id="campaign-offer"
          value={value.offer}
          onChange={(e) => updateBrief({ offer: e.target.value })}
          placeholder="תאר בפירוט את המסר המרכזי של הקמפיין. ככל שתכתוב יותר פרטים — הקריאייטיב יצא טוב יותר!&#10;&#10;לדוגמה: 30% הנחה על כל מערכות הישיבה של קולקציית &#34;רויאל&#34;. המבצע לרגל פתיחת הסניף החדש בבני ברק, תקף עד ט׳ אדר. כולל משלוח חינם והרכבה. מיועד למשפחות חרדיות שמחפשות ריהוט איכותי במחיר נגיש."
          className={cn(
            "min-h-[130px] text-base transition-all",
            briefQuality.level === 'weak' && 'border-orange-400/60 focus:border-orange-400',
            briefQuality.level === 'empty' && value.offer.length > 0 && 'border-destructive/60'
          )}
        />
        
        {/* Brief Quality Meter */}
        {value.offer.trim().length > 0 && (
          <div className="space-y-2 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{briefQuality.wordCount} מילים</span>
                <Badge 
                  variant={briefQuality.level === 'strong' ? 'default' : 'secondary'}
                  className={cn(
                    'text-xs',
                    briefQuality.level === 'weak' && 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                    briefQuality.level === 'medium' && 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                    briefQuality.level === 'strong' && 'bg-green-500/20 text-green-400 border-green-500/30'
                  )}
                >
                  {briefQuality.level === 'weak' ? '⚠️ חלש — צריך עוד פרטים' : 
                   briefQuality.level === 'medium' ? '👍 סביר — אפשר לשפר' : 
                   '✅ מעולה!'}
                </Badge>
              </div>
              {briefQuality.level !== 'strong' && (
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
              value={briefQuality.score} 
              className={cn(
                "h-1.5",
                briefQuality.level === 'weak' && '[&>div]:bg-orange-400',
                briefQuality.level === 'medium' && '[&>div]:bg-yellow-400',
                briefQuality.level === 'strong' && '[&>div]:bg-green-400'
              )}
            />

            {/* Missing details hints */}
            {briefQuality.missing.length > 0 && briefQuality.level !== 'strong' && (
              <div className="flex flex-wrap gap-2 mt-1">
                {briefQuality.missing.map((hint, i) => (
                  <span key={i} className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                    💡 {hint}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
        
        {value.offer.trim().length === 0 && (
          <p className="text-xs text-muted-foreground">
            ⚡ ככל שהבריף מפורט יותר — הקריאייטיב יצא מדויק ואיכותי יותר
          </p>
        )}
      </div>

      {/* Campaign Image Upload */}
      <div className="space-y-3">
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
            <button
              type="button"
              onClick={() => campaignImageInputRef.current?.click()}
              className="absolute bottom-1 right-1 bg-background/90 text-foreground text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
            >
              החלף
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

      <div className="space-y-4">
        <Label className="text-foreground font-medium">מה המטרה של הקמפיין?</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {GOAL_OPTIONS.map((goal) => (
            <Card
              key={goal.id}
              className={cn(
                'cursor-pointer transition-all duration-200 border-2',
                value.goal === goal.id
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border hover:border-primary/30'
              )}
              onClick={() => updateBrief({ goal: goal.id })}
            >
              <CardContent className="p-4 text-center">
                <div className={cn(
                  'w-10 h-10 mx-auto rounded-lg flex items-center justify-center mb-2',
                  value.goal === goal.id ? 'bg-primary/20' : 'bg-muted'
                )}>
                  <goal.icon className={cn(
                    'w-5 h-5',
                    value.goal === goal.id ? 'text-primary' : 'text-muted-foreground'
                  )} />
                </div>
                <p className="font-medium text-sm">{goal.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{goal.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Campaign Structure */}
      <div id="campaign-structure" className="space-y-4">
        <Label className="text-foreground font-medium">מבנה הקמפיין *</Label>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Single Ad */}
          <Card
            className={cn(
              'cursor-pointer transition-all duration-300 border-2',
              value.structure === 'single'
                ? 'border-primary bg-primary/5 shadow-lg'
                : 'border-border hover:border-primary/50'
            )}
            onClick={() => updateBrief({ structure: 'single' })}
          >
            <CardContent className="p-6 flex items-start gap-4">
              <div className={cn(
                'w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0',
                value.structure === 'single' ? 'bg-primary/20' : 'bg-muted'
              )}>
                <Zap className={cn(
                  'w-7 h-7',
                  value.structure === 'single' ? 'text-primary' : 'text-muted-foreground'
                )} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-foreground">פרסום נקודתי</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  קריאייטיב אחד ממוקד שמתפרסם בכל ערוצי המדיה שנבחרו.
                </p>
                <div className="flex gap-2 mt-3">
                  <Badge variant="secondary" className="text-xs">מהיר</Badge>
                  <Badge variant="secondary" className="text-xs">חסכוני</Badge>
                </div>
              </div>
              {value.structure === 'single' && (
                <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Series */}
          <Card
            className={cn(
              'cursor-pointer transition-all duration-300 border-2',
              value.structure === 'series'
                ? 'border-primary bg-primary/5 shadow-lg'
                : 'border-border hover:border-primary/50'
            )}
            onClick={() => updateBrief({ structure: 'series' })}
          >
            <CardContent className="p-6 flex items-start gap-4">
              <div className={cn(
                'w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0',
                value.structure === 'series' ? 'bg-primary/20' : 'bg-muted'
              )}>
                <Layers className={cn(
                  'w-7 h-7',
                  value.structure === 'series' ? 'text-primary' : 'text-muted-foreground'
                )} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-foreground">סדרה</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  מספר קריאייטיבים בסגנון אחיד שיוצאים לאורך זמן.
                </p>
                <div className="flex gap-2 mt-3">
                  <Badge variant="secondary" className="text-xs">עומק</Badge>
                  <Badge variant="secondary" className="text-xs">מגוון</Badge>
                </div>
              </div>
              {value.structure === 'series' && (
                <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Tip */}
      {value.structure && (
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 animate-fade-in">
          <p className="text-sm text-foreground">
            {value.structure === 'single' 
              ? '💡 פרסום נקודתי מתאים כשרוצים להעביר מסר ברור ומהיר, כמו מבצע קצר או הודעה חשובה.'
              : '💡 סדרה מתאימה כשרוצים לבנות נרטיב לאורך זמן, כמו השקה מדורגת או סיפור מותג.'}
          </p>
        </div>
      )}

      {/* Brand Colors Selection */}
      {hasBrandColors && (
        <div className="space-y-4 animate-fade-in">
          <Label className="text-foreground font-medium flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" />
            צבעי המותג לקמפיין
          </Label>
          
          {/* Color Preview */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {/* Color Mode Selection */}
              <div className="grid grid-cols-3 border-b">
                {/* Brand Colors (Default) */}
                <button
                  type="button"
                  className={cn(
                    'p-4 text-center transition-all border-l',
                    value.colorSelection.mode === 'brand'
                      ? 'bg-primary/10 border-b-2 border-b-primary'
                      : 'hover:bg-muted/50'
                  )}
                  onClick={() => setColorMode('brand')}
                >
                  <div className="flex justify-center gap-2 mb-2">
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                      style={{ backgroundColor: brandColors?.primary_color || '#ccc' }}
                    />
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white shadow-md mt-1"
                      style={{ backgroundColor: brandColors?.secondary_color || '#ccc' }}
                    />
                  </div>
                  <p className="text-sm font-medium">צבעי המותג</p>
                  <p className="text-xs text-muted-foreground">כפי שהגדרת</p>
                </button>

                {/* Swapped Colors */}
                <button
                  type="button"
                  className={cn(
                    'p-4 text-center transition-all border-l',
                    value.colorSelection.mode === 'swapped'
                      ? 'bg-primary/10 border-b-2 border-b-primary'
                      : 'hover:bg-muted/50'
                  )}
                  onClick={() => setColorMode('swapped')}
                >
                  <div className="flex justify-center gap-2 mb-2">
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                      style={{ backgroundColor: brandColors?.secondary_color || '#ccc' }}
                    />
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white shadow-md mt-1"
                      style={{ backgroundColor: brandColors?.primary_color || '#ccc' }}
                    />
                    <ArrowLeftRight className="w-4 h-4 text-muted-foreground absolute" />
                  </div>
                  <p className="text-sm font-medium">החלפת צבעים</p>
                  <p className="text-xs text-muted-foreground">ראשי ↔ משני</p>
                </button>

                {/* Continue Past Design */}
                <button
                  type="button"
                  className={cn(
                    'p-4 text-center transition-all',
                    value.colorSelection.mode === 'continue-past'
                      ? 'bg-primary/10 border-b-2 border-b-primary'
                      : 'hover:bg-muted/50'
                  )}
                  onClick={() => setColorMode('continue-past')}
                >
                  <div className="flex justify-center mb-2">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <History className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                  <p className="text-sm font-medium">המשך קו עיצובי</p>
                  <p className="text-xs text-muted-foreground">מהקמפיין האחרון</p>
                </button>
              </div>

              {/* Selected Mode Preview */}
              <div className="p-4">
                {value.colorSelection.mode === 'brand' && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-10 h-10 rounded-lg border shadow-sm"
                        style={{ backgroundColor: brandColors?.primary_color || '#ccc' }}
                      />
                      <div className="text-sm">
                        <p className="font-medium">ראשי</p>
                        <p className="text-muted-foreground text-xs" dir="ltr">{brandColors?.primary_color}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-10 h-10 rounded-lg border shadow-sm"
                        style={{ backgroundColor: brandColors?.secondary_color || '#ccc' }}
                      />
                      <div className="text-sm">
                        <p className="font-medium">משני</p>
                        <p className="text-muted-foreground text-xs" dir="ltr">{brandColors?.secondary_color}</p>
                      </div>
                    </div>
                    {brandColors?.background_color && (
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-10 h-10 rounded-lg border shadow-sm"
                          style={{ backgroundColor: brandColors.background_color }}
                        />
                        <div className="text-sm">
                          <p className="font-medium">רקע</p>
                          <p className="text-muted-foreground text-xs" dir="ltr">{brandColors.background_color}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {value.colorSelection.mode === 'swapped' && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-10 h-10 rounded-lg border shadow-sm"
                        style={{ backgroundColor: brandColors?.secondary_color || '#ccc' }}
                      />
                      <div className="text-sm">
                        <p className="font-medium">ראשי (הוחלף)</p>
                        <p className="text-muted-foreground text-xs" dir="ltr">{brandColors?.secondary_color}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-10 h-10 rounded-lg border shadow-sm"
                        style={{ backgroundColor: brandColors?.primary_color || '#ccc' }}
                      />
                      <div className="text-sm">
                        <p className="font-medium">משני (הוחלף)</p>
                        <p className="text-muted-foreground text-xs" dir="ltr">{brandColors?.primary_color}</p>
                      </div>
                    </div>
                  </div>
                )}

                {value.colorSelection.mode === 'continue-past' && (
                  <div className="text-center py-2">
                    <p className="text-sm text-muted-foreground">
                      העיצוב ימשיך את הקו הגרפי של הקמפיין האחרון שלך
                    </p>
                    <Badge variant="secondary" className="mt-2">
                      <History className="w-3 h-3 ml-1" />
                      מבוסס על היסטוריה
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contact Info Selection */}
      {hasAnyContact && (
        <div className="space-y-4">
          <Label className="text-foreground font-medium flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-primary" />
            מה להציג בקמפיין?
          </Label>
          <Card>
            <CardContent className="p-4 space-y-3">
              {contactInfo?.contact_phone && (
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="contact-phone"
                    checked={value.contactSelection.phone}
                    onCheckedChange={() => toggleContact('phone')}
                  />
                  <label htmlFor="contact-phone" className="flex items-center gap-2 cursor-pointer text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>טלפון:</span>
                    <span className="text-muted-foreground" dir="ltr">{contactInfo.contact_phone}</span>
                  </label>
                </div>
              )}
              {contactInfo?.contact_whatsapp && (
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="contact-whatsapp"
                    checked={value.contactSelection.whatsapp}
                    onCheckedChange={() => toggleContact('whatsapp')}
                  />
                  <label htmlFor="contact-whatsapp" className="flex items-center gap-2 cursor-pointer text-sm">
                    <MessageCircle className="w-4 h-4 text-muted-foreground" />
                    <span>וואטסאפ:</span>
                    <span className="text-muted-foreground" dir="ltr">{contactInfo.contact_whatsapp}</span>
                  </label>
                </div>
              )}
              {contactInfo?.contact_email && (
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="contact-email"
                    checked={value.contactSelection.email}
                    onCheckedChange={() => toggleContact('email')}
                  />
                  <label htmlFor="contact-email" className="flex items-center gap-2 cursor-pointer text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>מייל:</span>
                    <span className="text-muted-foreground" dir="ltr">{contactInfo.contact_email}</span>
                  </label>
                </div>
              )}
              {contactInfo?.contact_address && (
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="contact-address"
                    checked={value.contactSelection.address}
                    onCheckedChange={() => toggleContact('address')}
                  />
                  <label htmlFor="contact-address" className="flex items-center gap-2 cursor-pointer text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>כתובת:</span>
                    <span className="text-muted-foreground">{contactInfo.contact_address}</span>
                  </label>
                </div>
              )}
              {contactInfo?.opening_hours && (
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="contact-hours"
                    checked={value.contactSelection.openingHours}
                    onCheckedChange={() => toggleContact('openingHours')}
                  />
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
                      <Checkbox
                        id={`branch-${idx}`}
                        checked={(value.contactSelection.selectedBranches || []).includes(branch)}
                        onCheckedChange={() => toggleBranch(branch)}
                      />
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
                  <Checkbox
                    id="contact-youtube"
                    checked={value.contactSelection.youtube}
                    onCheckedChange={() => toggleContact('youtube')}
                  />
                  <label htmlFor="contact-youtube" className="flex items-center gap-2 cursor-pointer text-sm">
                    <Youtube className="w-4 h-4 text-muted-foreground" />
                    <span>יוטיוב:</span>
                    <span className="text-muted-foreground" dir="ltr">{contactInfo.contact_youtube}</span>
                  </label>
                </div>
              )}
              {contactInfo?.social_facebook && (
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="contact-facebook"
                    checked={value.contactSelection.facebook}
                    onCheckedChange={() => toggleContact('facebook')}
                  />
                  <label htmlFor="contact-facebook" className="flex items-center gap-2 cursor-pointer text-sm">
                    <Facebook className="w-4 h-4 text-muted-foreground" />
                    <span>פייסבוק:</span>
                    <span className="text-muted-foreground" dir="ltr">{contactInfo.social_facebook}</span>
                  </label>
                </div>
              )}
              {contactInfo?.social_instagram && (
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="contact-instagram"
                    checked={value.contactSelection.instagram}
                    onCheckedChange={() => toggleContact('instagram')}
                  />
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
            <p className="text-xs text-muted-foreground">
              טקסט זה יופיע בקריאייטיב בנוסף לפרטי הקשר שנבחרו
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudioBriefStep;
