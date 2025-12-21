import { useState } from 'react';
import { WizardData, initialWizardData } from '@/types/wizard';
import WizardProgress from '@/components/wizard/WizardProgress';
import StepIdentification from '@/components/wizard/StepIdentification';
import StepBrief from '@/components/wizard/StepBrief';
import StepSuccess from '@/components/wizard/StepSuccess';
import StepIntegrations from '@/components/wizard/StepIntegrations';
import StepAssets from '@/components/wizard/StepAssets';
import StepBudget from '@/components/wizard/StepBudget';
import { Rocket } from 'lucide-react';

const TOTAL_STEPS = 6;

const stepTitles = [
  'מי אתה?',
  'ספר לנו על העסק',
  'מה נחשב הצלחה?',
  'לאן לשלוח לידים?',
  'חומרים יצירתיים',
  'תקציב',
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
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    // Navigate to dashboard
    window.location.href = '/dashboard';
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepIdentification data={wizardData} updateData={updateData} onNext={nextStep} />;
      case 2:
        return <StepBrief data={wizardData} updateData={updateData} onNext={nextStep} onPrev={prevStep} />;
      case 3:
        return <StepSuccess data={wizardData} updateData={updateData} onNext={nextStep} onPrev={prevStep} />;
      case 4:
        return <StepIntegrations data={wizardData} updateData={updateData} onNext={nextStep} onPrev={prevStep} />;
      case 5:
        return <StepAssets data={wizardData} updateData={updateData} onNext={nextStep} onPrev={prevStep} />;
      case 6:
        return <StepBudget data={wizardData} updateData={updateData} onComplete={handleComplete} onPrev={prevStep} />;
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
            <span className="text-xl font-bold text-foreground">AdPilot</span>
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
        <div className="max-w-2xl mx-auto animate-fade-in">
          {renderStep()}
        </div>
      </main>
    </div>
  );
};

export default OnboardingWizard;
