import { FileText, Sparkles, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

export type CopyChoice = 'has-copy' | 'generate-copy';

interface StudioCopyStepProps {
  value: CopyChoice | null;
  onChange: (choice: CopyChoice) => void;
  copyText: string;
  onCopyTextChange: (text: string) => void;
}

const COPY_OPTIONS: { id: CopyChoice; label: string; sublabel: string; icon: React.ReactNode; gradient: string }[] = [
  {
    id: 'has-copy',
    label: 'יש לי קופי מוכן',
    sublabel: 'כבר כתבתי את הטקסט למודעה',
    icon: <FileText className="h-8 w-8" />,
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'generate-copy',
    label: 'אני צריך שתכתבו לי',
    sublabel: 'הרובוט יכתוב קופי מושלם בשבילך',
    icon: <Sparkles className="h-8 w-8" />,
    gradient: 'from-violet-500 to-purple-500',
  },
];

export const StudioCopyStep = ({ value, onChange, copyText, onCopyTextChange }: StudioCopyStepProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-3 bg-gradient-to-l from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
          מה עם הקופי?
        </h2>
        <p className="text-muted-foreground text-lg">יש לך טקסט למודעה או שנכתוב לך?</p>
      </div>

      <div className="grid gap-4 max-w-xl mx-auto">
        {COPY_OPTIONS.map((option) => {
          const isSelected = value === option.id;
          
          return (
            <Card
              key={option.id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                isSelected
                  ? 'ring-2 ring-primary shadow-lg'
                  : 'hover:border-primary/50'
              }`}
              onClick={() => onChange(option.id)}
            >
              <CardContent className="p-6 flex items-center gap-5">
                <div className={`p-4 rounded-xl bg-gradient-to-br ${option.gradient} text-white shadow-lg relative`}>
                  {option.icon}
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-md">
                      <Check className="h-4 w-4 text-primary-foreground" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <div className="flex-1 text-right">
                  <div className="font-semibold text-lg">{option.label}</div>
                  <div className="text-sm text-muted-foreground">{option.sublabel}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Show textarea when user has copy */}
      {value === 'has-copy' && (
        <div className="max-w-xl mx-auto mt-6 animate-fade-in">
          <label className="block text-sm font-medium mb-2 text-right">
            הכנס את הטקסט למודעה
          </label>
          <Textarea
            value={copyText}
            onChange={(e) => onCopyTextChange(e.target.value)}
            placeholder="למשל: מבצע חג! 30% הנחה על כל הקולקציה החדשה. בואו לסניף הקרוב אליכם!"
            className="min-h-[120px] text-right resize-none"
            dir="rtl"
          />
          <p className="text-xs text-muted-foreground mt-2 text-right">
            כתוב את כל הטקסט שאתה רוצה שיופיע במודעה - כותרת, תיאור, קריאה לפעולה
          </p>
        </div>
      )}

      {value === 'generate-copy' && (
        <div className="text-center mt-6 p-4 bg-violet-500/10 rounded-lg border border-violet-500/20 animate-scale-in max-w-xl mx-auto">
          <p className="text-violet-600 dark:text-violet-400 font-medium">
            מעולה! הרובוט שלנו יכתוב לך קופי מושלם על בסיס ה-DNA של המותג שלך ✨
          </p>
        </div>
      )}
    </div>
  );
};
