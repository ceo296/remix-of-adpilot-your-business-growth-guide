interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
}

const WizardProgress = ({ currentStep, totalSteps, stepTitles }: WizardProgressProps) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="bg-card border-b border-border py-8">
      <div className="container mx-auto px-4">
        {/* Progress Bar - larger and more prominent */}
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden mb-6 shadow-inner">
          <div 
            className="h-full bg-gradient-primary rounded-full transition-all duration-500 ease-out shadow-glow"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step Indicators - larger and more visible */}
        <div className="flex justify-between items-start">
          {stepTitles.map((title, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;

            return (
              <div 
                key={stepNumber}
                className="flex flex-col items-center flex-1"
              >
                <div 
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-base font-bold
                    transition-all duration-300 border-2
                    ${isActive 
                      ? 'bg-primary text-primary-foreground shadow-glow border-primary scale-110' 
                      : isCompleted 
                        ? 'bg-success text-success-foreground border-success' 
                        : 'bg-muted text-muted-foreground border-border'
                    }
                  `}
                >
                  {isCompleted ? '✓' : stepNumber}
                </div>
                <span 
                  className={`
                    text-sm mt-3 text-center max-w-24 leading-tight
                    ${isActive ? 'text-foreground font-semibold' : 'text-muted-foreground'}
                  `}
                >
                  {title}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WizardProgress;
