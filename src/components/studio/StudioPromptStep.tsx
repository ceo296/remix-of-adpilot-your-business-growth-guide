import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';
import { StyleChoice } from './StudioStyleStep';

interface StudioPromptStepProps {
  visualPrompt: string;
  onVisualPromptChange: (value: string) => void;
  textPrompt: string;
  onTextPromptChange: (value: string) => void;
  style: StyleChoice | null;
  hasProduct: boolean;
}

const PROMPT_SUGGESTIONS: Record<StyleChoice, string[]> = {
  naki: [
    'רקע לבן נקי, תאורה סטודיו מקצועית',
    'מינימליסטי, הרבה רווח לבן',
    'מראה מודרני וטכנולוגי',
  ],
  boet: [
    'רקע שחור דרמטי עם אדום',
    'תאורה חזקה עם צללים',
    'מודעת מכירה אגרסיבית',
  ],
  classic: [
    'רקע עם טקסטורת זהב יוקרתית',
    'אווירה חגיגית ומכובדת',
    'מראה עשיר עם פרטים מוזהבים',
  ],
  modern: [
    'תאורה רכה ופסטלית',
    'אווירה חמה ומזמינה',
    'צבעים רכים ונעימים',
  ],
};

export const StudioPromptStep = ({
  visualPrompt,
  onVisualPromptChange,
  textPrompt,
  onTextPromptChange,
  style,
  hasProduct,
}: StudioPromptStepProps) => {
  const suggestions = style ? PROMPT_SUGGESTIONS[style] : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">
          {hasProduct ? 'תאר את האווירה הרצויה' : 'תאר את התמונה שתיווצר'}
        </h2>
        <p className="text-muted-foreground">
          {hasProduct 
            ? 'איזה רקע ואווירה ליצור סביב המוצר?' 
            : 'מה רואים בתמונה?'}
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        {/* Visual Prompt */}
        <div>
          <Label className="font-medium mb-2 block">תיאור התמונה / הרקע</Label>
          <Textarea
            value={visualPrompt}
            onChange={(e) => onVisualPromptChange(e.target.value)}
            placeholder={hasProduct 
              ? 'למשל: רקע עם טקסטורת עץ חמה, תאורה רכה מהצד...'
              : 'למשל: משפחה חרדית שמחה סביב שולחן שבת, אור חם, אווירה חגיגית...'
            }
            className="min-h-[120px] resize-none text-base"
          />
        </div>

        {/* Style Suggestions */}
        {suggestions.length > 0 && (
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3 text-sm font-medium">
                <Lightbulb className="h-4 w-4 text-warning" />
                רעיונות לסגנון שבחרת:
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onVisualPromptChange(visualPrompt ? `${visualPrompt}, ${suggestion}` : suggestion)}
                    className="text-xs px-3 py-1.5 bg-background rounded-full border hover:border-primary transition-colors"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Text Prompt */}
        <div>
          <Label className="font-medium mb-2 block">מה הטקסט שיהיה כתוב בתמונה?</Label>
          <Input
            value={textPrompt}
            onChange={(e) => onTextPromptChange(e.target.value)}
            placeholder="למשל: שבת שלום, מבצע ענק, חג שמח..."
            className="text-lg h-12"
          />
          <p className="text-xs text-muted-foreground mt-2">
            הטקסט יירנדר בעברית מושלמת 🇮🇱
          </p>
        </div>
      </div>
    </div>
  );
};
