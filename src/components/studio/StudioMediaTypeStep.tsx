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
  Mail,
  MessageCircle,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type MediaType = 'ad' | 'radio' | 'banner' | 'email' | 'whatsapp' | 'article' | 'all';

export interface MediaTypeSelection {
  types: MediaType[];
}

interface StudioMediaTypeStepProps {
  value: MediaType[];
  onChange: (types: MediaType[]) => void;
}

// Media options with vibrant color schemes
const MEDIA_OPTIONS: { 
  id: MediaType; 
  label: string; 
  description: string; 
  icon: React.ElementType;
  tags: string[];
  gradient: string;
  shadowColor: string;
}[] = [
  { 
    id: 'ad', 
    label: 'מודעות', 
    description: 'פרסום בעיתונות, מגזינים ועלוני קהילה', 
    icon: Newspaper,
    tags: ['עיתונות', 'מגזינים'],
    gradient: 'from-blue-500 to-cyan-500',
    shadowColor: 'shadow-cyan-500/30'
  },
  { 
    id: 'banner', 
    label: 'באנרים', 
    description: 'באנרים לאתרים, אפליקציות ופלטפורמות דיגיטליות', 
    icon: Monitor,
    tags: ['דיגיטלי', 'אונליין'],
    gradient: 'from-emerald-500 to-teal-500',
    shadowColor: 'shadow-teal-500/30'
  },
  { 
    id: 'radio', 
    label: 'תשדיר רדיו', 
    description: 'ספוט פרסומי לשידור בתחנות רדיו', 
    icon: Radio,
    tags: ['אודיו', 'ספוטים'],
    gradient: 'from-violet-500 to-purple-600',
    shadowColor: 'shadow-purple-500/30'
  },
  { 
    id: 'email', 
    label: 'מיילים', 
    description: 'דיוור אלקטרוני מעוצב עם הנעה לפעולה', 
    icon: Mail,
    tags: ['דיוור', 'ניוזלטר'],
    gradient: 'from-orange-500 to-amber-500',
    shadowColor: 'shadow-amber-500/30'
  },
  { 
    id: 'whatsapp', 
    label: 'וואטסאפ', 
    description: 'מודעה מותאמת + קופי קצר לשיתוף בוואטסאפ', 
    icon: MessageCircle,
    tags: ['וירלי', 'מסרים'],
    gradient: 'from-green-500 to-emerald-600',
    shadowColor: 'shadow-green-500/30'
  },
  { 
    id: 'article', 
    label: 'כתבה פרסומית', 
    description: 'כתבת תוכן שיווקית (Advertorial) למגזינים ואתרים', 
    icon: FileText,
    tags: ['תוכן', 'PR'],
    gradient: 'from-pink-500 to-rose-500',
    shadowColor: 'shadow-rose-500/30'
  },
  { 
    id: 'all', 
    label: 'קמפיין 360°', 
    description: 'קמפיין מקיף שמשלב את כל סוגי המדיה', 
    icon: Layers,
    tags: ['מקיף', 'מומלץ'],
    gradient: 'from-primary to-red-500',
    shadowColor: 'shadow-primary/30'
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
                'cursor-pointer transition-all duration-300 border-2 relative overflow-hidden group hover:scale-[1.02]',
                isSelected(option.id)
                  ? 'border-transparent bg-card shadow-xl'
                  : 'border-border hover:border-primary/50'
              )}
              onClick={() => handleToggle(option.id)}
            >
              <CardContent className="p-6 flex items-start gap-4">
                <div className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-all',
                  isSelected(option.id) 
                    ? `bg-gradient-to-br ${option.gradient} shadow-lg ${option.shadowColor}` 
                    : `bg-gradient-to-br ${option.gradient} shadow-md ${option.shadowColor}`
                )}>
                  <option.icon className="w-7 h-7 text-white transition-transform group-hover:scale-110" />
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
                  <div className={cn(
                    "absolute top-3 left-3 w-6 h-6 rounded-full flex items-center justify-center shadow-md",
                    `bg-gradient-to-br ${option.gradient}`
                  )}>
                    <Check className="w-4 h-4 text-white" />
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
