import { MessageCircle, MousePointerClick, ExternalLink, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const DigitalCorner = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const stats = [
    {
      label: 'קליקים לוואצאפ',
      value: 142,
      icon: MessageCircle,
      color: 'text-green-500',
    },
    {
      label: 'כניסות לדף נחיתה',
      value: 350,
      icon: MousePointerClick,
      color: 'text-primary',
    },
  ];

  const expandedStats = [
    { label: 'זמן ממוצע בדף', value: '2:34 דקות' },
    { label: 'אחוז יציאה', value: '42%' },
    { label: 'מקור עיקרי', value: 'כיכר השבת' },
  ];

  return (
    <Card className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
      <CardContent className="p-5">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-primary" />
            נתוני דיגיטל (בקטנה)
          </h3>
          <ChevronDown className={cn(
            'w-4 h-4 text-muted-foreground transition-transform',
            isExpanded && 'rotate-180'
          )} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center p-3 rounded-lg bg-secondary/50">
              <stat.icon className={cn('w-5 h-5 mx-auto mb-2', stat.color)} />
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-border space-y-2 animate-fade-in">
            {expandedStats.map((stat) => (
              <div key={stat.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{stat.label}</span>
                <span className="font-medium text-foreground">{stat.value}</span>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center mt-4">
          לחץ להרחבה
        </p>
      </CardContent>
    </Card>
  );
};

export default DigitalCorner;
