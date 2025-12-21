import { TrendingUp, TrendingDown, Users, DollarSign, CheckCircle } from 'lucide-react';

const metrics = [
  {
    title: 'סך הצלחות',
    value: '247',
    change: '+23%',
    trend: 'up',
    description: 'לידים ורכישות',
    icon: Users,
    color: 'success',
  },
  {
    title: 'עלות להצלחה',
    value: '₪42',
    change: '-12%',
    trend: 'down',
    description: 'ממוצע לליד',
    icon: DollarSign,
    color: 'primary',
  },
  {
    title: 'סטטוס אופטימיזציה',
    value: 'פעיל',
    change: '',
    trend: 'neutral',
    description: 'מבוסס על נתוני CRM',
    icon: CheckCircle,
    color: 'success',
  },
];

const MetricsCards = () => {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {metrics.map((metric, index) => (
        <div 
          key={metric.title}
          className="bg-card rounded-xl border border-border p-5 animate-slide-up hover:shadow-md transition-shadow"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`
              w-11 h-11 rounded-xl flex items-center justify-center
              ${metric.color === 'success' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}
            `}>
              <metric.icon className="w-5 h-5" />
            </div>
            {metric.change && (
              <div className={`
                flex items-center gap-1 text-sm font-medium rounded-full px-2 py-0.5
                ${metric.trend === 'up' 
                  ? 'text-success bg-success/10' 
                  : metric.trend === 'down' 
                    ? 'text-success bg-success/10'
                    : 'text-muted-foreground bg-muted'
                }
              `}>
                {metric.trend === 'up' ? (
                  <TrendingUp className="w-3 h-3" />
                ) : metric.trend === 'down' ? (
                  <TrendingDown className="w-3 h-3" />
                ) : null}
                {metric.change}
              </div>
            )}
          </div>
          <div className="text-2xl font-bold text-foreground mb-1">
            {metric.value}
          </div>
          <div className="text-sm text-muted-foreground">{metric.title}</div>
          <div className="text-xs text-muted-foreground mt-1">{metric.description}</div>
        </div>
      ))}
    </div>
  );
};

export default MetricsCards;
