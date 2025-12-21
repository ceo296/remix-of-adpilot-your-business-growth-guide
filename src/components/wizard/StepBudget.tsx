import { WizardData } from '@/types/wizard';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ArrowRight, TrendingUp, Users, Zap } from 'lucide-react';

interface StepBudgetProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  onComplete: () => void;
  onPrev: () => void;
}

const StepBudget = ({ data, updateData, onComplete, onPrev }: StepBudgetProps) => {
  const budget = data.monthlyBudget;
  
  // Estimated results based on budget
  const estimatedLeads = Math.round(budget / 50);
  const estimatedReach = Math.round(budget * 100);
  const estimatedClicks = Math.round(budget * 8);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('he-IL').format(num);
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-foreground">תקציב חודשי</h1>
        <p className="text-lg text-muted-foreground">
          בחר את התקציב שמתאים לעסק שלך
        </p>
      </div>

      {/* Budget Slider */}
      <div className="bg-card p-6 rounded-xl border border-border space-y-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-primary mb-1">
            ₪{formatNumber(budget)}
          </div>
          <div className="text-muted-foreground">לחודש</div>
        </div>

        <Slider
          value={[budget]}
          onValueChange={(value) => updateData({ monthlyBudget: value[0] })}
          min={1000}
          max={50000}
          step={500}
          className="py-4"
        />

        <div className="flex justify-between text-sm text-muted-foreground">
          <span>₪50,000</span>
          <span>₪1,000</span>
        </div>
      </div>

      {/* Estimated Results */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-card p-5 rounded-xl border border-border text-center">
          <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-success" />
          </div>
          <div className="text-2xl font-bold text-foreground">{formatNumber(estimatedLeads)}</div>
          <div className="text-sm text-muted-foreground">לידים משוערים</div>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">{formatNumber(estimatedReach)}</div>
          <div className="text-sm text-muted-foreground">חשיפות משוערות</div>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border text-center">
          <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-3">
            <Zap className="w-6 h-6 text-warning" />
          </div>
          <div className="text-2xl font-bold text-foreground">{formatNumber(estimatedClicks)}</div>
          <div className="text-sm text-muted-foreground">קליקים משוערים</div>
        </div>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        * התוצאות המשוערות מבוססות על ממוצעים בתעשייה ועשויות להשתנות
      </p>

      <div className="flex justify-between pt-4">
        <Button 
          variant="gradient" 
          size="xl"
          onClick={onComplete}
        >
          🚀 בואו נתחיל!
        </Button>
        <Button 
          variant="ghost" 
          size="lg"
          onClick={onPrev}
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          חזור
        </Button>
      </div>
    </div>
  );
};

export default StepBudget;
