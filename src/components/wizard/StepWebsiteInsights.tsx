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

// Ordered by market strength/prominence
const INDUSTRY_OPTIONS = [
  'נדל"ן',
  'מוצרי חשמל ואלקטרוניקה',
  'שירותי בריאות',
  'שירותים פיננסיים',
  'חופשות, מלונות וצימרים',
  'ריהוט לבית ולמשרד',
  'מזון',
  'ביוטי וקוסמטיקה',
  'אופנה והלבשה',
  'ספרי ילדים וקודש',
  'טכנולוגיה ומחשוב',
  'חינוך והדרכה',
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

    const finalAudience = formValues.audience === 'אחר' ? formValues.audienceOther : formValues.audience;

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
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 flex items-center justify-center">
          {isManualMode ? (
            <Building2 className="w-10 h-10 text-white" />
          ) : hasAIPredictions ? (
            <Sparkles className="w-10 h-10 text-white" />
          ) : (
            <Check className="w-10 h-10 text-white" />
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
      <Card className="max-w-2xl mx-auto border-2 shadow-xl">
        <CardContent className="p-6 space-y-6">
          {/* Business Name */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200/50 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md shadow-blue-500/30 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <Label htmlFor="businessName" className="text-sm font-semibold text-blue-800">
                שם העסק *
              </Label>
            </div>
            <Input
              id="businessName"
              value={formValues.businessName}
              onChange={(e) => handleValueChange('businessName', e.target.value)}
              placeholder="לדוגמה: רהיטי הבית"
              className="text-lg h-12 bg-white border-blue-200 hover:border-blue-400 focus:border-blue-500"
            />
          </div>

          {/* Industry */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-md shadow-amber-500/30 flex items-center justify-center">
                <Star className="h-5 w-5 text-white" />
              </div>
              <Label htmlFor="industry" className="text-sm font-semibold text-amber-800">
                תחום עיסוק *
              </Label>
            </div>
            <Select
              value={formValues.industry}
              onValueChange={(value) => handleValueChange('industry', value)}
            >
              <SelectTrigger className="text-lg h-12 bg-white border-amber-200 hover:border-amber-400">
                <SelectValue placeholder="בחרו תחום עיסוק" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-amber-200 z-50">
                {INDUSTRY_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option} className="hover:bg-amber-50">
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
                className="mt-2 bg-white border-amber-200"
              />
            )}
          </div>

          {/* Seniority */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200/50 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-md shadow-violet-500/30 flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <Label htmlFor="seniority" className="text-sm font-semibold text-violet-800">
                ותק וניסיון *
              </Label>
            </div>
            <Input
              id="seniority"
              value={formValues.seniority}
              onChange={(e) => handleValueChange('seniority', e.target.value)}
              placeholder="לדוגמה: פעילים משנת 2010 (14 שנה)"
              className="h-12 bg-white border-violet-200 hover:border-violet-400 focus:border-violet-500"
            />
          </div>

          {/* Core Offering */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/50 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/30 flex items-center justify-center">
                <Star className="h-5 w-5 text-white" />
              </div>
              <Label htmlFor="coreOffering" className="text-sm font-semibold text-emerald-800">
                המוצר/שירות המרכזי *
              </Label>
            </div>
            <Input
              id="coreOffering"
              value={formValues.coreOffering}
              onChange={(e) => handleValueChange('coreOffering', e.target.value)}
              placeholder="לדוגמה: מערכות ישיבה בהתאמה אישית"
              className="h-12 bg-white border-emerald-200 hover:border-emerald-400 focus:border-emerald-500"
            />
          </div>

          {/* Audience */}
          <div className={`p-5 rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50 border-2 space-y-3 transition-all ${!formValues.audience ? 'border-destructive/50 ring-2 ring-destructive/20' : 'border-pink-200/50'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 shadow-md shadow-pink-500/30 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <Label htmlFor="audience" className="text-sm font-semibold text-pink-800">
                קהל היעד *
              </Label>
              {!formValues.audience && (
                <span className="text-xs text-destructive font-medium bg-destructive/10 px-2 py-1 rounded-full">
                  שדה חובה
                </span>
              )}
            </div>
            <Select
              value={formValues.audience}
              onValueChange={(value) => handleValueChange('audience', value)}
            >
              <SelectTrigger className={`h-12 bg-white hover:border-pink-400 ${!formValues.audience ? 'border-destructive' : 'border-pink-200'}`}>
                <SelectValue placeholder="בחרו קהל יעד" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-pink-200 z-50">
                {AUDIENCE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option} className="hover:bg-pink-50">
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
                className="mt-2 bg-white border-pink-200"
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
      <div className="flex flex-col gap-4 justify-center max-w-lg mx-auto">
        <Button
          onClick={handleConfirm}
          size="xl"
          variant={isValid ? "gradient" : "secondary"}
          className="w-full"
          disabled={!isValid}
        >
          <Check className="w-5 h-5 ml-2" />
          {isValid ? 'מעולה! אפשר להתקדם' : 'יש למלא את כל השדות'}
        </Button>

        {/* Back Button - Prominent */}
        <Button
          onClick={onPrev}
          variant="outline"
          size="lg"
          className="w-full border-2 border-muted-foreground/30 hover:border-primary hover:bg-primary/5"
        >
          ← חזרה לשלב הקודם
        </Button>
      </div>
    </div>
  );
};

export default StepWebsiteInsights;