import { Card, CardContent } from '@/components/ui/card';

export type StyleChoice = 'naki' | 'boet' | 'classic' | 'modern';

interface StyleOption {
  id: StyleChoice;
  label: string;
  description: string;
  emoji: string;
  colors: string;
  preview: string;
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'naki',
    label: 'נקי (Clean)',
    description: 'נקי ומקצועי. מינימליסטי, הרבה רווח לבן, פונטים דקים.',
    emoji: '✨',
    colors: 'from-slate-100 to-white',
    preview: 'bg-gradient-to-br from-slate-50 to-white border-slate-200',
  },
  {
    id: 'boet',
    label: 'בועט (Bold)',
    description: 'בועט ומכירתי. ניגודיות גבוהה, טקסט גדול ועבה.',
    emoji: '💥',
    colors: 'from-red-600 to-black',
    preview: 'bg-gradient-to-br from-red-500 to-black text-white',
  },
  {
    id: 'classic',
    label: 'קלאסי (Hasidic)',
    description: 'קלאסי ומכובד. טקסטורות זהב, פונטים עם סריף, מראה עשיר.',
    emoji: '👑',
    colors: 'from-amber-600 to-amber-800',
    preview: 'bg-gradient-to-br from-amber-100 to-amber-200 border-amber-400',
  },
  {
    id: 'modern',
    label: 'מודרני (Soft)',
    description: 'מודרני ורך. צבעי פסטל, תאורה רכה, חיבור רגשי.',
    emoji: '🌸',
    colors: 'from-pink-200 to-purple-200',
    preview: 'bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200',
  },
];

interface StudioStyleStepProps {
  value: StyleChoice | null;
  onChange: (style: StyleChoice) => void;
}

export const StudioStyleStep = ({ value, onChange }: StudioStyleStepProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">איזה 'לבוש' נתפור לקמפיין?</h2>
        <p className="text-muted-foreground">בחר את הסגנון העיצובי</p>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
        {STYLE_OPTIONS.map((style) => (
          <Card
            key={style.id}
            className={`cursor-pointer transition-all hover:shadow-lg overflow-hidden ${
              value === style.id
                ? 'ring-2 ring-primary shadow-lg'
                : 'hover:border-primary/50'
            }`}
            onClick={() => onChange(style.id)}
          >
            {/* Style Preview */}
            <div className={`h-24 ${style.preview} flex items-center justify-center border-b`}>
              <span className="text-4xl">{style.emoji}</span>
            </div>
            
            <CardContent className="p-4 text-right">
              <div className="font-bold text-lg mb-1">{style.label}</div>
              <div className="text-sm text-muted-foreground leading-relaxed">
                {style.description}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
