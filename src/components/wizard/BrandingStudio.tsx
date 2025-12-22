import { useState, useEffect } from "react";
import { X, Sparkles, ArrowLeft, ArrowRight, Check, Loader2, Package, Crown, Palette, Target, Users, Eye, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface BrandingStudioProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BriefData {
  essence: string;
  differentiator: string;
  persona: string;
  audience: string;
  vision: string;
  designPreferences: string;
}

type StudioPhase = 'brief' | 'processing' | 'packages' | 'success';

const BRIEF_STEPS = [
  {
    key: 'essence' as const,
    title: 'התמחות העסק',
    question: 'במשפט אחד: מה התמחות העסק ולמה לבחור דווקא בכם?',
    placeholder: 'לדוגמה: אנחנו מספקים שירותי הובלות מהירות ואמינות עם שירות אישי ומחירים שקופים',
    icon: Target,
  },
  {
    key: 'differentiator' as const,
    title: 'הבידול שלכם',
    question: 'במה אתם שונים מהמתחרים שלכם?',
    placeholder: 'לדוגמה: אנחנו היחידים שמציעים ביטוח מלא ללא תוספת תשלום',
    icon: Sparkles,
  },
  {
    key: 'persona' as const,
    title: 'אופי המותג',
    question: 'אם המותג היה אדם, איזה אופי היה לו?',
    placeholder: 'לדוגמה: מקצועי אבל חברותי, רציני כשצריך אבל עם חיוך',
    icon: Users,
  },
  {
    key: 'audience' as const,
    title: 'קהל היעד',
    question: 'מי הקהל האידיאלי? (גיל, סגנון, אזור)',
    placeholder: 'לדוגמה: משפחות צעירות באזור המרכז, גילאי 25-45',
    icon: Target,
  },
  {
    key: 'vision' as const,
    title: 'החזון',
    question: 'איפה העסק יהיה בעוד שנתיים מהיום?',
    placeholder: 'לדוגמה: נהיה הרשת הגדולה בישראל עם 10 סניפים',
    icon: Eye,
  },
  {
    key: 'designPreferences' as const,
    title: 'העדפות עיצוב',
    question: 'איזה צבעים או סגנון מדברים אליכם?',
    placeholder: 'לדוגמה: צבעים חמים, סגנון מודרני ונקי',
    icon: Palette,
  },
];

const PACKAGES = [
  {
    id: 'visibility',
    name: 'חבילת נראות',
    price: 1500,
    description: 'לוגו + צבעים',
    features: ['עיצוב לוגו מקצועי', 'פלטת צבעים', '3 סבבי תיקונים'],
    icon: Package,
  },
  {
    id: 'full_brand',
    name: 'חבילת מותג מלאה',
    price: 2500,
    description: 'אסטרטגיה + שם + לוגו',
    features: ['אסטרטגיית מותג', 'שם מותג (במידת הצורך)', 'עיצוב לוגו מקצועי', 'פלטת צבעים ופונטים', 'מדריך מותג דיגיטלי', '5 סבבי תיקונים'],
    icon: Crown,
    popular: true,
  },
];

export function BrandingStudio({ isOpen, onClose }: BrandingStudioProps) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<StudioPhase>('brief');
  const [briefStep, setBriefStep] = useState(0);
  const [briefData, setBriefData] = useState<BriefData>({
    essence: '',
    differentiator: '',
    persona: '',
    audience: '',
    vision: '',
    designPreferences: '',
  });
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPhase('brief');
      setBriefStep(0);
      setBriefData({
        essence: '',
        differentiator: '',
        persona: '',
        audience: '',
        vision: '',
        designPreferences: '',
      });
      setSelectedPackage(null);
    }
  }, [isOpen]);

  const currentBriefStep = BRIEF_STEPS[briefStep];
  const canProceedBrief = currentBriefStep && briefData[currentBriefStep.key].trim().length > 10;

  const handleBriefNext = () => {
    if (briefStep < BRIEF_STEPS.length - 1) {
      setBriefStep(prev => prev + 1);
    } else {
      // Move to processing phase
      setPhase('processing');
      setTimeout(() => {
        setPhase('packages');
      }, 2500);
    }
  };

  const handleBriefPrev = () => {
    if (briefStep > 0) {
      setBriefStep(prev => prev - 1);
    }
  };

  const handlePackageSelect = async (packageId: string) => {
    setSelectedPackage(packageId);
  };

  const handleSubmitOrder = async () => {
    if (!selectedPackage) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('יש להתחבר כדי להמשיך');
        return;
      }

      const selectedPkg = PACKAGES.find(p => p.id === selectedPackage);
      
      const { error } = await supabase.from('branding_orders').insert({
        user_id: user.id,
        essence: briefData.essence,
        differentiator: briefData.differentiator,
        persona: briefData.persona,
        audience: briefData.audience,
        vision: briefData.vision,
        design_preferences: briefData.designPreferences,
        package_type: selectedPackage,
        package_price: selectedPkg?.price || 0,
        status: 'pending',
        payment_status: 'unpaid',
      });

      if (error) throw error;

      setPhase('success');
    } catch (error) {
      console.error('Error submitting branding order:', error);
      toast.error('שגיאה בשליחת ההזמנה');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    onClose();
    navigate('/dashboard');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-auto" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">ADKOP Branding Studio</h1>
              <p className="text-xs text-muted-foreground">אפיון מותג מקצועי</p>
            </div>
          </div>
          {phase !== 'success' && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Phase A: Brief */}
        {phase === 'brief' && currentBriefStep && (
          <div className="space-y-8">
            {/* Progress */}
            <div className="flex items-center gap-2">
              {BRIEF_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    idx <= briefStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            {/* Question Card */}
            <Card className="p-8 space-y-6">
              <div className="flex items-center gap-3 text-primary">
                <currentBriefStep.icon className="w-6 h-6" />
                <span className="text-sm font-medium">{currentBriefStep.title}</span>
              </div>

              <h2 className="text-2xl font-bold leading-relaxed">
                {currentBriefStep.question}
              </h2>

              <Textarea
                value={briefData[currentBriefStep.key]}
                onChange={(e) => setBriefData(prev => ({
                  ...prev,
                  [currentBriefStep.key]: e.target.value
                }))}
                placeholder={currentBriefStep.placeholder}
                className="min-h-[150px] text-lg resize-none"
                dir="rtl"
              />

              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="ghost"
                  onClick={handleBriefPrev}
                  disabled={briefStep === 0}
                  className="gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  הקודם
                </Button>

                <span className="text-sm text-muted-foreground">
                  {briefStep + 1} / {BRIEF_STEPS.length}
                </span>

                <Button
                  onClick={handleBriefNext}
                  disabled={!canProceedBrief}
                  className="gap-2"
                >
                  {briefStep === BRIEF_STEPS.length - 1 ? 'סיום האפיון' : 'הבא'}
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Phase B: Processing */}
        {phase === 'processing' && (
          <div className="min-h-[400px] flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">ADKOP מנתח את התשובות...</h2>
              <p className="text-muted-foreground">יש לנו כיוון מצוין 🎯</p>
            </div>
          </div>
        )}

        {/* Phase C: Packages */}
        {phase === 'packages' && (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">איך נתקדם מכאן?</h2>
              <p className="text-muted-foreground">בחרו את החבילה המתאימה לכם</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {PACKAGES.map((pkg) => (
                <Card
                  key={pkg.id}
                  className={`relative p-6 cursor-pointer transition-all hover:shadow-lg ${
                    selectedPackage === pkg.id
                      ? 'ring-2 ring-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => handlePackageSelect(pkg.id)}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                      הכי פופולרי
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        pkg.popular ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        <pkg.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{pkg.name}</h3>
                        <p className="text-sm text-muted-foreground">{pkg.description}</p>
                      </div>
                    </div>

                    <div className="text-3xl font-bold">
                      ₪{pkg.price.toLocaleString()}
                    </div>

                    <ul className="space-y-2">
                      {pkg.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {selectedPackage === pkg.id && (
                      <div className="absolute top-4 left-4">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex justify-center pt-4">
              <Button
                size="lg"
                onClick={handleSubmitOrder}
                disabled={!selectedPackage || isSubmitting}
                className="gap-2 min-w-[200px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    שולח...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4" />
                    לתשלום והתחלת עבודה
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Phase D: Success */}
        {phase === 'success' && (
          <div className="min-h-[400px] flex flex-col items-center justify-center text-center space-y-8">
            <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center">
              <Check className="w-12 h-12 text-green-500" />
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-bold">הבריף התקבל! 🎉</h2>
              <p className="text-muted-foreground max-w-md">
                נחזור אליך תוך 24-48 שעות עם סקיצות ראשונות.
                <br />
                בינתיים, אפשר לחזור לדף הבית.
              </p>
            </div>

            <Button size="lg" onClick={handleFinish} className="gap-2">
              חזרה לדף הבית
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}