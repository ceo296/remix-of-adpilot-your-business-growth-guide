import { useState, useEffect } from 'react';
import { WizardData } from '@/types/wizard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Check, Building2, Clock, Star, Users, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StepWebsiteInsightsProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

interface InsightField {
  id: string;
  label: string;
  sublabel: string;
  value: string;
  placeholder: string;
  icon: React.ReactNode;
  type: 'text' | 'select';
  options?: string[];
}

const LOADING_MESSAGES = [
  'סורק מוצרים...',
  'קורא את האודות...',
  'מנתח שפה ומסרים...',
  'מזהה קהל יעד...',
  'מסכם תובנות...',
];

const INDUSTRY_OPTIONS = [
  'ריהוט לבית ולמשרד',
  'מזון ומאפים',
  'טכנולוגיה ומחשוב',
  'אופנה והלבשה',
  'שירותי בריאות',
  'חינוך והדרכה',
  'נדל"ן',
  'שירותים פיננסיים',
  'אירועים ושמחות',
  'אחר',
];

const AUDIENCE_OPTIONS = [
  'משפחות חרדיות',
  'קהילות חסידיות',
  'ציבור ליטאי',
  'נשים חרדיות',
  'גברים חרדיים',
  'בעלי עסקים',
  'מוסדות חינוך',
  'כלל הציבור החרדי',
  'אחר',
];

const StepWebsiteInsights = ({ data, updateData, onNext, onPrev }: StepWebsiteInsightsProps) => {
  const isManualMode = !data.websiteUrl;
  const [isLoading, setIsLoading] = useState(!isManualMode);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [scrapeFailed, setScrapeFailed] = useState(false);
  
  // Form values - start empty for manual mode
  const [formValues, setFormValues] = useState({
    businessName: data.brand.name || '',
    industry: data.websiteInsights.industry || '',
    seniority: data.websiteInsights.seniority || '',
    coreOffering: data.websiteInsights.coreOffering || '',
    audience: data.websiteInsights.audience || '',
  });

  // Simulate loading with animated messages (only for website mode)
  useEffect(() => {
    if (isLoading && !isManualMode) {
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => {
          if (prev >= LOADING_MESSAGES.length - 1) {
            clearInterval(interval);
            // After all messages, "attempt" to scrape
            setTimeout(() => {
              // Simulate scrape failure - leave fields empty
              setScrapeFailed(true);
              setFormValues({
                businessName: data.brand.name || '',
                industry: '',
                seniority: '',
                coreOffering: '',
                audience: '',
              });
              setIsLoading(false);
              toast.warning('לא הצלחנו לקרוא הכל, אנא השלימו את הפרטים החסרים');
            }, 500);
            return prev;
          }
          return prev + 1;
        });
      }, 800);

      return () => clearInterval(interval);
    }
  }, [isLoading, isManualMode, data.brand.name]);

  const handleValueChange = (field: string, value: string) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
  };

  const handleConfirm = () => {
    // Validate required fields
    if (!formValues.businessName.trim()) {
      toast.error('נא להזין שם עסק');
      return;
    }
    if (!formValues.industry) {
      toast.error('נא לבחור תחום עיסוק');
      return;
    }

    // Save insights to wizard data
    updateData({
      brand: {
        ...data.brand,
        name: formValues.businessName,
      },
      websiteInsights: {
        industry: formValues.industry,
        seniority: formValues.seniority,
        coreOffering: formValues.coreOffering,
        audience: formValues.audience,
        confirmed: true,
      },
    });
    onNext();
  };

  const isValid = formValues.businessName.trim() && formValues.industry;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <div className="relative w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xl font-semibold text-foreground">
              לומדים את העסק שלכם...
            </p>
            <div className="flex flex-col items-center gap-2">
              {LOADING_MESSAGES.map((msg, idx) => (
                <p 
                  key={msg}
                  className={`text-sm transition-all duration-300 ${
                    idx === loadingMessageIndex 
                      ? 'text-primary font-medium' 
                      : idx < loadingMessageIndex 
                        ? 'text-success' 
                        : 'text-muted-foreground'
                  }`}
                >
                  {idx < loadingMessageIndex && '✓ '}
                  {idx === loadingMessageIndex && '⏳ '}
                  {msg}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          {isManualMode ? (
            <Building2 className="w-10 h-10 text-primary" />
          ) : scrapeFailed ? (
            <AlertCircle className="w-10 h-10 text-warning" />
          ) : (
            <Check className="w-10 h-10 text-success" />
          )}
        </div>
        <h2 className="text-3xl font-bold text-foreground">
          {isManualMode ? 'ספרו לנו על העסק' : 'השלימו את הפרטים'}
        </h2>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          {isManualMode 
            ? 'מלאו את הפרטים כדי שנוכל להתאים לכם את הקמפיין' 
            : scrapeFailed 
              ? 'לא הצלחנו לאסוף את כל המידע - אנא השלימו'
              : 'אם משהו לא מדויק - אפשר לערוך'
          }
        </p>
      </div>

      {/* Form Card */}
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6 space-y-6">
          {/* Business Name */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <Label htmlFor="businessName" className="text-sm font-medium">
                  שם העסק *
                </Label>
              </div>
            </div>
            <Input
              id="businessName"
              value={formValues.businessName}
              onChange={(e) => handleValueChange('businessName', e.target.value)}
              placeholder="לדוגמה: רהיטי הבית"
              className="text-lg"
            />
          </div>

          {/* Industry */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Star className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <Label htmlFor="industry" className="text-sm font-medium">
                  תחום עיסוק *
                </Label>
              </div>
            </div>
            <Select
              value={formValues.industry}
              onValueChange={(value) => handleValueChange('industry', value)}
            >
              <SelectTrigger className="text-lg bg-background">
                <SelectValue placeholder="בחרו תחום עיסוק" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border z-50">
                {INDUSTRY_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formValues.industry === 'אחר' && (
              <Input
                value={formValues.coreOffering}
                onChange={(e) => handleValueChange('coreOffering', e.target.value)}
                placeholder="פרטו את תחום העיסוק"
                className="mt-2"
              />
            )}
          </div>

          {/* Seniority */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                <Clock className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <Label htmlFor="seniority" className="text-sm font-medium">
                  ותק וניסיון
                </Label>
              </div>
            </div>
            <Input
              id="seniority"
              value={formValues.seniority}
              onChange={(e) => handleValueChange('seniority', e.target.value)}
              placeholder="לדוגמה: פעילים משנת 2010 (14 שנה)"
            />
          </div>

          {/* Core Offering */}
          {formValues.industry !== 'אחר' && (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                  <Star className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <Label htmlFor="coreOffering" className="text-sm font-medium">
                    המוצר/שירות המרכזי
                  </Label>
                </div>
              </div>
              <Input
                id="coreOffering"
                value={formValues.coreOffering}
                onChange={(e) => handleValueChange('coreOffering', e.target.value)}
                placeholder="לדוגמה: מערכות ישיבה בהתאמה אישית"
              />
            </div>
          )}

          {/* Audience */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                <Users className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <Label htmlFor="audience" className="text-sm font-medium">
                  קהל היעד
                </Label>
              </div>
            </div>
            <Select
              value={formValues.audience}
              onValueChange={(value) => handleValueChange('audience', value)}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="בחרו קהל יעד" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border z-50">
                {AUDIENCE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Micro-copy */}
      <p className="text-center text-sm text-muted-foreground">
        * שדות חובה | השאר השדות אופציונליים אך יעזרו לנו להתאים טוב יותר
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
        <Button
          onClick={handleConfirm}
          size="xl"
          variant="gradient"
          className="flex-1"
          disabled={!isValid}
        >
          <Check className="w-5 h-5 ml-2" />
          מעולה! אפשר להתקדם
        </Button>
      </div>

      {/* Back Link */}
      <div className="text-center">
        <button
          onClick={onPrev}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
        >
          חזרה לשלב הקודם
        </button>
      </div>
    </div>
  );
};

export default StepWebsiteInsights;
