import { useState } from 'react';
import { Heart, DollarSign, Smile, Sparkles, Loader2, RefreshCw, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface CreativeConcept {
  id: string;
  type: 'emotional' | 'hard-sale' | 'pain-point';
  headline: string;
  idea: string;
  copy: string;
}

interface StudioAutopilotProps {
  isGenerating: boolean;
  concepts: CreativeConcept[];
  selectedConcept: CreativeConcept | null;
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

export const StudioAutopilot = ({
  isGenerating,
  concepts,
  selectedConcept,
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
        <p className="text-muted-foreground mb-8 max-w-md">
          תשברו אתם את הראש במקומי. המערכת תיצור 3 כיווני קריאייטיב מבוססי האסטרטגיה שלכם.
        </p>
        <Button
          size="lg"
          variant="gradient"
          onClick={onGenerateConcepts}
          className="text-lg px-8"
        >
          <Wand2 className="h-5 w-5 ml-2" />
          תכינו לי סקיצות על בסיס האסטרטגיה
        </Button>
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
