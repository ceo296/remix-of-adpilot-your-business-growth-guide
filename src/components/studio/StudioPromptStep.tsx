import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, Sparkles, PenLine, Check } from 'lucide-react';
import { StyleChoice } from './StudioStyleStep';
import { cn } from '@/lib/utils';

// AspectRatio is kept for API compatibility but not user-selectable
export type AspectRatio = 'square' | 'portrait' | 'landscape';
export type PromptMode = 'surprise' | 'idea' | null;

interface StudioPromptStepProps {
  visualPrompt: string;
  onVisualPromptChange: (value: string) => void;
  textPrompt: string;
  onTextPromptChange: (value: string) => void;
  style: StyleChoice | null;
  hasProduct: boolean;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (value: AspectRatio) => void;
  promptMode?: PromptMode;
  onPromptModeChange?: (mode: PromptMode) => void;
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
  promptMode: externalPromptMode,
  onPromptModeChange,
}: StudioPromptStepProps) => {
  const [internalPromptMode, setInternalPromptMode] = useState<PromptMode>(null);
  
  // Use external state if provided, otherwise use internal
  const promptMode = externalPromptMode !== undefined ? externalPromptMode : internalPromptMode;
  const setPromptMode = onPromptModeChange || setInternalPromptMode;

  const suggestions = style ? PROMPT_SUGGESTIONS[style] : [];

  const handleSurpriseMe = () => {
    setPromptMode('surprise');
    // Auto-generate a prompt based on style
    const stylePrompts: Record<StyleChoice, string> = {
      naki: 'עיצוב נקי ומודרני, תאורת סטודיו מקצועית, רקע לבן מינימליסטי',
      boet: 'עיצוב דרמטי ובולט, ניגודיות גבוהה, אנרגיה חזקה ומכירתית',
      classic: 'עיצוב יוקרתי ומכובד, טקסטורות עשירות, תחושה פרימיום',
      modern: 'עיצוב עדכני וחם, תאורה רכה, אווירה נעימה ומזמינה',
    };
    if (style) {
      onVisualPromptChange(stylePrompts[style]);
    }
  };

  // Show mode selection first if no mode is chosen
  if (!promptMode) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            איך תרצה ליצור את התמונה?
          </h2>
          <p className="text-muted-foreground text-lg">
            בחר את הדרך שמתאימה לך
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 max-w-2xl mx-auto">
          {/* Surprise Me */}
          <button
            onClick={handleSurpriseMe}
            className="group relative overflow-hidden rounded-2xl p-[2px] transition-all duration-300 bg-border hover:bg-gradient-to-r hover:from-primary hover:via-primary/80 hover:to-primary/60 hover:shadow-lg"
          >
            <Card className="h-full rounded-[14px] bg-card group-hover:bg-card/95 transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">תפתיעו אותי!</h3>
                <p className="text-muted-foreground text-sm">
                  נייצר עבורך קריאייטיב מושלם על בסיס הסגנון שבחרת
                </p>
              </CardContent>
            </Card>
          </button>

          {/* I Have an Idea */}
          <button
            onClick={() => setPromptMode('idea')}
            className="group relative overflow-hidden rounded-2xl p-[2px] transition-all duration-300 bg-border hover:bg-gradient-to-r hover:from-amber-500 hover:via-orange-500 hover:to-amber-500 hover:shadow-lg"
          >
            <Card className="h-full rounded-[14px] bg-card group-hover:bg-card/95 transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <PenLine className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">יש לי רעיון</h3>
                <p className="text-muted-foreground text-sm">
                  אתאר בעצמי מה אני רוצה לראות בתמונה
                </p>
              </CardContent>
            </Card>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          {promptMode === 'surprise' ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">יצרנו עבורך תיאור</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-600">
              <PenLine className="w-4 h-4" />
              <span className="text-sm font-medium">תאר את הרעיון שלך</span>
            </div>
          )}
          <button 
            onClick={() => setPromptMode(null)}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            שנה בחירה
          </button>
        </div>
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
