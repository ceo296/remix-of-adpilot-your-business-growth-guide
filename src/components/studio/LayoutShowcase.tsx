import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { applyHtmlTextOverlay, type TextLayoutStyle } from '@/lib/html-text-overlay';

const LAYOUT_OPTIONS: { id: TextLayoutStyle; label: string; icon: string; description: string }[] = [
  { id: 'magazine-blend', label: 'מגזין', icon: '📋', description: 'הדר בצבע המותג למעלה, טקסט גוף בכדור למטה. מודעת מגזין קלאסית.' },
  { id: 'brand-top', label: 'כותרת על הוויזואל', icon: '🎨', description: 'כותרת כבאדג\' צבעוני, אפקט דרמטי ובולט.' },
  { id: 'classic-ad', label: 'מודעה קלאסית', icon: '📰', description: 'כותרת גדולה למעלה, גוף למטה. סטנדרטי ומוכר.' },
  { id: 'professional-ad', label: 'מודעה מקצועית', icon: '🎯', description: 'כמו קלאסית עם CTA וכותרת משנה. לקמפיינים עם הנעה לפעולה.' },
  { id: 'side-strip', label: 'פס צד', icon: '▐', description: 'פס אנכי בצד עם כל הטקסט. התמונה חופשית לחלוטין.' },
  { id: 'minimal', label: 'מינימליסטי', icon: '✨', description: 'רק כותרת ולוגו. מינימום כיסוי, מקסימום תמונה.' },
];

// Sample content for demo
const SAMPLE_CONFIG = {
  headline: 'הנחת שתרצו לספר עליה לכולם',
  subtitle: 'לרגל חופשת פסח והכנה לתקופת הלימודים',
  bodyText: 'בחג הזה, העניקו להם מתנה של קשב וריכוז, ותקבלו נחת לכל החיים.',
  ctaText: 'התקשרו עכשיו',
  businessName: 'אקטיב הד',
  phone: '033818980',
  email: 'cx@havimoti.co.il',
  address: 'בני ברק',
  primaryColor: '#E34870',
  secondaryColor: '#2A2F33',
  servicesList: ['אבחון', 'טיפול', 'ייעוץ', 'הדרכה'],
  logoUrl: undefined as string | undefined,
};

// A simple sample image - gradient placeholder
function createSampleImageUrl(): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1067; // 3:4 aspect
    const ctx = canvas.getContext('2d')!;
    
    // Warm gradient background simulating a photo
    const grad = ctx.createLinearGradient(0, 0, 800, 1067);
    grad.addColorStop(0, '#f5e6d3');
    grad.addColorStop(0.3, '#e8d5c0');
    grad.addColorStop(0.6, '#d4b896');
    grad.addColorStop(1, '#c9a87c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 1067);
    
    // Add some visual interest - circles
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#8B7355';
    ctx.beginPath();
    ctx.arc(400, 400, 200, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(300, 600, 150, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    
    // Person silhouette area (simple shapes)
    ctx.fillStyle = '#a08060';
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.ellipse(400, 500, 180, 280, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    resolve(canvas.toDataURL('image/jpeg', 0.9));
  });
}

interface LayoutShowcaseProps {
  onSelectDefault: (layoutId: TextLayoutStyle) => void;
  currentDefault: TextLayoutStyle;
  clientLogoUrl?: string;
  clientPrimaryColor?: string;
  clientSecondaryColor?: string;
}

export function LayoutShowcase({ onSelectDefault, currentDefault, clientLogoUrl, clientPrimaryColor, clientSecondaryColor }: LayoutShowcaseProps) {
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TextLayoutStyle>(currentDefault);

  useEffect(() => {
    generateAllPreviews();
  }, []);

  async function generateAllPreviews() {
    setLoading(true);
    try {
      const sampleImage = await createSampleImageUrl();
      
      const config = {
        ...SAMPLE_CONFIG,
        primaryColor: clientPrimaryColor || SAMPLE_CONFIG.primaryColor,
        secondaryColor: clientSecondaryColor || SAMPLE_CONFIG.secondaryColor,
        logoUrl: clientLogoUrl || undefined,
      };

      const results: Record<string, string> = {};
      
      for (const layout of LAYOUT_OPTIONS) {
        try {
          const result = await applyHtmlTextOverlay(sampleImage, {
            ...config,
            layoutStyle: layout.id,
          });
          results[layout.id] = result;
        } catch (e) {
          console.error(`Failed to generate ${layout.id}:`, e);
          results[layout.id] = sampleImage;
        }
      }
      
      setPreviews(results);
    } catch (e) {
      console.error('Failed to generate previews:', e);
      toast.error('שגיאה ביצירת התצוגות המקדימות');
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(id: TextLayoutStyle) {
    setSelected(id);
    onSelectDefault(id);
    toast.success(`ברירת המחדל שונתה ל: ${LAYOUT_OPTIONS.find(l => l.id === id)?.label}`);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4" dir="rtl">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">מייצר תצוגה מקדימה של כל הסגנונות...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">בחר סגנון ברירת מחדל</h2>
        <p className="text-muted-foreground text-sm">כל הסגנונות משתמשים בצבעי המותג שלך. לחץ על הסגנון המועדף כדי להגדיר אותו כברירת מחדל.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {LAYOUT_OPTIONS.map((layout) => {
          const isSelected = selected === layout.id;
          return (
            <Card 
              key={layout.id}
              className={`relative overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                isSelected 
                  ? 'ring-2 ring-primary shadow-lg shadow-primary/20' 
                  : 'hover:ring-1 hover:ring-primary/50'
              }`}
              onClick={() => handleSelect(layout.id)}
            >
              {/* Preview Image */}
              <div className="aspect-[3/4] w-full overflow-hidden bg-muted">
                {previews[layout.id] ? (
                  <img 
                    src={previews[layout.id]} 
                    alt={layout.label}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                )}
              </div>
              
              {/* Info bar */}
              <div className="p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{layout.icon}</span>
                    <span className="font-bold text-foreground">{layout.label}</span>
                  </div>
                  {isSelected && (
                    <Badge className="bg-primary text-primary-foreground gap-1">
                      <Check className="h-3 w-3" />
                      ברירת מחדל
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{layout.description}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
