import { RefreshCw, TrendingUp, Image, Zap } from 'lucide-react';

const activities = [
  {
    id: 1,
    title: 'הוחלף קריאייטיב חלש',
    description: 'הפרסומת "הנחה מיוחדת" הוחלפה בגרסה יותר גישמאק',
    time: 'לפני שעתיים',
    icon: Image,
    color: 'primary',
  },
  {
    id: 2,
    title: 'הוגדל תקציב לפרסומת מנצחת',
    description: 'שכוייח! הפרסומת "תפריט החורף" מביאה תוצאות מעולות',
    time: 'אתמול',
    icon: TrendingUp,
    color: 'success',
  },
  {
    id: 3,
    title: 'אופטימיזציה אוטומטית',
    description: 'שיפרנו את קהל היעד – עכשיו יותר מדויק בעזה״י',
    time: 'לפני יומיים',
    icon: Zap,
    color: 'warning',
  },
  {
    id: 4,
    title: 'רענון יצירתי',
    description: 'נוספו 3 תמונות חדשות לקמפיין הראשי',
    time: 'לפני 3 ימים',
    icon: RefreshCw,
    color: 'primary',
  },
];

const ActivityFeed = () => {
  return (
    <div className="bg-card rounded-xl border border-border p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
      <h3 className="text-lg font-semibold text-foreground mb-4">מה עשינו השבוע? 📋</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div 
            key={activity.id}
            className="flex gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className={`
              w-10 h-10 rounded-lg flex items-center justify-center shrink-0
              ${activity.color === 'success' 
                ? 'bg-success/10 text-success' 
                : activity.color === 'warning'
                  ? 'bg-warning/10 text-warning'
                  : 'bg-primary/10 text-primary'
              }
            `}>
              <activity.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm">{activity.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{activity.description}</p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{activity.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;
