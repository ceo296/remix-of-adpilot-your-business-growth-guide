import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Rocket, Brain, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingSuccessModalProps {
  userName?: string;
  brandName?: string;
}

const OnboardingSuccessModal = ({ userName = 'שם', brandName = 'העסק' }: OnboardingSuccessModalProps) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'check' | 'brain' | 'ready'>('check');

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

  const handleGoToStudio = () => {
    setIsOpen(false);
    navigate('/studio');
  };

  const handleStayOnDashboard = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md border-0 bg-gradient-to-br from-card via-card to-primary/5 overflow-hidden">
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
              תודה, {userName}
            </h2>
            <p className="text-lg text-primary font-semibold">
              הראש של ADKOP התחיל לעבוד.
            </p>
            <p className="text-muted-foreground">
              קלטנו את כל הנתונים על <span className="text-foreground font-medium">{brandName}</span>.
              <br />
              הכל מוכן לשלב הבא.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3 w-full">
            <Button 
              onClick={handleGoToStudio}
              variant="gradient"
              size="lg"
              className="w-full text-lg font-bold gap-2 shadow-glow"
            >
              <Sparkles className="w-5 h-5" />
              יאללה, בוא נבנה את הקמפיין 🎨
            </Button>
            <Button 
              onClick={handleStayOnDashboard}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              אישאר בלוח הבקרה
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingSuccessModal;
