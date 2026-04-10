import { useState, useRef } from 'react';

import { 
  Image as ImageIcon, 
  LayoutGrid, 
  Heading1, 
  Heading2, 
  MessageCircle,
  Check,
  X,
  Send,
  Circle,
  ShieldCheck,
  Upload,
  Loader2
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
  | 'badge-stamp'
  | 'kosher-logo'
  | 'general'
  // WhatsApp-specific
  | 'wa-image-headline'
  | 'wa-image-visual'
  | 'wa-text-intro'
  | 'wa-text-bullets'
  | 'wa-text-cta'
  | 'wa-text-links';

interface ComponentFeedback {
  component: AdComponent;
  text: string;
  fileUrl?: string; // For kosher logo file upload
}

interface ComponentFeedbackPickerProps {
  sketchLabel: string;
  onSubmit: (feedbacks: ComponentFeedback[]) => void;
  onCancel: () => void;
  mediaType?: string; // 'whatsapp' triggers WhatsApp-specific categories
}

export const AD_COMPONENTS: {
  id: AdComponent;
  label: string;
  description: string;
  icon: React.ElementType;
  placeholder: string;
  group?: 'design' | 'text'; // For WhatsApp grouping
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
  {
    id: 'badge-stamp',
    label: 'עיגול / פלאצ׳ / חותמת',
    description: 'תוספת מבצע, חדש, שעות פתיחה וכדומה',
    icon: Circle,
    placeholder: 'מה לכתוב בחותמת? למשל: "מבצע השקה!", "שעות מורחבות", "חדש!"...',
  },
  {
    id: 'kosher-logo',
    label: 'לוגו כשרות',
    description: 'הוספת או עדכון סמל כשרות במודעה',
    icon: ShieldCheck,
    placeholder: 'איזה כשרות? למשל: "בד״ץ העדה החרדית", "רבנות מהדרין", "בד״ץ בית יוסף"...',
  },
  {
    id: 'general',
    label: 'מסר כללי',
    description: 'הערה חופשית על המודעה',
    icon: MessageCircle,
    placeholder: 'כתוב הערה כללית... למשל: "הטון לא מתאים", "צריך להיות יותר מכירתי"...',
  },
];

// WhatsApp-specific components grouped by design vs text
export const WA_COMPONENTS: {
  id: AdComponent;
  label: string;
  description: string;
  icon: React.ElementType;
  placeholder: string;
  group: 'design' | 'text';
}[] = [
  // Design group (the square image)
  {
    id: 'wa-image-headline',
    label: 'כותרת בקוביה',
    description: 'הכותרת הקצרה שמופיעה על התמונה',
    icon: Heading1,
    placeholder: 'מה לשנות? למשל: "לשנות ניסוח", "להוסיף מחיר", "לקצר"...',
    group: 'design',
  },
  {
    id: 'wa-image-visual',
    label: 'עיצוב הקוביה',
    description: 'הרקע, צבעים, גרפיקה בתמונה',
    icon: ImageIcon,
    placeholder: 'מה לשנות? למשל: "רקע אחר", "צבעים שונים", "יותר נקי"...',
    group: 'design',
  },
  {
    id: 'kosher-logo',
    label: 'לוגו כשרות',
    description: 'הוספת סמל כשרות בקוביה',
    icon: ShieldCheck,
    placeholder: 'איזה כשרות? למשל: "בד״ץ העדה החרדית"...',
    group: 'design',
  },
  // Text group (the accompanying message)
  {
    id: 'wa-text-intro',
    label: 'פתיחת המסר',
    description: 'השורות הראשונות של הטקסט הנלווה',
    icon: Heading2,
    placeholder: 'מה לשנות? למשל: "פתיחה יותר סוקרנת", "טון שונה"...',
    group: 'text',
  },
  {
    id: 'wa-text-bullets',
    label: 'נקודות מפתח',
    description: 'הבולטים/סעיפים במסר',
    icon: LayoutGrid,
    placeholder: 'מה לשנות? למשל: "להוסיף יתרון", "להוריד סעיף", "לשנות ניסוח"...',
    group: 'text',
  },
  {
    id: 'wa-text-cta',
    label: 'קריאה לפעולה',
    description: 'ה-CTA — מה המשתמש צריך לעשות',
    icon: MessageCircle,
    placeholder: 'מה לשנות? למשל: "להזמינו עכשיו", "שלחו הודעה", "חייגו"...',
    group: 'text',
  },
  {
    id: 'wa-text-links',
    label: 'קישורים ופרטי קשר',
    description: 'טלפון, וואטסאפ, דף נחיתה',
    icon: Circle,
    placeholder: 'מה להוסיף/לשנות? למשל: "להוסיף קישור לדף נחיתה", "לשנות מספר טלפון"...',
    group: 'text',
  },
  {
    id: 'general',
    label: 'הערה כללית',
    description: 'הערה חופשית',
    icon: MessageCircle,
    placeholder: 'כתוב הערה כללית...',
    group: 'text',
  },
];

export const ComponentFeedbackPicker = ({
  sketchLabel,
  onSubmit,
  onCancel,
}: ComponentFeedbackPickerProps) => {
  const [selectedComponents, setSelectedComponents] = useState<Set<AdComponent>>(new Set());
  const [feedbackTexts, setFeedbackTexts] = useState<Record<AdComponent, string>>({} as any);
  const [kosherLogoUrl, setKosherLogoUrl] = useState<string | null>(null);
  const [isUploadingKosher, setIsUploadingKosher] = useState(false);
  const kosherFileRef = useRef<HTMLInputElement>(null);

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

  const handleKosherFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingKosher(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const ext = file.name.split('.').pop() || 'png';
      const path = `kosher-logos/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('sector-brain').upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('sector-brain').getPublicUrl(path);
      setKosherLogoUrl(urlData.publicUrl);
      // Auto-fill text if empty
      if (!feedbackTexts['kosher-logo']?.trim()) {
        updateFeedbackText('kosher-logo', 'שבץ את חותמת הכשרות המצורפת במודעה');
      }
    } catch (err) {
      console.error('Kosher logo upload error:', err);
    } finally {
      setIsUploadingKosher(false);
    }
  };

  const handleSubmit = () => {
    const feedbacks: ComponentFeedback[] = [];
    for (const comp of selectedComponents) {
      const text = feedbackTexts[comp]?.trim();
      if (text || (comp === 'kosher-logo' && kosherLogoUrl)) {
        feedbacks.push({ 
          component: comp, 
          text: text || 'שבץ חותמת כשרות',
          ...(comp === 'kosher-logo' && kosherLogoUrl ? { fileUrl: kosherLogoUrl } : {}),
        });
      }
    }
    if (feedbacks.length === 0) {
      return;
    }
    onSubmit(feedbacks);
  };

  const hasValidFeedback = Array.from(selectedComponents).some(
    comp => feedbackTexts[comp]?.trim() || (comp === 'kosher-logo' && kosherLogoUrl)
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
                {/* Kosher logo file upload */}
                {comp.id === 'kosher-logo' && (
                  <div className="flex items-center gap-3 pt-1">
                    <input
                      ref={kosherFileRef}
                      type="file"
                      accept="image/*,.svg,.pdf"
                      className="hidden"
                      onChange={handleKosherFileUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => kosherFileRef.current?.click()}
                      disabled={isUploadingKosher}
                    >
                      {isUploadingKosher ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      העלה חותמת כשרות
                    </Button>
                    {kosherLogoUrl && (
                      <div className="flex items-center gap-2">
                        <img src={kosherLogoUrl} alt="חותמת כשרות" className="h-8 w-8 object-contain rounded border border-border" />
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                    )}
                  </div>
                )}
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
