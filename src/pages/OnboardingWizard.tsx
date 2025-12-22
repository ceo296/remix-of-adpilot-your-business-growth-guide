import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WizardData, initialWizardData } from '@/types/wizard';
import WizardProgress from '@/components/wizard/WizardProgress';
import StepWelcome from '@/components/wizard/StepWelcome';
import StepMagicLink from '@/components/wizard/StepMagicLink';
import StepWebsiteInsights from '@/components/wizard/StepWebsiteInsights';
import StepStrategicMRI from '@/components/wizard/StepStrategicMRI';
import StepBrandIdentity from '@/components/wizard/StepBrandIdentity';
import StepPastMaterials from '@/components/wizard/StepPastMaterials';
import StepStrategy from '@/components/wizard/StepStrategy';
import StepBrandPassport from '@/components/wizard/StepBrandPassport';
import { Rocket, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const TOTAL_STEPS = 8;

const stepTitles = [
  'ברוכים הבאים',
  'הלינק הקסום',
  'מה למדנו עליכם',
  'ה-MRI האסטרטגי',
  'זהות המותג',
  'חומרי עבר',
  'תוכנית המשחק',
  'דרכון המותג',
];

const OnboardingWizard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>(initialWizardData);
  const [isSaving, setIsSaving] = useState(false);

  // Redirect to auth if not logged in, or to dashboard if already completed onboarding
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/auth?redirect=/onboarding');
      return;
    }
    
    // Check if user already completed onboarding
    const checkOnboardingStatus = async () => {
      const { data: profile } = await supabase
        .from('client_profiles')
        .select('onboarding_completed, business_name')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (profile?.onboarding_completed) {
        // User already completed onboarding, show message and redirect to dashboard
        toast.info(`שלום ${profile.business_name || ''}! כבר סיימת את ההיכרות – מעבירים אותך ליצירת קמפיין 🚀`);
        navigate('/dashboard');
      }
    };
    
    checkOnboardingStatus();
  }, [user, authLoading, navigate]);

  const updateData = (data: Partial<WizardData>) => {
    setWizardData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
      // Scroll to top of page on step change
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (currentStep > 1) {
        toast.success('שכוייח! ממשיכים הלאה');
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      // Scroll to top of page on step change
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleWelcomeComplete = (userName: string, brandName: string, logo: string | null) => {
    setWizardData((prev) => ({
      ...prev,
      userName,
      brand: {
        ...prev.brand,
        name: brandName,
        logo: logo,
      },
    }));
    toast.success(`שלום ${userName}! נעים להכיר`);
    nextStep();
  };

  const handleComplete = async () => {
    if (!user) {
      toast.error('נא להתחבר כדי לשמור את הנתונים');
      return;
    }

    setIsSaving(true);
    
    try {
      // Update profile with user name
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          full_name: wizardData.userName,
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
      }

      // Check if client profile exists
      const { data: existingProfile } = await supabase
        .from('client_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingProfile) {
        // Update existing client profile
        const { error: clientError } = await supabase
          .from('client_profiles')
          .update({
            business_name: wizardData.brand.name,
            website_url: wizardData.websiteUrl || null,
            primary_color: wizardData.brand.colors.primary,
            secondary_color: wizardData.brand.colors.secondary,
            background_color: wizardData.brand.colors.background,
            header_font: wizardData.brand.headerFont,
            body_font: wizardData.brand.bodyFont,
            x_factors: wizardData.strategicMRI.xFactors,
            primary_x_factor: wizardData.strategicMRI.primaryXFactor,
            advantage_type: wizardData.strategicMRI.advantageType,
            advantage_slider: wizardData.strategicMRI.advantageSlider,
            winning_feature: wizardData.strategicMRI.winningFeature,
            competitors: wizardData.strategicMRI.competitors,
            my_position_x: wizardData.strategicMRI.myPosition.x,
            my_position_y: wizardData.strategicMRI.myPosition.y,
            competitor_positions: JSON.parse(JSON.stringify(wizardData.strategicMRI.competitorPositions)),
            end_consumer: wizardData.strategicMRI.endConsumer,
            decision_maker: wizardData.strategicMRI.decisionMaker,
            onboarding_completed: true,
          })
          .eq('user_id', user.id);

        if (clientError) throw clientError;
      } else {
        // Create new client profile
        const { error: clientError } = await supabase
          .from('client_profiles')
          .insert([{
            user_id: user.id,
            business_name: wizardData.brand.name,
            website_url: wizardData.websiteUrl || null,
            primary_color: wizardData.brand.colors.primary,
            secondary_color: wizardData.brand.colors.secondary,
            background_color: wizardData.brand.colors.background,
            header_font: wizardData.brand.headerFont,
            body_font: wizardData.brand.bodyFont,
            x_factors: wizardData.strategicMRI.xFactors,
            primary_x_factor: wizardData.strategicMRI.primaryXFactor,
            advantage_type: wizardData.strategicMRI.advantageType,
            advantage_slider: wizardData.strategicMRI.advantageSlider,
            winning_feature: wizardData.strategicMRI.winningFeature,
            competitors: wizardData.strategicMRI.competitors,
            my_position_x: wizardData.strategicMRI.myPosition.x,
            my_position_y: wizardData.strategicMRI.myPosition.y,
            competitor_positions: JSON.parse(JSON.stringify(wizardData.strategicMRI.competitorPositions)),
            end_consumer: wizardData.strategicMRI.endConsumer,
            decision_maker: wizardData.strategicMRI.decisionMaker,
            onboarding_completed: true,
          }]);

        if (clientError) throw clientError;
      }

      toast.success('בשעה טובה! המותג והקמפיין מוכנים');
      navigate('/dashboard?welcome=true');
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      toast.error('שגיאה בשמירת הנתונים, נסו שוב');
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepWelcome onNext={handleWelcomeComplete} />;
      case 2:
        return <StepMagicLink data={wizardData} updateData={updateData} onNext={nextStep} />;
      case 3:
        return <StepWebsiteInsights data={wizardData} updateData={updateData} onNext={nextStep} onPrev={prevStep} />;
      case 4:
        return <StepStrategicMRI data={wizardData} updateData={updateData} onNext={nextStep} onPrev={prevStep} />;
      case 5:
        return <StepBrandIdentity data={wizardData} updateData={updateData} onNext={nextStep} onPrev={prevStep} />;
      case 6:
        return <StepPastMaterials data={wizardData} updateData={updateData} onNext={nextStep} onPrev={prevStep} />;
      case 7:
        return <StepStrategy data={wizardData} updateData={updateData} onNext={nextStep} onPrev={prevStep} />;
      case 8:
        return <StepBrandPassport data={wizardData} updateData={updateData} onComplete={handleComplete} onPrev={prevStep} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Rocket className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-xl font-bold">
                <span className="logo-black">AD</span>
                <span className="logo-red">KOP</span>
              </span>
              <span className="text-sm text-muted-foreground mr-2">| בס״ד</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {wizardData.userName && (
              <span className="text-sm font-medium text-foreground">
                שלום, {wizardData.userName}
              </span>
            )}
            <span className="text-sm text-muted-foreground">
              שלב {currentStep} מתוך {TOTAL_STEPS}
            </span>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <WizardProgress 
        currentStep={currentStep} 
        totalSteps={TOTAL_STEPS} 
        stepTitles={stepTitles} 
      />

      {/* Step Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto animate-fade-in">
          {renderStep()}
        </div>
      </main>
    </div>
  );
};

export default OnboardingWizard;
