import { useState } from 'react';
import { WizardData, WizardDataUpdate, XFactorType, AudienceToneType } from '@/types/wizard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, Trophy, Package, Tag, Heart, Sparkles, Users, Crown, Briefcase, Edit3, X, Check } from 'lucide-react';
import { getYourWord } from '@/lib/honorific-utils';

interface StepProps {
  data: WizardData;
  updateData: (data: WizardDataUpdate) => void;
  onNext: () => void;
  onPrev: () => void;
}

const X_FACTORS: { id: XFactorType; label: string; emoji: string; hint: string }[] = [
  { id: 'veteran', label: 'ותק וניסיון', emoji: '🏆', hint: 'כמה שנים? כמה לקוחות?' },
  { id: 'product', label: 'עליונות מוצרית', emoji: '📦', hint: 'מה הופך את המוצר ליותר טוב?' },
  { id: 'price', label: 'מחיר', emoji: '💰', hint: 'הכי זול? הכי משתלם?' },
  { id: 'service', label: 'שירות ויחס', emoji: '❤️', hint: 'מה מיוחד ביחס שלך?' },
  { id: 'brand', label: 'סיפור המותג', emoji: '✨', hint: 'מה הסיפור הייחודי?' },
];

const AUDIENCE_OPTIONS: { id: AudienceToneType; label: string; sub: string; emoji: string }[] = [
  { id: 'broad', label: 'קהל רחב', sub: 'שפה פשוטה ובגובה העיניים', emoji: '👥' },
  { id: 'premium', label: 'פרימיום', sub: 'שפה גבוהה, דגש על איכות', emoji: '👑' },
  { id: 'b2b', label: 'עסקי (B2B)', sub: 'שפה מקצועית ועניינית', emoji: '💼' },
];

const StepStrategicMRI = ({ data, updateData, onNext, onPrev }: StepProps) => {
  const [otherXFactor, setOtherXFactor] = useState(data.strategicMRI.otherXFactor || '');
  const [isOtherSelected, setIsOtherSelected] = useState(!!data.strategicMRI.otherXFactor);
  const [showCompetitors, setShowCompetitors] = useState(data.strategicMRI.competitors.length > 0);

  const mri = data.strategicMRI;

  const updateMRI = (updates: Partial<typeof mri>) => {
    updateData({ strategicMRI: { ...mri, ...updates } });
  };

  const toggleXFactor = (factor: XFactorType) => {
    const current = mri.xFactors;
    if (current.includes(factor)) {
      const remaining = current.filter((f) => f !== factor);
      updateMRI({
        xFactors: remaining,
        primaryXFactor: mri.primaryXFactor === factor ? (remaining[0] || null) : mri.primaryXFactor,
      });
    } else {
      const newFactors = [...current, factor];
      updateMRI({
        xFactors: newFactors,
        primaryXFactor: mri.primaryXFactor || factor,
      });
    }
  };

  const selectAudience = (tone: AudienceToneType) => {
    const endConsumer = tone === 'b2b' ? 'b2b' : 'private';
    // Also set brandPresence based on tone for downstream compatibility
    const brandPresence = tone === 'premium' ? 'known' as const : tone === 'b2b' ? 'expert' as const : 'active' as const;
    updateMRI({ audienceTone: tone, endConsumer, brandPresence });
  };

  const hasValidXFactors = mri.xFactors.length > 0 || (isOtherSelected && otherXFactor.trim().length > 0);
  const hasValidTone = !!mri.audienceTone;
  const isValid = hasValidXFactors && hasValidTone;

  // Brand primary color for subtle accent
  const brandColor = data.brand.colors.primary || 'hsl(var(--primary))';

  return (
    <div className="space-y-10">
      {/* Header — clean, no-nonsense */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
          3 שאלות קצרות
        </h2>
        <p className="text-muted-foreground text-base">
          כדי שהמודעות ידברו בשפה {getYourWord(data.honorific)} ויבלטו מול המתחרים
        </p>
      </div>

      {/* ─── Q1: Differentiation ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <span 
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ backgroundColor: brandColor }}
          >
            1
          </span>
          <div>
            <h3 className="text-lg font-bold text-foreground">למה שיבחרו דווקא בך?</h3>
            <p className="text-sm text-muted-foreground">בחר את מה שהכי מבדל אותך (אפשר יותר מאחד)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pr-11">
          {X_FACTORS.map((factor) => {
            const isSelected = mri.xFactors.includes(factor.id);
            const isPrimary = mri.primaryXFactor === factor.id;
            return (
              <button
                key={factor.id}
                type="button"
                onClick={() => toggleXFactor(factor.id)}
                className={`relative text-right p-4 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-card hover:border-muted-foreground/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{factor.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {factor.label}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                {/* Detail input when selected */}
                {isSelected && (
                  <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                    <Input
                      value={mri.xFactorDetails?.[factor.id] || ''}
                      onChange={(e) => updateMRI({ xFactorDetails: { ...mri.xFactorDetails, [factor.id]: e.target.value } })}
                      placeholder={factor.hint}
                      className="text-sm h-9 bg-background"
                    />
                  </div>
                )}
                {/* Primary badge */}
                {isSelected && mri.xFactors.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateMRI({ primaryXFactor: factor.id });
                    }}
                    className={`absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                      isPrimary 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground hover:bg-primary/20'
                    }`}
                  >
                    {isPrimary ? '⭐ עיקרי' : 'עיקרי?'}
                  </button>
                )}
              </button>
            );
          })}

          {/* Other option */}
          <button
            type="button"
            onClick={() => {
              if (isOtherSelected) {
                setIsOtherSelected(false);
                setOtherXFactor('');
                updateMRI({ otherXFactor: '' });
              } else {
                setIsOtherSelected(true);
              }
            }}
            className={`text-right p-4 rounded-xl border-2 transition-all duration-200 ${
              isOtherSelected
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border bg-card hover:border-muted-foreground/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">✏️</span>
              <p className={`font-semibold text-sm ${isOtherSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                משהו אחר
              </p>
              {isOtherSelected && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0 mr-auto">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </div>
            {isOtherSelected && (
              <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                <Textarea
                  value={otherXFactor}
                  onChange={(e) => {
                    setOtherXFactor(e.target.value);
                    updateMRI({ otherXFactor: e.target.value });
                  }}
                  placeholder="מה הגורם המבדל הייחודי שלך?"
                  className="min-h-[50px] text-sm bg-background"
                />
              </div>
            )}
          </button>
        </div>
      </section>

      {/* ─── Q2: Audience ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <span 
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ backgroundColor: brandColor }}
          >
            2
          </span>
          <div>
            <h3 className="text-lg font-bold text-foreground">למי אתה מדבר?</h3>
            <p className="text-sm text-muted-foreground">זה קובע את טון השפה במודעות</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pr-11">
          {AUDIENCE_OPTIONS.map((option) => {
            const isSelected = mri.audienceTone === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => selectAudience(option.id)}
                className={`text-center p-5 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-card hover:border-muted-foreground/30'
                }`}
              >
                <span className="text-3xl block mb-2">{option.emoji}</span>
                <p className={`font-bold text-base mb-1 ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {option.label}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">{option.sub}</p>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center mx-auto mt-3">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ─── Q3: Competitors (optional, collapsible) ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-muted text-muted-foreground shrink-0">
            3
          </span>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground">מתחרים</h3>
            <p className="text-sm text-muted-foreground">אופציונלי — עוזר לנו להבדיל אותך</p>
          </div>
          {!showCompetitors && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCompetitors(true)}
              className="text-xs"
            >
              + הוסף מתחרים
            </Button>
          )}
        </div>

        {showCompetitors && (
          <div className="space-y-2.5 pr-11">
            {[0, 1, 2].map((idx) => {
              const value = mri.competitors[idx] || '';
              return (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-5 text-center shrink-0">{idx + 1}</span>
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
                      placeholder={idx === 0 ? 'המתחרה הראשי...' : idx === 1 ? 'עוד מתחרה...' : 'אופציונלי...'}
                      className="h-10 text-sm bg-background"
                    />
                    {value && (
                      <button
                        onClick={() => updateMRI({ competitors: mri.competitors.filter((_, i) => i !== idx) })}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-destructive/10"
                      >
                        <X className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            <button
              onClick={() => {
                setShowCompetitors(false);
                updateMRI({ competitors: [], competitorPositions: [], noCompetitors: true });
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors pr-7"
            >
              אין לי מתחרים ישירים
            </button>
          </div>
        )}
      </section>

      {/* ─── Navigation ─── */}
      <div className="flex justify-between pt-2">
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
