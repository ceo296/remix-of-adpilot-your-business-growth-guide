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
      return '💡 קמפיין 360° - נייצר מודעה, באנר, תשדיר רדיו, כתבה פרסומית, מייל ומסר לוואטסאפ — הכל מתואם ואחיד.';
    }
    if (value.length === 1) {
      const type = value[0];
      switch (type) {
        case 'ad': return '💡 נתמקד ביצירת מודעה מושלמת לפרסום בעיתונות ובמגזינים.';
        case 'radio': return '💡 ניצור לך תסריט ספוט רדיו מותאם לקהל היעד שלך.';
        case 'banner': return '💡 נעצב באנר דיגיטלי בממדים המתאימים לפלטפורמות המובילות.';
        case 'email': return '💡 ניצור מייל מעוצב עם כותרת, גוף טקסט והנעה לפעולה.';
        case 'whatsapp': return '💡 ניצור מודעה מותאמת + קופי קצר וקליט לשיתוף בוואטסאפ.';
        case 'article': return '💡 נכתוב כתבה פרסומית (Advertorial) מקצועית ומעוררת עניין.';
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

      {/* Media Type Selection — Tiered hierarchy */}
      <div className="space-y-5 max-w-3xl mx-auto">
        {/* Tier 1: Hero — מודעות */}
        {(() => {
          const hero = MEDIA_OPTIONS.find(o => o.id === 'ad')!;
          return (
            <Card
              className={cn(
                'cursor-pointer transition-all duration-300 border-2 relative overflow-hidden group hover:scale-[1.01]',
                isSelected(hero.id)
                  ? 'border-transparent bg-card shadow-xl ring-2 ring-cyan-400/30'
                  : 'border-border hover:border-primary/50'
              )}
              onClick={() => handleToggle(hero.id)}
            >
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className={cn(
                  'w-18 h-18 rounded-2xl flex items-center justify-center mb-3 transition-all',
                  `bg-gradient-to-br ${hero.gradient} shadow-lg ${hero.shadowColor}`
                )}>
                  <hero.icon className="w-9 h-9 text-white transition-transform group-hover:scale-110" />
                </div>
                <h4 className="text-xl font-bold text-foreground">{hero.label}</h4>
                <p className="text-sm text-muted-foreground mt-1">{hero.description}</p>
                {isSelected(hero.id) && (
                  <div className={cn("absolute top-3 left-3 w-6 h-6 rounded-full flex items-center justify-center shadow-md", `bg-gradient-to-br ${hero.gradient}`)}>
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })()}

        {/* Tier 2: Secondary — מייל + וואטסאפ */}
        <div className="grid grid-cols-2 gap-4">
          {MEDIA_OPTIONS.filter(o => o.id === 'email' || o.id === 'whatsapp').map((option) => (
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
              <CardContent className="p-5 flex flex-col items-center text-center">
                <div className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center mb-2 transition-all',
                  `bg-gradient-to-br ${option.gradient} shadow-md ${option.shadowColor}`
                )}>
                  <option.icon className="w-7 h-7 text-white transition-transform group-hover:scale-110" />
                </div>
                <h4 className="text-lg font-bold text-foreground">{option.label}</h4>
                <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                {isSelected(option.id) && (
                  <div className={cn("absolute top-3 left-3 w-6 h-6 rounded-full flex items-center justify-center shadow-md", `bg-gradient-to-br ${option.gradient}`)}>
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tier 3: Tertiary — באנרים, כתבה, רדיו */}
        <div className="grid grid-cols-3 gap-3">
          {MEDIA_OPTIONS.filter(o => ['banner', 'article', 'radio'].includes(o.id)).map((option) => (
            <Card
              key={option.id}
              className={cn(
                'cursor-pointer transition-all duration-300 border-2 relative overflow-hidden group hover:scale-[1.02]',
                isSelected(option.id)
                  ? 'border-transparent bg-card shadow-lg'
                  : 'border-border hover:border-primary/50'
              )}
              onClick={() => handleToggle(option.id)}
            >
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-all',
                  `bg-gradient-to-br ${option.gradient} shadow-md ${option.shadowColor}`
                )}>
                  <option.icon className="w-6 h-6 text-white transition-transform group-hover:scale-110" />
                </div>
                <h4 className="text-base font-bold text-foreground">{option.label}</h4>
                {isSelected(option.id) && (
                  <div className={cn("absolute top-2 left-2 w-5 h-5 rounded-full flex items-center justify-center shadow-md", `bg-gradient-to-br ${option.gradient}`)}>
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tier 4: CTA — קמפיין 360° */}
        {(() => {
          const allOption = MEDIA_OPTIONS.find(o => o.id === 'all')!;
          return (
            <Card
              className={cn(
                'cursor-pointer transition-all duration-300 border-2 relative overflow-hidden group hover:scale-[1.01]',
                isSelected(allOption.id)
                  ? 'border-transparent bg-gradient-to-r from-primary/10 to-red-500/10 shadow-xl ring-2 ring-primary/30'
                  : 'border-dashed border-primary/40 hover:border-primary/70 hover:bg-primary/5'
              )}
              onClick={() => handleToggle(allOption.id)}
            >
              <CardContent className="p-5 flex items-center gap-4 justify-center">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center transition-all',
                  `bg-gradient-to-br ${allOption.gradient} shadow-lg ${allOption.shadowColor}`
                )}>
                  <allOption.icon className="w-6 h-6 text-white transition-transform group-hover:scale-110" />
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-bold text-foreground">{allOption.label}</h4>
                    <Badge variant="default" className="text-xs">מומלץ</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{allOption.description}</p>
                </div>
                {isSelected(allOption.id) && (
                  <div className={cn("absolute top-3 left-3 w-6 h-6 rounded-full flex items-center justify-center shadow-md", `bg-gradient-to-br ${allOption.gradient}`)}>
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })()}
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
