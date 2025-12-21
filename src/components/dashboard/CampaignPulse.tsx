import { differenceInDays, format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Activity, Newspaper, Globe, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface CampaignPulseProps {
  startDate: Date;
  endDate: Date;
  newspaperCount: number;
  digitalCount: number;
}

const CampaignPulse = ({ 
  startDate, 
  endDate, 
  newspaperCount = 3, 
  digitalCount = 2 
}: CampaignPulseProps) => {
  const today = new Date();
  const totalDays = differenceInDays(endDate, startDate);
  const daysLive = differenceInDays(today, startDate);
  const daysRemaining = differenceInDays(endDate, today);
  const progress = Math.min(100, Math.max(0, (daysLive / totalDays) * 100));

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden animate-fade-in">
      {/* Status Header */}
      <div className="bg-gradient-to-l from-primary to-primary/80 p-6 text-primary-foreground">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm opacity-80">סטטוס הקמפיין</p>
              <h2 className="text-2xl font-bold">
                🟢 באוויר כבר {daysLive} ימים!
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Newspaper className="w-5 h-5" />
              <span className="font-medium">{newspaperCount} עיתונים</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              <span className="font-medium">{digitalCount} אתרים</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>התקדמות הקמפיין</span>
          </div>
          <span className="font-medium text-foreground">
            {daysRemaining > 0 ? `נשארו ${daysRemaining} ימים` : 'הקמפיין הסתיים'}
          </span>
        </div>

        <Progress value={progress} className="h-3" />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>התחלה: {format(startDate, 'dd/MM', { locale: he })}</span>
          <span>סיום: {format(endDate, 'dd/MM', { locale: he })}</span>
        </div>
      </div>
    </div>
  );
};

export default CampaignPulse;
