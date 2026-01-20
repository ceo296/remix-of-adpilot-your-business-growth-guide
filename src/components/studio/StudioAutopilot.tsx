import { useState } from 'react';
import { Heart, DollarSign, Smile, Sparkles, Loader2, RefreshCw, Wand2, Newspaper, Radio, Monitor, RectangleHorizontal, Share2, Layers, Check, Volume2, FileText, Image, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MediaType } from './StudioMediaTypeStep';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export type HolidaySeason = 'pesach' | 'sukkot' | 'chanukah' | 'purim' | 'shavuot' | 'lag_baomer' | 'tu_bishvat' | 'summer' | 'bein_hazmanim' | 'rosh_hashana' | 'yom_kippur' | 'year_round' | '';

export const HOLIDAY_LABELS: Record<string, string> = {
  pesach: 'פסח',
  sukkot: 'סוכות',
  chanukah: 'חנוכה',
  purim: 'פורים',
  shavuot: 'שבועות',
  lag_baomer: 'ל"ג בעומר',
  tu_bishvat: 'ט"ו בשבט',
  summer: 'קיץ',
  bein_hazmanim: 'בין הזמנים',
  rosh_hashana: 'ראש השנה',
  yom_kippur: 'ימים נוראים',
  year_round: 'כל השנה',
};

export interface CreativeConcept {
  id: string;
  type: 'emotional' | 'hard-sale' | 'pain-point';
  headline: string;
  idea: string;
  copy: string;
  mediaType?: MediaType;
}

interface ClientInfo {
  business_name: string;
  target_audience: string | null;
}

interface StudioAutopilotProps {
  isGenerating: boolean;
  concepts: CreativeConcept[];
  selectedConcept: CreativeConcept | null;
  clientInfo: ClientInfo | null;
  selectedMediaTypes: MediaType[];
  onMediaTypesChange: (types: MediaType[]) => void;
  onGenerateConcepts: () => void;
  onSelectConcept: (concept: CreativeConcept) => void;
  onExecuteConcept: () => void;
  selectedHoliday?: HolidaySeason;
  onHolidayChange?: (holiday: HolidaySeason) => void;
}

const CONCEPT_ICONS = {
  'emotional': Heart,
  'hard-sale': DollarSign,
  'pain-point': Smile,
};

const CONCEPT_COLORS = {
  'emotional': 'border-pink-500/50 bg-pink-500/5',
  'hard-sale': 'border-amber-500/50 bg-amber-500/5',
  'pain-point': 'border-emerald-500/50 bg-emerald-500/5',
};

// Media options with vibrant color schemes
const MEDIA_OPTIONS: { 
  id: MediaType; 
  label: string; 
  icon: React.ElementType;
  gradient: string;
  shadowColor: string;
}[] = [
  { id: 'radio', label: 'רדיו', icon: Radio, gradient: 'from-violet-500 to-purple-600', shadowColor: 'shadow-purple-500/30' },
  { id: 'ad', label: 'מודעות', icon: Newspaper, gradient: 'from-blue-500 to-cyan-500', shadowColor: 'shadow-cyan-500/30' },
  { id: 'banner', label: 'באנרים', icon: Monitor, gradient: 'from-emerald-500 to-teal-500', shadowColor: 'shadow-teal-500/30' },
  { id: 'billboard', label: 'שלטי חוצות', icon: RectangleHorizontal, gradient: 'from-orange-500 to-amber-500', shadowColor: 'shadow-amber-500/30' },
  { id: 'social', label: 'סושיאל', icon: Share2, gradient: 'from-pink-500 to-rose-500', shadowColor: 'shadow-rose-500/30' },
  { id: 'all', label: 'קמפיין 360°', icon: Layers, gradient: 'from-primary to-red-500', shadowColor: 'shadow-primary/30' },
];

// Truncate text helper
const truncateText = (text: string | undefined | null, maxLength: number = 120): string => {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

// Media-specific preview component - redesigned for clarity
const ConceptPreview = ({ concept, mediaType }: { concept: CreativeConcept; mediaType: MediaType | null }) => {
  if (mediaType === 'radio') {
    // Radio script preview - cleaner layout
    return (
      <div className="mt-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Volume2 className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">ספוט רדיו • 30 שניות</span>
        </div>
        
        {/* Audio waveform visual */}
        <div className="flex items-center gap-1 h-8 px-2">
          {[...Array(50)].map((_, i) => (
            <div 
              key={i} 
              className="w-1 bg-primary/30 rounded-full transition-all"
              style={{ height: `${20 + Math.random() * 80}%` }}
            />
          ))}
        </div>
        
        {/* Script preview */}
        <div className="bg-muted/30 rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-2 font-medium">תסריט:</p>
          <p className="text-foreground leading-relaxed" dir="rtl">
            {truncateText(concept.copy, 150)}
          </p>
        </div>
      </div>
    );
  }

  if (mediaType === 'ad' || mediaType === 'all') {
    // Print ad preview - simplified
    return (
      <div className="mt-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Newspaper className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">מודעת פרסום</span>
        </div>
        
        {/* Simplified ad mockup */}
        <div className="bg-muted/20 rounded-xl p-5 border border-border/50">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
              <Image className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <div className="flex-1 space-y-2">
              <p className="font-bold text-lg text-foreground" dir="rtl">{concept.headline}</p>
              <p className="text-sm text-muted-foreground leading-relaxed" dir="rtl">
                {truncateText(concept.copy, 100)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mediaType === 'banner') {
    // Digital banner preview
    return (
      <div className="mt-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Monitor className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">באנר דיגיטלי</span>
        </div>
        
        {/* Banner mockup */}
        <div className="bg-gradient-to-l from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/20">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-right" dir="rtl">
              <p className="font-bold text-foreground">{concept.headline}</p>
              <p className="text-xs text-muted-foreground mt-1">{truncateText(concept.copy, 60)}</p>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
              קרא עוד →
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mediaType === 'billboard') {
    // Billboard preview - dramatic
    return (
      <div className="mt-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <RectangleHorizontal className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">שלט חוצות</span>
        </div>
        
        {/* Billboard mockup */}
        <div className="aspect-[16/6] bg-gradient-to-br from-muted/30 to-muted/50 rounded-xl border-2 border-muted flex items-center justify-center p-6">
          <p className="font-black text-xl md:text-2xl text-foreground text-center" dir="rtl">
            {truncateText(concept.copy, 50)}
          </p>
        </div>
        <p className="text-xs text-muted-foreground text-center">* נקרא ב-3 שניות מרכב נוסע</p>
      </div>
    );
  }

  if (mediaType === 'social') {
    // Social media post preview
    return (
      <div className="mt-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Share2 className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">פוסט סושיאל</span>
        </div>
        
        {/* Social post mockup - simplified */}
        <div className="bg-muted/20 rounded-xl p-4 border border-border/50 max-w-xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/20" />
            <div className="text-xs">
              <p className="font-bold">שם העסק</p>
              <p className="text-muted-foreground">ממומן</p>
            </div>
          </div>
          <p className="text-sm font-medium" dir="rtl">{concept.headline}</p>
          <p className="text-sm text-muted-foreground mt-1" dir="rtl">{truncateText(concept.copy, 80)}</p>
        </div>
      </div>
    );
  }

  // Default - clean text preview
  return (
    <div className="mt-5 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">קופי מוצע</span>
      </div>
      <div className="bg-muted/20 rounded-xl p-4">
        <p className="text-foreground leading-relaxed" dir="rtl">"{truncateText(concept.copy, 120)}"</p>
      </div>
    </div>
  );
};

export const StudioAutopilot = ({
  isGenerating,
  concepts,
  selectedConcept,
  clientInfo,
  selectedMediaTypes,
  onMediaTypesChange,
  onGenerateConcepts,
  onSelectConcept,
  onExecuteConcept,
  selectedHoliday = '',
  onHolidayChange,
}: StudioAutopilotProps) => {
  const handleToggleMediaType = (id: MediaType) => {
    // If selecting 'all', clear others and select only 'all'
    if (id === 'all') {
      if (selectedMediaTypes.includes('all')) {
        onMediaTypesChange([]);
      } else {
        onMediaTypesChange(['all']);
      }
      return;
    }

    // If selecting individual type, remove 'all' if present
    let newValue = selectedMediaTypes.filter(v => v !== 'all');
    
    if (newValue.includes(id)) {
      newValue = newValue.filter(v => v !== id);
    } else {
      newValue = [...newValue, id];
    }
    
    onMediaTypesChange(newValue);
  };

  const isSelected = (id: MediaType) => selectedMediaTypes.includes(id);
  const primaryMediaType = selectedMediaTypes[0] || null;
  // Initial state - no concepts yet
  if (concepts.length === 0 && !isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Sparkles className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">מצב אוטומטי</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          תשברו אתם את הראש במקומי. המערכת תיצור 3 כיווני קריאייטיב מבוססי האסטרטגיה שלכם.
        </p>
        
        {/* Media Type Selection */}
        <div className="w-full max-w-2xl mb-6">
          <p className="text-sm font-medium text-muted-foreground mb-3">איזה חומר פרסומי תרצו ליצור? (ניתן לבחור כמה)</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {MEDIA_OPTIONS.map((option) => (
              <Card
                key={option.id}
                className={cn(
                  'cursor-pointer transition-all duration-300 border-2 relative group hover:scale-105',
                  isSelected(option.id)
                    ? `border-transparent bg-gradient-to-br ${option.gradient} shadow-lg ${option.shadowColor}`
                    : 'border-border hover:border-primary/50 bg-card'
                )}
                onClick={() => handleToggleMediaType(option.id)}
              >
                <CardContent className="p-4 flex flex-col items-center gap-2">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center transition-all',
                    isSelected(option.id) 
                      ? 'bg-white/20' 
                      : `bg-gradient-to-br ${option.gradient} shadow-md ${option.shadowColor}`
                  )}>
                    <option.icon className={cn(
                      'w-6 h-6 transition-transform group-hover:scale-110',
                      isSelected(option.id) ? 'text-white' : 'text-white'
                    )} />
                  </div>
                  <span className={cn(
                    'text-sm font-semibold',
                    isSelected(option.id) ? 'text-white' : 'text-foreground'
                  )}>
                    {option.label}
                  </span>
                  {isSelected(option.id) && (
                    <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-md">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Holiday/Season Selection */}
        {onHolidayChange && (
          <div className="w-full max-w-md mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">חג/עונה (אופציונלי)</Label>
            </div>
            <Select 
              value={selectedHoliday} 
              onValueChange={(v) => onHolidayChange(v as HolidaySeason)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="בחר חג או עונה רלוונטית לקמפיין" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(HOLIDAY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              בחירת חג תביא דוגמאות מותאמות לעונה ותשפיע על סגנון הקריאייטיב
            </p>
          </div>
        )}
        
        {/* Personalized info card */}
        {clientInfo && (
          <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6 max-w-md">
            <p className="text-sm text-muted-foreground mb-2">מייצרים קונספטים עבור:</p>
            <p className="font-bold text-lg text-foreground">{clientInfo.business_name}</p>
            {clientInfo.target_audience && (
              <p className="text-sm text-muted-foreground mt-1">
                קהל יעד: <span className="text-foreground">{clientInfo.target_audience}</span>
              </p>
            )}
            {selectedHoliday && selectedHoliday !== 'year_round' && (
              <Badge variant="secondary" className="mt-2">
                <Calendar className="h-3 w-3 ml-1" />
                {HOLIDAY_LABELS[selectedHoliday]}
              </Badge>
            )}
          </div>
        )}
        
        <Button
          size="lg"
          variant="gradient"
          onClick={onGenerateConcepts}
          disabled={selectedMediaTypes.length === 0}
          className="text-lg px-8"
        >
          <Wand2 className="h-5 w-5 ml-2" />
          תכינו לי סקיצות על בסיס האסטרטגיה
        </Button>
        
        {selectedMediaTypes.length === 0 && (
          <p className="text-xs text-muted-foreground mt-2">יש לבחור סוג מדיה להמשך</p>
        )}
      </div>
    );
  }

  // Loading state
  if (isGenerating && concepts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
        <h2 className="text-xl font-bold mb-2">הקופירייטר שלנו מחדד עפרונות...</h2>
        <p className="text-muted-foreground animate-pulse">
          מנתח את האסטרטגיה ובונה כיווני קריאייטיב
        </p>
      </div>
    );
  }

  // Get media type label
  const getMediaLabel = () => {
    if (selectedMediaTypes.length === 0) return 'קריאייטיב';
    if (selectedMediaTypes.includes('all')) return 'קמפיין 360°';
    if (selectedMediaTypes.length === 1) {
      const media = MEDIA_OPTIONS.find(m => m.id === selectedMediaTypes[0]);
      return media?.label || 'קריאייטיב';
    }
    return `${selectedMediaTypes.length} סוגי מדיה`;
  };

  // Concepts display
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Badge variant="secondary" className="mb-3">
          {primaryMediaType === 'radio' ? '🎙️' : primaryMediaType === 'billboard' ? '🪧' : primaryMediaType === 'social' ? '📱' : '📰'} {getMediaLabel()}
        </Badge>
        <h2 className="text-2xl font-bold mb-2">בחרו את הזווית שמדברת אליכם</h2>
        <p className="text-muted-foreground">
          3 כיוונים שונים מבוססי האסטרטגיה שלכם
        </p>
      </div>

      <div className="grid gap-4">
        {concepts.map((concept) => {
          const Icon = CONCEPT_ICONS[concept.type];
          const colorClass = CONCEPT_COLORS[concept.type];
          const isConceptSelected = selectedConcept?.id === concept.id;

          // Get type label in Hebrew
          const typeLabel = concept.type === 'emotional' ? 'רגשי' : 
                           concept.type === 'hard-sale' ? 'מכירתי' : 'כאב ופתרון';

          return (
            <Card
              key={concept.id}
              onClick={() => onSelectConcept(concept)}
              className={cn(
                "cursor-pointer transition-all duration-200 border-2 overflow-hidden",
                colorClass,
                isConceptSelected && "ring-2 ring-primary ring-offset-2",
                "hover:shadow-lg"
              )}
            >
              {/* Header bar */}
              <div className={cn(
                "px-5 py-3 flex items-center justify-between border-b",
                concept.type === 'emotional' && "bg-pink-500/10 border-pink-500/20",
                concept.type === 'hard-sale' && "bg-amber-500/10 border-amber-500/20",
                concept.type === 'pain-point' && "bg-emerald-500/10 border-emerald-500/20",
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    concept.type === 'emotional' && "bg-pink-500/20 text-pink-500",
                    concept.type === 'hard-sale' && "bg-amber-500/20 text-amber-500",
                    concept.type === 'pain-point' && "bg-emerald-500/20 text-emerald-500",
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <Badge variant="secondary" className="text-xs mb-1">{typeLabel}</Badge>
                    <h3 className="text-lg font-bold text-foreground">{concept.headline}</h3>
                  </div>
                </div>
                {isConceptSelected && (
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Content area */}
              <div className="p-5">
                {/* Idea/direction - concise */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1">כיוון קריאייטיבי</p>
                  <p className="text-sm text-foreground">{concept.idea}</p>
                </div>
                
                {/* Media-specific preview */}
                <ConceptPreview concept={concept} mediaType={primaryMediaType} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-border">
        <Button variant="outline" onClick={onGenerateConcepts} disabled={isGenerating}>
          <RefreshCw className={cn("h-4 w-4 ml-2", isGenerating && "animate-spin")} />
          רעיונות חדשים
        </Button>
        
        <Button
          variant="gradient"
          size="lg"
          onClick={onExecuteConcept}
          disabled={!selectedConcept || isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
              מייצר...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 ml-2" />
              אהבתי, רוץ עם זה!
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
