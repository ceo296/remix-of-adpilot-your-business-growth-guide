import { useEffect } from 'react';
import { WizardData, DesignDirection, CampaignStructure } from '@/types/wizard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { 
  Anchor, 
  Sparkles, 
  CalendarIcon, 
  Zap, 
  Layers, 
  ArrowRight, 
  ArrowLeft,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

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

  // Smart advisor logic
  useEffect(() => {
    if (strategy.startDate && strategy.endDate && strategy.structure) {
      const days = differenceInDays(strategy.endDate, strategy.startDate);
      
      if (days > 14 && strategy.structure === 'single') {
        toast.warning(
          'חודש שלם עם אותה מודעה? הציבור עלול להשתעמם... אנחנו ממליצים על סדרה.',
          { duration: 5000 }
        );
      } else if (days < 3 && strategy.structure === 'series') {
        toast.warning(
          'בשביל יומיים לא בטוח שצריך סדרה. מודעה אחת חזקה תעשה את העבודה.',
          { duration: 5000 }
        );
      }
    }
  }, [strategy.startDate, strategy.endDate, strategy.structure]);

  const isComplete = strategy.designDirection && strategy.startDate && strategy.endDate && strategy.structure;

  const getDurationText = () => {
    if (!strategy.startDate || !strategy.endDate) return null;
    const days = differenceInDays(strategy.endDate, strategy.startDate);
    if (days === 0) return 'יום אחד';
    if (days === 1) return 'יומיים';
    if (days < 7) return `${days + 1} ימים`;
    if (days < 14) return 'שבוע וקצת';
    if (days < 21) return 'שבועיים וקצת';
    if (days < 30) return 'כשלושה שבועות';
    return 'חודש ומעלה';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Target className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-3xl font-bold text-foreground">
          תוכנית המשחק
        </h2>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          בואו נקבע את האסטרטגיה - כמה זמן רצים ואיך נראים
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

      {/* Part 2: Duration */}
      <div className="max-w-3xl mx-auto space-y-4">
        <h3 className="text-xl font-semibold text-foreground text-center">
          כמה זמן רצים?
        </h3>

        <Card className="border-2 border-border">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              {/* Start Date */}
              <div className="space-y-2 text-center">
                <label className="text-sm text-muted-foreground">מתחילים</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-[180px] justify-start text-right font-normal',
                        !strategy.startDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {strategy.startDate ? (
                        format(strategy.startDate, 'dd/MM/yyyy', { locale: he })
                      ) : (
                        <span>בחר תאריך</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={strategy.startDate || undefined}
                      onSelect={(date) => updateStrategy({ startDate: date || null })}
                      initialFocus
                      className="pointer-events-auto"
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <span className="text-2xl text-muted-foreground">→</span>

              {/* End Date */}
              <div className="space-y-2 text-center">
                <label className="text-sm text-muted-foreground">מסיימים</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-[180px] justify-start text-right font-normal',
                        !strategy.endDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {strategy.endDate ? (
                        format(strategy.endDate, 'dd/MM/yyyy', { locale: he })
                      ) : (
                        <span>בחר תאריך</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={strategy.endDate || undefined}
                      onSelect={(date) => updateStrategy({ endDate: date || null })}
                      initialFocus
                      className="pointer-events-auto"
                      disabled={(date) => 
                        date < new Date() || 
                        (strategy.startDate ? date < strategy.startDate : false)
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Duration Display */}
            {getDurationText() && (
              <div className="mt-4 text-center">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium">
                  <CalendarIcon className="w-4 h-4" />
                  {getDurationText()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Part 3: Structure */}
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
                <h4 className="text-lg font-bold text-foreground">זבנג וגמרנו</h4>
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
