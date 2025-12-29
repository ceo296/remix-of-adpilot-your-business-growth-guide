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
  types: MediaType[];
}

interface StudioMediaTypeStepProps {
  value: MediaType[];
  onChange: (types: MediaType[]) => void;
}

const MEDIA_OPTIONS: { 
  id: MediaType; 
  label: string; 
  description: string; 
  icon: React.ElementType;
  tags: string[];
}[] = [
  { 
    id: 'radio', 
    label: 'רדיו', 
    description: 'ספוט פרסומי לשידור בתחנות רדיו', 
    icon: Radio,
    tags: ['אודיו', 'ספוטים']
  },
  { 
    id: 'ad', 
    label: 'מודעות', 
    description: 'פרסום בעיתונות, מגזינים ועלוני קהילה', 
    icon: Newspaper,
    tags: ['עיתונות', 'מגזינים']
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
  const handleToggle = (id: MediaType) => {
    // If selecting 'all', clear others and select only 'all'
    if (id === 'all') {
      if (value.includes('all')) {
        onChange([]);
      } else {
        onChange(['all']);
      }
      return;
    }

    // If selecting individual type, remove 'all' if present
    let newValue = value.filter(v => v !== 'all');
    
    if (newValue.includes(id)) {
      newValue = newValue.filter(v => v !== id);
    } else {
      newValue = [...newValue, id];
    }
    
    onChange(newValue);
  };

  const isSelected = (id: MediaType) => value.includes(id);

  // Generate info message based on selection
  const getInfoMessage = () => {
    if (value.length === 0) return null;
    if (value.includes('all')) {
      return '💡 קמפיין 360° - נתחיל מיצירת מודעה מאסטר, ולאחר אישורך נתאים אותה לכל שאר הפלטפורמות.';
    }
    if (value.length === 1) {
      const type = value[0];
      switch (type) {
        case 'ad': return '💡 נתמקד ביצירת מודעה מושלמת לפרסום בעיתונות ובמגזינים.';
        case 'radio': return '💡 ניצור לך תסריט ספוט רדיו מותאם לקהל היעד שלך.';
        case 'billboard': return '💡 נעצב שלט חוצות בולט ומרשים שייתפס מרחוק.';
        case 'social': return '💡 ניצור תוכן מושך לרשתות חברתיות, וואטסאפ וניוזלטר שיניע לפעולה.';
        case 'banner': return '💡 נעצב באנר דיגיטלי בממדים המתאימים לפלטפורמות המובילות.';
        default: return null;
      }
    }
    return `💡 בחרת ${value.length} סוגי מדיה - ניצור קריאייטיב מותאם לכל פלטפורמה.`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
          <Megaphone className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          אלו חומרים הולכים להיות בקמפיין?
        </h2>
        <p className="text-muted-foreground">
          בחר את סוגי המדיה לקמפיין שלך (ניתן לבחור כמה)
        </p>
      </div>

      {/* Media Type Selection */}
      <div className="space-y-4">
        <Label className="text-foreground font-medium">סוג המדיה *</Label>
        <div className="grid md:grid-cols-3 gap-4">
          {MEDIA_OPTIONS.map((option) => (
            <Card
              key={option.id}
              className={cn(
                'cursor-pointer transition-all duration-300 border-2 relative overflow-hidden',
                isSelected(option.id)
                  ? 'border-primary bg-primary/5 shadow-lg'
                  : 'border-border hover:border-primary/50'
              )}
              onClick={() => handleToggle(option.id)}
            >
              <CardContent className="p-6 flex items-start gap-4">
                <div className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0',
                  isSelected(option.id) ? 'bg-primary/20' : 'bg-muted'
                )}>
                  <option.icon className={cn(
                    'w-7 h-7',
                    isSelected(option.id) ? 'text-primary' : 'text-muted-foreground'
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
                {isSelected(option.id) && (
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
      {value.length > 0 && (
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 animate-fade-in">
          <p className="text-sm text-foreground">
            {getInfoMessage()}
          </p>
        </div>
      )}
    </div>
  );
};

export default StudioMediaTypeStep;
