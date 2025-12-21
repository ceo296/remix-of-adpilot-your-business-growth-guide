import { WizardData, SuccessMetric } from '@/types/wizard';
import { Button } from '@/components/ui/button';
import { ArrowRight, UserPlus, ShoppingCart, MessageCircle, Phone } from 'lucide-react';

interface StepSuccessProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const metrics: { id: SuccessMetric; title: string; description: string; icon: React.ReactNode }[] = [
  {
    id: 'leads',
    title: 'לידים',
    description: 'אנשים שמשאירים פרטים ליצירת קשר',
    icon: <UserPlus className="w-6 h-6" />,
  },
  {
    id: 'purchases',
    title: 'רכישות',
    description: 'מכירות ישירות באתר או בחנות',
    icon: <ShoppingCart className="w-6 h-6" />,
  },
  {
    id: 'whatsapp',
    title: 'הודעות ווטסאפ',
    description: 'לקוחות ששולחים הודעה',
    icon: <MessageCircle className="w-6 h-6" />,
  },
  {
    id: 'calls',
    title: 'שיחות טלפון',
    description: 'לקוחות שמתקשרים אליך',
    icon: <Phone className="w-6 h-6" />,
  },
];

const StepSuccess = ({ data, updateData, onNext, onPrev }: StepSuccessProps) => {
  const toggleMetric = (metric: SuccessMetric) => {
    const current = data.successMetrics;
    const updated = current.includes(metric)
      ? current.filter((m) => m !== metric)
      : [...current, metric];
    updateData({ successMetrics: updated });
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-foreground">מה נחשב הצלחה בעיניך?</h1>
        <p className="text-lg text-muted-foreground">
          בחר את המדדים שחשובים לעסק שלך (ניתן לבחור יותר מאחד)
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {metrics.map((metric) => {
          const isSelected = data.successMetrics.includes(metric.id);
          
          return (
            <button
              key={metric.id}
              onClick={() => toggleMetric(metric.id)}
              className={`
                group p-5 rounded-xl border-2 transition-all duration-300 text-right
                hover:shadow-lg hover:scale-[1.02]
                ${isSelected 
                  ? 'border-primary bg-primary/5 shadow-md' 
                  : 'border-border bg-card hover:border-primary/50'
                }
              `}
            >
              <div className="flex items-start gap-4">
                <div className={`
                  w-12 h-12 rounded-lg flex items-center justify-center shrink-0
                  transition-all duration-300
                  ${isSelected 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                  }
                `}>
                  {metric.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">{metric.title}</h3>
                  <p className="text-sm text-muted-foreground">{metric.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-between pt-4">
        <Button 
          variant="gradient" 
          size="lg"
          onClick={onNext}
          disabled={data.successMetrics.length === 0}
        >
          המשך
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

export default StepSuccess;
