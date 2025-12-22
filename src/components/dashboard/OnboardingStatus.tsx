import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, ArrowLeft, Sparkles } from 'lucide-react';

interface OnboardingData {
  onboardingCompleted: boolean;
  businessName: string | null;
  websiteUrl: string | null;
  primaryXFactor: string | null;
  logoUrl: string | null;
}

const OnboardingStatus = () => {
  const { user } = useAuth();
  const [data, setData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOnboardingStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('client_profiles')
          .select('onboarding_completed, business_name, website_url, primary_x_factor, logo_url')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        setData(profile ? {
          onboardingCompleted: profile.onboarding_completed ?? false,
          businessName: profile.business_name,
          websiteUrl: profile.website_url,
          primaryXFactor: profile.primary_x_factor,
          logoUrl: profile.logo_url,
        } : null);
      } catch (error) {
        console.error('Error fetching onboarding status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOnboardingStatus();
  }, [user]);

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-5 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/3 mb-3" />
        <div className="h-2 bg-muted rounded w-full" />
      </div>
    );
  }

  // No profile yet - show call to action
  if (!data) {
    return (
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20 p-5 animate-slide-up">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-1">בואו נתחיל!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              השלימו את תהליך ההרשמה כדי לפתוח את כל יכולות המערכת
            </p>
            <Link to="/onboarding">
              <Button variant="gradient" size="sm">
                <Sparkles className="w-4 h-4 ml-2" />
                התחילו עכשיו
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculate completion steps
  const steps = [
    { label: 'שם העסק', completed: !!data.businessName },
    { label: 'אתר אינטרנט', completed: !!data.websiteUrl },
    { label: 'אסטרטגיה', completed: !!data.primaryXFactor },
    { label: 'לוגו', completed: !!data.logoUrl },
    { label: 'השלמת הרשמה', completed: data.onboardingCompleted },
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const progressPercent = (completedCount / steps.length) * 100;

  // Fully completed
  if (data.onboardingCompleted && completedCount === steps.length) {
    return null; // Hide when fully complete
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5 animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">מצב ההרשמה</h3>
        <span className="text-xs text-muted-foreground">
          {completedCount} מתוך {steps.length}
        </span>
      </div>
      
      <Progress value={progressPercent} className="h-2 mb-4" />
      
      <div className="space-y-2 mb-4">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            {step.completed ? (
              <CheckCircle2 className="w-4 h-4 text-success" />
            ) : (
              <Circle className="w-4 h-4 text-muted-foreground" />
            )}
            <span className={step.completed ? 'text-foreground' : 'text-muted-foreground'}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {!data.onboardingCompleted && (
        <Link to="/onboarding">
          <Button variant="outline" size="sm" className="w-full">
            המשיכו בהרשמה
            <ArrowLeft className="w-4 h-4 mr-2" />
          </Button>
        </Link>
      )}
    </div>
  );
};

export default OnboardingStatus;
