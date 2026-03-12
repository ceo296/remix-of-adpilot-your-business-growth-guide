import { useState, useEffect } from 'react';
import { WizardData, WizardDataUpdate, XFactorType, CompetitorPosition, BrandPresenceType, AudienceToneType, QualitySignature } from '@/types/wizard';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Trophy, Package, Tag, Heart, Sparkles, Users, User, Plus, X, Bot, Edit3, Crown, Briefcase, Zap, Shield, Clock, Award, Star, Check } from 'lucide-react';
import { getYourWord } from '@/lib/honorific-utils';

interface StepProps {
  data: WizardData;
  updateData: (data: WizardDataUpdate) => void;
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

const BRAND_PRESENCE_OPTIONS: { id: BrandPresenceType; label: string; description: string; icon: React.ElementType; gradient: string }[] = [
  { id: 'known', label: 'מותג מוכר', description: 'השם שלי מספיק, אני מעדיף עיצוב נקי, מינימליסטי ויוקרתי.', icon: Crown, gradient: 'from-amber-500 to-yellow-500' },
  { id: 'expert', label: 'מומחה בתחומו', description: 'אני בונה אמון דרך מקצועיות, איכות וניסיון.', icon: Briefcase, gradient: 'from-blue-500 to-cyan-600' },
  { id: 'active', label: 'שחקן אקטיבי', description: 'אני כאן כדי לייצר תוצאות, המודעות שלי צריכות להיות בולטות ונוכחות.', icon: Zap, gradient: 'from-emerald-500 to-teal-600' },
];

const QUALITY_SIGNATURE_OPTIONS: { type: QualitySignature['type']; label: string; template: string; placeholder: string; icon: React.ElementType; gradient: string }[] = [
  { type: 'experience', label: 'ותק וניסיון', template: 'מעל {value} שנות ניסיון', placeholder: 'מספר שנים', icon: Clock, gradient: 'from-amber-500 to-orange-500' },
  { type: 'technology', label: 'טכנולוגיה/איכות', template: 'מובילים ב{value}', placeholder: 'למשל: חדשנות, איכות...', icon: Star, gradient: 'from-blue-500 to-indigo-600' },
  { type: 'service', label: 'שירות וזמינות', template: 'מענה מהיר ושירות VIP אישי', placeholder: '', icon: Heart, gradient: 'from-pink-500 to-rose-500' },
  { type: 'trust', label: 'אמינות ואחריות', template: 'אחריות מלאה / באישור המוסדות', placeholder: '', icon: Shield, gradient: 'from-emerald-500 to-green-600' },
  { type: 'scale', label: 'היקף הצלחה', template: 'מעל {value} לקוחות מרוצים', placeholder: 'מספר לקוחות', icon: Award, gradient: 'from-violet-500 to-purple-600' },
];

const AUDIENCE_TONE_OPTIONS: { id: AudienceToneType; label: string; description: string; icon: React.ElementType; gradient: string }[] = [
  { id: 'broad', label: 'הקהל הרחב', description: 'שפה פשוטה, ברורה ובגובה העיניים.', icon: Users, gradient: 'from-blue-500 to-cyan-500' },
  { id: 'premium', label: 'קהל פרימיום', description: 'שפה גבוהה, מאופקת, דגש על איכות ובלעדיות.', icon: Crown, gradient: 'from-amber-500 to-yellow-500' },
  { id: 'b2b', label: 'קהל עסקי (B2B)', description: 'שפה מקצועית, עניינית ודגש על תועלות.', icon: Briefcase, gradient: 'from-violet-500 to-purple-600' },
];

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
    if (mri.brandPresence && mri.audienceTone) {
      const presenceLabel = BRAND_PRESENCE_OPTIONS.find(o => o.id === mri.brandPresence)?.label;
      const toneLabel = AUDIENCE_TONE_OPTIONS.find(o => o.id === mri.audienceTone)?.label;
      setBotMessage(`מעולה! \"${presenceLabel}\" + \"${toneLabel}\" — יש לי תמונה ברורה של הזהות שלכם.`);
    } else {
      setBotMessage(null);
    }
  }, [mri.brandPresence, mri.audienceTone]);

  const toggleXFactor = (factor: XFactorType) => {
    const current = mri.xFactors;
    if (current.includes(factor)) {
      updateMRI({
        xFactors: current.filter((f) => f !== factor),
        primaryXFactor: mri.primaryXFactor === factor ? null : mri.primaryXFactor,
      });
    } else {
      updateMRI({ xFactors: [...current, factor] });
    }
  };

  const setPrimaryXFactor = (factor: XFactorType) => {
    if (!mri.xFactors.includes(factor)) {
      updateMRI({ xFactors: [...mri.xFactors, factor], primaryXFactor: factor });
    } else {
      updateMRI({ primaryXFactor: factor });
    }
  };

  const addCompetitor = () => {
    if (newCompetitor.trim() && mri.competitors.length < 3) {
      const newId = `comp-${Date.now()}`;
      updateMRI({
        competitors: [...mri.competitors, newCompetitor.trim()],
        competitorPositions: [...mri.competitorPositions, { id: newId, name: newCompetitor.trim(), x: 0, y: 0 }],
      });
      setNewCompetitor('');
    }
  };

  const removeCompetitor = (index: number) => {
    updateMRI({
      competitors: mri.competitors.filter((_, i) => i !== index),
      competitorPositions: mri.competitorPositions.filter((_, i) => i !== index),
    });
  };

  const toggleQualitySignature = (type: QualitySignature['type']) => {
    const existing = mri.qualitySignatures.find(s => s.type === type);
    if (existing) {
      updateMRI({ qualitySignatures: mri.qualitySignatures.filter(s => s.type !== type) });
    } else if (mri.qualitySignatures.length < 3) {
      updateMRI({ qualitySignatures: [...mri.qualitySignatures, { type, value: '' }] });
    }
  };

  const updateSignatureValue = (type: QualitySignature['type'], value: string) => {
    updateMRI({
      qualitySignatures: mri.qualitySignatures.map(s => s.type === type ? { ...s, value } : s),
    });
  };

  const toggleNoCompetitors = () => {
    const newValue = !noCompetitors;
    setNoCompetitors(newValue);
    updateMRI({ noCompetitors: newValue, ...(newValue ? { competitors: [], competitorPositions: [] } : {}) });
  };

  const hasValidXFactors = mri.xFactors.length > 0 || (isOtherSelected && otherXFactor.trim().length > 0);
  const otherNeedsText = isOtherSelected && otherXFactor.trim().length === 0;
  const hasValidCompetitors = noCompetitors || mri.competitors.length > 0;
  const hasValidPresence = !!mri.brandPresence;
  const hasValidTone = !!mri.audienceTone;
  const hasValidAudience = mri.endConsumer === 'private' || mri.endConsumer === 'b2b' || mri.endConsumer === 'both';
  const isValid = hasValidXFactors && !otherNeedsText && hasValidCompetitors && hasValidPresence && hasValidTone && hasValidAudience;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">תעודת הזהות העסקית</h2>
        <p className="text-muted-foreground">לפני שמדברים על עיצוב, בואו נבין את ה-DNA האסטרטגי {getYourWord(data.honorific)}</p>
      </div>

      {/* ─── Section 1: Brand Presence ─── */}
      <Card className="border-2 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Crown className="w-5 h-5" />
            נוכחות המותג
          </h3>
          <p className="text-sm text-white/80">איך היית מגדיר את הנוכחות של המותג שלך בשוק?</p>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Known Brand - Luxury/Gold aesthetic */}
            {(() => {
              const isSelected = mri.brandPresence === 'known';
              return (
                <div
                  onClick={() => updateMRI({ brandPresence: 'known' })}
                  className={`relative rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden group ${
                    isSelected ? 'scale-[1.03] shadow-2xl ring-2 ring-amber-400' : 'hover:scale-[1.01] hover:shadow-xl'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br from-stone-800 via-stone-700 to-stone-800 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-80 group-hover:opacity-90'}`} />
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, rgba(200,180,150,0.2) 0%, transparent 50%)' }} />
                  <div className="relative p-6 text-center min-h-[180px] flex flex-col items-center justify-center">
                    <div className={`mb-4 transition-transform ${isSelected ? 'scale-125' : 'group-hover:scale-110'}`}>
                      <Crown className={`w-12 h-12 ${isSelected ? 'text-yellow-300' : 'text-yellow-400/60'}`} strokeWidth={1.5} />
                    </div>
                    <h4 className="font-bold text-white text-lg tracking-wide mb-2">מותג מוכר</h4>
                    <p className="text-sm text-amber-100/70 leading-relaxed">השם שלי מספיק, אני מעדיף עיצוב נקי, מינימליסטי ויוקרתי</p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg">
                      <Check className="w-4 h-4 text-amber-900" />
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Expert - Professional/Trust blue aesthetic */}
            {(() => {
              const isSelected = mri.brandPresence === 'expert';
              return (
                <div
                  onClick={() => updateMRI({ brandPresence: 'expert' })}
                  className={`relative rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden group ${
                    isSelected ? 'scale-[1.03] shadow-2xl ring-2 ring-sky-400' : 'hover:scale-[1.01] hover:shadow-xl'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-80 group-hover:opacity-90'}`} />
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(100,180,255,0.05) 10px, rgba(100,180,255,0.05) 20px)' }} />
                  <div className="relative p-6 text-center min-h-[180px] flex flex-col items-center justify-center">
                    <div className={`mb-4 transition-transform ${isSelected ? 'scale-125' : 'group-hover:scale-110'}`}>
                      <Briefcase className={`w-12 h-12 ${isSelected ? 'text-sky-300' : 'text-sky-400/60'}`} strokeWidth={1.5} />
                    </div>
                    <h4 className="font-bold text-white text-lg tracking-wide mb-2">מומחה בתחומו</h4>
                    <p className="text-sm text-blue-100/70 leading-relaxed">אני בונה אמון דרך מקצועיות, איכות וניסיון</p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-sky-400 flex items-center justify-center shadow-lg">
                      <Check className="w-4 h-4 text-blue-900" />
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Active Player - Bold/Energetic green aesthetic */}
            {(() => {
              const isSelected = mri.brandPresence === 'active';
              return (
                <div
                  onClick={() => updateMRI({ brandPresence: 'active' })}
                  className={`relative rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden group ${
                    isSelected ? 'scale-[1.03] shadow-2xl ring-2 ring-emerald-400' : 'hover:scale-[1.01] hover:shadow-xl'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-800 to-green-900 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-80 group-hover:opacity-90'}`} />
                  <div className="absolute top-0 left-0 w-32 h-32 opacity-20">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-transparent rounded-full blur-2xl" />
                  </div>
                  <div className="relative p-6 text-center min-h-[180px] flex flex-col items-center justify-center">
                    <div className={`mb-4 transition-transform ${isSelected ? 'scale-125' : 'group-hover:scale-110'}`}>
                      <Zap className={`w-12 h-12 ${isSelected ? 'text-emerald-300' : 'text-emerald-400/60'}`} strokeWidth={1.5} />
                    </div>
                    <h4 className="font-bold text-white text-lg tracking-wide mb-2">שחקן אקטיבי</h4>
                    <p className="text-sm text-emerald-100/70 leading-relaxed">אני כאן כדי לייצר תוצאות, המודעות שלי צריכות להיות בולטות</p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-emerald-400 flex items-center justify-center shadow-lg">
                      <Check className="w-4 h-4 text-emerald-900" />
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </CardContent>
      </Card>

      {/* ─── Section 1b: X-Factor (Why You?) ─── */}
      <Card className="border-2 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-4">
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
                      ? isPrimary ? 'border-primary bg-primary/10 shadow-lg' : 'border-primary/50 bg-primary/5'
                      : 'border-border bg-card hover:border-primary/30 hover:shadow-md'
                  }`}
                >
                  {isSelected && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setPrimaryXFactor(factor.id); }}
                      className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full ${
                        isPrimary ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:bg-primary/20'
                      }`}
                    >
                      {isPrimary ? '⭐ עיקרי' : 'הפוך לעיקרי'}
                    </button>
                  )}
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all bg-gradient-to-br ${gradients[factor.id]} shadow-lg ${shadows[factor.id]} ${isSelected ? 'scale-110' : 'opacity-70'}`}>
                      <factor.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 mt-1">
                      <p className="font-semibold text-foreground">{factor.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{factor.description}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                      <Input
                        value={mri.xFactorDetails?.[factor.id] || ''}
                        onChange={(e) => updateMRI({ xFactorDetails: { ...mri.xFactorDetails, [factor.id]: e.target.value } })}
                        placeholder={
                          factor.id === 'veteran' ? 'למשל: 25 שנה בתחום, מעל 10,000 לקוחות...' :
                          factor.id === 'product' ? 'למשל: טכנולוגיה ייחודית, חומרי גלם מובחרים...' :
                          factor.id === 'price' ? 'למשל: הזול ביותר בקטגוריה, חבילות משתלמות...' :
                          factor.id === 'service' ? 'למשל: מענה 24/7, ליווי אישי לכל לקוח...' :
                          'למשל: הסיפור שמאחורי המותג, ערכים ייחודיים...'
                        }
                        className="text-sm bg-background"
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Other Option */}
            <div
              onClick={toggleOtherXFactor}
              className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                isOtherSelected
                  ? otherNeedsText ? 'border-destructive bg-destructive/5' : 'border-primary/50 bg-primary/5'
                  : 'border-border bg-card hover:border-primary/30 hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all bg-gradient-to-br from-slate-600 to-gray-700 shadow-lg shadow-slate-500/30 ${isOtherSelected ? 'scale-110' : 'opacity-70'}`}>
                  <Edit3 className="w-6 h-6 text-white" />
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
                    className={`min-h-[60px] text-sm bg-background ${otherNeedsText ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  />
                  {otherNeedsText && <p className="text-xs text-destructive mt-1">יש למלא את השדה</p>}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>



      {/* ─── NEW Section 3: Quality Signatures (conditional - not for "known" brand) ─── */}
      {mri.brandPresence !== 'known' && (
        <Card className="border-2 shadow-xl overflow-hidden animate-fade-in">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5" />
              חתימות האיכות שלך
            </h3>
            <p className="text-sm text-white/80">האם יש הוכחות שתרצה שנספר עליך בגריד? (בחר עד 3)</p>
          </div>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {QUALITY_SIGNATURE_OPTIONS.map((option) => {
                const isSelected = mri.qualitySignatures.some(s => s.type === option.type);
                const signature = mri.qualitySignatures.find(s => s.type === option.type);
                const isDisabled = !isSelected && mri.qualitySignatures.length >= 3;
                const needsValue = option.placeholder && isSelected && !signature?.value?.trim();

                return (
                  <div
                    key={option.type}
                    onClick={() => !isDisabled && toggleQualitySignature(option.type)}
                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-md'
                        : isDisabled
                          ? 'border-border bg-muted/50 opacity-50 cursor-not-allowed'
                          : 'border-border bg-card hover:border-primary/30 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all bg-gradient-to-br ${option.gradient} shadow-md ${isSelected ? 'scale-110' : 'opacity-60'}`}>
                        <option.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground text-sm">{option.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{option.template.replace('{value}', '___')}</p>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    {isSelected && option.placeholder && (
                      <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={signature?.value || ''}
                          onChange={(e) => updateSignatureValue(option.type, e.target.value)}
                          placeholder={option.placeholder}
                          className={`text-sm bg-background ${needsValue ? 'border-destructive' : ''}`}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {mri.qualitySignatures.length > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <p className="text-sm font-medium text-foreground mb-2">יופיעו בגריד המודעה:</p>
                <div className="flex flex-wrap gap-2">
                  {mri.qualitySignatures.map((sig) => {
                    const opt = QUALITY_SIGNATURE_OPTIONS.find(o => o.type === sig.type);
                    const displayText = opt?.template.replace('{value}', sig.value || '___') || sig.type;
                    return (
                      <Badge key={sig.type} className="bg-primary/10 text-primary border-primary/30 text-xs">
                        {displayText}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Section: Competitors ─── */}
      <Card className="border-2 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-slate-600 to-gray-700 p-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            מתחרים עיקריים
          </h3>
          <p className="text-sm text-white/80">
            {data.contactAssets?.contact_address
              ? `מי המתחרים הכי קרובים אליך באזור ${data.contactAssets.contact_address}?`
              : 'מי המתחרים הישירים שלך? חשבו על עסקים שהלקוחות שלכם שוקלים במקומכם'
            }
          </p>
        </div>
        <CardContent className="p-6 space-y-4">
          {!noCompetitors && (
            <div className="space-y-3">
              {[0, 1, 2].map((idx) => {
                const value = mri.competitors[idx] || '';
                const isEmpty = !value;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                      value ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 relative">
                      <Input
                        value={value}
                        onChange={(e) => {
                          const updated = [...mri.competitors];
                          if (e.target.value) {
                            updated[idx] = e.target.value;
                          } else {
                            updated.splice(idx, 1);
                          }
                          updateMRI({ competitors: updated.filter(Boolean) });
                        }}
                        placeholder={
                          idx === 0 ? 'המתחרה הראשי שלך...' :
                          idx === 1 ? 'מתחרה נוסף...' :
                          'ועוד אחד (אופציונלי)...'
                        }
                        className={`h-12 text-base bg-background transition-all ${
                          value ? 'border-primary/30 pr-10' : 'border-border'
                        }`}
                      />
                      {value && (
                        <button
                          onClick={() => {
                            const updated = mri.competitors.filter((_, i) => i !== idx);
                            updateMRI({ competitors: updated });
                          }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-destructive/20 transition-colors"
                        >
                          <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {data.websiteInsights?.industry && (
                <p className="text-xs text-muted-foreground pr-12">
                  💡 חשבו על עסקים בתחום {data.websiteInsights.industry} שהלקוחות שלכם מכירים
                </p>
              )}
            </div>
          )}

          <button
            onClick={toggleNoCompetitors}
            className={`px-5 py-2.5 rounded-xl border-2 transition-all text-sm font-medium ${
              noCompetitors ? 'border-primary bg-primary text-primary-foreground shadow-md' : 'border-border bg-card hover:border-primary/50 text-muted-foreground'
            }`}
          >
            {noCompetitors ? '✓ אין לי מתחרים ישירים' : 'אין לי מתחרים'}
          </button>
        </CardContent>
      </Card>

      {/* ─── NEW Section 4: Audience Tone ─── */}
      <Card className="border-2 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            למי אנחנו מדברים בדרך כלל?
          </h3>
          <p className="text-sm text-white/80">זה יקבע את טון השפה במודעות</p>
        </div>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Broad audience */}
            {(() => {
              const isSelected = mri.audienceTone === 'broad';
              return (
                <div
                  onClick={() => updateMRI({ audienceTone: 'broad', endConsumer: 'private' })}
                  className={`relative rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden group ${
                    isSelected ? 'scale-[1.03] shadow-2xl ring-2 ring-cyan-400' : 'hover:scale-[1.01] hover:shadow-xl'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br from-cyan-800 via-blue-800 to-sky-900 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-80 group-hover:opacity-90'}`} />
                  <div className="absolute bottom-0 left-0 w-full h-1/2 opacity-10 bg-gradient-to-t from-cyan-300 to-transparent" />
                  <div className="relative p-6 text-center min-h-[160px] flex flex-col items-center justify-center">
                    <div className={`mb-3 transition-transform ${isSelected ? 'scale-125' : 'group-hover:scale-110'}`}>
                      <Users className={`w-11 h-11 ${isSelected ? 'text-cyan-300' : 'text-cyan-400/60'}`} strokeWidth={1.5} />
                    </div>
                    <h4 className="font-bold text-white text-lg mb-1">הקהל הרחב</h4>
                    <p className="text-sm text-cyan-100/70">שפה פשוטה, ברורה ובגובה העיניים</p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-cyan-400 flex items-center justify-center shadow-lg">
                      <Check className="w-4 h-4 text-cyan-900" />
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Premium audience */}
            {(() => {
              const isSelected = mri.audienceTone === 'premium';
              return (
                <div
                  onClick={() => updateMRI({ audienceTone: 'premium', endConsumer: 'private' })}
                  className={`relative rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden group ${
                    isSelected ? 'scale-[1.03] shadow-2xl ring-2 ring-amber-400' : 'hover:scale-[1.01] hover:shadow-xl'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br from-stone-900 via-amber-950 to-stone-800 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-80 group-hover:opacity-90'}`} />
                  <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,215,0,0.4) 0%, transparent 60%)' }} />
                  <div className="relative p-6 text-center min-h-[160px] flex flex-col items-center justify-center">
                    <div className={`mb-3 transition-transform ${isSelected ? 'scale-125' : 'group-hover:scale-110'}`}>
                      <Crown className={`w-11 h-11 ${isSelected ? 'text-amber-300' : 'text-amber-400/60'}`} strokeWidth={1.5} />
                    </div>
                    <h4 className="font-bold text-white text-lg mb-1">קהל פרימיום</h4>
                    <p className="text-sm text-amber-100/70">שפה גבוהה, מאופקת, דגש על איכות ובלעדיות</p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center shadow-lg">
                      <Check className="w-4 h-4 text-amber-900" />
                    </div>
                  )}
                </div>
              );
            })()}

            {/* B2B audience */}
            {(() => {
              const isSelected = mri.audienceTone === 'b2b';
              return (
                <div
                  onClick={() => updateMRI({ audienceTone: 'b2b', endConsumer: 'b2b' })}
                  className={`relative rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden group ${
                    isSelected ? 'scale-[1.03] shadow-2xl ring-2 ring-violet-400' : 'hover:scale-[1.01] hover:shadow-xl'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-80 group-hover:opacity-90'}`} />
                  <div className="absolute top-0 right-0 w-24 h-24 opacity-15">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-400 to-transparent rounded-full blur-xl" />
                  </div>
                  <div className="relative p-6 text-center min-h-[160px] flex flex-col items-center justify-center">
                    <div className={`mb-3 transition-transform ${isSelected ? 'scale-125' : 'group-hover:scale-110'}`}>
                      <Briefcase className={`w-11 h-11 ${isSelected ? 'text-violet-300' : 'text-violet-400/60'}`} strokeWidth={1.5} />
                    </div>
                    <h4 className="font-bold text-white text-lg mb-1">קהל עסקי (B2B)</h4>
                    <p className="text-sm text-violet-100/70">שפה מקצועית, עניינית ודגש על תועלות</p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-violet-400 flex items-center justify-center shadow-lg">
                      <Check className="w-4 h-4 text-violet-900" />
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </CardContent>
      </Card>

      {/* ─── Summary: Brand Identity Card ─── */}
      {mri.brandPresence && mri.audienceTone && (
        <Card className="border-2 border-primary/30 shadow-xl overflow-hidden animate-fade-in">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6">
            <h3 className="text-xl font-bold text-foreground mb-4 text-center">תעודת הזהות של המותג</h3>
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Logo */}
              {data.brand.logo && (
                <div className="w-20 h-20 rounded-2xl bg-white shadow-md flex items-center justify-center overflow-hidden border-2 border-border shrink-0">
                  <img src={data.brand.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                </div>
              )}
              <div className="flex-1 text-center md:text-right space-y-3">
                <h4 className="text-2xl font-bold text-foreground">{data.brand.name}</h4>
                {/* Colors */}
                {(data.brand.colors.primary || data.brand.colors.secondary) && (
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <span className="text-sm text-muted-foreground">צבעי מותג:</span>
                    {data.brand.colors.primary && <div className="w-8 h-8 rounded-lg border-2 border-white shadow-sm" style={{ backgroundColor: data.brand.colors.primary }} />}
                    {data.brand.colors.secondary && <div className="w-8 h-8 rounded-lg border-2 border-white shadow-sm" style={{ backgroundColor: data.brand.colors.secondary }} />}
                  </div>
                )}
                {/* DNA Summary */}
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/30">
                    {BRAND_PRESENCE_OPTIONS.find(o => o.id === mri.brandPresence)?.label}
                  </Badge>
                  <Badge className="bg-pink-500/10 text-pink-700 border-pink-500/30">
                    {AUDIENCE_TONE_OPTIONS.find(o => o.id === mri.audienceTone)?.label}
                  </Badge>
                  {mri.xFactors.length > 0 && (
                    <Badge className="bg-violet-500/10 text-violet-700 border-violet-500/30">
                      {X_FACTORS.find(f => f.id === (mri.primaryXFactor || mri.xFactors[0]))?.label}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

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
        <Button onClick={onNext} disabled={!isValid} variant="gradient" className="gap-2">
          המשך
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default StepStrategicMRI;
