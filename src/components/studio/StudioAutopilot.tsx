import { useState } from 'react';
import { Heart, DollarSign, Smile, Sparkles, Loader2, RefreshCw, Wand2, Newspaper, Radio, Monitor, RectangleHorizontal, Share2, Layers, Check, Volume2, FileText, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MediaType } from './StudioMediaTypeStep';

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

const MEDIA_OPTIONS: { 
  id: MediaType; 
  label: string; 
  icon: React.ElementType;
}[] = [
  { id: 'radio', label: 'רדיו', icon: Radio },
  { id: 'ad', label: 'מודעות', icon: Newspaper },
  { id: 'banner', label: 'באנרים', icon: Monitor },
  { id: 'billboard', label: 'שלטי חוצות', icon: RectangleHorizontal },
  { id: 'social', label: 'סושיאל', icon: Share2 },
  { id: 'all', label: 'קמפיין 360°', icon: Layers },
];

// Media-specific preview component
const ConceptPreview = ({ concept, mediaType }: { concept: CreativeConcept; mediaType: MediaType | null }) => {
  if (mediaType === 'radio') {
    // Radio script preview with audio player mockup
    return (
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Volume2 className="h-4 w-4" />
          תסריט ספוט רדיו (30 שניות)
        </div>
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/20">
          {/* Audio waveform mockup */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Radio className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1 h-8">
                {[...Array(40)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-1 bg-primary/40 rounded-full"
                    style={{ 
                      height: `${Math.random() * 100}%`,
                      minHeight: '4px'
                    }}
                  />
                ))}
              </div>
            </div>
            <span className="text-xs text-muted-foreground">0:30</span>
          </div>
          {/* Script text */}
          <div className="bg-background/80 rounded-lg p-3 border border-border">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap" dir="rtl">
              {concept.copy}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <Badge variant="secondary" className="text-xs">קריין</Badge>
            <span>• הנחיות: {concept.idea}</span>
          </div>
        </div>
      </div>
    );
  }

  if (mediaType === 'ad' || mediaType === 'all') {
    // Print ad preview
    return (
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Newspaper className="h-4 w-4" />
          תצוגת מודעה
        </div>
        <div className="bg-white border-2 border-border rounded-lg p-6 shadow-md max-w-sm mx-auto">
          {/* Ad mockup */}
          <div className="aspect-[3/4] bg-gradient-to-b from-muted/30 to-muted/60 rounded-lg p-4 flex flex-col justify-between">
            {/* Image placeholder */}
            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg mb-4">
              <div className="text-center text-muted-foreground/50">
                <Image className="h-8 w-8 mx-auto mb-2" />
                <p className="text-xs">{concept.idea}</p>
              </div>
            </div>
            {/* Ad copy */}
            <div className="bg-background rounded-lg p-3 text-center">
              <p className="font-bold text-foreground text-lg mb-1" dir="rtl">{concept.headline}</p>
              <p className="text-sm text-foreground" dir="rtl">"{concept.copy}"</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mediaType === 'banner') {
    // Digital banner preview
    return (
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Monitor className="h-4 w-4" />
          תצוגת באנר
        </div>
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-border rounded-lg p-3 overflow-hidden">
          {/* Banner mockup - horizontal */}
          <div className="aspect-[4/1] bg-gradient-to-r from-muted to-muted/80 rounded flex items-center justify-between px-6">
            <div className="flex-1 text-right" dir="rtl">
              <p className="font-bold text-foreground text-sm md:text-base">{concept.headline}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{concept.copy}</p>
            </div>
            <Button size="sm" variant="default" className="mr-4 text-xs">
              לחצו כאן
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (mediaType === 'billboard') {
    // Billboard preview
    return (
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <RectangleHorizontal className="h-4 w-4" />
          תצוגת שלט חוצות
        </div>
        <div className="bg-muted/50 rounded-lg p-4">
          {/* Billboard mockup */}
          <div className="aspect-[16/9] bg-gradient-to-br from-primary/20 via-primary/10 to-muted rounded-lg border-4 border-muted-foreground/20 flex flex-col items-center justify-center p-8 shadow-lg">
            <p className="font-black text-2xl md:text-3xl text-foreground text-center" dir="rtl">
              {concept.copy}
            </p>
            <div className="mt-4 text-xs text-muted-foreground text-center">
              {concept.idea}
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">* נקרא ב-3 שניות מרכב נוסע</p>
        </div>
      </div>
    );
  }

  if (mediaType === 'social') {
    // Social media post preview
    return (
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Share2 className="h-4 w-4" />
          תצוגת פוסט סושיאל
        </div>
        <div className="bg-background border border-border rounded-xl max-w-xs mx-auto shadow-md">
          {/* Social post mockup */}
          <div className="p-3 border-b border-border flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20" />
            <div>
              <p className="text-xs font-bold">העסק שלי</p>
              <p className="text-xs text-muted-foreground">ממומן</p>
            </div>
          </div>
          <div className="aspect-square bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center">
            <div className="text-center px-4">
              <Image className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">{concept.idea}</p>
            </div>
          </div>
          <div className="p-3">
            <p className="text-sm font-medium" dir="rtl">{concept.headline}</p>
            <p className="text-sm text-foreground mt-1" dir="rtl">{concept.copy}</p>
            <p className="text-xs text-primary mt-2">#פרסום #קמפיין #מומלץ</p>
          </div>
        </div>
      </div>
    );
  }

  // Default - text preview
  return (
    <div className="bg-background/50 rounded-lg p-3 border border-border mt-3">
      <p className="text-sm font-medium">קופי מוצע:</p>
      <p className="text-foreground">"{concept.copy}"</p>
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
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {MEDIA_OPTIONS.map((option) => (
              <Card
                key={option.id}
                className={cn(
                  'cursor-pointer transition-all duration-300 border-2 relative',
                  isSelected(option.id)
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border hover:border-primary/50'
                )}
                onClick={() => handleToggleMediaType(option.id)}
              >
                <CardContent className="p-3 flex flex-col items-center gap-2">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    isSelected(option.id) ? 'bg-primary/20' : 'bg-muted'
                  )}>
                    <option.icon className={cn(
                      'w-5 h-5',
                      isSelected(option.id) ? 'text-primary' : 'text-muted-foreground'
                    )} />
                  </div>
                  <span className={cn(
                    'text-xs font-medium',
                    isSelected(option.id) ? 'text-primary' : 'text-muted-foreground'
                  )}>
                    {option.label}
                  </span>
                  {isSelected(option.id) && (
                    <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
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

      <div className="grid gap-6">
        {concepts.map((concept) => {
          const Icon = CONCEPT_ICONS[concept.type];
          const colorClass = CONCEPT_COLORS[concept.type];
          const isSelected = selectedConcept?.id === concept.id;

          return (
            <Card
              key={concept.id}
              onClick={() => onSelectConcept(concept)}
              className={cn(
                "p-6 cursor-pointer transition-all border-2",
                colorClass,
                isSelected && "ring-2 ring-primary ring-offset-2 scale-[1.01]",
                "hover:scale-[1.005] hover:shadow-lg"
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                  concept.type === 'emotional' && "bg-pink-500/20 text-pink-500",
                  concept.type === 'hard-sale' && "bg-amber-500/20 text-amber-500",
                  concept.type === 'pain-point' && "bg-emerald-500/20 text-emerald-500",
                )}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold mb-2">{concept.headline}</h3>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        ✓
                      </div>
                    )}
                  </div>
                  
                  {/* Media-specific preview */}
                  <ConceptPreview concept={concept} mediaType={primaryMediaType} />
                </div>
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
