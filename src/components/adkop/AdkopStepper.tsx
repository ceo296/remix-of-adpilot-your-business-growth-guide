import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  number: number;
  title: string;
}

const STEPS: Step[] = [
  { number: 1, title: 'MRI אסטרטגי' },
  { number: 2, title: 'הגדרת קמפיין' },
  { number: 3, title: 'זהות מותגית' },
  { number: 4, title: 'תוצרים קריאטיביים' },
  { number: 5, title: 'מדיה ותקציב' },
];

interface AdkopStepperProps {
  currentStep: number;
}

const AdkopStepper = ({ currentStep }: AdkopStepperProps) => {
  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-3xl mx-auto mb-10">
      {STEPS.map((step, index) => {
        const isCompleted = currentStep > step.number;
        const isActive = currentStep === step.number;
        return (
          <div key={step.number} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2',
                  isCompleted && 'bg-primary border-primary text-primary-foreground',
                  isActive && 'border-primary text-primary bg-primary/10 shadow-glow',
                  !isCompleted && !isActive && 'border-border text-muted-foreground bg-card'
                )}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : step.number}
              </div>
              <span
                className={cn(
                  'text-xs font-medium whitespace-nowrap transition-colors',
                  isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.title}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-0.5 flex-1 mx-2 mt-[-1.5rem] transition-colors duration-300',
                  currentStep > step.number ? 'bg-primary' : 'bg-border'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AdkopStepper;
