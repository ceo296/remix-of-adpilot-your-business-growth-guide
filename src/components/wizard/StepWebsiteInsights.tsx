import { useState } from 'react';
import { WizardData } from '@/types/wizard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Check, Building2, Clock, Star, Users, Sparkles } from 'lucide-react';
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
  const hasAIPredictions = !!(data.websiteInsights.industry || data.websiteInsights.audience);
  
  // Form values - start with existing data (from AI predictions or previous input)
  const [formValues, setFormValues] = useState({
    businessName: data.brand.name || '',
    industry: data.websiteInsights.industry || '',
    seniority: data.websiteInsights.seniority || '',
    coreOffering: data.websiteInsights.coreOffering || '',
    audience: data.websiteInsights.audience || '',
    audienceOther: '',
  });

  const handleValueChange = (field: string, value: string) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
  };

  const handleConfirm = () => {
    // Validate all required fields
    if (!formValues.businessName.trim()) {
      toast.error('נא להזין שם עסק');
      return;
    }
    if (!formValues.industry) {
      toast.error('נא לבחור תחום עיסוק');
      return;
    }
    if (!formValues.seniority.trim()) {
      toast.error('נא להזין ותק וניסיון');
      return;
    }
    if (!formValues.coreOffering.trim()) {
      toast.error('נא להזין את המוצר/שירות המרכזי');
      return;
    }
    if (!formValues.audience) {
      toast.error('נא לבחור קהל יעד');
      return;
    }
    if (formValues.audience === 'אחר' && !formValues.audienceOther.trim()) {
      toast.error('נא לפרט את קהל היעד');
      return;
    }

    // Determine the final audience value
    const finalAudience = formValues.audience === 'אחר' ? formValues.audienceOther : formValues.audience;

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
        audience: finalAudience,
        confirmed: true,
      },
    });
    onNext();
  };

  const isValid = formValues.businessName.trim() && formValues.industry && formValues.seniority.trim() && formValues.coreOffering.trim() && formValues.audience && (formValues.audience !== 'אחר' || formValues.audienceOther.trim());

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          {isManualMode ? (
            <Building2 className="w-10 h-10 text-primary" />
          ) : hasAIPredictions ? (
            <Sparkles className="w-10 h-10 text-primary" />
          ) : (
            <Check className="w-10 h-10 text-success" />
          )}
        </div>
        <h2 className="text-3xl font-bold text-foreground">
          {isManualMode ? 'ספרו לנו על העסק' : hasAIPredictions ? 'זיהינו את העסק! ✨' : 'השלימו את הפרטים'}
        </h2>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          {isManualMode 
            ? 'מלאו את הפרטים כדי שנוכל להתאים לכם את הקמפיין' 
            : hasAIPredictions 
              ? 'בדקו שהפרטים נכונים - אפשר לערוך אם משהו לא מדויק'
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
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <Label htmlFor="seniority" className="text-sm font-medium">
                  ותק וניסיון *
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
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Star className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <Label htmlFor="coreOffering" className="text-sm font-medium">
                  המוצר/שירות המרכזי *
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

          {/* Audience */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <Label htmlFor="audience" className="text-sm font-medium">
                  קהל היעד *
                </Label>
              </div>
            </div>
            <Select
              value={formValues.audience}
              onValueChange={(value) => handleValueChange('audience', value)}
            >
              <SelectTrigger className={`bg-background ${!formValues.audience ? 'border-destructive/50' : ''}`}>
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
            {formValues.audience === 'אחר' && (
              <Input
                value={formValues.audienceOther}
                onChange={(e) => handleValueChange('audienceOther', e.target.value)}
                placeholder="פרטו את קהל היעד"
                className="mt-2"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Micro-copy */}
      <p className="text-center text-sm text-muted-foreground">
        * כל השדות הם שדות חובה
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
