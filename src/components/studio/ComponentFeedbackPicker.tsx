import { useState } from 'react';
import { 
  Image as ImageIcon, 
  LayoutGrid, 
  Heading1, 
  Heading2, 
  Check,
  X,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export type AdComponent = 
  | 'headline' 
  | 'subtitle' 
  | 'visual' 
  | 'grid-layout'
  | 'general';

interface ComponentFeedback {
  component: AdComponent;
  text: string;
}

interface ComponentFeedbackPickerProps {
  sketchLabel: string;
  onSubmit: (feedbacks: ComponentFeedback[]) => void;
  onCancel: () => void;
}

const AD_COMPONENTS: {
  id: AdComponent;
  label: string;
  description: string;
  icon: React.ElementType;
  placeholder: string;
}[] = [
  {
    id: 'headline',
    label: 'כותרת ראשית',
    description: 'הכותרת הגדולה במודעה',
    icon: Heading1,
    placeholder: 'מה לשנות בכותרת? למשל: "לשנות ל...", "קצר מדי", "לא מדויק"...',
  },
  {
    id: 'subtitle',
    label: 'כותרת משנה',
    description: 'הטקסט המשני מתחת לכותרת',
    icon: Heading2,
    placeholder: 'מה לתקן? למשל: "להוסיף פירוט על...", "לשנות ניסוח"...',
  },
  {
    id: 'visual',
    label: 'הוויז\'ואל / תמונה',
    description: 'התמונה או הגרפיקה המרכזית',
    icon: ImageIcon,
    placeholder: 'מה לא עבד? למשל: "רקע שונה", "תמונה יותר חמה", "בלי אנשים"...',
  },
  {
    id: 'grid-layout',
    label: 'פרטים טכניים בגריד',
    description: 'לוגו, טלפון, כתובת, מיקום אלמנטים',
    icon: LayoutGrid,
    placeholder: 'מה לשנות? למשל: "הלוגו גדול מדי", "הטלפון לא קריא", "כתובת חסרה"...',
  },
];

export const ComponentFeedbackPicker = ({
  sketchLabel,
  onSubmit,
  onCancel,
}: ComponentFeedbackPickerProps) => {
  const [selectedComponents, setSelectedComponents] = useState<Set<AdComponent>>(new Set());
  const [feedbackTexts, setFeedbackTexts] = useState<Record<AdComponent, string>>({} as any);

  const toggleComponent = (id: AdComponent) => {
    setSelectedComponents(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const updateFeedbackText = (id: AdComponent, text: string) => {
    setFeedbackTexts(prev => ({ ...prev, [id]: text }));
  };

  const handleSubmit = () => {
    const feedbacks: ComponentFeedback[] = [];
    for (const comp of selectedComponents) {
      const text = feedbackTexts[comp]?.trim();
      if (text) {
        feedbacks.push({ component: comp, text });
      }
    }
    if (feedbacks.length === 0) {
      return;
    }
    onSubmit(feedbacks);
  };

  const hasValidFeedback = Array.from(selectedComponents).some(
    comp => feedbackTexts[comp]?.trim()
  );

  const selectedCount = selectedComponents.size;

  return (
    <Card className="max-w-2xl mx-auto animate-fade-in">
      <CardContent className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">מה לתקן ב{sketchLabel}?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              סמן את החלקים שדורשים תיקון ופרט מה לשנות
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Component Chips */}
        <div className="flex flex-wrap gap-2">
          {AD_COMPONENTS.map((comp) => {
            const isSelected = selectedComponents.has(comp.id);
            return (
              <button
                key={comp.id}
                onClick={() => toggleComponent(comp.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all text-sm font-medium',
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'
                )}
              >
                <comp.icon className="h-4 w-4" />
                {comp.label}
                {isSelected && <Check className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>

        {/* Feedback Inputs for Selected Components */}
        {selectedCount > 0 && (
          <div className="space-y-4 pt-2">
            {AD_COMPONENTS.filter(c => selectedComponents.has(c.id)).map((comp) => (
              <div key={comp.id} className="space-y-2 animate-fade-in">
                <div className="flex items-center gap-2">
                  <comp.icon className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">{comp.label}</span>
                  <Badge variant="secondary" className="text-xs">{comp.description}</Badge>
                </div>
                <Textarea
                  value={feedbackTexts[comp.id] || ''}
                  onChange={(e) => updateFeedbackText(comp.id, e.target.value)}
                  placeholder={comp.placeholder}
                  className="min-h-[80px] text-sm"
                  dir="rtl"
                />
              </div>
            ))}
          </div>
        )}

        {/* Submit */}
        {selectedCount > 0 && (
          <Button
            onClick={handleSubmit}
            disabled={!hasValidFeedback}
            className="w-full gap-2"
            variant="gradient"
          >
            <Send className="h-4 w-4" />
            שלח תיקונים ({selectedCount} {selectedCount === 1 ? 'חלק' : 'חלקים'})
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ComponentFeedbackPicker;
