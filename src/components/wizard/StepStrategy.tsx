import { WizardData, DesignDirection, CampaignStructure } from '@/types/wizard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  Anchor, 
  Sparkles, 
  Zap, 
  Layers, 
  ArrowRight, 
  ArrowLeft,
  Target
} from 'lucide-react';

interface StepStrategyProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const StepStrategy = ({ data, updateData, onNext, onPrev }: StepStrategyProps) => {
  const { strategy } = data;

  const updateStrategy = (updates: Partial<WizardData['strategy']>) => {
    updateData({
      strategy: {
        ...strategy,
        ...updates,
      },
    });
  };

  const isComplete = strategy.designDirection && strategy.structure;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Target className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-3xl font-bold text-foreground">
          אסטרטגיית קמפיין
        </h2>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          בואו נקבע את הכיוון העיצובי ואת מבנה הקמפיין
        </p>
      </div>

      {/* Part 1: Design Direction */}
      <div className="max-w-3xl mx-auto space-y-4">
        <h3 className="text-xl font-semibold text-foreground text-center">
          איך אנחנו נראים הפעם?
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          {/* Option A: Consistent */}
          <Card
            className={cn(
              'cursor-pointer transition-all duration-300 border-2',
              strategy.designDirection === 'consistent'
                ? 'border-primary bg-primary/5 shadow-lg'
                : 'border-border hover:border-primary/50'
            )}
            onClick={() => updateStrategy({ designDirection: 'consistent' })}
          >
            <CardContent className="p-6 text-center space-y-4">
              <div className={cn(
                'w-16 h-16 mx-auto rounded-2xl flex items-center justify-center transition-colors',
                strategy.designDirection === 'consistent'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground'
              )}>
                <Anchor className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-foreground">הקו המוכר והטוב</h4>
                <p className="text-sm text-muted-foreground mt-2">
                  ממשיכים עם השפה העיצובית הקבועה. זה עובד, למה להחליף?
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Option B: Refresh */}
          <Card
            className={cn(
              'cursor-pointer transition-all duration-300 border-2',
              strategy.designDirection === 'refresh'
                ? 'border-primary bg-primary/5 shadow-lg'
                : 'border-border hover:border-primary/50'
            )}
            onClick={() => updateStrategy({ designDirection: 'refresh' })}
          >
            <CardContent className="p-6 text-center space-y-4">
              <div className={cn(
                'w-16 h-16 mx-auto rounded-2xl flex items-center justify-center transition-colors',
                strategy.designDirection === 'refresh'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground'
              )}>
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-foreground">בא לי לרענן / משהו חדש</h4>
                <p className="text-sm text-muted-foreground mt-2">
                  הגיע הזמן להפתיע עם לוק קצת אחר.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Part 2: Structure */}
      <div className="max-w-3xl mx-auto space-y-4">
        <h3 className="text-xl font-semibold text-foreground text-center">
          ומה התוכנית האומנותית?
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Option A: Single */}
          <Card
            className={cn(
              'cursor-pointer transition-all duration-300 border-2',
              strategy.structure === 'single'
                ? 'border-primary bg-primary/5 shadow-lg'
                : 'border-border hover:border-primary/50'
            )}
            onClick={() => updateStrategy({ structure: 'single' })}
          >
            <CardContent className="p-6 text-center space-y-4">
              <div className={cn(
                'w-16 h-16 mx-auto rounded-2xl flex items-center justify-center transition-colors',
                strategy.structure === 'single'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground'
              )}>
                <Zap className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-foreground">פרסום נקודתי</h4>
                <p className="text-sm text-muted-foreground mt-2">
                  מודעה אחת מדויקת שרצה לאורך כל התקופה.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Option B: Series */}
          <Card
            className={cn(
              'cursor-pointer transition-all duration-300 border-2',
              strategy.structure === 'series'
                ? 'border-primary bg-primary/5 shadow-lg'
                : 'border-border hover:border-primary/50'
            )}
            onClick={() => updateStrategy({ structure: 'series' })}
          >
            <CardContent className="p-6 text-center space-y-4">
              <div className={cn(
                'w-16 h-16 mx-auto rounded-2xl flex items-center justify-center transition-colors',
                strategy.structure === 'series'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground'
              )}>
                <Layers className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-foreground">סדרה מתמשכת</h4>
                <p className="text-sm text-muted-foreground mt-2">
                  מחליפים מסרים/ויז'ואל כל כמה ימים כדי לשמור עניין.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between max-w-3xl mx-auto pt-6">
        <Button variant="outline" size="lg" onClick={onPrev}>
          <ArrowRight className="w-4 h-4 ml-2" />
          חזרה
        </Button>
        <Button 
          variant="gradient" 
          size="lg" 
          onClick={onNext}
          disabled={!isComplete}
        >
          יאללה, סגרנו תוכנית
          <ArrowLeft className="w-4 h-4 mr-2" />
        </Button>
      </div>
    </div>
  );
};

export default StepStrategy;
