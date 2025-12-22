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
  const hasValidAudience = mri.endConsumer === 'private' || mri.endConsumer === 'b2b';
  const isValid = hasValidXFactors && !otherNeedsText && hasValidAudience;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">תעודת הזהות העסקית</h2>
        <p className="text-muted-foreground">לפני שמדברים על עיצוב, בואו נבין את ה-DNA האסטרטגי שלכם</p>
      </div>

      {/* Section 1: The 'Why You?' */}
      <Card className="border-border">
        <CardContent className="p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">למה שהלקוח יבחר דווקא בך?</h3>
            <p className="text-sm text-muted-foreground">בחר את הגורמים המבדלים (אפשר יותר מאחד, ואז לסמן את העיקרי)</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {X_FACTORS.map((factor) => {
              const isSelected = mri.xFactors.includes(factor.id);
              const isPrimary = mri.primaryXFactor === factor.id;
              return (
                <div
                  key={factor.id}
                  onClick={() => toggleXFactor(factor.id)}
                  className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? isPrimary
                        ? 'border-primary bg-primary/10'
                        : 'border-primary/50 bg-primary/5'
                      : 'border-border bg-card hover:border-primary/30'
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
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-primary/20'
                      }`}
                    >
                      {isPrimary ? 'עיקרי' : 'הפוך לעיקרי'}
                    </button>
                  )}
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-primary/20' : 'bg-muted'
                    }`}>
                      <factor.icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 mt-1">
                      <p className="font-medium text-foreground">{factor.label}</p>
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
                      ? 'border-destructive bg-destructive/5'
                      : 'border-primary/50 bg-primary/5'
                    : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isOtherSelected ? (otherNeedsText ? 'bg-destructive/20' : 'bg-primary/20') : 'bg-muted'
                  }`}>
                    <Edit3 className={`w-5 h-5 ${isOtherSelected ? (otherNeedsText ? 'text-destructive' : 'text-primary') : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 mt-1">
                    <p className="font-medium text-foreground">אחר</p>
                    <p className="text-xs text-muted-foreground mt-1">יש לי סיבה ייחודית משלי</p>
                  </div>
                </div>
                {isOtherSelected && (
                  <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                    <Textarea
                      value={otherXFactor}
                      onChange={(e) => handleOtherXFactorChange(e.target.value)}
                      placeholder="תאר את הגורם המבדל הייחודי שלך..."
                      className={`min-h-[60px] text-sm ${otherNeedsText ? 'border-destructive focus-visible:ring-destructive' : ''}`}
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
            <h3 className="text-lg font-semibold text-foreground mb-1">בוא נהיה כנים - איפה היתרון יושב?</h3>
            <p className="text-sm text-muted-foreground">לחץ על הצד שמתאים יותר לעסק שלך</p>
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

      {/* Section 3: The Arena - Simplified */}
      <Card className="border-border">
        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">איפה אתה ממוקם בשוק?</h3>
            <p className="text-sm text-muted-foreground">הגדר את הפוזיציה שלך בשני צירים פשוטים</p>
          </div>

          {/* Price Positioning */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Tag className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium text-foreground">רמת מחיר</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {mri.myPosition.x < -30 ? 'זול / משתלם' : mri.myPosition.x > 30 ? 'פרימיום / יוקרה' : 'ביניים'}
              </Badge>
            </div>
            
            <div className="relative px-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-3">
                <span>💰 זול / משתלם</span>
                <span>💎 פרימיום / יוקרה</span>
              </div>
              <Slider
                value={[mri.myPosition.x + 100]}
                onValueChange={(value) => updateMRI({ myPosition: { ...mri.myPosition, x: value[0] - 100 } })}
                max={200}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between mt-2">
                {['הכי זול', 'מתחת לממוצע', 'ממוצע', 'מעל הממוצע', 'הכי יקר'].map((label, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      Math.abs((mri.myPosition.x + 100) - (i * 50)) < 25 ? 'bg-primary' : 'bg-border'
                    }`} />
                    <span className="text-[10px] text-muted-foreground mt-1 hidden md:block">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Style Positioning */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium text-foreground">סגנון תקשורת</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {mri.myPosition.y < -30 ? 'קלאסי / מסורתי' : mri.myPosition.y > 30 ? 'מודרני / חדשני' : 'מאוזן'}
              </Badge>
            </div>
            
            <div className="relative px-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-3">
                <span>🏛️ קלאסי / אולד סקול</span>
                <span>✨ מודרני / חדשני</span>
              </div>
              <Slider
                value={[mri.myPosition.y + 100]}
                onValueChange={(value) => updateMRI({ myPosition: { ...mri.myPosition, y: value[0] - 100 } })}
                max={200}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between mt-2">
                {['קלאסי מאוד', 'נוטה לקלאסי', 'מאוזן', 'נוטה למודרני', 'מודרני מאוד'].map((label, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      Math.abs((mri.myPosition.y + 100) - (i * 50)) < 25 ? 'bg-primary' : 'bg-border'
                    }`} />
                    <span className="text-[10px] text-muted-foreground mt-1 hidden md:block">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                אני
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">הפוזיציה שלך:</p>
                <p className="text-xs text-muted-foreground">
                  {mri.myPosition.x < -30 ? 'זול ומשתלם' : mri.myPosition.x > 30 ? 'פרימיום ויוקרתי' : 'מחיר ביניים'}
                  {' • '}
                  {mri.myPosition.y < -30 ? 'סגנון קלאסי ומסורתי' : mri.myPosition.y > 30 ? 'סגנון מודרני וחדשני' : 'סגנון מאוזן'}
                </p>
              </div>
            </div>
          </div>

          {/* Competitors Section - Optional */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">מתחרים עיקריים (אופציונלי)</span>
              <span className="text-xs text-muted-foreground">עד 3 מתחרים</span>
            </div>
            <div className="flex gap-2">
              <Input
                value={newCompetitor}
                onChange={(e) => setNewCompetitor(e.target.value)}
                placeholder="שם המתחרה..."
                onKeyDown={(e) => e.key === 'Enter' && addCompetitor()}
                disabled={mri.competitors.length >= 3}
              />
              <Button
                onClick={addCompetitor}
                disabled={!newCompetitor.trim() || mri.competitors.length >= 3}
                variant="outline"
                size="icon"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {mri.competitors.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {mri.competitors.map((comp, idx) => (
                  <Badge key={idx} variant="outline" className="pl-3 pr-1.5 py-1.5 gap-2 bg-muted/50">
                    {comp}
                    <button
                      onClick={() => removeCompetitor(idx)}
                      className="hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Target Audience - Selection Options */}
      <Card className="border-border">
        <CardContent className="p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">למי אתם פונים?</h3>
            <p className="text-sm text-muted-foreground">בחרו את סוג הלקוחות שלכם</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* B2C - Private Customers */}
            <div
              onClick={() => updateMRI({ endConsumer: 'private', decisionMaker: mri.decisionMaker === 'b2b' ? '' : mri.decisionMaker })}
              className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                mri.endConsumer === 'private'
                  ? 'border-primary bg-primary/10 shadow-md'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  mri.endConsumer === 'private' ? 'bg-primary/20' : 'bg-muted'
                }`}>
                  <User className={`w-6 h-6 ${mri.endConsumer === 'private' ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-1">לקוחות פרטיים</h4>
                  <p className="text-sm text-muted-foreground">אנשים פרטיים, משפחות, צרכנים</p>
                </div>
              </div>
              {mri.endConsumer === 'private' && (
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>

            {/* B2B - Organizations */}
            <div
              onClick={() => updateMRI({ endConsumer: 'b2b', decisionMaker: mri.decisionMaker === 'private' ? '' : mri.decisionMaker })}
              className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                mri.endConsumer === 'b2b'
                  ? 'border-primary bg-primary/10 shadow-md'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  mri.endConsumer === 'b2b' ? 'bg-primary/20' : 'bg-muted'
                }`}>
                  <Users className={`w-6 h-6 ${mri.endConsumer === 'b2b' ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-1">ארגונים וחברות</h4>
                  <p className="text-sm text-muted-foreground">רשויות, מוסדות, עסקים, חברות</p>
                </div>
              </div>
              {mri.endConsumer === 'b2b' && (
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
