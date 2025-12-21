import { Newspaper, Globe, Mail, Clock, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TimelineEvent {
  id: string;
  type: 'newspaper' | 'digital' | 'email' | 'radio';
  title: string;
  description: string;
  date: Date;
  status: 'completed' | 'upcoming';
  proof?: string; // URL to screenshot/clipping
}

const mockEvents: TimelineEvent[] = [
  {
    id: '1',
    type: 'newspaper',
    title: 'פורסם ב״יתד נאמן״',
    description: 'מודעת חצי עמוד - עמוד 7',
    date: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    status: 'completed',
    proof: '/placeholder.svg',
  },
  {
    id: '2',
    type: 'digital',
    title: 'עלה באתר ״כיכר השבת״',
    description: 'באנר ראשי - 300x250',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24), // Yesterday
    status: 'completed',
    proof: '/placeholder.svg',
  },
  {
    id: '3',
    type: 'newspaper',
    title: 'פורסם ב״המודיע״',
    description: 'מודעת עמוד שלם - צבע',
    date: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    status: 'completed',
    proof: '/placeholder.svg',
  },
  {
    id: '4',
    type: 'newspaper',
    title: 'מודעת עמוד בהמודיע',
    description: 'עמוד 3 - מיקום פרימיום',
    date: new Date(Date.now() + 1000 * 60 * 60 * 24), // Tomorrow
    status: 'upcoming',
  },
  {
    id: '5',
    type: 'email',
    title: 'דיוור ל-10,000 אימיילים',
    description: 'רשימת הלקוחות הפעילים',
    date: new Date(Date.now() + 1000 * 60 * 60 * 72), // In 3 days
    status: 'upcoming',
  },
];

const getEventIcon = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'newspaper': return Newspaper;
    case 'digital': return Globe;
    case 'email': return Mail;
    default: return Newspaper;
  }
};

const getRelativeTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (diff < 0) {
    // Future
    const futureDays = Math.ceil(Math.abs(diff) / (1000 * 60 * 60 * 24));
    if (futureDays === 1) return 'מחר';
    if (futureDays === 2) return 'מחרתיים';
    return `בעוד ${futureDays} ימים`;
  }

  if (hours < 1) return 'עכשיו';
  if (hours < 24) return `לפני ${hours} שעות`;
  if (days === 1) return 'אתמול';
  return `לפני ${days} ימים`;
};

const ActivityTimeline = () => {
  const completedEvents = mockEvents.filter(e => e.status === 'completed');
  const upcomingEvents = mockEvents.filter(e => e.status === 'upcoming');

  return (
    <Card className="animate-slide-up">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-foreground">
            📋 יומן מבצעים - מה קורה בשטח?
          </h3>
          <Badge variant="secondary" className="bg-success/10 text-success border-0">
            {completedEvents.length} בוצעו
          </Badge>
        </div>

        <div className="space-y-1">
          {/* Completed Events */}
          {completedEvents.map((event, index) => {
            const Icon = getEventIcon(event.type);
            return (
              <div key={event.id} className="relative">
                {/* Timeline Line */}
                {index < completedEvents.length - 1 && (
                  <div className="absolute top-12 right-5 w-0.5 h-full bg-border" />
                )}
                
                <div className="flex gap-4 p-3 rounded-xl hover:bg-accent/50 transition-colors">
                  {/* Icon */}
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-success" />
                    </div>
                    <CheckCircle className="absolute -bottom-1 -left-1 w-4 h-4 text-success bg-card rounded-full" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{event.title}</p>
                      <span className="text-xs text-muted-foreground">{getRelativeTime(event.date)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  </div>

                  {/* Proof Thumbnail */}
                  {event.proof && (
                    <div className="w-16 h-16 rounded-lg border border-border overflow-hidden bg-secondary shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
                      <img 
                        src={event.proof} 
                        alt="הוכחה" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                        <ImageIcon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Separator */}
          <div className="py-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                בקרוב
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
          </div>

          {/* Upcoming Events */}
          {upcomingEvents.map((event, index) => {
            const Icon = getEventIcon(event.type);
            return (
              <div key={event.id} className="relative opacity-60">
                {/* Timeline Line */}
                {index < upcomingEvents.length - 1 && (
                  <div className="absolute top-12 right-5 w-0.5 h-full bg-border border-dashed" />
                )}
                
                <div className="flex gap-4 p-3 rounded-xl">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{event.title}</p>
                      <Badge variant="outline" className="text-xs">
                        {getRelativeTime(event.date)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityTimeline;
