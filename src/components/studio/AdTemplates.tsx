import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Newspaper, Monitor, RectangleHorizontal, Square, Smartphone } from 'lucide-react';

export interface AdTemplate {
  id: string;
  name: string;
  category: 'newspaper' | 'banner' | 'billboard' | 'social';
  dimensions: { width: number; height: number };
  aspectRatio: string;
  description: string;
  promptHints: string;
}

const TEMPLATES: AdTemplate[] = [
  // Newspaper ads
  {
    id: 'newspaper-full',
    name: 'עמוד מלא',
    category: 'newspaper',
    dimensions: { width: 1024, height: 1408 },
    aspectRatio: '5:7',
    description: 'מודעת עמוד מלא בעיתון',
    promptHints: 'professional newspaper advertisement, clean layout, Hebrew text area at top, product showcase, elegant typography'
  },
  {
    id: 'newspaper-half',
    name: 'חצי עמוד',
    category: 'newspaper',
    dimensions: { width: 1024, height: 704 },
    aspectRatio: '3:2',
    description: 'מודעת חצי עמוד אופקי',
    promptHints: 'horizontal newspaper ad, balanced composition, text on left product on right, professional layout'
  },
  {
    id: 'newspaper-quarter',
    name: 'רבע עמוד',
    category: 'newspaper',
    dimensions: { width: 512, height: 704 },
    aspectRatio: '3:4',
    description: 'מודעת רבע עמוד',
    promptHints: 'compact vertical ad, focused message, single product hero, minimal text area'
  },
  // Digital banners
  {
    id: 'banner-leaderboard',
    name: 'באנר ראשי',
    category: 'banner',
    dimensions: { width: 1456, height: 256 },
    aspectRatio: '728:90',
    description: 'Leaderboard - באנר עליון',
    promptHints: 'wide horizontal web banner, eye-catching, call to action button area, dynamic composition'
  },
  {
    id: 'banner-rectangle',
    name: 'באנר מרובע',
    category: 'banner',
    dimensions: { width: 600, height: 500 },
    aspectRatio: '6:5',
    description: 'Medium Rectangle - באנר צד',
    promptHints: 'medium rectangle web banner, clear focal point, action button space, engaging visuals'
  },
  {
    id: 'banner-skyscraper',
    name: 'באנר צד',
    category: 'banner',
    dimensions: { width: 320, height: 1200 },
    aspectRatio: '4:15',
    description: 'Wide Skyscraper - באנר אנכי',
    promptHints: 'vertical skyscraper banner, stacked elements, logo top product middle cta bottom'
  },
  // Billboards
  {
    id: 'billboard-standard',
    name: 'בילבורד סטנדרטי',
    category: 'billboard',
    dimensions: { width: 1920, height: 640 },
    aspectRatio: '3:1',
    description: 'שלט חוצות קלאסי',
    promptHints: 'outdoor billboard, bold visuals, minimal text, high contrast, visible from distance, dramatic lighting'
  },
  {
    id: 'billboard-digital',
    name: 'בילבורד דיגיטלי',
    category: 'billboard',
    dimensions: { width: 1920, height: 1080 },
    aspectRatio: '16:9',
    description: 'מסך דיגיטלי HD',
    promptHints: 'digital billboard, vivid colors, modern design, impactful imagery, clear message'
  },
  // Social media
  {
    id: 'social-square',
    name: 'פוסט מרובע',
    category: 'social',
    dimensions: { width: 1080, height: 1080 },
    aspectRatio: '1:1',
    description: 'פוסט לאינסטגרם/פייסבוק',
    promptHints: 'social media post, engaging visually, share-worthy, modern aesthetic, lifestyle context'
  },
  {
    id: 'social-story',
    name: 'סטורי',
    category: 'social',
    dimensions: { width: 1080, height: 1920 },
    aspectRatio: '9:16',
    description: 'סטורי לאינסטגרם/וואטסאפ',
    promptHints: 'vertical story format, immersive full screen, swipe up cta area, trendy design'
  },
];

const CATEGORY_ICONS = {
  newspaper: Newspaper,
  banner: Monitor,
  billboard: RectangleHorizontal,
  social: Smartphone,
};

const CATEGORY_LABELS = {
  newspaper: 'עיתונות',
  banner: 'באנרים',
  billboard: 'שילוט',
  social: 'דיגיטל',
};

interface AdTemplatesProps {
  selectedTemplate: AdTemplate | null;
  onSelect: (template: AdTemplate) => void;
  mediaType?: string;
}

export function AdTemplates({ selectedTemplate, onSelect, mediaType }: AdTemplatesProps) {
  // Filter templates based on media type if provided
  const filteredTemplates = mediaType 
    ? TEMPLATES.filter(t => {
        if (mediaType === 'print' || mediaType === 'newspaper') return t.category === 'newspaper';
        if (mediaType === 'digital' || mediaType === 'banner') return t.category === 'banner';
        if (mediaType === 'outdoor' || mediaType === 'billboard') return t.category === 'billboard';
        if (mediaType === 'social') return t.category === 'social';
        return true;
      })
    : TEMPLATES;

  // Group templates by category
  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.category]) acc[template.category] = [];
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, AdTemplate[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedTemplates).map(([category, templates]) => {
        const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];
        const label = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS];
        
        return (
          <div key={category}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className="h-4 w-4 text-primary" />
              <h4 className="font-medium">{label}</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  onClick={() => onSelect(template)}
                  className={cn(
                    "p-3 cursor-pointer transition-all hover:border-primary/50",
                    selectedTemplate?.id === template.id && "border-primary ring-2 ring-primary/20"
                  )}
                >
                  {/* Aspect ratio preview */}
                  <div 
                    className="bg-muted rounded mb-2 flex items-center justify-center text-muted-foreground text-xs"
                    style={{
                      aspectRatio: template.aspectRatio.replace(':', '/'),
                      maxHeight: '60px',
                    }}
                  >
                    {template.dimensions.width}×{template.dimensions.height}
                  </div>
                  <div className="text-sm font-medium">{template.name}</div>
                  <div className="text-xs text-muted-foreground">{template.description}</div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { TEMPLATES };
