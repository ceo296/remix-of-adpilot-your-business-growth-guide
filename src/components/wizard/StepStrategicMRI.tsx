import { useState, useEffect } from 'react';
import { WizardData, XFactorType, TargetAudienceType, CompetitorPosition } from '@/types/wizard';
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

const TARGET_AUDIENCES: { id: TargetAudienceType; label: string; description: string; icon: React.ElementType }[] = [
  { id: 'end_user', label: 'הצרכן הסופי', description: 'הבחור ישיבה שקונה את החליפה', icon: User },
  { id: 'decision_maker', label: 'מקבל ההחלטות', description: 'האמא/האישה שמשלמת', icon: Users },
];

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
    } else if (mri.xFactors.length > 0 && mri.targetAudience) {
      setBotMessage('מעולה! יש לי תמונה ברורה של הפוזיציה שלכם.');
    } else {
      setBotMessage(null);
    }
  }, [mri.xFactors, mri.myPosition, mri.targetAudience]);

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
  const isValid = hasValidXFactors && !otherNeedsText && mri.targetAudience !== null;

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

      {/* Section 3: The Arena */}
      <Card className="border-border">
        <CardContent className="p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">מי מפריע לך לישון בלילה?</h3>
            <p className="text-sm text-muted-foreground">רשום 2-3 מתחרים עיקריים ומקם אותם על המפה</p>
          </div>

          {/* Add Competitors */}
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
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {mri.competitors.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {mri.competitors.map((comp, idx) => (
                <Badge key={idx} variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                  {comp}
                  <button
                    onClick={() => removeCompetitor(idx)}
                    className="hover:bg-destructive/20 rounded p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Positioning Map - Modern Design */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6 border border-border/50 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <GripHorizontal className="w-4 h-4 text-primary" />
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-foreground">מפת הפוזיציה שלך</h4>
                <p className="text-xs text-muted-foreground">גרור את העיגולים למיקום הנכון</p>
              </div>
            </div>
            
            {/* Map Container */}
            <div className="relative w-full aspect-square max-w-sm mx-auto">
              {/* Background with gradient quadrants */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden bg-background border-2 border-border/30 shadow-inner">
                {/* Quadrant backgrounds */}
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20" />
                <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-bl from-blue-50/50 to-transparent dark:from-blue-950/20" />
                <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tr from-amber-50/50 to-transparent dark:from-amber-950/20" />
                <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tl from-rose-50/50 to-transparent dark:from-rose-950/20" />
                
                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-30">
                  {[...Array(5)].map((_, i) => (
                    <div key={`h-${i}`} className="absolute w-full h-px bg-border" style={{ top: `${(i + 1) * 16.66}%` }} />
                  ))}
                  {[...Array(5)].map((_, i) => (
                    <div key={`v-${i}`} className="absolute h-full w-px bg-border" style={{ left: `${(i + 1) * 16.66}%` }} />
                  ))}
                </div>
                
                {/* Center cross - prominent */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-border to-transparent" />
                  <div className="absolute h-full w-0.5 bg-gradient-to-b from-transparent via-border to-transparent" />
                </div>
              </div>
              
              {/* Axis Labels - Outside the map */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-sm font-medium text-foreground">מודרני / חדשני</span>
              </div>
              
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Trophy className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-sm font-medium text-foreground">אולד סקול / קלאסי</span>
              </div>
              
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <Tag className="w-3 h-3 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">פרימיום</span>
              </div>
              
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 -translate-x-full flex items-center gap-1.5">
                <span className="text-sm font-medium text-foreground">זול</span>
                <div className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                  <Tag className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                </div>
              </div>

              {/* My Position - Enhanced */}
              <div
                className="absolute w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-sm font-bold cursor-grab active:cursor-grabbing shadow-xl shadow-primary/30 z-20 transform -translate-x-1/2 -translate-y-1/2 ring-4 ring-background ring-offset-0 hover:scale-110 transition-transform"
                style={{
                  left: `${50 + mri.myPosition.x / 2}%`,
                  top: `${50 - mri.myPosition.y / 2}%`,
                }}
                draggable
                onDrag={(e) => {
                  if (e.clientX === 0 && e.clientY === 0) return;
                  const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                  if (rect) {
                    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 200;
                    const y = (0.5 - (e.clientY - rect.top) / rect.height) * 200;
                    updateMRI({ myPosition: { x: Math.max(-100, Math.min(100, x)), y: Math.max(-100, Math.min(100, y)) } });
                  }
                }}
              >
                אני
              </div>

              {/* Competitor Positions - Enhanced */}
              {mri.competitorPositions.map((comp, idx) => (
                <div
                  key={comp.id}
                  className="absolute w-11 h-11 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 dark:from-slate-400 dark:to-slate-500 flex items-center justify-center text-white dark:text-slate-900 text-xs font-semibold cursor-grab active:cursor-grabbing shadow-lg z-10 transform -translate-x-1/2 -translate-y-1/2 ring-2 ring-background hover:scale-110 transition-transform"
                  style={{
                    left: `${50 + comp.x / 2}%`,
                    top: `${50 - comp.y / 2}%`,
                  }}
                  draggable
                  onDrag={(e) => {
                    if (e.clientX === 0 && e.clientY === 0) return;
                    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                    if (rect) {
                      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 200;
                      const y = (0.5 - (e.clientY - rect.top) / rect.height) * 200;
                      updateCompetitorPosition(idx, Math.max(-100, Math.min(100, x)), Math.max(-100, Math.min(100, y)));
                    }
                  }}
                  title={comp.name}
                >
                  {comp.name.charAt(0)}
                </div>
              ))}
            </div>
            
            {/* Legend */}
            {mri.competitors.length > 0 && (
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-xs font-medium text-foreground">אני</span>
                </div>
                {mri.competitors.map((comp, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div className="w-3 h-3 rounded-full bg-slate-600 dark:bg-slate-400" />
                    <span className="text-xs font-medium text-foreground">{comp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Target Audience */}
      <Card className="border-border">
        <CardContent className="p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">מי הלקוח האמיתי?</h3>
            <p className="text-sm text-muted-foreground">האם אנחנו מדברים ל...</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TARGET_AUDIENCES.map((audience) => {
              const isSelected = mri.targetAudience === audience.id;
              return (
                <div
                  key={audience.id}
                  onClick={() => updateMRI({ targetAudience: audience.id })}
                  className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-primary/20' : 'bg-muted'
                    }`}>
                      <audience.icon className={`w-6 h-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{audience.label}</p>
                      <p className="text-sm text-muted-foreground">{audience.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
