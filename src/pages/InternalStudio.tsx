import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowRight, 
  CreditCard, 
  FileText, 
  Presentation, 
  Mail, 
  Calendar,
  Palette,
  Sparkles,
  ChevronLeft,
  Check,
  Phone,
  AtSign,
  MapPin,
  MessageCircle,
  Globe,
  Clock,
  PartyPopper,
  Newspaper,
  Brain
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useClientProfile } from '@/hooks/useClientProfile';
import TopNavbar from '@/components/dashboard/TopNavbar';
import { TemplatePreview } from '@/components/internal/TemplatePreview';
import { BrandingStudio } from '@/components/wizard/BrandingStudio';

interface TemplateCategory {
  id: string;
  name: string;
  nameHe: string;
  description: string;
  icon: React.ElementType;
  templates: Template[];
  comingSoon?: boolean;
  directRoute?: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  aspectRatio: string;
  popular?: boolean;
}

const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: 'business-cards',
    name: 'Business Cards',
    nameHe: 'כרטיסי ביקור',
    description: 'כרטיסים מקצועיים שמשאירים רושם',
    icon: CreditCard,
    templates: [
      { id: 'bc-classic', name: 'קלאסי', description: 'עיצוב נקי ומקצועי', aspectRatio: '3.5:2', popular: true },
      { id: 'bc-modern', name: 'מודרני', description: 'קווים חדים וצבעים נועזים', aspectRatio: '3.5:2' },
      { id: 'bc-minimal', name: 'מינימליסטי', description: 'פחות זה יותר', aspectRatio: '3.5:2' },
      { id: 'bc-premium', name: 'פרימיום', description: 'עיצוב יוקרתי עם אלמנטים מיוחדים', aspectRatio: '3.5:2' },
      { id: 'bc-bold', name: 'בולד', description: 'צבעוני ובולט', aspectRatio: '3.5:2' },
      { id: 'bc-elegant', name: 'אלגנטי', description: 'עדין ומעודן', aspectRatio: '3.5:2' },
    ]
  },
  {
    id: 'letterhead',
    name: 'Letterhead',
    nameHe: 'נייר מכתבים',
    description: 'ניירת רשמית ממותגת',
    icon: Mail,
    templates: [
      { id: 'lh-classic', name: 'קלאסי', description: 'עיצוב רשמי ומכובד', aspectRatio: '1:1.41', popular: true },
      { id: 'lh-modern', name: 'מודרני', description: 'מראה עכשווי ורענן', aspectRatio: '1:1.41' },
      { id: 'lh-minimal', name: 'מינימליסטי', description: 'נקי ופשוט', aspectRatio: '1:1.41' },
    ]
  },
  {
    id: 'presentations',
    name: 'Presentations',
    nameHe: 'מצגות',
    description: 'מצגות מקצועיות ממותגות',
    icon: Presentation,
    comingSoon: false,
    templates: [],
    directRoute: '/presentation-studio',
  },
  {
    id: 'greetings',
    name: 'Greetings',
    nameHe: 'ברכות',
    description: 'ברכות ממותגות לחגים ואירועים',
    icon: PartyPopper,
    comingSoon: false,
    templates: [],
    directRoute: '/greeting-studio',
  },
  {
    id: 'articles',
    name: 'Articles',
    nameHe: 'כתבות פרסומיות',
    description: 'כתבות תוכן שיווקי מקצועיות',
    icon: Newspaper,
    comingSoon: false,
    templates: [
      { id: 'art-product', name: 'כתבת מוצר', description: 'כתבה על מוצר או שירות', aspectRatio: '1:1.41', popular: true },
      { id: 'art-story', name: 'כתבת סיפור', description: 'סיפור העסק / היזם', aspectRatio: '1:1.41' },
      { id: 'art-expert', name: 'כתבת מומחה', description: 'מאמר מקצועי בתחום', aspectRatio: '1:1.41' },
      { id: 'art-seasonal', name: 'כתבה עונתית', description: 'תוכן מותאם לעונה/חג', aspectRatio: '1:1.41' },
    ]
  },
  {
    id: 'strategy-advisor',
    name: 'Strategy Advisor',
    nameHe: 'יועץ אסטרטגי',
    description: 'גבש את המסר המרכזי עם יועץ AI מנוסה',
    icon: Brain,
    comingSoon: false,
    templates: [],
    directRoute: '/strategy-advisor',
  },
  {
    id: 'branding',
    name: 'Branding',
    nameHe: 'מיתוג',
    description: 'עיצוב לוגו, פלטת צבעים וזהות מותגית',
    icon: Palette,
    comingSoon: false,
    templates: [],
    directRoute: '__branding__',
  },
];

const InternalStudio = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useClientProfile();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedContactFields, setSelectedContactFields] = useState<string[]>(['phone', 'email', 'address']);
  const [isDoubleSided, setIsDoubleSided] = useState(true);
  const [paperType, setPaperType] = useState('matte');
  const [cardSize, setCardSize] = useState('90x50');

  // Auto-open branding if navigated with ?open=branding
  const searchParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const [showBrandingStudio, setShowBrandingStudio] = useState(searchParams.get('open') === 'branding');

  const currentCategory = TEMPLATE_CATEGORIES.find(c => c.id === selectedCategory);
  const needsContactPicker = selectedCategory === 'business-cards' || selectedCategory === 'letterhead';

  const CONTACT_FIELD_OPTIONS = [
    { id: 'phone', label: 'טלפון', icon: Phone },
    { id: 'email', label: 'אימייל', icon: AtSign },
    { id: 'address', label: 'כתובת', icon: MapPin },
    { id: 'whatsapp', label: 'וואטסאפ', icon: MessageCircle },
    { id: 'website', label: 'אתר אינטרנט', icon: Globe },
    { id: 'opening_hours', label: 'שעות פתיחה', icon: Clock },
  ];

  const toggleContactField = (fieldId: string) => {
    setSelectedContactFields(prev =>
      prev.includes(fieldId)
        ? prev.filter(f => f !== fieldId)
        : [...prev, fieldId]
    );
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handleContinue = () => {
    if (selectedTemplate && selectedCategory) {
      const contactParams = needsContactPicker ? `&contactFields=${selectedContactFields.join(',')}` : '';
      if (selectedCategory === 'business-cards') {
        const sidesParam = `&sides=${isDoubleSided ? 2 : 1}`;
        navigate(`/business-card-studio?template=${selectedTemplate}${contactParams}${sidesParam}&paper=${paperType}&size=${cardSize}`);
      } else if (selectedCategory === 'letterhead') {
        navigate(`/letterhead-studio?template=${selectedTemplate}${contactParams}`);
      } else if (selectedCategory === 'greetings') {
        const occasion = selectedTemplate.replace('gr-', '');
        navigate(`/greeting-studio?occasion=${occasion}`);
      } else if (selectedCategory === 'articles') {
        const style = selectedTemplate.replace('art-', '');
        navigate(`/article-studio?style=${style}`);
      } else {
        navigate(`/studio?type=internal&category=${selectedCategory}&template=${selectedTemplate}${contactParams}`);
      }
    }
  };

  const handleBack = () => {
    if (selectedCategory) {
      setSelectedCategory(null);
      setSelectedTemplate(null);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNavbar />
      
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="mb-4"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            {selectedCategory ? 'חזרה לקטגוריות' : 'חזרה לדאשבורד'}
          </Button>
          
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg mb-4">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              {selectedCategory ? currentCategory?.nameHe : 'סטודיו חומרים פנימיים'}
            </h1>
            <p className="text-lg text-muted-foreground">
              {selectedCategory 
                ? `בחר תבנית עבור ${profile?.business_name || 'העסק שלך'}`
                : 'צור חומרים ממותגים מקצועיים לעסק שלך'
              }
            </p>
          </div>
        </div>

        {/* Category Selection */}
        {!selectedCategory && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEMPLATE_CATEGORIES.map((category) => (
              <Card
                key={category.id}
                className={`relative overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 ${
                  category.comingSoon ? 'opacity-60' : ''
                }`}
                onClick={() => {
                  if (category.comingSoon) return;
                  if (category.directRoute === '__branding__') { setShowBrandingStudio(true); return; }
                  if (category.directRoute) { navigate(category.directRoute); return; }
                  setSelectedCategory(category.id);
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <category.icon className="w-7 h-7 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-foreground">{category.nameHe}</h3>
                        {category.comingSoon && (
                          <Badge variant="secondary" className="text-xs">בקרוב</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                      {!category.comingSoon && !category.directRoute && category.templates.length > 0 && (
                        <p className="text-xs text-primary mt-2">{category.templates.length} תבניות זמינות</p>
                      )}
                      {!category.comingSoon && category.directRoute && (
                        <p className="text-xs text-primary mt-2">לחץ לפתיחה →</p>
                      )}
                    </div>
                  </div>
                  
                  {!category.comingSoon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Template Selection */}
        {selectedCategory && currentCategory && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-8">
              {currentCategory.templates.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplate === template.id
                      ? 'border-2 border-primary bg-primary/5 shadow-md'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => handleSelectTemplate(template.id)}
                >
                  <CardContent className="p-2">
                    <div className="aspect-[4/3] rounded-md mb-2 relative overflow-hidden border border-border">
                      <TemplatePreview
                        templateId={template.id}
                        primaryColor={profile?.primary_color || '#E34870'}
                        businessName={profile?.business_name || 'שם העסק'}
                        doubleSided={selectedCategory === 'business-cards' ? isDoubleSided : undefined}
                      />
                      {template.popular && (
                        <Badge className="absolute top-1 right-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0">
                          פופולרי
                        </Badge>
                      )}
                      {selectedTemplate === template.id && (
                        <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">{template.name}</h4>
                    <p className="text-[10px] text-muted-foreground leading-tight">{template.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Double-sided toggle for business cards */}
            {selectedCategory === 'business-cards' && (
              <div className="mb-6 max-w-2xl mx-auto space-y-3">
                {/* Double-sided toggle */}
                <Card>
                  <CardContent className="p-4 flex items-center justify-between" dir="rtl">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">סוג הדפסה</h3>
                      <p className="text-xs text-muted-foreground">
                        {isDoubleSided ? 'דו-צדדי — חזית + גב' : 'חד-צדדי — חזית בלבד'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs ${!isDoubleSided ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>חד-צדדי</span>
                      <Switch checked={isDoubleSided} onCheckedChange={setIsDoubleSided} />
                      <span className={`text-xs ${isDoubleSided ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>דו-צדדי</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Paper type & card size */}
                <Card>
                  <CardContent className="p-4 space-y-4" dir="rtl">
                    {/* Card size */}
                    <div>
                      <h3 className="text-sm font-bold text-foreground mb-2">גודל כרטיס</h3>
                      <div className="flex gap-2">
                        {[
                          { id: '90x50', label: '90×50 מ״מ', desc: 'סטנדרטי' },
                          { id: '85x55', label: '85×55 מ״מ', desc: 'אירופאי' },
                        ].map(size => (
                          <div
                            key={size.id}
                            className={`flex-1 p-3 rounded-lg border cursor-pointer transition-all text-center ${
                              cardSize === size.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                            }`}
                            onClick={() => setCardSize(size.id)}
                          >
                            <div className="text-sm font-medium text-foreground">{size.label}</div>
                            <div className="text-[10px] text-muted-foreground">{size.desc}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Paper type */}
                    <div>
                      <h3 className="text-sm font-bold text-foreground mb-2">סוג נייר</h3>
                      <div className="flex gap-2">
                        {[
                          { id: 'matte', label: 'מט', desc: 'מגע חלק ואלגנטי' },
                          { id: 'glossy', label: 'מבריק', desc: 'ברק וצבעים חיים' },
                          { id: 'chromo', label: 'כרומו', desc: 'עבה ואיכותי' },
                        ].map(paper => (
                          <div
                            key={paper.id}
                            className={`flex-1 p-3 rounded-lg border cursor-pointer transition-all text-center ${
                              paperType === paper.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                            }`}
                            onClick={() => setPaperType(paper.id)}
                          >
                            <div className="text-sm font-medium text-foreground">{paper.label}</div>
                            <div className="text-[10px] text-muted-foreground">{paper.desc}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Contact Fields Picker */}
            {needsContactPicker && selectedTemplate && (
              <Card className="mb-8 max-w-2xl mx-auto">
                <CardContent className="p-6" dir="rtl">
                  <h3 className="text-base font-bold text-foreground mb-1">אילו פרטים יופיעו?</h3>
                  <p className="text-sm text-muted-foreground mb-4">בחר אילו פרטי קשר יוצגו על {selectedCategory === 'business-cards' ? 'כרטיס הביקור' : 'נייר המכתבים'}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {CONTACT_FIELD_OPTIONS.map((field) => {
                      const isSelected = selectedContactFields.includes(field.id);
                      const fieldMap: Record<string, string> = { phone: 'contact_phone', email: 'contact_email', address: 'contact_address', whatsapp: 'contact_whatsapp', website: 'website_url', opening_hours: 'opening_hours' };
                      const profileValue = profile?.[fieldMap[field.id] as keyof typeof profile];
                      return (
                        <div
                          key={field.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                          }`}
                          onClick={() => toggleContactField(field.id)}
                        >
                          <Checkbox checked={isSelected} onCheckedChange={() => toggleContactField(field.id)} className="pointer-events-none" />
                          <field.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <Label className="text-sm font-medium cursor-pointer">{field.label}</Label>
                            {profileValue && <p className="text-[10px] text-muted-foreground truncate">{String(profileValue)}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {selectedContactFields.length === 0 && (
                    <p className="text-xs text-destructive mt-2">יש לבחור לפחות פרט קשר אחד</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Continue Button */}
            <div className="flex justify-center">
              <Button
                variant="gradient"
                size="xl"
                onClick={handleContinue}
                disabled={!selectedTemplate || (needsContactPicker && selectedContactFields.length === 0)}
                className="min-w-[300px] h-14 text-lg font-bold"
              >
                <Sparkles className="w-5 h-5 ml-2" />
                {selectedCategory === 'articles' ? 'המשך' : 'המשך לעיצוב'}
              </Button>
            </div>
          </>
        )}

        {/* Brand Info */}
        {profile && (
          <div className="mt-12 p-4 rounded-xl bg-muted/50 border border-border max-w-md mx-auto">
            <div className="flex items-center gap-3">
              {profile.logo_url && (
                <img 
                  src={profile.logo_url} 
                  alt={profile.business_name} 
                  className="w-12 h-12 rounded-lg object-contain bg-white p-1"
                />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">{profile.business_name}</p>
                <p className="text-xs text-muted-foreground">כל החומרים יעוצבו עם המיתוג שלך</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Branding Studio Modal */}
      <BrandingStudio
        isOpen={showBrandingStudio}
        onClose={() => setShowBrandingStudio(false)}
        businessName={profile?.business_name || 'העסק שלי'}
        onBrandingComplete={(branding) => {
          setShowBrandingStudio(false);
          // After branding, route to onboarding to complete remaining steps (MRI, contacts, etc.)
          navigate('/onboarding?from=branding');
        }}
      />
    </div>
  );
};

export default InternalStudio;
