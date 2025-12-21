import { useState } from 'react';
import { WizardData, initialWizardData } from '@/types/wizard';
import WizardProgress from '@/components/wizard/WizardProgress';
import StepMagicLink from '@/components/wizard/StepMagicLink';
import StepBrandIdentity from '@/components/wizard/StepBrandIdentity';
import StepPastMaterials from '@/components/wizard/StepPastMaterials';
import StepBrandPassport from '@/components/wizard/StepBrandPassport';
import { Rocket } from 'lucide-react';
import { toast } from 'sonner';

const TOTAL_STEPS = 4;

const stepTitles = [
  'הלינק הקסום',
  'זהות המותג',
  'חומרי עבר',
  'דרכון המותג',
];

const OnboardingWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>(initialWizardData);

  const updateData = (data: Partial<WizardData>) => {
    setWizardData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
      toast.success('שכוייח! ממשיכים הלאה');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    toast.success('בשעה טובה! המותג שלכם מוכן');
    window.location.href = '/dashboard';
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepMagicLink data={wizardData} updateData={updateData} onNext={nextStep} />;
      case 2:
        return <StepBrandIdentity data={wizardData} updateData={updateData} onNext={nextStep} onPrev={prevStep} />;
      case 3:
        return <StepPastMaterials data={wizardData} updateData={updateData} onNext={nextStep} onPrev={prevStep} />;
      case 4:
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
              <span className="text-xl font-bold text-foreground">AdPilot</span>
              <span className="text-sm text-muted-foreground mr-2">| בס״ד</span>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            שלב {currentStep} מתוך {TOTAL_STEPS}
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
