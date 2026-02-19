import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import AdkopStepper from '@/components/adkop/AdkopStepper';
import StepStrategicMRI from '@/components/adkop/StepStrategicMRI';
import StepCampaignConfig from '@/components/adkop/StepCampaignConfig';
import StepBrandAssets from '@/components/adkop/StepBrandAssets';
import StepCreativeResults from '@/components/adkop/StepCreativeResults';
import StepMediaBudget from '@/components/adkop/StepMediaBudget';
import { AdkopWizardData, initialAdkopData } from '@/types/adkop';
import { useAdkopAgents } from '@/hooks/useAdkopAgents';

const AdkopWizard = () => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<AdkopWizardData>(initialAdkopData);
  const { agentState, generateCreatives, generateMediaPlan } = useAdkopAgents();

  const totalSteps = 5;
  const canGoNext = step < totalSteps;
  const canGoBack = step > 1;
  const isLoading = agentState.isGeneratingCreatives || agentState.isGeneratingMedia;

  const handleNext = async () => {
    if (!canGoNext || isLoading) return;

    // Step 3 → 4: Trigger creative-agent
    if (step === 3) {
      setStep(4);
      const creatives = await generateCreatives(data);
      if (creatives.length > 0) {
        setData(prev => ({ ...prev, creatives }));
      }
      return;
    }

    // Step 4 → 5: Trigger media-agent
    if (step === 4) {
      setStep(5);
      const mediaBudget = await generateMediaPlan(data);
      if (mediaBudget.length > 0) {
        setData(prev => ({ ...prev, mediaBudget }));
      }
      return;
    }

    setStep(s => s + 1);
  };

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
          {step === 4 && (
            <StepCreativeResults
              creatives={data.creatives}
              isLoading={agentState.isGeneratingCreatives}
              error={agentState.creativeError}
              onRetry={() => generateCreatives(data).then(c => c.length > 0 && setData(prev => ({ ...prev, creatives: c })))}
            />
          )}
          {step === 5 && (
            <StepMediaBudget
              items={data.mediaBudget}
              isLoading={agentState.isGeneratingMedia}
              error={agentState.mediaError}
              onRetry={() => generateMediaPlan(data).then(m => m.length > 0 && setData(prev => ({ ...prev, mediaBudget: m })))}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="outline"
            size="lg"
            disabled={!canGoBack || isLoading}
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
              onClick={handleNext}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  מייצר...
                </>
              ) : (
                <>
                  הבא
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
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
