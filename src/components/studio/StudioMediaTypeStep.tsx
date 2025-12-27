import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Newspaper, 
  Radio, 
  Monitor, 
  Layers,
  Megaphone,
  Check,
  RectangleHorizontal,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type MediaType = 'ad' | 'radio' | 'banner' | 'billboard' | 'social' | 'all';

export interface MediaTypeSelection {
  type: MediaType | null;
}

interface StudioMediaTypeStepProps {
  value: MediaType | null;
  onChange: (type: MediaType) => void;
}

const MEDIA_OPTIONS: { 
  id: MediaType; 
  label: string; 
  description: string; 
  icon: React.ElementType;
  tags: string[];
}[] = [
  { 
    id: 'ad', 
    label: 'מודעות', 
    description: 'פרסום בעיתונות, מגזינים ועלוני קהילה', 
    icon: Newspaper,
    tags: ['עיתונות', 'מגזינים']
  },
  { 
    id: 'radio', 
    label: 'רדיו', 
    description: 'ספוט פרסומי לשידור בתחנות רדיו', 
    icon: Radio,
    tags: ['אודיו', 'ספוטים']
  },
  { 
    id: 'banner', 
    label: 'באנרים', 
    description: 'באנרים לאתרים, אפליקציות ופלטפורמות דיגיטליות', 
    icon: Monitor,
    tags: ['דיגיטלי', 'אונליין']
  },
  { 
    id: 'billboard', 
    label: 'שלטי חוצות', 
    description: 'שילוט חוצות, ביגבורד ושלטים בתחנות אוטובוס', 
    icon: RectangleHorizontal,
    tags: ['חוצות', 'OOH']
  },
  { 
    id: 'social', 
    label: 'סושיאל מדיה', 
    description: 'פוסטים לרשתות חברתיות, וואטסאפ וניוזלטר', 
    icon: Share2,
    tags: ['דיגיטלי', 'וירלי']
  },
  { 
    id: 'all', 
    label: 'קמפיין 360°', 
    description: 'קמפיין מקיף שמשלב את כל סוגי המדיה', 
    icon: Layers,
    tags: ['מקיף', 'מומלץ']
  },
];

export const StudioMediaTypeStep = ({ value, onChange }: StudioMediaTypeStepProps) => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
          <Megaphone className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          איפה נפרסם?
        </h2>
        <p className="text-muted-foreground">
          בחר את סוג המדיה לקמפיין שלך
        </p>
      </div>

      {/* Media Type Selection */}
      <div className="space-y-4">
        <Label className="text-foreground font-medium">סוג המדיה *</Label>
        <div className="grid md:grid-cols-2 gap-4">
          {MEDIA_OPTIONS.map((option) => (
            <Card
              key={option.id}
              className={cn(
                'cursor-pointer transition-all duration-300 border-2 relative overflow-hidden',
                value === option.id
                  ? 'border-primary bg-primary/5 shadow-lg'
                  : 'border-border hover:border-primary/50'
              )}
              onClick={() => onChange(option.id)}
            >
              <CardContent className="p-6 flex items-start gap-4">
                <div className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0',
                  value === option.id ? 'bg-primary/20' : 'bg-muted'
                )}>
                  <option.icon className={cn(
                    'w-7 h-7',
                    value === option.id ? 'text-primary' : 'text-muted-foreground'
                  )} />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-foreground">{option.label}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {option.description}
                  </p>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {option.tags.map((tag) => (
                      <Badge 
                        key={tag} 
                        variant={option.id === 'all' && tag === 'מומלץ' ? 'default' : 'secondary'} 
                        className="text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                {value === option.id && (
                  <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Info message based on selection */}
      {value && (
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 animate-fade-in">
          <p className="text-sm text-foreground">
            {value === 'all' 
              ? '💡 קמפיין 360° - נתחיל מיצירת מודעה מאסטר, ולאחר אישורך נתאים אותה לכל שאר הפלטפורמות.'
              : value === 'ad'
              ? '💡 נתמקד ביצירת מודעה מושלמת לפרסום בעיתונות ובמגזינים.'
              : value === 'radio'
              ? '💡 ניצור לך תסריט ספוט רדיו מותאם לקהל היעד שלך.'
              : value === 'billboard'
              ? '💡 נעצב שלט חוצות בולט ומרשים שייתפס מרחוק.'
              : value === 'social'
              ? '💡 ניצור תוכן מושך לרשתות חברתיות, וואטסאפ וניוזלטר שיניע לפעולה.'
              : '💡 נעצב באנר דיגיטלי בממדים המתאימים לפלטפורמות המובילות.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default StudioMediaTypeStep;
