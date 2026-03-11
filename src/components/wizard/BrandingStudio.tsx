import { useState, useEffect, useRef, useCallback } from "react";
import { X, Sparkles, ArrowLeft, ArrowRight, Check, Loader2, Palette, Target, Users, Eye, RefreshCw, RotateCcw, ChevronLeft, ChevronRight, Pencil, Type, ChevronDown, Globe, Heart, Star, Download } from "lucide-react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface BrandingStudioProps {
  isOpen: boolean;
  onClose: () => void;
  onBrandingComplete?: (branding: {
    businessName: string;
    logo: string | null;
    colors: { primary: string; secondary: string; accent?: string; background: string; dark?: string };
    fonts: { header: string; body: string };
    tagline?: string;
    brandVoice?: string;
  }) => void;
  businessName?: string;
}

interface BriefData {
  businessName: string;
  essence: string;
  differentiator: string;
  persona: string;
  audience: string;
  vision: string;
  designPreferences: string;
}

interface TaglineOption {
  hebrew: string;
  english: string;
  style: string;
}

interface WorldReference {
  brand: string;
  colors: string;
  lesson: string;
}

interface BrandValue {
  value: string;
  icon: string;
  designConnection: string;
}

interface BrandDirection {
  name: string;
  nameEn: string;
  philosophy: string;
  colors: { primary: string; secondary: string; accent: string; background: string; dark: string };
  colorDescription: string;
  colorEmotion: string | null;
  fonts: { header: string; body: string };
  logo: string | null;
  mockup: string | null;
  mockups: string[];
  worldReferences: WorldReference[];
}

interface BrandResult {
  strategy: {
    tagline_options?: TaglineOption[];
    brand_voice: string;
    brand_essence_summary: string;
    brand_values?: BrandValue[];
  };
  directions: BrandDirection[];
}

type StudioPhase = 'brief' | 'generating' | 'result';

const BRIEF_STEPS = [
  { key: 'businessName' as const, title: 'שם העסק', question: 'מה שם העסק שלכם?', placeholder: 'לדוגמה: בית חם - עיצוב פנים', icon: Target, minLength: 2 },
  { key: 'essence' as const, title: 'התמחות העסק', question: 'במשפט אחד: מה התמחות העסק ולמה לבחור דווקא בכם?', placeholder: 'לדוגמה: אנחנו מספקים שירותי הובלות מהירות ואמינות עם שירות אישי', icon: Target, minLength: 10 },
  { key: 'differentiator' as const, title: 'הבידול שלכם', question: 'במה אתם שונים מהמתחרים?', placeholder: 'לדוגמה: אנחנו היחידים שמציעים ביטוח מלא ללא תוספת תשלום', icon: Sparkles, minLength: 10 },
  { key: 'audience' as const, title: 'קהל היעד', question: 'מי הקהל האידיאלי שלכם?', placeholder: 'לדוגמה: משפחות צעירות באזור המרכז, גילאי 25-45', icon: Users, minLength: 5 },
  { key: 'designPreferences' as const, title: 'העדפות עיצוב', question: 'איזה צבעים או סגנון מדברים אליכם? (אופציונלי)', placeholder: 'לדוגמה: צבעים חמים, סגנון מודרני ונקי, או "תפתיעו אותי"', icon: Palette, minLength: 3 },
];

const GENERATION_STEPS = [
  { text: 'מנתחים את הבריף שלכם...', duration: 3000 },
  { text: 'מעצבים 3 כיווני מיתוג...', duration: 5000 },
  { text: 'יוצרים לוגו והדמיות לכיוון 1...', duration: 12000 },
  { text: 'יוצרים לוגו והדמיות לכיוון 2...', duration: 12000 },
  { text: 'יוצרים לוגו והדמיות לכיוון 3...', duration: 12000 },
  { text: 'מרכיבים את חבילת המיתוג...', duration: 3000 },
];

// Color utility helpers
const hexToHsl = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) / 6 : max === g ? ((b - r) / d + 2) / 6 : ((r - g) / d + 4) / 6;
  }
  return [h * 360, s * 100, l * 100];
};

const hslToHex = (h: number, s: number, l: number) => {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => { const k = (n + h / 30) % 12; return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); };
  return '#' + [f(0), f(8), f(4)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
};

// Convert hex color to Hebrew color name based on hue/saturation/lightness
const hexToHebrewName = (hex: string): string => {
  const [h, s, l] = hexToHsl(hex);
  if (s < 10) {
    if (l < 15) return 'שחור';
    if (l < 35) return 'אפור כהה';
    if (l < 65) return 'אפור';
    if (l < 90) return 'אפור בהיר';
    return 'לבן';
  }
  if (l < 12) return 'שחור';
  if (l > 92) return 'לבן';
  
  const shade = l < 35 ? ' כהה' : l > 70 ? ' בהיר' : '';
  if (h < 15 || h >= 345) return `אדום${shade}`;
  if (h < 35) return `כתום${shade}`;
  if (h < 55) return `צהוב${shade}`;
  if (h < 80) return `ירוק-צהוב${shade}`;
  if (h < 160) return `ירוק${shade}`;
  if (h < 190) return `טורקיז${shade}`;
  if (h < 250) return `כחול${shade}`;
  if (h < 290) return `סגול${shade}`;
  if (h < 330) return `ורוד${shade}`;
  return `אדום${shade}`;
};

// Build accurate color description from actual hex values
const buildColorDescription = (colors: { primary: string; secondary: string; accent: string; background?: string; dark?: string }): string => {
  const names = [
    hexToHebrewName(colors.primary),
    hexToHebrewName(colors.secondary),
    hexToHebrewName(colors.accent),
  ].filter((v, i, a) => a.indexOf(v) === i); // unique names only
  return names.join(', ');
};

export function BrandingStudio({ isOpen, onClose, onBrandingComplete, businessName }: BrandingStudioProps) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<StudioPhase>('brief');
  const [briefStep, setBriefStep] = useState(0);
  const [briefData, setBriefData] = useState<BriefData>({
    businessName: businessName || '', essence: '', differentiator: '', persona: '', audience: '', vision: '', designPreferences: '',
  });
  const [generationStep, setGenerationStep] = useState(0);
  const [brandResult, setBrandResult] = useState<BrandResult | null>(null);
  const [selectedDirectionIndex, setSelectedDirectionIndex] = useState(0);
  const [selectedTaglineIndex, setSelectedTaglineIndex] = useState<number | null>(null);
  const [showTaglineSelection, setShowTaglineSelection] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [logoBgMode, setLogoBgMode] = useState<'light' | 'dark' | 'brand'>('light');
  const [swapSource, setSwapSource] = useState<string | null>(null);
  const [customTagline, setCustomTagline] = useState<string>('');
  const [isEditingTagline, setIsEditingTagline] = useState(false);
  const [subtitle, setSubtitle] = useState<string>('');
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [deepDiveOpen, setDeepDiveOpen] = useState(false);
  const [activeMockupIndex, setActiveMockupIndex] = useState(0);
  const presentationRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPhase('brief');
      setBriefStep(0);
      setBriefData({ businessName: businessName || '', essence: '', differentiator: '', persona: '', audience: '', vision: '', designPreferences: '' });
      setBrandResult(null);
      setSelectedDirectionIndex(0);
      setSelectedTaglineIndex(null);
      setShowTaglineSelection(false);
      setGenerationStep(0);
      setLogoBgMode('light');
      setCustomTagline('');
      setIsEditingTagline(false);
      setSubtitle('');
      setShowSubtitle(false);
      setDeepDiveOpen(false);
    }
  }, [isOpen, businessName]);

  useEffect(() => {
    if (phase !== 'generating') return;
    if (generationStep >= GENERATION_STEPS.length - 1) return;
    const timer = setTimeout(() => {
      setGenerationStep(prev => Math.min(prev + 1, GENERATION_STEPS.length - 1));
    }, GENERATION_STEPS[generationStep].duration);
    return () => clearTimeout(timer);
  }, [phase, generationStep]);

  const currentBriefStep = BRIEF_STEPS[briefStep];
  const canProceedBrief = currentBriefStep && briefData[currentBriefStep.key].trim().length >= currentBriefStep.minLength;

  const handleBriefNext = () => {
    if (briefStep < BRIEF_STEPS.length - 1) setBriefStep(prev => prev + 1);
    else startGeneration();
  };

  const handleBriefPrev = () => {
    if (briefStep > 0) setBriefStep(prev => prev - 1);
  };

  const startGeneration = async () => {
    setPhase('generating');
    setGenerationStep(0);
    try {
      const { data, error } = await supabase.functions.invoke('generate-branding', {
        body: {
          businessName: briefData.businessName, essence: briefData.essence,
          differentiator: briefData.differentiator, persona: briefData.persona,
          audience: briefData.audience, vision: briefData.vision,
          designPreferences: briefData.designPreferences,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Generation failed');
      setBrandResult(data);
      setPhase('result');
      toast.success('3 כיווני מיתוג מוכנים! 🎨');
    } catch (e: any) {
      console.error('Branding generation error:', e);
      const errorText = `${e?.message || ''} ${e?.context || ''}`.toLowerCase();

      if (errorText.includes('402') || errorText.includes('payment required')) {
        toast.error('נגמרה כרגע מכסת ה-AI בחשבון. נסו שוב עוד מעט או הוסיפו יתרה.');
      } else if (errorText.includes('429') || errorText.includes('rate')) {
        toast.error('יש עומס רגעי בבקשות AI. נסו שוב בעוד דקה.');
      } else {
        toast.error('שגיאה ביצירת המיתוג. נסו שוב.');
      }

      setPhase('brief');
      setBriefStep(BRIEF_STEPS.length - 1);
    }
  };

  const selectedDirection = brandResult?.directions?.[selectedDirectionIndex];

  const exportPdf = useCallback(async () => {
    if (!pdfRef.current || !selectedDirection || !brandResult) return;
    setIsExportingPdf(true);
    try {
      const el = pdfRef.current;
      el.style.display = 'block';
      await new Promise(r => setTimeout(r, 600));

      const dataUrl = await toPng(el, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      el.style.display = 'none';

      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = reject; });

      const imgW = img.naturalWidth;
      const imgH = img.naturalHeight;
      const pdfW = 210;
      const pdfH = (imgH / imgW) * pdfW;

      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: [pdfW, Math.max(pdfH, 297)] });
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfW, pdfH);
      pdf.save(`${briefData.businessName || 'branding'}-כיוון-${selectedDirectionIndex + 1}.pdf`);
      toast.success('ה-PDF הורד בהצלחה! 📄');
    } catch (e) {
      console.error('PDF export error:', e);
      toast.error('שגיאה בייצוא PDF');
    } finally {
      setIsExportingPdf(false);
      if (pdfRef.current) pdfRef.current.style.display = 'none';
    }
  }, [selectedDirection, brandResult, briefData.businessName, selectedDirectionIndex]);

  const handleSaveAndContinue = async () => {
    if (!brandResult || !selectedDirection) return;

    const taglineOptions = brandResult.strategy.tagline_options || [];
    const selectedTagline = customTagline || (selectedTaglineIndex !== null ? taglineOptions[selectedTaglineIndex]?.hebrew : null);
    const fullTagline = [selectedTagline, subtitle].filter(Boolean).join(' | ');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('יש להתחבר'); return; }

      await supabase.from('branding_orders').insert({
        user_id: user.id, essence: briefData.essence, differentiator: briefData.differentiator,
        persona: briefData.persona, audience: briefData.audience, vision: briefData.vision,
        design_preferences: briefData.designPreferences, package_type: 'ai_generated',
        status: 'completed', payment_status: 'free_ai',
      });

      const { data: profiles } = await supabase
        .from('client_profiles').select('id').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(1);

      if (profiles && profiles.length > 0) {
        await supabase.from('client_profiles').update({
          business_name: briefData.businessName || undefined,
          primary_color: selectedDirection.colors.primary,
          secondary_color: selectedDirection.colors.secondary,
          background_color: selectedDirection.colors.background,
          header_font: selectedDirection.fonts.header,
          body_font: selectedDirection.fonts.body,
          logo_url: selectedDirection.logo || undefined,
        }).eq('id', profiles[0].id);
      }

      toast.success('המיתוג נשמר בהצלחה!');

      if (onBrandingComplete) {
        onBrandingComplete({
          businessName: briefData.businessName,
          logo: selectedDirection.logo,
          colors: selectedDirection.colors,
          fonts: selectedDirection.fonts,
          tagline: fullTagline || undefined,
          brandVoice: brandResult.strategy.brand_voice,
        });
        onClose();
      } else {
        onClose();
        navigate('/dashboard');
      }
    } catch (e) {
      console.error('Save error:', e);
      toast.error('שגיאה בשמירה');
    }
  };

  const updateDirectionColor = (colorKey: string, newColor: string) => {
    if (!brandResult || !selectedDirection) return;
    const newDirections = [...brandResult.directions];
    newDirections[selectedDirectionIndex] = {
      ...newDirections[selectedDirectionIndex],
      colors: { ...newDirections[selectedDirectionIndex].colors, [colorKey]: newColor },
    };
    setBrandResult({ ...brandResult, directions: newDirections });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-auto" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">ADKOP Branding AI</h1>
              <p className="text-xs text-muted-foreground">יצירת מיתוג אוטומטית</p>
            </div>
          </div>
          {phase !== 'result' && (
            <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* ═══════════ BRIEF PHASE ═══════════ */}
        {phase === 'brief' && currentBriefStep && (
          <div className="space-y-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-2">
              {BRIEF_STEPS.map((_, idx) => (
                <div key={idx} className={`h-1.5 flex-1 rounded-full transition-colors ${idx <= briefStep ? 'bg-primary' : 'bg-muted'}`} />
              ))}
            </div>
            <Card className="p-8 space-y-6">
              <div className="flex items-center gap-3 text-primary">
                <currentBriefStep.icon className="w-6 h-6" />
                <span className="text-sm font-medium">{currentBriefStep.title}</span>
              </div>
              <h2 className="text-2xl font-bold leading-relaxed">{currentBriefStep.question}</h2>
              {currentBriefStep.key === 'businessName' ? (
                <Input value={briefData[currentBriefStep.key]} onChange={(e) => setBriefData(prev => ({ ...prev, [currentBriefStep.key]: e.target.value }))} placeholder={currentBriefStep.placeholder} className="text-lg h-14" dir="rtl" />
              ) : (
                <Textarea value={briefData[currentBriefStep.key]} onChange={(e) => setBriefData(prev => ({ ...prev, [currentBriefStep.key]: e.target.value }))} placeholder={currentBriefStep.placeholder} className="min-h-[120px] text-lg resize-none" dir="rtl" />
              )}
              <div className="flex items-center justify-between pt-4">
                <Button variant="ghost" onClick={handleBriefPrev} disabled={briefStep === 0} className="gap-2"><ArrowRight className="w-4 h-4" />הקודם</Button>
                <span className="text-sm text-muted-foreground">{briefStep + 1} / {BRIEF_STEPS.length}</span>
                <Button onClick={handleBriefNext} disabled={!canProceedBrief} className="gap-2">{briefStep === BRIEF_STEPS.length - 1 ? '✨ צרו לי מיתוג' : 'הבא'}<ArrowLeft className="w-4 h-4" /></Button>
              </div>
            </Card>
          </div>
        )}

        {/* ═══════════ GENERATING PHASE ═══════════ */}
        {phase === 'generating' && (
          <div className="min-h-[500px] flex flex-col items-center justify-center text-center space-y-10">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Sparkles className="w-14 h-14 text-primary animate-pulse" />
              </div>
              <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
            </div>
            <div className="space-y-4 max-w-md">
              <h2 className="text-2xl font-bold">יוצרים 3 כיווני מיתוג...</h2>
              <div className="space-y-3">
                {GENERATION_STEPS.map((step, idx) => (
                  <div key={idx} className={`flex items-center gap-3 transition-all duration-500 ${idx <= generationStep ? 'opacity-100' : 'opacity-30'}`}>
                    {idx < generationStep ? <Check className="w-5 h-5 text-primary flex-shrink-0" /> : idx === generationStep ? <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" /> : <div className="w-5 h-5 rounded-full border-2 border-muted flex-shrink-0" />}
                    <span className={`text-sm ${idx <= generationStep ? 'text-foreground' : 'text-muted-foreground'}`}>{step.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ RESULT PHASE ═══════════ */}
        {phase === 'result' && brandResult && brandResult.directions.length > 0 && (
          <div className="space-y-8" ref={presentationRef}>
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold">🎨 3 כיווני מיתוג ל{briefData.businessName}</h2>
              <p className="text-muted-foreground">בחרו את הכיוון שמדבר אליכם — כל אחד עולם שלם</p>
            </div>

            {/* Direction Tabs */}
            <div className="flex justify-center gap-3">
              {brandResult.directions.map((dir, idx) => (
                <button
                  key={idx}
                  onClick={() => { setSelectedDirectionIndex(idx); setActiveMockupIndex(0); }}
                  className={`relative px-6 py-3 rounded-xl border-2 transition-all duration-300 font-bold text-sm ${
                    selectedDirectionIndex === idx
                      ? 'border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/30 bg-primary/5'
                      : 'border-border hover:border-primary/40 bg-card'
                  }`}
                >
                  <span className="text-xs text-muted-foreground block mb-0.5">כיוון {idx + 1}</span>
                  <span>{dir.name}</span>
                  {selectedDirectionIndex === idx && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Selected Direction - Full Presentation */}
            {selectedDirection && (
              <div className="space-y-6">
                {/* Philosophy + Rationale */}
                <Card className="p-6 text-center" style={{
                  background: `linear-gradient(135deg, ${selectedDirection.colors.primary}10, ${selectedDirection.colors.secondary}10)`,
                  borderColor: selectedDirection.colors.primary + '30',
                }}>
                  <p className="text-lg font-medium text-foreground">{selectedDirection.philosophy}</p>
                </Card>

                {/* Logo + Mockup Side by Side */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Logo */}
                  <Card className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        לוגו
                      </h4>
                      <div className="flex gap-1 bg-muted rounded-lg p-0.5">
                        {([['light', '☀️'], ['dark', '🌙'], ['brand', '🎨']] as const).map(([mode, emoji]) => (
                          <button key={mode} onClick={() => setLogoBgMode(mode)}
                            className={`px-2 py-1 rounded text-xs transition-all ${logoBgMode === mode ? 'bg-background shadow-sm' : 'hover:bg-background/50'}`}>
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      {selectedDirection.logo ? (
                        <div className="w-full aspect-square max-w-[280px] rounded-2xl flex items-center justify-center p-8 shadow-xl border-2 transition-all duration-500"
                          style={{
                            backgroundColor: logoBgMode === 'dark' ? '#1a1a2e' : logoBgMode === 'brand' ? selectedDirection.colors.primary : '#ffffff',
                            borderColor: logoBgMode === 'brand' ? selectedDirection.colors.secondary : logoBgMode === 'dark' ? '#333' : '#e5e7eb',
                          }}>
                          <img src={selectedDirection.logo} alt="Logo" className="max-w-full max-h-full object-contain drop-shadow-xl"
                            style={{ filter: logoBgMode === 'dark' ? 'brightness(1.1)' : 'none' }} />
                        </div>
                      ) : (
                        <div className="w-full aspect-square max-w-[280px] rounded-2xl bg-muted flex items-center justify-center">
                          <p className="text-muted-foreground text-sm">לוגו לא נוצר</p>
                        </div>
                      )}
                      {/* Tagline under logo */}
                      {(() => {
                        const displayTagline = customTagline || (selectedTaglineIndex !== null ? brandResult.strategy.tagline_options?.[selectedTaglineIndex]?.hebrew : null);
                        return displayTagline ? (
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-lg font-bold" style={{ color: selectedDirection.colors.primary }}>{displayTagline}</p>
                            <button onClick={() => { setCustomTagline(displayTagline); setIsEditingTagline(true); }} className="opacity-50 hover:opacity-100 transition-opacity">
                              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                          </div>
                        ) : null;
                      })()}
                      {/* Subtitle under tagline */}
                      {showSubtitle && subtitle && (
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground font-medium">{subtitle}</p>
                          <button onClick={() => setShowSubtitle(true)} className="opacity-50 hover:opacity-100 transition-opacity">
                            <Pencil className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Mockups Carousel */}
                  <Card className="p-6 space-y-4">
                    <h4 className="text-base font-bold flex items-center gap-2">
                      <Eye className="w-4 h-4 text-primary" />
                      הדמיות יישום
                    </h4>
                    {(selectedDirection.mockups?.length > 0 || selectedDirection.mockup) ? (() => {
                      const allMockups = selectedDirection.mockups?.length > 0 ? selectedDirection.mockups : (selectedDirection.mockup ? [selectedDirection.mockup] : []);
                      const currentMockup = allMockups[activeMockupIndex] || allMockups[0];
                      return (
                        <div className="space-y-3">
                          <div className="rounded-xl overflow-hidden shadow-xl border border-border">
                            <img src={currentMockup} alt={`Mockup ${activeMockupIndex + 1}`} className="w-full aspect-square object-cover" />
                          </div>
                          {allMockups.length > 1 && (
                            <div className="flex justify-center gap-2">
                              {allMockups.map((_, mIdx) => (
                                <button key={mIdx} onClick={() => setActiveMockupIndex(mIdx)}
                                  className={`w-2.5 h-2.5 rounded-full transition-all ${mIdx === activeMockupIndex ? 'scale-125' : 'opacity-40 hover:opacity-70'}`}
                                  style={{ backgroundColor: mIdx === activeMockupIndex ? selectedDirection.colors.primary : '#999' }} />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })() : (
                      <div className="w-full aspect-square rounded-xl bg-muted flex items-center justify-center">
                        <p className="text-muted-foreground text-sm">הדמיות לא נוצרו</p>
                      </div>
                    )}
                  </Card>
                </div>

                {/* Color Palette */}
                <Card className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold flex items-center gap-2">
                        <Palette className="w-4 h-4 text-primary" />
                        צבעוניות
                      </h4>
                      {selectedDirection.colorDescription && (
                        <p className="text-sm text-muted-foreground mt-1">{selectedDirection.colorDescription}</p>
                      )}
                    </div>
                    {swapSource && (
                      <Button variant="ghost" size="sm" onClick={() => setSwapSource(null)} className="text-xs gap-1">
                        <X className="w-3 h-3" /> ביטול
                      </Button>
                    )}
                  </div>
                  {swapSource && (
                    <p className="text-sm text-primary font-medium text-center animate-pulse">🔄 לחצו על צבע אחר להחלפת מיקומים</p>
                  )}
                  <div className="grid grid-cols-5 gap-4">
                    {Object.entries(selectedDirection.colors).map(([key, color]) => {
                      const label = key === 'primary' ? 'ראשי' : key === 'secondary' ? 'משני' : key === 'accent' ? 'אקסנט' : key === 'background' ? 'רקע' : 'כהה';
                      const isSwapSrc = swapSource === key;
                      return (
                        <div key={key} className="space-y-2 text-center">
                          <button
                            onClick={() => {
                              if (!swapSource) { setSwapSource(key); }
                              else if (swapSource === key) { setSwapSource(null); }
                              else {
                                const curColors = { ...selectedDirection.colors };
                                const temp = curColors[swapSource as keyof typeof curColors];
                                (curColors as any)[swapSource] = curColors[key as keyof typeof curColors];
                                (curColors as any)[key] = temp;
                                const newDirs = [...brandResult.directions];
                                newDirs[selectedDirectionIndex] = { ...newDirs[selectedDirectionIndex], colors: curColors };
                                setBrandResult({ ...brandResult, directions: newDirs });
                                setSwapSource(null);
                                toast.success('הצבעים הוחלפו!');
                              }
                            }}
                            className={`w-full aspect-square rounded-xl shadow-lg border-2 transition-all duration-300 hover:scale-105 cursor-pointer ${
                              isSwapSrc ? 'border-primary ring-4 ring-primary/30 scale-110' : swapSource ? 'border-dashed border-primary/50 hover:border-primary' : 'border-border hover:border-primary/40'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                          <p className="text-xs font-medium">{label}</p>
                          <div className="flex items-center justify-center gap-1">
                            <p className="text-xs text-muted-foreground font-mono">{color}</p>
                            <button onClick={(e) => {
                              e.stopPropagation();
                              const [h, s, l] = hexToHsl(color);
                              const newH = (h + 30 + Math.random() * 60) % 360;
                              const newColor = hslToHex(newH, Math.min(100, s + (Math.random() * 20 - 10)), Math.min(95, Math.max(10, l + (Math.random() * 20 - 10))));
                              updateDirectionColor(key, newColor);
                              toast.success(`צבע ${label} הוחלף!`);
                            }}>
                              <RotateCcw className="w-3 h-3 text-muted-foreground hover:text-primary cursor-pointer" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Typography */}
                <Card className="p-6 space-y-4">
                  <h4 className="text-base font-bold">טיפוגרפיה</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-muted/50">
                      <p className="text-xs font-medium text-muted-foreground mb-2">פונט כותרות</p>
                      <p className="text-2xl font-bold" style={{ fontFamily: selectedDirection.fonts.header }}>{briefData.businessName}</p>
                      <p className="text-sm text-muted-foreground mt-1">{selectedDirection.fonts.header}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50">
                      <p className="text-xs font-medium text-muted-foreground mb-2">פונט גוף</p>
                      <p className="text-base" style={{ fontFamily: selectedDirection.fonts.body }}>{brandResult.strategy.brand_essence_summary}</p>
                      <p className="text-sm text-muted-foreground mt-1">{selectedDirection.fonts.body}</p>
                    </div>
                  </div>
                </Card>

                {/* Deep Dive - Expandable */}
                <div className="border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setDeepDiveOpen(!deepDiveOpen)}
                    className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Globe className="w-4 h-4" />
                      <span>רוצים להעמיק? רפרנסים מהתחום, פסיכולוגיית צבע וערכי מותג</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${deepDiveOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {deepDiveOpen && (
                    <div className="p-5 pt-0 space-y-5 border-t border-border">
                      {/* World References */}
                      {selectedDirection.worldReferences && selectedDirection.worldReferences.length > 0 && (
                        <div className="space-y-3 pt-4">
                          <h5 className="text-sm font-bold flex items-center gap-2">
                            <Globe className="w-4 h-4 text-primary" />
                            רפרנסים מהתחום
                          </h5>
                          <div className="grid gap-2">
                            {selectedDirection.worldReferences.map((ref, idx) => (
                              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
                                  {idx + 1}
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-sm font-bold">{ref.brand} <span className="font-normal text-muted-foreground">({ref.colors})</span></p>
                                  <p className="text-xs text-muted-foreground">{ref.lesson}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Color Emotion */}
                      {selectedDirection.colorEmotion && (
                        <div className="space-y-2">
                          <h5 className="text-sm font-bold flex items-center gap-2">
                            <Heart className="w-4 h-4 text-rose-500" />
                            חיבור רגשי לצבע
                          </h5>
                          <div className="p-3 rounded-lg border border-border" style={{
                            background: `linear-gradient(135deg, ${selectedDirection.colors.primary}08, ${selectedDirection.colors.secondary}08)`
                          }}>
                            <p className="text-sm text-foreground leading-relaxed">{selectedDirection.colorEmotion}</p>
                          </div>
                        </div>
                      )}

                      {/* Brand Values */}
                      {brandResult.strategy.brand_values && brandResult.strategy.brand_values.length > 0 && (
                        <div className="space-y-3">
                          <h5 className="text-sm font-bold flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-500" />
                            ערכי המותג → עיצוב
                          </h5>
                          <div className="grid gap-2">
                            {brandResult.strategy.brand_values.map((val, idx) => (
                              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                                <span className="text-lg">{val.icon}</span>
                                <div>
                                  <p className="text-sm font-bold">{val.value}</p>
                                  <p className="text-xs text-muted-foreground">{val.designConnection}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tagline + Subtitle */}
            {!showTaglineSelection ? (
              <Card className="p-6 text-center space-y-3">
                <p className="text-muted-foreground">רוצים להוסיף סלוגן מתחת ללוגו?</p>
                <div className="flex justify-center gap-3">
                  <Button onClick={() => setShowTaglineSelection(true)} className="gap-2"><Sparkles className="w-4 h-4" />כן, תראו לי אפשרויות</Button>
                  <Button variant="ghost" onClick={() => setSelectedTaglineIndex(null)}>לא, בלי סלוגן</Button>
                </div>
              </Card>
            ) : (
              <Card className="p-6 space-y-4">
                <h4 className="text-base font-bold text-center">✨ בחרו סלוגן</h4>
                {brandResult.strategy.tagline_options && brandResult.strategy.tagline_options.length > 0 ? (
                  <div className="grid gap-3">
                    {brandResult.strategy.tagline_options.map((option, idx) => (
                      <button key={idx} onClick={() => { setSelectedTaglineIndex(idx); setCustomTagline(''); setIsEditingTagline(false); }}
                        className={`relative p-4 rounded-xl border-2 text-right transition-all duration-300 ${
                          selectedTaglineIndex === idx && !customTagline ? 'border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/30' : 'border-border hover:border-primary/40'
                        }`}
                        style={selectedTaglineIndex === idx && !customTagline && selectedDirection ? {
                          background: `linear-gradient(135deg, ${selectedDirection.colors.primary}10, ${selectedDirection.colors.secondary}10)`
                        } : {}}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1 flex-1">
                            <p className="text-xl font-bold text-foreground">{option.hebrew}</p>
                            <p className="text-sm text-muted-foreground">{option.english}</p>
                          </div>
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground whitespace-nowrap">{option.style}</span>
                        </div>
                        {selectedTaglineIndex === idx && !customTagline && (
                          <div className="absolute -top-2 -left-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-md">
                            <Check className="w-3.5 h-3.5 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                    ))}

                    {/* Custom tagline input */}
                    <div className="border-t border-border pt-4 mt-2 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Pencil className="w-4 h-4" />
                        <span>או כתבו סלוגן משלכם:</span>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={customTagline}
                          onChange={(e) => { setCustomTagline(e.target.value); if (e.target.value) setSelectedTaglineIndex(null); }}
                          placeholder="הקלידו סלוגן מותאם אישית..."
                          className="flex-1 text-base"
                          dir="rtl"
                        />
                        {customTagline && (
                          <Button size="sm" variant="outline" onClick={() => { setCustomTagline(''); }}>
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      {customTagline && (
                        <p className="text-xs text-primary flex items-center gap-1">
                          <Check className="w-3 h-3" /> הסלוגן המותאם יופיע מתחת ללוגו
                        </p>
                      )}
                    </div>

                    {/* Subtitle option */}
                    <div className="border-t border-border pt-4 mt-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Type className="w-4 h-4" />
                          <span>תת-כותרת תיאורית (אופציונלי):</span>
                        </div>
                        {!showSubtitle && (
                          <Button size="sm" variant="ghost" onClick={() => setShowSubtitle(true)} className="text-xs gap-1">
                            <span>+ הוסף</span>
                          </Button>
                        )}
                      </div>
                      {showSubtitle && (
                        <div className="flex gap-2">
                          <Input
                            value={subtitle}
                            onChange={(e) => setSubtitle(e.target.value)}
                            placeholder="לדוגמה: ייעוץ וליווי עסקי | מאז 2005"
                            className="flex-1 text-sm"
                            dir="rtl"
                          />
                          <Button size="sm" variant="outline" onClick={() => { setShowSubtitle(false); setSubtitle(''); }}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <button onClick={() => { setSelectedTaglineIndex(null); setCustomTagline(''); setShowTaglineSelection(false); setShowSubtitle(false); setSubtitle(''); }} className="text-sm text-muted-foreground hover:text-foreground transition-colors pt-1">↩ בלי סלוגן</button>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">לא נוצרו אפשרויות סלוגן</p>
                )}
              </Card>
            )}

            {/* Brand Voice */}
            <Card className="p-6 space-y-3">
              <h4 className="text-base font-bold">קול המותג</h4>
              <p className="text-base leading-relaxed text-muted-foreground">{brandResult.strategy.brand_voice}</p>
            </Card>

            {/* Actions */}
            <div className="flex flex-col items-center gap-4 pt-6 pb-12">
              <Button variant="gradient" size="xl" onClick={handleSaveAndContinue} className="w-full max-w-md h-16 text-xl font-bold gap-2">
                <Check className="w-6 h-6" />
                שמור ותמשיך לאונבורדינג
              </Button>
              <Button variant="outline" size="lg" onClick={exportPdf} disabled={isExportingPdf} className="gap-2">
                <Download className={`w-4 h-4 ${isExportingPdf ? 'animate-bounce' : ''}`} />
                {isExportingPdf ? 'מייצא PDF...' : 'הורד כיוון מיתוג כ-PDF'}
              </Button>
              <Button variant="outline" size="lg" onClick={startGeneration} disabled={isRegenerating} className="gap-2">
                <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                צור מיתוג חדש
              </Button>
              <Button variant="ghost" onClick={onClose}>סגור</Button>
            </div>
          </div>
        )}

        {/* Hidden PDF Template */}
        {brandResult && selectedDirection && (
          <div
            ref={pdfRef}
            style={{ display: 'none', position: 'absolute', left: '-9999px', top: 0, width: '800px', fontFamily: 'Arial, sans-serif' }}
            dir="rtl"
          >
            <div style={{ padding: '48px', background: '#fff' }}>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: `3px solid ${selectedDirection.colors.primary}`, paddingBottom: '24px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '8px' }}>{briefData.businessName}</h1>
                <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>כיוון מיתוג {selectedDirectionIndex + 1}: {selectedDirection.name}</p>
              </div>

              {/* Philosophy */}
              <div style={{ padding: '20px', background: `${selectedDirection.colors.primary}10`, borderRadius: '12px', marginBottom: '32px', borderRight: `4px solid ${selectedDirection.colors.primary}` }}>
                <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#333', margin: 0 }}>{selectedDirection.philosophy}</p>
              </div>

              {/* Logo */}
              {selectedDirection.logo && (
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '16px' }}>לוגו</h3>
                  <div style={{ display: 'inline-block', padding: '32px', background: '#fff', border: '2px solid #e5e7eb', borderRadius: '16px' }}>
                    <img src={selectedDirection.logo} alt="Logo" style={{ maxWidth: '240px', maxHeight: '240px' }} crossOrigin="anonymous" />
                  </div>
                  {(() => {
                    const displayTagline = customTagline || (selectedTaglineIndex !== null ? brandResult.strategy.tagline_options?.[selectedTaglineIndex]?.hebrew : null);
                    return displayTagline ? (
                      <p style={{ fontSize: '20px', fontWeight: 'bold', color: selectedDirection.colors.primary, marginTop: '12px' }}>{displayTagline}</p>
                    ) : null;
                  })()}
                </div>
              )}

              {/* Mockups */}
              {(() => {
                const allMockups = selectedDirection.mockups?.length > 0 ? selectedDirection.mockups : (selectedDirection.mockup ? [selectedDirection.mockup] : []);
                return allMockups.length > 0 ? (
                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '16px' }}>הדמיות יישום</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: allMockups.length > 1 ? 'repeat(auto-fit, minmax(200px, 1fr))' : '1fr', gap: '12px' }}>
                      {allMockups.map((m, mIdx) => (
                        <img key={mIdx} src={m} alt={`Mockup ${mIdx + 1}`} style={{ width: '100%', borderRadius: '12px', border: '1px solid #e5e7eb' }} crossOrigin="anonymous" />
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Color Palette */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '16px' }}>צבעוניות</h3>
                {selectedDirection.colorDescription && (
                  <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>{selectedDirection.colorDescription}</p>
                )}
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                  {Object.entries(selectedDirection.colors).map(([key, color]) => {
                    const label = key === 'primary' ? 'ראשי' : key === 'secondary' ? 'משני' : key === 'accent' ? 'אקסנט' : key === 'background' ? 'רקע' : 'כהה';
                    return (
                      <div key={key} style={{ textAlign: 'center' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '12px', backgroundColor: color, border: '2px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <p style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '8px', marginBottom: '2px' }}>{label}</p>
                        <p style={{ fontSize: '11px', color: '#999', fontFamily: 'monospace', margin: 0 }}>{color}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Typography */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '16px' }}>טיפוגרפיה</h3>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1, padding: '16px', background: '#f9f9f9', borderRadius: '12px' }}>
                    <p style={{ fontSize: '12px', color: '#999', marginBottom: '8px', margin: '0 0 8px 0' }}>פונט כותרות</p>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{selectedDirection.fonts.header}</p>
                  </div>
                  <div style={{ flex: 1, padding: '16px', background: '#f9f9f9', borderRadius: '12px' }}>
                    <p style={{ fontSize: '12px', color: '#999', marginBottom: '8px', margin: '0 0 8px 0' }}>פונט גוף</p>
                    <p style={{ fontSize: '16px', margin: 0 }}>{selectedDirection.fonts.body}</p>
                  </div>
                </div>
              </div>

              {/* Brand Voice */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '12px' }}>קול המותג</h3>
                <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#555', margin: 0 }}>{brandResult.strategy.brand_voice}</p>
              </div>

              {/* Deep Dive content if open */}
              {selectedDirection.worldReferences && selectedDirection.worldReferences.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '12px' }}>🌍 רפרנסים מהתחום</h3>
                  {selectedDirection.worldReferences.map((ref, idx) => (
                    <div key={idx} style={{ padding: '10px 12px', background: '#f5f5f5', borderRadius: '8px', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{ref.brand}</span>
                      <span style={{ color: '#888', fontSize: '13px' }}> ({ref.colors})</span>
                      <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 0' }}>{ref.lesson}</p>
                    </div>
                  ))}
                </div>
              )}

              {selectedDirection.colorEmotion && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '12px' }}>❤️ חיבור רגשי לצבע</h3>
                  <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#555', margin: 0 }}>{selectedDirection.colorEmotion}</p>
                </div>
              )}

              {brandResult.strategy.brand_values && brandResult.strategy.brand_values.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '12px' }}>⭐ ערכי המותג → עיצוב</h3>
                  {brandResult.strategy.brand_values.map((val, idx) => (
                    <div key={idx} style={{ padding: '10px 12px', background: '#f5f5f5', borderRadius: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '16px' }}>{val.icon}</span>
                      <span style={{ fontWeight: 'bold', fontSize: '14px', marginRight: '8px' }}> {val.value}</span>
                      <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 0' }}>{val.designConnection}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div style={{ borderTop: '2px solid #eee', paddingTop: '16px', textAlign: 'center', marginTop: '32px' }}>
                <p style={{ fontSize: '12px', color: '#aaa', margin: 0 }}>נוצר באמצעות ADKOP Branding AI</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
