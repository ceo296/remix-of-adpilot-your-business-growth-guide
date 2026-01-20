import { useState, useEffect } from 'react';
import { WizardData, XFactorType, CompetitorPosition } from '@/types/wizard';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Trophy, Package, Tag, Heart, Sparkles, Users, User, Plus, X, GripHorizontal, Bot, Edit3 } from 'lucide-react';
import { getYourWord } from '@/lib/honorific-utils';

interface StepProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const X_FACTORS: { id: XFactorType; label: string; description: string; icon: React.ElementType }[] = [
  { id: 'veteran', label: 'הוותק והניסיון', description: 'אני פה כבר 30 שנה, כולם מכירים אותי.', icon: Trophy },
  { id: 'product', label: 'עליונות מוצרית', description: 'המוצר שלי פשוט יותר טוב טכנית/פיזית.', icon: Package },
  { id: 'price', label: 'המחיר', description: 'אני הכי זול/משתלם בקטגוריה.', icon: Tag },
  { id: 'service', label: 'השירות והיחס', description: 'אצלי מקבלים יחס שאין אצל המתחרים.', icon: Heart },
  { id: 'brand', label: 'הבטחה פרסומית', description: 'המוצר דומה, אבל הסיפור שלנו אחר.', icon: Sparkles },
];

// TARGET_AUDIENCES removed - now using free text fields

const StepStrategicMRI = ({ data, updateData, onNext, onPrev }: StepProps) => {
  const [newCompetitor, setNewCompetitor] = useState('');
  const [botMessage, setBotMessage] = useState<string | null>(null);
  const [otherXFactor, setOtherXFactor] = useState(data.strategicMRI.otherXFactor || '');
  const [isOtherSelected, setIsOtherSelected] = useState(!!data.strategicMRI.otherXFactor);
  const [noCompetitors, setNoCompetitors] = useState(data.strategicMRI.noCompetitors || false);
  const toggleOtherXFactor = () => {
    if (isOtherSelected) {
      setIsOtherSelected(false);
      setOtherXFactor('');
      updateMRI({ otherXFactor: '' });
    } else {
      setIsOtherSelected(true);
    }
  };

  const handleOtherXFactorChange = (value: string) => {
    setOtherXFactor(value);
    updateMRI({ otherXFactor: value });
  };

  const mri = data.strategicMRI;

  const updateMRI = (updates: Partial<typeof mri>) => {
    updateData({
      strategicMRI: { ...mri, ...updates },
    });
  };

  // Generate bot message based on selections
  useEffect(() => {
    const hasVeteran = mri.xFactors.includes('veteran');
    const hasPrice = mri.xFactors.includes('price');
    const isPremium = mri.myPosition.x > 30;
    const isMassMarket = mri.myPosition.x < -30;

    if (hasVeteran && isPremium) {
      setBotMessage('הבנתי, משדרים יציבות ויוקרה. אולד-סקול איכותי.');
    } else if (hasPrice && isMassMarket) {
      setBotMessage("הבנתי, נלך על מסרים של 'אסור לפספס' ומבצעים.");
    } else if (mri.xFactors.length > 0 && (mri.endConsumer || mri.decisionMaker)) {
      setBotMessage('מעולה! יש לי תמונה ברורה של הפוזיציה שלכם.');
    } else {
      setBotMessage(null);
    }
  }, [mri.xFactors, mri.myPosition, mri.endConsumer, mri.decisionMaker]);

  const toggleXFactor = (factor: XFactorType) => {
    const current = mri.xFactors;
    if (current.includes(factor)) {
      updateMRI({
        xFactors: current.filter((f) => f !== factor),
        primaryXFactor: mri.primaryXFactor === factor ? null : mri.primaryXFactor,
      });
    } else {
      updateMRI({
        xFactors: [...current, factor],
      });
    }
  };

  const setPrimaryXFactor = (factor: XFactorType) => {
    if (!mri.xFactors.includes(factor)) {
      updateMRI({
        xFactors: [...mri.xFactors, factor],
        primaryXFactor: factor,
      });
    } else {
      updateMRI({ primaryXFactor: factor });
    }
  };

  const addCompetitor = () => {
    if (newCompetitor.trim() && mri.competitors.length < 3) {
      const newId = `comp-${Date.now()}`;
      updateMRI({
        competitors: [...mri.competitors, newCompetitor.trim()],
        competitorPositions: [
          ...mri.competitorPositions,
          { id: newId, name: newCompetitor.trim(), x: 0, y: 0 },
        ],
      });
      setNewCompetitor('');
    }
  };

  const removeCompetitor = (index: number) => {
    const newComps = mri.competitors.filter((_, i) => i !== index);
    const newPositions = mri.competitorPositions.filter((_, i) => i !== index);
    updateMRI({
      competitors: newComps,
      competitorPositions: newPositions,
    });
  };

  const updateCompetitorPosition = (index: number, x: number, y: number) => {
    const newPositions = [...mri.competitorPositions];
    newPositions[index] = { ...newPositions[index], x, y };
    updateMRI({ competitorPositions: newPositions });
  };

  const hasValidXFactors = mri.xFactors.length > 0 || (isOtherSelected && otherXFactor.trim().length > 0);
  const otherNeedsText = isOtherSelected && otherXFactor.trim().length === 0;
  const hasValidAudience = mri.endConsumer === 'private' || mri.endConsumer === 'b2b' || mri.endConsumer === 'both';
  const hasValidCompetitors = noCompetitors || mri.competitors.length > 0;
  const isValid = hasValidXFactors && !otherNeedsText && hasValidAudience && hasValidCompetitors;

  const toggleNoCompetitors = () => {
    const newValue = !noCompetitors;
    setNoCompetitors(newValue);
    updateMRI({ noCompetitors: newValue });
    if (newValue) {
      // Clear competitors when selecting "no competitors"
      updateMRI({ competitors: [], competitorPositions: [], noCompetitors: newValue });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">תעודת הזהות העסקית</h2>
        <p className="text-muted-foreground">לפני שמדברים על עיצוב, בואו נבין את ה-DNA האסטרטגי {getYourWord(data.honorific)}</p>
      </div>

      {/* Section 1: The 'Why You?' */}
      <Card className="border-2 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            למה שהלקוח יבחר דווקא בך?
          </h3>
          <p className="text-sm text-white/80">בחר את הגורמים המבדלים (אפשר יותר מאחד, ואז לסמן את העיקרי)</p>
        </div>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {X_FACTORS.map((factor) => {
              const isSelected = mri.xFactors.includes(factor.id);
              const isPrimary = mri.primaryXFactor === factor.id;
              const gradients: Record<string, string> = {
                veteran: 'from-amber-500 to-orange-500',
                product: 'from-blue-500 to-cyan-500',
                price: 'from-emerald-500 to-teal-500',
                service: 'from-pink-500 to-rose-500',
                brand: 'from-violet-500 to-purple-600',
              };
              const shadows: Record<string, string> = {
                veteran: 'shadow-amber-500/30',
                product: 'shadow-blue-500/30',
                price: 'shadow-emerald-500/30',
                service: 'shadow-pink-500/30',
                brand: 'shadow-violet-500/30',
              };
              return (
                <div
                  key={factor.id}
                  onClick={() => toggleXFactor(factor.id)}
                  className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? isPrimary
                        ? 'border-primary bg-primary/10 shadow-lg'
                        : 'border-primary/50 bg-primary/5'
                      : 'border-border bg-card hover:border-primary/30 hover:shadow-md'
                  }`}
                >
                  {isSelected && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPrimaryXFactor(factor.id);
                      }}
                      className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full ${
                        isPrimary
                          ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-sm'
                          : 'bg-muted text-muted-foreground hover:bg-primary/20'
                      }`}
                    >
                      {isPrimary ? '⭐ עיקרי' : 'הפוך לעיקרי'}
                    </button>
                  )}
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                      isSelected 
                        ? `bg-gradient-to-br ${gradients[factor.id]} shadow-md ${shadows[factor.id]}` 
                        : 'bg-muted'
                    }`}>
                      <factor.icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 mt-1">
                      <p className="font-semibold text-foreground">{factor.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{factor.description}</p>
                    </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Other Option */}
              <div
                onClick={toggleOtherXFactor}
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  isOtherSelected
                    ? otherNeedsText
                      ? 'border-destructive bg-gradient-to-br from-red-50 to-rose-50'
                      : 'border-primary/50 bg-gradient-to-br from-slate-50 to-gray-50'
                    : 'border-border bg-card hover:border-primary/30 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    isOtherSelected 
                      ? otherNeedsText 
                        ? 'bg-gradient-to-br from-red-500 to-rose-500 shadow-md shadow-red-500/30' 
                        : 'bg-gradient-to-br from-slate-600 to-gray-700 shadow-md shadow-slate-500/30'
                      : 'bg-muted'
                  }`}>
                    <Edit3 className={`w-6 h-6 ${isOtherSelected ? 'text-white' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 mt-1">
                    <p className="font-semibold text-foreground">אחר</p>
                    <p className="text-xs text-muted-foreground mt-1">יש לי סיבה ייחודית משלי</p>
                  </div>
                </div>
                {isOtherSelected && (
                  <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                    <Textarea
                      value={otherXFactor}
                      onChange={(e) => handleOtherXFactorChange(e.target.value)}
                      placeholder="תארו את הגורם המבדל הייחודי..."
                      className={`min-h-[60px] text-sm bg-white ${otherNeedsText ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />
                    {otherNeedsText && (
                      <p className="text-xs text-destructive mt-1">יש למלא את השדה</p>
                    )}
                  </div>
                )}
              </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Reality Check - Visual Advantage Spectrum */}
      <Card className="border-border overflow-hidden">
        <CardContent className="p-6 space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-1">בואו נהיה כנים - איפה היתרון יושב?</h3>
            <p className="text-sm text-muted-foreground">לחצו על הצד שמתאים יותר לעסק</p>
          </div>
          
          {/* Visual Toggle Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Physical Advantage */}
            <div
              onClick={() => updateMRI({ advantageSlider: 20, advantageType: 'hard' })}
              className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 text-center ${
                mri.advantageSlider < 50
                  ? 'border-primary bg-primary/10 shadow-lg scale-[1.02]'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-colors ${
                mri.advantageSlider < 50 ? 'bg-primary/20' : 'bg-muted'
              }`}>
                <Package className={`w-8 h-8 ${mri.advantageSlider < 50 ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <h4 className="font-bold text-foreground mb-2">יתרון פיזי מובהק</h4>
              <p className="text-sm text-muted-foreground">טעים יותר, חזק יותר, מהיר יותר</p>
              <div className="mt-3 flex flex-wrap gap-1 justify-center">
                <Badge variant="secondary" className="text-xs">איכות</Badge>
                <Badge variant="secondary" className="text-xs">ביצועים</Badge>
                <Badge variant="secondary" className="text-xs">עובדות</Badge>
              </div>
              {mri.advantageSlider < 50 && (
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>

            {/* Emotional Advantage */}
            <div
              onClick={() => updateMRI({ advantageSlider: 80, advantageType: 'soft' })}
              className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 text-center ${
                mri.advantageSlider >= 50
                  ? 'border-primary bg-primary/10 shadow-lg scale-[1.02]'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-colors ${
                mri.advantageSlider >= 50 ? 'bg-primary/20' : 'bg-muted'
              }`}>
                <Heart className={`w-8 h-8 ${mri.advantageSlider >= 50 ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <h4 className="font-bold text-foreground mb-2">יתרון תדמיתי/רגשי</h4>
              <p className="text-sm text-muted-foreground">יוקרה, היימיש, סטייל, כיף</p>
              <div className="mt-3 flex flex-wrap gap-1 justify-center">
                <Badge variant="secondary" className="text-xs">תחושה</Badge>
                <Badge variant="secondary" className="text-xs">סיפור</Badge>
                <Badge variant="secondary" className="text-xs">חוויה</Badge>
              </div>
              {mri.advantageSlider >= 50 && (
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {mri.advantageSlider < 50 && (
            <div className="animate-fade-in pt-2">
              <Label htmlFor="winning-feature" className="text-foreground">מה הפיצ׳ר המנצח?</Label>
              <Input
                id="winning-feature"
                value={mri.winningFeature}
                onChange={(e) => updateMRI({ winningFeature: e.target.value })}
                placeholder="לדוגמה: הכי מהיר בשוק, 100% טבעי..."
                className="mt-2"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 3: The Arena - Simplified & Cleaner */}
      <Card className="border-border">
        <CardContent className="p-6 md:p-8 space-y-10">
          <div className="text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">איפה אתם ממוקמים בשוק?</h3>
            <p className="text-lg text-muted-foreground">הגדירו את הפוזיציה בשני צירים פשוטים</p>
          </div>

          {/* Price Positioning - Enhanced Design */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200/50 space-y-6">
            <div className="flex items-center justify-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30 flex items-center justify-center">
                <Tag className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-emerald-800">רמת מחיר</span>
            </div>
            
            {/* Labels above slider */}
            <div className="flex justify-between items-center px-2" dir="rtl">
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="text-3xl">💎</span>
                <span className="text-base font-bold text-emerald-700">פרימיום / יוקרה</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="text-3xl">💰</span>
                <span className="text-base font-bold text-emerald-700">זול / משתלם</span>
              </div>
            </div>

            <div className="relative py-4 px-4" dir="ltr">
              <Slider
                value={[mri.myPosition.x + 100]}
                onValueChange={(value) => updateMRI({ myPosition: { ...mri.myPosition, x: value[0] - 100 } })}
                max={200}
                step={10}
                className="w-full h-3"
              />
            </div>

            <div className="text-center">
              <Badge className={`text-lg px-6 py-2.5 ${
                mri.myPosition.x < -30 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                  : mri.myPosition.x > 30 
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white' 
                    : 'bg-gradient-to-r from-slate-500 to-gray-500 text-white'
              }`}>
                {mri.myPosition.x < -30 ? '💰 זול / משתלם' : mri.myPosition.x > 30 ? '💎 פרימיום / יוקרה' : '⚖️ מחיר ביניים'}
              </Badge>
            </div>
          </div>

          {/* Style Positioning - Enhanced Design */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200/50 space-y-6">
            <div className="flex items-center justify-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-violet-800">סגנון תקשורת</span>
            </div>
            
            {/* Labels above slider */}
            <div className="flex justify-between items-center px-2" dir="rtl">
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="text-3xl">✨</span>
                <span className="text-base font-bold text-violet-700">מודרני / חדשני</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="text-3xl">🏛️</span>
                <span className="text-base font-bold text-violet-700">קלאסי / מסורתי</span>
              </div>
            </div>

            <div className="relative py-4 px-4" dir="ltr">
              <Slider
                value={[mri.myPosition.y + 100]}
                onValueChange={(value) => updateMRI({ myPosition: { ...mri.myPosition, y: value[0] - 100 } })}
                max={200}
                step={10}
                className="w-full h-3"
              />
            </div>

            <div className="text-center">
              <Badge className={`text-lg px-6 py-2.5 ${
                mri.myPosition.y < -30 
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white' 
                  : mri.myPosition.y > 30 
                    ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white' 
                    : 'bg-gradient-to-r from-slate-500 to-gray-500 text-white'
              }`}>
                {mri.myPosition.y < -30 ? '🏛️ קלאסי / מסורתי' : mri.myPosition.y > 30 ? '✨ מודרני / חדשני' : '⚖️ סגנון מאוזן'}
              </Badge>
            </div>
          </div>

          {/* Summary Card - Prominent */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/30">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shrink-0">
                אני
              </div>
              <div>
                <p className="font-bold text-xl text-foreground">הפוזיציה שלכם:</p>
                <p className="text-lg text-muted-foreground mt-2">
                  {mri.myPosition.x < -30 ? 'זול ומשתלם' : mri.myPosition.x > 30 ? 'פרימיום ויוקרתי' : 'מחיר ביניים'}
                  {' • '}
                  {mri.myPosition.y < -30 ? 'סגנון קלאסי ומסורתי' : mri.myPosition.y > 30 ? 'סגנון מודרני וחדשני' : 'סגנון מאוזן'}
                </p>
              </div>
            </div>
          </div>

          {/* Competitors Section - Required - Prominent Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-gray-100 border-2 border-slate-200 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-600 to-gray-700 shadow-md flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-lg font-bold text-foreground">מתחרים עיקריים</span>
                  <span className="text-destructive mr-1">*</span>
                </div>
              </div>
              <span className="text-sm text-muted-foreground bg-white px-3 py-1 rounded-full">עד 3 מתחרים</span>
            </div>
            
            {!noCompetitors && (
              <>
                <div className="flex gap-3">
                  <Input
                    value={newCompetitor}
                    onChange={(e) => setNewCompetitor(e.target.value)}
                    placeholder="שם המתחרה..."
                    onKeyDown={(e) => e.key === 'Enter' && addCompetitor()}
                    disabled={mri.competitors.length >= 3}
                    className={`h-14 text-lg bg-white ${!hasValidCompetitors ? 'border-destructive border-2' : 'border-slate-300'}`}
                  />
                  <Button
                    onClick={addCompetitor}
                    disabled={!newCompetitor.trim() || mri.competitors.length >= 3}
                    variant="outline"
                    size="lg"
                    className="h-14 w-14 border-2"
                  >
                    <Plus className="w-6 h-6" />
                  </Button>
                </div>

                {mri.competitors.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-4">
                    {mri.competitors.map((comp, idx) => (
                      <Badge key={idx} variant="outline" className="pl-4 pr-2 py-2.5 gap-3 text-base bg-white border-2 border-slate-300">
                        {comp}
                        <button
                          onClick={() => removeCompetitor(idx)}
                          className="hover:bg-destructive/20 rounded-full p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </>
            )}

            <button
              onClick={toggleNoCompetitors}
              className={`px-6 py-3 rounded-xl border-2 transition-all text-base font-medium ${
                noCompetitors
                  ? 'border-primary bg-primary text-primary-foreground shadow-md'
                  : 'border-slate-300 bg-white hover:border-primary/50 text-muted-foreground hover:shadow-md'
              }`}
            >
              אין לי מתחרים
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Target Audience - Selection Options */}
      <Card className="border-2 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            למי אתם פונים?
          </h3>
          <p className="text-sm text-white/80">בחרו את סוג הלקוחות שלכם</p>
        </div>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* B2C - Private Customers */}
            <div
              onClick={() => updateMRI({ endConsumer: 'private', decisionMaker: '' })}
              className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                mri.endConsumer === 'private'
                  ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg'
                  : 'border-border bg-card hover:border-blue-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  mri.endConsumer === 'private' 
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md shadow-blue-500/30' 
                    : 'bg-muted'
                }`}>
                  <User className={`w-6 h-6 ${mri.endConsumer === 'private' ? 'text-white' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold mb-1 ${mri.endConsumer === 'private' ? 'text-blue-700' : 'text-foreground'}`}>לקוחות פרטיים</h4>
                  <p className="text-sm text-muted-foreground">אנשים פרטיים, משפחות, צרכנים</p>
                </div>
              </div>
              {mri.endConsumer === 'private' && (
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 shadow-sm flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>

            {/* B2B - Organizations */}
            <div
              onClick={() => updateMRI({ endConsumer: 'b2b', decisionMaker: '' })}
              className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                mri.endConsumer === 'b2b'
                  ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-violet-50 shadow-lg'
                  : 'border-border bg-card hover:border-purple-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  mri.endConsumer === 'b2b' 
                    ? 'bg-gradient-to-br from-purple-500 to-violet-600 shadow-md shadow-purple-500/30' 
                    : 'bg-muted'
                }`}>
                  <Users className={`w-6 h-6 ${mri.endConsumer === 'b2b' ? 'text-white' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold mb-1 ${mri.endConsumer === 'b2b' ? 'text-purple-700' : 'text-foreground'}`}>ארגונים וחברות</h4>
                  <p className="text-sm text-muted-foreground">רשויות, מוסדות, עסקים, חברות</p>
                </div>
              </div>
              {mri.endConsumer === 'b2b' && (
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 shadow-sm flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>

            {/* Both - Mixed */}
            <div
              onClick={() => updateMRI({ endConsumer: 'both', decisionMaker: '' })}
              className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                mri.endConsumer === 'both'
                  ? 'border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 shadow-lg'
                  : 'border-border bg-card hover:border-amber-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  mri.endConsumer === 'both' 
                    ? 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-md shadow-amber-500/30' 
                    : 'bg-muted'
                }`}>
                  <div className="relative">
                    <User className={`w-5 h-5 absolute -right-1 -top-1 ${mri.endConsumer === 'both' ? 'text-white' : 'text-muted-foreground'}`} />
                    <Users className={`w-5 h-5 absolute -left-1 -bottom-1 ${mri.endConsumer === 'both' ? 'text-white' : 'text-muted-foreground'}`} />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold mb-1 ${mri.endConsumer === 'both' ? 'text-amber-700' : 'text-foreground'}`}>גם וגם</h4>
                  <p className="text-sm text-muted-foreground">פרטיים וגם ארגונים</p>
                </div>
              </div>
              {mri.endConsumer === 'both' && (
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 shadow-sm flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Sub-options for B2C */}
          {mri.endConsumer === 'private' && (
            <div className="animate-fade-in pt-4 border-t border-border space-y-3">
              <p className="text-sm font-medium text-foreground">מי מקבל את ההחלטה?</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'buyer', label: 'הקונה עצמו', desc: 'מחליט ומשלם בעצמו' },
                  { id: 'parent', label: 'הורים / משפחה', desc: 'ההורים משלמים' },
                  { id: 'spouse', label: 'בן/בת זוג', desc: 'החלטה זוגית' },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => updateMRI({ decisionMaker: option.id })}
                    className={`px-4 py-2 rounded-full border transition-all text-sm ${
                      mri.decisionMaker === option.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sub-options for B2B */}
          {mri.endConsumer === 'b2b' && (
            <div className="animate-fade-in pt-4 border-t border-border space-y-3">
              <p className="text-sm font-medium text-foreground">איזה סוג ארגון?</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'business', label: 'עסקים קטנים' },
                  { id: 'corporate', label: 'חברות גדולות' },
                  { id: 'institution', label: 'מוסדות חינוך' },
                  { id: 'authority', label: 'רשויות מקומיות' },
                  { id: 'nonprofit', label: 'עמותות' },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => updateMRI({ decisionMaker: option.id })}
                    className={`px-4 py-2 rounded-full border transition-all text-sm ${
                      mri.decisionMaker === option.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bot Message */}
      {botMessage && (
        <div className="flex items-start gap-3 p-4 bg-primary/10 rounded-xl border border-primary/20 animate-fade-in">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">המערכת מבינה:</p>
            <p className="text-foreground">{botMessage}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onPrev} className="gap-2">
          <ArrowRight className="w-4 h-4" />
          חזרה
        </Button>
        <Button
          onClick={onNext}
          disabled={!isValid}
          variant="gradient"
          className="gap-2"
        >
          המשך
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default StepStrategicMRI;
