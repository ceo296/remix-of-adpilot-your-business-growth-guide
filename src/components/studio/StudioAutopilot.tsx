import { useState } from 'react';
import { Heart, DollarSign, Smile, Sparkles, Loader2, RefreshCw, Wand2, Newspaper, Radio, Monitor, RectangleHorizontal, Share2, Layers, Check } from 'lucide-react';
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
  selectedMediaType: MediaType | null;
  onMediaTypeChange: (type: MediaType) => void;
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

export const StudioAutopilot = ({
  isGenerating,
  concepts,
  selectedConcept,
  clientInfo,
  selectedMediaType,
  onMediaTypeChange,
  onGenerateConcepts,
  onSelectConcept,
  onExecuteConcept,
}: StudioAutopilotProps) => {
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
          <p className="text-sm font-medium text-muted-foreground mb-3">איזה חומר פרסומי תרצו ליצור?</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {MEDIA_OPTIONS.map((option) => (
              <Card
                key={option.id}
                className={cn(
                  'cursor-pointer transition-all duration-300 border-2 relative',
                  selectedMediaType === option.id
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border hover:border-primary/50'
                )}
                onClick={() => onMediaTypeChange(option.id)}
              >
                <CardContent className="p-3 flex flex-col items-center gap-2">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    selectedMediaType === option.id ? 'bg-primary/20' : 'bg-muted'
                  )}>
                    <option.icon className={cn(
                      'w-5 h-5',
                      selectedMediaType === option.id ? 'text-primary' : 'text-muted-foreground'
                    )} />
                  </div>
                  <span className={cn(
                    'text-xs font-medium',
                    selectedMediaType === option.id ? 'text-primary' : 'text-muted-foreground'
                  )}>
                    {option.label}
                  </span>
                  {selectedMediaType === option.id && (
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
          disabled={!selectedMediaType}
          className="text-lg px-8"
        >
          <Wand2 className="h-5 w-5 ml-2" />
          תכינו לי סקיצות על בסיס האסטרטגיה
        </Button>
        
        {!selectedMediaType && (
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

  // Concepts display
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">בחרו את הזווית שמדברת אליכם</h2>
        <p className="text-muted-foreground">
          3 כיוונים שונים מבוססי האסטרטגיה שלכם
        </p>
      </div>

      <div className="grid gap-4">
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
                isSelected && "ring-2 ring-primary ring-offset-2 scale-[1.02]",
                "hover:scale-[1.01] hover:shadow-lg"
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
                  <h3 className="text-lg font-bold mb-2">{concept.headline}</h3>
                  <p className="text-muted-foreground mb-3">{concept.idea}</p>
                  <div className="bg-background/50 rounded-lg p-3 border border-border">
                    <p className="text-sm font-medium">קופי מוצע:</p>
                    <p className="text-foreground">"{concept.copy}"</p>
                  </div>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    ✓
                  </div>
                )}
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
