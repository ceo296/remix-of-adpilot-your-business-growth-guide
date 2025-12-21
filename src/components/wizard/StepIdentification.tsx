import { WizardData, UserType } from '@/types/wizard';
import { Button } from '@/components/ui/button';
import { Building2, Users } from 'lucide-react';

interface StepIdentificationProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  onNext: () => void;
}

const StepIdentification = ({ data, updateData, onNext }: StepIdentificationProps) => {
  const handleSelect = (type: UserType) => {
    updateData({ userType: type });
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-foreground">ברוכים הבאים ל-AdPilot</h1>
        <p className="text-lg text-muted-foreground">
          בואו נתחיל - מי אתה?
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <button
          onClick={() => handleSelect('business')}
          className={`
            group p-6 rounded-xl border-2 transition-all duration-300 text-right
            hover:shadow-lg hover:scale-[1.02]
            ${data.userType === 'business' 
              ? 'border-primary bg-primary/5 shadow-md' 
              : 'border-border bg-card hover:border-primary/50'
            }
          `}
        >
          <div className={`
            w-14 h-14 rounded-xl flex items-center justify-center mb-4
            transition-all duration-300
            ${data.userType === 'business' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
            }
          `}>
            <Building2 className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">בעל עסק</h3>
          <p className="text-muted-foreground">
            אני רוצה להגדיל את העסק שלי ולהביא יותר לקוחות
          </p>
        </button>

        <button
          onClick={() => handleSelect('agency')}
          className={`
            group p-6 rounded-xl border-2 transition-all duration-300 text-right
            hover:shadow-lg hover:scale-[1.02]
            ${data.userType === 'agency' 
              ? 'border-primary bg-primary/5 shadow-md' 
              : 'border-border bg-card hover:border-primary/50'
            }
          `}
        >
          <div className={`
            w-14 h-14 rounded-xl flex items-center justify-center mb-4
            transition-all duration-300
            ${data.userType === 'agency' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
            }
          `}>
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">סוכנות פרסום</h3>
          <p className="text-muted-foreground">
            אני מנהל קמפיינים עבור לקוחות שלי
          </p>
        </button>
      </div>

      <div className="flex justify-start pt-4">
        <Button 
          variant="gradient" 
          size="lg"
          onClick={onNext}
          disabled={!data.userType}
        >
          המשך
        </Button>
      </div>
    </div>
  );
};

export default StepIdentification;
