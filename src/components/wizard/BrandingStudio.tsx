import { useState, useEffect, useRef } from "react";
import { X, Sparkles, ArrowLeft, ArrowRight, Check, Loader2, Palette, Target, Users, Eye, Download, RefreshCw } from "lucide-react";
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

interface LogoOption {
  name: string;
  nameEn: string;
  description: string;
  image: string;
  includesName?: boolean;
}

interface TaglineOption {
  hebrew: string;
  english: string;
  style: string;
}

interface BrandResult {
  strategy: {
    tagline: string;
    tagline_english: string;
    tagline_options?: TaglineOption[];
    brand_voice: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      dark: string;
    };
    fonts: {
      header: string;
      body: string;
      header_reasoning: string;
      body_reasoning: string;
    };
    logo_concept: string;
    brand_essence_summary: string;
    mockup_scenes: string[];
  };
  logo: string | null;
  logoOptions: LogoOption[];
  mockups: string[];
}

type StudioPhase = 'brief' | 'generating' | 'result';

const BRIEF_STEPS = [
  {
    key: 'businessName' as const,
    title: 'שם העסק',
    question: 'מה שם העסק שלכם?',
    placeholder: 'לדוגמה: בית חם - עיצוב פנים',
    icon: Target,
    minLength: 2,
  },
  {
    key: 'essence' as const,
    title: 'התמחות העסק',
    question: 'במשפט אחד: מה התמחות העסק ולמה לבחור דווקא בכם?',
    placeholder: 'לדוגמה: אנחנו מספקים שירותי הובלות מהירות ואמינות עם שירות אישי',
    icon: Target,
    minLength: 10,
  },
  {
    key: 'differentiator' as const,
    title: 'הבידול שלכם',
    question: 'במה אתם שונים מהמתחרים?',
    placeholder: 'לדוגמה: אנחנו היחידים שמציעים ביטוח מלא ללא תוספת תשלום',
    icon: Sparkles,
    minLength: 10,
  },
  {
    key: 'audience' as const,
    title: 'קהל היעד',
    question: 'מי הקהל האידיאלי שלכם?',
    placeholder: 'לדוגמה: משפחות צעירות באזור המרכז, גילאי 25-45',
    icon: Users,
    minLength: 5,
  },
  {
    key: 'designPreferences' as const,
    title: 'העדפות עיצוב',
    question: 'איזה צבעים או סגנון מדברים אליכם? (אופציונלי)',
    placeholder: 'לדוגמה: צבעים חמים, סגנון מודרני ונקי, או "תפתיעו אותי"',
    icon: Palette,
    minLength: 3,
  },
];

const GENERATION_STEPS = [
  { text: 'מנתחים את הבריף שלכם...', duration: 3000 },
  { text: 'בוחרים פלטת צבעים מושלמת...', duration: 4000 },
  { text: 'מעצבים 5 סגנונות לוגו...', duration: 12000 },
  { text: 'בוחרים טיפוגרפיה מדויקת...', duration: 3000 },
  { text: 'יוצרים הדמיות מותג...', duration: 10000 },
  { text: 'מרכיבים את חבילת המיתוג...', duration: 5000 },
];

export function BrandingStudio({ isOpen, onClose, onBrandingComplete, businessName }: BrandingStudioProps) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<StudioPhase>('brief');
  const [briefStep, setBriefStep] = useState(0);
  const [briefData, setBriefData] = useState<BriefData>({
    businessName: businessName || '',
    essence: '',
    differentiator: '',
    persona: '',
    audience: '',
    vision: '',
    designPreferences: '',
  });
  const [generationStep, setGenerationStep] = useState(0);
  const [brandResult, setBrandResult] = useState<BrandResult | null>(null);
  const [selectedLogoIndex, setSelectedLogoIndex] = useState(0);
  const [selectedTaglineIndex, setSelectedTaglineIndex] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [logoBgMode, setLogoBgMode] = useState<'light' | 'dark' | 'brand'>('light');
  const presentationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPhase('brief');
      setBriefStep(0);
      setBriefData({
        businessName: businessName || '',
        essence: '',
        differentiator: '',
        persona: '',
        audience: '',
        vision: '',
        designPreferences: '',
      });
      setBrandResult(null);
      setSelectedLogoIndex(0);
      setSelectedTaglineIndex(0);
      setGenerationStep(0);
      setLogoBgMode('light');
    }
  }, [isOpen, businessName]);

  // Generation step animation
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
    if (briefStep < BRIEF_STEPS.length - 1) {
      setBriefStep(prev => prev + 1);
    } else {
      startGeneration();
    }
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
          businessName: briefData.businessName,
          essence: briefData.essence,
          differentiator: briefData.differentiator,
          persona: briefData.persona,
          audience: briefData.audience,
          vision: briefData.vision,
          designPreferences: briefData.designPreferences,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Generation failed');

      setBrandResult(data);
      setPhase('result');
      toast.success('חבילת המיתוג מוכנה! 🎨');
    } catch (e: any) {
      console.error('Branding generation error:', e);
      toast.error('שגיאה ביצירת המיתוג. נסו שוב.');
      setPhase('brief');
      setBriefStep(BRIEF_STEPS.length - 1);
    }
  };

  const handleSaveAndContinue = async () => {
    if (!brandResult) return;

    const selectedLogo = brandResult.logoOptions?.[selectedLogoIndex]?.image || brandResult.logo || null;
    const s = brandResult.strategy;
    const taglineOptions = s.tagline_options || [];
    const selectedTagline = taglineOptions[selectedTaglineIndex] || null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('יש להתחבר'); return; }

      // Save branding order
      await supabase.from('branding_orders').insert({
        user_id: user.id,
        essence: briefData.essence,
        differentiator: briefData.differentiator,
        persona: briefData.persona,
        audience: briefData.audience,
        vision: briefData.vision,
        design_preferences: briefData.designPreferences,
        package_type: 'ai_generated',
        status: 'completed',
        payment_status: 'free_ai',
      });

      // Update client profile with generated branding
      const { data: profiles } = await supabase
        .from('client_profiles')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (profiles && profiles.length > 0) {
        await supabase.from('client_profiles').update({
          business_name: briefData.businessName || undefined,
          primary_color: s.colors.primary,
          secondary_color: s.colors.secondary,
          background_color: s.colors.background,
          header_font: s.fonts.header,
          body_font: s.fonts.body,
          logo_url: selectedLogo || undefined,
        }).eq('id', profiles[0].id);
      }

      toast.success('המיתוג נשמר בהצלחה!');

      // If callback provided, pass branding back to wizard instead of navigating away
      if (onBrandingComplete) {
        onBrandingComplete({
          businessName: briefData.businessName,
          logo: selectedLogo,
          colors: s.colors,
          fonts: s.fonts,
          tagline: selectedTagline?.hebrew || s.tagline,
          brandVoice: s.brand_voice,
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-auto" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
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
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
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
                <Input
                  value={briefData[currentBriefStep.key]}
                  onChange={(e) => setBriefData(prev => ({ ...prev, [currentBriefStep.key]: e.target.value }))}
                  placeholder={currentBriefStep.placeholder}
                  className="text-lg h-14"
                  dir="rtl"
                />
              ) : (
                <Textarea
                  value={briefData[currentBriefStep.key]}
                  onChange={(e) => setBriefData(prev => ({ ...prev, [currentBriefStep.key]: e.target.value }))}
                  placeholder={currentBriefStep.placeholder}
                  className="min-h-[120px] text-lg resize-none"
                  dir="rtl"
                />
              )}

              <div className="flex items-center justify-between pt-4">
                <Button variant="ghost" onClick={handleBriefPrev} disabled={briefStep === 0} className="gap-2">
                  <ArrowRight className="w-4 h-4" />
                  הקודם
                </Button>
                <span className="text-sm text-muted-foreground">{briefStep + 1} / {BRIEF_STEPS.length}</span>
                <Button onClick={handleBriefNext} disabled={!canProceedBrief} className="gap-2">
                  {briefStep === BRIEF_STEPS.length - 1 ? '✨ צרו לי מיתוג' : 'הבא'}
                  <ArrowLeft className="w-4 h-4" />
                </Button>
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
              <h2 className="text-2xl font-bold">יוצרים את המותג שלכם...</h2>
              <div className="space-y-3">
                {GENERATION_STEPS.map((step, idx) => (
                  <div key={idx} className={`flex items-center gap-3 transition-all duration-500 ${idx <= generationStep ? 'opacity-100' : 'opacity-30'}`}>
                    {idx < generationStep ? (
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    ) : idx === generationStep ? (
                      <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted flex-shrink-0" />
                    )}
                    <span className={`text-sm ${idx <= generationStep ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ RESULT PHASE ═══════════ */}
        {phase === 'result' && brandResult && (
          <div className="space-y-8" ref={presentationRef}>
            {/* Header */}
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold">🎨 המיתוג של {briefData.businessName} מוכן!</h2>
              <p className="text-muted-foreground">הנה הזהות העיצובית שנוצרה עבורכם</p>
            </div>

            {/* Tagline */}
            <Card className="p-8 text-center space-y-3" style={{ 
              background: `linear-gradient(135deg, ${brandResult.strategy.colors.primary}15, ${brandResult.strategy.colors.secondary}15)` 
            }}>
              <p className="text-sm text-muted-foreground font-medium">סלוגן המותג</p>
              <h3 className="text-3xl font-bold" style={{ color: brandResult.strategy.colors.primary }}>
                {brandResult.strategy.tagline}
              </h3>
              <p className="text-sm text-muted-foreground">{brandResult.strategy.tagline_english}</p>
            </Card>

            {/* Logo Options Gallery */}
            {brandResult.logoOptions && brandResult.logoOptions.length > 0 && (
              <Card className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    בחרו את הלוגו שלכם
                  </h4>
                  <div className="flex gap-1 bg-muted rounded-lg p-1">
                    {([['light', '☀️'], ['dark', '🌙'], ['brand', '🎨']] as const).map(([mode, emoji]) => (
                      <button
                        key={mode}
                        onClick={() => setLogoBgMode(mode)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${logoBgMode === mode ? 'bg-background shadow-sm' : 'hover:bg-background/50'}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Selected Logo - Hero Display */}
                <div className="flex justify-center">
                  <div 
                    className="relative w-64 h-64 rounded-3xl flex items-center justify-center p-8 shadow-2xl border-2 transition-all duration-500"
                    style={{ 
                      backgroundColor: logoBgMode === 'dark' ? '#1a1a2e' : logoBgMode === 'brand' ? brandResult.strategy.colors.primary : '#ffffff',
                      borderColor: logoBgMode === 'brand' ? brandResult.strategy.colors.secondary : logoBgMode === 'dark' ? '#333' : '#e5e7eb',
                    }}
                  >
                    <img 
                      src={brandResult.logoOptions[selectedLogoIndex]?.image} 
                      alt="Selected Logo" 
                      className="max-w-full max-h-full object-contain drop-shadow-xl"
                      style={{ filter: logoBgMode === 'dark' ? 'brightness(1.1)' : 'none' }}
                    />
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                      {brandResult.logoOptions[selectedLogoIndex]?.name}
                    </div>
                  </div>
                </div>

                {/* Logo Options Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {brandResult.logoOptions.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedLogoIndex(idx)}
                      className={`group relative rounded-xl border-2 p-3 transition-all duration-300 hover:scale-105 ${
                        selectedLogoIndex === idx 
                          ? 'border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/30 bg-primary/5' 
                          : 'border-border hover:border-primary/40 bg-card'
                      }`}
                    >
                      <div className="aspect-square flex items-center justify-center p-2">
                        <img src={option.image} alt={option.nameEn} className="max-w-full max-h-full object-contain" />
                      </div>
                      <p className="text-xs font-medium text-center mt-2 truncate">{option.name}</p>
                      {selectedLogoIndex === idx && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  💡 {brandResult.strategy.logo_concept}
                </p>
              </Card>
            )}

            {/* Fallback: single logo */}
            {(!brandResult.logoOptions || brandResult.logoOptions.length === 0) && brandResult.logo && (
              <Card className="p-8 space-y-4">
                <h4 className="text-lg font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  לוגו
                </h4>
                <div className="flex justify-center">
                  <div className="w-48 h-48 rounded-2xl border-2 border-border bg-card flex items-center justify-center p-4 shadow-lg">
                    <img src={brandResult.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center">{brandResult.strategy.logo_concept}</p>
              </Card>
            )}

            {/* Color Palette */}
            <Card className="p-8 space-y-4">
              <h4 className="text-lg font-bold flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                פלטת צבעים
              </h4>
              <div className="grid grid-cols-5 gap-4">
                {Object.entries(brandResult.strategy.colors).map(([key, color]) => (
                  <div key={key} className="space-y-2 text-center">
                    <div className="w-full aspect-square rounded-xl shadow-lg border border-border" style={{ backgroundColor: color }} />
                    <p className="text-xs font-medium capitalize">{
                      key === 'primary' ? 'ראשי' :
                      key === 'secondary' ? 'משני' :
                      key === 'accent' ? 'אקסנט' :
                      key === 'background' ? 'רקע' : 'כהה'
                    }</p>
                    <p className="text-xs text-muted-foreground font-mono">{color}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Typography */}
            <Card className="p-8 space-y-6">
              <h4 className="text-lg font-bold">טיפוגרפיה</h4>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3 p-4 rounded-xl bg-muted/50">
                  <p className="text-xs font-medium text-muted-foreground">פונט כותרות</p>
                  <p className="text-3xl font-bold" style={{ fontFamily: brandResult.strategy.fonts.header }}>
                    {briefData.businessName}
                  </p>
                  <p className="text-sm text-muted-foreground">{brandResult.strategy.fonts.header} — {brandResult.strategy.fonts.header_reasoning}</p>
                </div>
                <div className="space-y-3 p-4 rounded-xl bg-muted/50">
                  <p className="text-xs font-medium text-muted-foreground">פונט גוף</p>
                  <p className="text-lg" style={{ fontFamily: brandResult.strategy.fonts.body }}>
                    {brandResult.strategy.brand_essence_summary}
                  </p>
                  <p className="text-sm text-muted-foreground">{brandResult.strategy.fonts.body} — {brandResult.strategy.fonts.body_reasoning}</p>
                </div>
              </div>
            </Card>

            {/* Brand Voice */}
            <Card className="p-8 space-y-3">
              <h4 className="text-lg font-bold">קול המותג</h4>
              <p className="text-base leading-relaxed text-muted-foreground">{brandResult.strategy.brand_voice}</p>
            </Card>

            {/* Mockups */}
            {brandResult.mockups.length > 0 && (
              <Card className="p-8 space-y-4">
                <h4 className="text-lg font-bold">הדמיות מותג</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  {brandResult.mockups.map((img, idx) => (
                    <div key={idx} className="rounded-xl overflow-hidden shadow-lg border border-border">
                      <img src={img} alt={`Mockup ${idx + 1}`} className="w-full aspect-[4/3] object-cover" />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Actions */}
            <div className="flex flex-col items-center gap-4 pt-6 pb-12">
              <Button variant="gradient" size="xl" onClick={handleSaveAndContinue} className="w-full max-w-md h-16 text-xl font-bold gap-2">
                <Check className="w-6 h-6" />
                שמור ותמשיך לאונבורדינג
              </Button>
              <Button variant="outline" size="lg" onClick={startGeneration} disabled={isRegenerating} className="gap-2">
                <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                צור מיתוג חדש
              </Button>
              <Button variant="ghost" onClick={onClose}>
                סגור
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
