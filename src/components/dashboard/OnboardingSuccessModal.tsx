import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Rocket, Brain, Sparkles, Megaphone, Palette, User, ArrowRight, Newspaper } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClientProfile } from '@/hooks/useClientProfile';
import { getGreeting, getWhatWouldYouLike } from '@/lib/honorific-utils';

interface OnboardingSuccessModalProps {
  userName?: string;
  brandName?: string;
}

const OnboardingSuccessModal = ({ userName: propUserName, brandName: propBrandName }: OnboardingSuccessModalProps) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'check' | 'brain' | 'ready'>('check');
  const { profile, honorificPreference } = useClientProfile();
  
  const userName = propUserName || profile?.business_name || 'שם';
  const brandName = propBrandName || profile?.business_name || 'העסק';

  useEffect(() => {
    // Check if coming from onboarding
    const fromOnboarding = searchParams.get('welcome') === 'true';
    if (fromOnboarding) {
      setIsOpen(true);
      // Clear the param from URL
      searchParams.delete('welcome');
      setSearchParams(searchParams, { replace: true });
      
      // Animate through phases
      setTimeout(() => setAnimationPhase('brain'), 800);
      setTimeout(() => setAnimationPhase('ready'), 1600);
    }
  }, [searchParams, setSearchParams]);

  const handleCreateCampaign = () => {
    setIsOpen(false);
    navigate('/studio');
  };

  const handleCreateInternalMaterials = () => {
    setIsOpen(false);
    navigate('/internal-studio');
  };

  const handleMediaPurchase = () => {
    setIsOpen(false);
    navigate('/new-campaign?mode=media-only');
  };

  const handleStayOnDashboard = () => {
    setIsOpen(false);
  };

  const handleGoBack = () => {
    setIsOpen(false);
    navigate('/onboarding');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg border-0 bg-gradient-to-br from-card via-card to-primary/5 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-success/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center py-6 px-2">
          {/* Animated Icon */}
          <div className="relative w-24 h-24 mb-6">
            {/* Check phase */}
            <div 
              className={cn(
                "absolute inset-0 flex items-center justify-center transition-all duration-500",
                animationPhase === 'check' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
              )}
            >
              <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center animate-pulse-soft">
                <CheckCircle2 className="w-12 h-12 text-success" />
              </div>
            </div>

            {/* Brain phase */}
            <div 
              className={cn(
                "absolute inset-0 flex items-center justify-center transition-all duration-500",
                animationPhase === 'brain' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
              )}
            >
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                <Brain className="w-12 h-12 text-primary animate-pulse" />
              </div>
            </div>

            {/* Ready phase */}
            <div 
              className={cn(
                "absolute inset-0 flex items-center justify-center transition-all duration-500",
                animationPhase === 'ready' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
              )}
            >
              <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow">
                <Rocket className="w-12 h-12 text-primary-foreground" />
              </div>
            </div>

            {/* Sparkles decoration */}
            {animationPhase === 'ready' && (
              <>
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-warning animate-pulse" />
                <Sparkles className="absolute -bottom-1 -left-3 w-5 h-5 text-primary animate-pulse" style={{ animationDelay: '0.3s' }} />
              </>
            )}
          </div>

          {/* Text content */}
          <div className="space-y-3 mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              {getGreeting(honorificPreference, userName)}! 🎉
            </h2>
            <p className="text-lg text-primary font-semibold">
              הפרופיל של {brandName} מוכן!
            </p>
            <p className="text-muted-foreground">
              קלטנו את כל הנתונים. {getWhatWouldYouLike(honorificPreference)}
            </p>
          </div>

      {/* Choice Cards */}
      <div className="grid grid-cols-3 gap-3 w-full mb-6">
        {/* Advertising Campaign */}
        <button
          onClick={handleCreateCampaign}
          className="p-4 rounded-2xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary transition-all flex flex-col items-center gap-2 group"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Megaphone className="w-6 h-6 text-primary" />
          </div>
          <span className="font-bold text-foreground text-sm">קמפיין פרסומי</span>
          <span className="text-[10px] text-muted-foreground text-center">מודעות לעיתונים, באנרים, דיגיטל</span>
        </button>

        {/* Direct Media Purchase */}
        <button
          onClick={handleMediaPurchase}
          className="p-4 rounded-2xl border-2 border-amber-400/50 bg-amber-50 hover:bg-amber-100 hover:border-amber-500 transition-all flex flex-col items-center gap-2 group"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Newspaper className="w-6 h-6 text-amber-600" />
          </div>
          <span className="font-bold text-foreground text-sm">רכישת מדיה</span>
          <span className="text-[10px] text-muted-foreground text-center">בחירת עיתונים ופלטפורמות ישירות</span>
        </button>

        {/* Internal Materials */}
        <button
          onClick={handleCreateInternalMaterials}
          className="p-4 rounded-2xl border-2 border-border bg-muted/30 hover:bg-muted/50 hover:border-primary/50 transition-all flex flex-col items-center gap-2 group"
        >
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
            <Palette className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <span className="font-bold text-foreground text-sm">חומרים פנימיים</span>
          <span className="text-[10px] text-muted-foreground text-center">כרטיסי ביקור, פליירים, מצגות</span>
        </button>
      </div>

          {/* Personal Area Info */}
          <div className="w-full p-4 rounded-xl bg-muted/50 border border-border mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">האזור האישי שלך</p>
                <p className="text-xs text-muted-foreground">כאן תוכל לעקוב אחרי סטטוס והיסטוריית הקמפיינים שלך</p>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between w-full gap-4">
            <Button 
              onClick={handleGoBack}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              חזרה לעריכה
            </Button>
            
            <Button 
              onClick={handleStayOnDashboard}
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
            >
              רק רוצה להסתכל סביב
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingSuccessModal;
