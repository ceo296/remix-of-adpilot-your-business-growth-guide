import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
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
  History
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
}

export interface ContactInfo {
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
  contact_email?: string | null;
  contact_address?: string | null;
  contact_youtube?: string | null;
  social_facebook?: string | null;
  social_instagram?: string | null;
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
  const updateBrief = (updates: Partial<CampaignBrief>) => {
    onChange({ ...value, ...updates });
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

  const hasAnyContact = contactInfo && (
    contactInfo.contact_phone || 
    contactInfo.contact_whatsapp || 
    contactInfo.contact_email || 
    contactInfo.contact_address ||
    contactInfo.contact_youtube ||
    contactInfo.social_facebook ||
    contactInfo.social_instagram
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
          placeholder="תאר בקצרה את המסר המרכזי של הקמפיין. לדוגמה: 30% הנחה על כל מערכות הישיבה, השקת טעמים חדשים לסדרת המאפים..."
          className="min-h-[100px] text-base"
        />
        <p className="text-xs text-muted-foreground">
          זה יעזור לנו לכוון את הקריאייטיב והמסרים
        </p>
      </div>

      {/* Campaign Goal */}
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
      <div className="space-y-4">
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
                      style={{ backgroundColor: brandColors?.primary_color || '#E31E24' }}
                    />
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white shadow-md mt-1"
                      style={{ backgroundColor: brandColors?.secondary_color || '#000000' }}
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
                      style={{ backgroundColor: brandColors?.secondary_color || '#000000' }}
                    />
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white shadow-md mt-1"
                      style={{ backgroundColor: brandColors?.primary_color || '#E31E24' }}
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
                        style={{ backgroundColor: brandColors?.primary_color || '#E31E24' }}
                      />
                      <div className="text-sm">
                        <p className="font-medium">ראשי</p>
                        <p className="text-muted-foreground text-xs" dir="ltr">{brandColors?.primary_color}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-10 h-10 rounded-lg border shadow-sm"
                        style={{ backgroundColor: brandColors?.secondary_color || '#000000' }}
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
                        style={{ backgroundColor: brandColors?.secondary_color || '#000000' }}
                      />
                      <div className="text-sm">
                        <p className="font-medium">ראשי (הוחלף)</p>
                        <p className="text-muted-foreground text-xs" dir="ltr">{brandColors?.secondary_color}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-10 h-10 rounded-lg border shadow-sm"
                        style={{ backgroundColor: brandColors?.primary_color || '#E31E24' }}
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
