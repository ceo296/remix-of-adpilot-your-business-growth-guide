import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, Heading1, Heading2, Image as ImageIcon, LayoutGrid, Check, Circle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface TextMeta {
  headline: string;
  businessName: string;
  phone: string;
}

type FeedbackCategory = 'headline' | 'subtitle' | 'visual' | 'grid-layout' | 'badge-stamp' | 'kosher-logo';

interface InlineTextEditorProps {
  imageUrl: string;
  visualOnlyUrl: string;
  textMeta: TextMeta;
  onImageUpdate: (newUrl: string, newMeta: TextMeta) => void;
  onOpenFullEditor: () => void;
}

const FEEDBACK_CATEGORIES: {
  id: FeedbackCategory;
  label: string;
  icon: React.ElementType;
  placeholder: string;
}[] = [
  {
    id: 'headline',
    label: 'כותרת ראשית',
    icon: Heading1,
    placeholder: 'מה לשנות בכותרת? למשל: "לשנות ל...", "קצר מדי"...',
  },
  {
    id: 'subtitle',
    label: 'כותרת משנה',
    icon: Heading2,
    placeholder: 'מה לתקן בכותרת המשנה?',
  },
  {
    id: 'visual',
    label: 'וויז\'ואל / תמונה',
    icon: ImageIcon,
    placeholder: 'מה לא עבד? למשל: "רקע שונה", "תמונה יותר חמה"...',
  },
  {
    id: 'grid-layout',
    label: 'פרטים טכניים בגריד',
    icon: LayoutGrid,
    placeholder: 'מה לשנות? למשל: "הלוגו גדול מדי", "הטלפון לא קריא"...',
  },
  {
    id: 'badge-stamp',
    label: 'עיגול / פלאג׳ / חותמת',
    icon: Circle,
    placeholder: 'מה לכתוב? למשל: "מבצע השקה!", "שעות מורחבות", "חדש!"...',
  },
  {
    id: 'kosher-logo',
    label: 'לוגו כשרות',
    icon: ShieldCheck,
    placeholder: 'איזה כשרות? למשל: "בד״ץ העדה החרדית", "רבנות מהדרין"...',
  },
];

export const InlineTextEditor = ({
  imageUrl,
  visualOnlyUrl,
  textMeta,
  onImageUpdate,
  onOpenFullEditor,
}: InlineTextEditorProps) => {
  const [selectedCategories, setSelectedCategories] = useState<Set<FeedbackCategory>>(new Set());
  const [feedbackTexts, setFeedbackTexts] = useState<Record<FeedbackCategory, string>>({} as any);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const toggleCategory = (id: FeedbackCategory) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const hasValidFeedback = Array.from(selectedCategories).some(
    cat => feedbackTexts[cat]?.trim()
  );

  const handleSubmit = useCallback(async () => {
    if (!hasValidFeedback) return;

    const corrections: string[] = [];
    for (const cat of selectedCategories) {
      const text = feedbackTexts[cat]?.trim();
      if (text) {
        const label = FEEDBACK_CATEGORIES.find(c => c.id === cat)?.label || cat;
        corrections.push(`[${label}] ${text}`);
      }
    }

    setIsRegenerating(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          visualPrompt: '',
          textPrompt: textMeta.headline,
          style: 'ultra-realistic',
          engine: 'nano-banana',
          brandContext: {
            businessName: textMeta.businessName,
            contactPhone: textMeta.phone,
          },
          campaignContext: {
            offer: textMeta.headline,
          },
          corrections,
          _visualOnlyUrl: visualOnlyUrl,
        }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        onImageUpdate(data.imageUrl, textMeta);
        toast.success('המודעה עודכנה בהצלחה! ✅');
        setSelectedCategories(new Set());
        setFeedbackTexts({} as any);
      }
    } catch (err) {
      console.error('Error regenerating:', err);
      toast.error('שגיאה בעדכון. נסה שוב.');
    } finally {
      setIsRegenerating(false);
    }
  }, [feedbackTexts, selectedCategories, hasValidFeedback, textMeta, visualOnlyUrl, onImageUpdate]);

  return (
    <div className="flex flex-col h-full max-h-[85vh]" dir="rtl">
      {/* Image preview */}
      <div className="flex-1 flex items-center justify-center p-4 bg-muted/10 min-h-0">
        <div className="relative max-w-full max-h-full">
          <img
            src={imageUrl}
            alt="תצוגה מקדימה"
            className="max-w-full max-h-[55vh] object-contain rounded-lg"
          />
          {isRegenerating && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-lg">
              <div className="flex items-center gap-2 text-primary">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="font-medium">מייצר מודעה מתוקנת...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feedback area - below image */}
      <div className="border-t border-border bg-card p-4 space-y-3 max-h-[30vh] overflow-y-auto">
        {/* Category chips */}
        <div className="flex flex-wrap gap-2">
          {FEEDBACK_CATEGORIES.map((cat) => {
            const isSelected = selectedCategories.has(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 transition-all text-sm font-medium',
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'
                )}
              >
                <cat.icon className="h-3.5 w-3.5" />
                {cat.label}
                {isSelected && <Check className="h-3 w-3" />}
              </button>
            );
          })}
        </div>

        {/* Feedback inputs for selected categories */}
        {selectedCategories.size > 0 && (
          <div className="space-y-3">
            {FEEDBACK_CATEGORIES.filter(c => selectedCategories.has(c.id)).map((cat) => (
              <div key={cat.id} className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <cat.icon className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium text-xs">{cat.label}</span>
                </div>
                <Textarea
                  value={feedbackTexts[cat.id] || ''}
                  onChange={(e) => setFeedbackTexts(prev => ({ ...prev, [cat.id]: e.target.value }))}
                  placeholder={cat.placeholder}
                  className="min-h-[60px] text-sm"
                  dir="rtl"
                />
              </div>
            ))}

            <Button
              onClick={handleSubmit}
              disabled={!hasValidFeedback || isRegenerating}
              className="w-full gap-2"
              size="sm"
            >
              {isRegenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              שלח תיקונים ({selectedCategories.size})
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
