import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import AdkopStepper from '@/components/adkop/AdkopStepper';
import StepStrategicMRI from '@/components/adkop/StepStrategicMRI';
import StepCampaignConfig from '@/components/adkop/StepCampaignConfig';
import StepBrandAssets from '@/components/adkop/StepBrandAssets';
import StepCreativeResults from '@/components/adkop/StepCreativeResults';
import StepMediaBudget from '@/components/adkop/StepMediaBudget';
import { AdkopWizardData, initialAdkopData } from '@/types/adkop';

const AdkopWizard = () => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<AdkopWizardData>(initialAdkopData);

  const totalSteps = 5;
  const canGoNext = step < totalSteps;
  const canGoBack = step > 1;

  return (
    <div className="min-h-screen bg-background" dir="rtl" lang="he">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-rubik font-bold">
            <span className="text-foreground">AD</span>
            <span className="text-primary">KOP</span>
          </h1>
          <span className="text-sm text-muted-foreground">מערכת פרסום חכמה</span>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-3xl mx-auto px-6 py-10">
        <AdkopStepper currentStep={step} />

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          {step === 1 && (
            <StepStrategicMRI
              data={data.mri}
              onChange={(mri) => setData({ ...data, mri })}
            />
          )}
          {step === 2 && (
            <StepCampaignConfig
              data={data.campaign}
              onChange={(campaign) => setData({ ...data, campaign })}
            />
          )}
          {step === 3 && (
            <StepBrandAssets
              data={data.brand}
              onChange={(brand) => setData({ ...data, brand })}
            />
          )}
          {step === 4 && <StepCreativeResults creatives={data.creatives} />}
          {step === 5 && <StepMediaBudget items={data.mediaBudget} />}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="outline"
            size="lg"
            disabled={!canGoBack}
            onClick={() => setStep((s) => s - 1)}
            className="gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            הקודם
          </Button>

          <span className="text-sm text-muted-foreground">
            שלב {step} מתוך {totalSteps}
          </span>

          {canGoNext ? (
            <Button
              size="lg"
              onClick={() => setStep((s) => s + 1)}
              className="gap-2"
            >
              הבא
              <ArrowLeft className="w-4 h-4" />
            </Button>
          ) : (
            <div />
          )}
        </div>
      </main>
    </div>
  );
};

export default AdkopWizard;
