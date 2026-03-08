import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  ArrowRight, 
  CreditCard, 
  FileText, 
  Presentation, 
  Mail, 
  Calendar,
  BookOpen,
  Sparkles,
  ChevronLeft,
  Check,
  Phone,
  AtSign,
  MapPin,
  MessageCircle,
  Globe,
  Clock
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useClientProfile } from '@/hooks/useClientProfile';
import TopNavbar from '@/components/dashboard/TopNavbar';
import { TemplatePreview } from '@/components/internal/TemplatePreview';

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
      { id: 'bc-classic', name: 'קלאסי דו-צדדי', description: 'עיצוב נקי ומקצועי · דו-צדדי', aspectRatio: '3.5:2', popular: true },
      { id: 'bc-modern', name: 'מודרני דו-צדדי', description: 'קווים חדים וצבעים נועזים · דו-צדדי', aspectRatio: '3.5:2' },
      { id: 'bc-minimal', name: 'מינימליסטי', description: 'פחות זה יותר · חד-צדדי', aspectRatio: '3.5:2' },
      { id: 'bc-premium', name: 'פרימיום דו-צדדי', description: 'עיצוב יוקרתי · דו-צדדי', aspectRatio: '3.5:2' },
      { id: 'bc-bold', name: 'בולד דו-צדדי', description: 'צבעוני ובולט · דו-צדדי', aspectRatio: '3.5:2' },
      { id: 'bc-elegant', name: 'אלגנטי', description: 'עדין ומעודן · חד-צדדי', aspectRatio: '3.5:2' },
    ]
  },
  {
    id: 'flyers',
    name: 'Flyers',
    nameHe: 'פליירים',
    description: 'עלונים להפצה ושיווק',
    icon: FileText,
    templates: [
      { id: 'flyer-a5', name: 'A5 קלאסי', description: 'גודל סטנדרטי להפצה', aspectRatio: '1:1.41', popular: true },
      { id: 'flyer-a4', name: 'A4 מלא', description: 'דף שלם לפרטים מרובים', aspectRatio: '1:1.41' },
      { id: 'flyer-dl', name: 'DL ארוך', description: 'פורמט צר ואלגנטי', aspectRatio: '1:2.1' },
      { id: 'flyer-square', name: 'ריבועי', description: 'פורמט מודרני ויחודי', aspectRatio: '1:1' },
    ]
  },
  {
    id: 'invitations',
    name: 'Invitations',
    nameHe: 'הזמנות',
    description: 'הזמנות לאירועים ושמחות',
    icon: Calendar,
    templates: [
      { id: 'inv-wedding', name: 'חתונה', description: 'הזמנות חתונה מעוצבות', aspectRatio: '5:7', popular: true },
      { id: 'inv-bar', name: 'בר מצווה', description: 'הזמנות לשמחת בר/בת מצווה', aspectRatio: '5:7' },
      { id: 'inv-brit', name: 'ברית/שלום זכר', description: 'הזמנות לברית או שלום זכר', aspectRatio: '5:7' },
      { id: 'inv-event', name: 'אירוע כללי', description: 'הזמנות לכל סוגי האירועים', aspectRatio: '5:7' },
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
    id: 'catalogs',
    name: 'Catalogs',
    nameHe: 'קטלוגים',
    description: 'קטלוגי מוצרים ושירותים',
    icon: BookOpen,
    comingSoon: false,
    templates: [],
    directRoute: '/catalog-studio',
  },
];

const InternalStudio = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useClientProfile();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedContactFields, setSelectedContactFields] = useState<string[]>(['phone', 'email', 'address']);

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
      navigate(`/studio?type=internal&category=${selectedCategory}&template=${selectedTemplate}${contactParams}`);
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
                      {!category.comingSoon && (
                        <p className="text-xs text-primary mt-2">{category.templates.length} תבניות זמינות</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {currentCategory.templates.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedTemplate === template.id
                      ? 'border-2 border-primary bg-primary/5 shadow-lg'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => handleSelectTemplate(template.id)}
                >
                  <CardContent className="p-4">
                    {/* Template Preview Placeholder */}
                    <div className="aspect-[3/4] rounded-lg mb-3 relative overflow-hidden border border-border">
                      <TemplatePreview
                        templateId={template.id}
                        primaryColor={profile?.primary_color || '#E34870'}
                        businessName={profile?.business_name || 'שם העסק'}
                      />
                      {template.popular && (
                        <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs">
                          פופולרי
                        </Badge>
                      )}
                      {selectedTemplate === template.id && (
                        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    
                    <h4 className="font-semibold text-foreground">{template.name}</h4>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

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
                המשך לעיצוב
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
    </div>
  );
};

export default InternalStudio;
