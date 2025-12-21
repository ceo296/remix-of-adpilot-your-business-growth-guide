interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
}

const WizardProgress = ({ currentStep, totalSteps, stepTitles }: WizardProgressProps) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="bg-card border-b border-border py-6">
      <div className="container mx-auto px-4">
        {/* Progress Bar */}
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-gradient-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between items-center">
          {stepTitles.map((title, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;

            return (
              <div 
                key={stepNumber}
                className="flex flex-col items-center"
              >
                <div 
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    transition-all duration-300
                    ${isActive 
                      ? 'bg-primary text-primary-foreground shadow-glow' 
                      : isCompleted 
                        ? 'bg-success text-success-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }
                  `}
                >
                  {isCompleted ? '✓' : stepNumber}
                </div>
                <span 
                  className={`
                    text-xs mt-2 hidden md:block text-center max-w-20
                    ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}
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
