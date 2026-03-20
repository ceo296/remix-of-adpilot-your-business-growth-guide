import { useState } from 'react';
import { CreativeResult } from '@/types/adkop';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Sparkles, Loader2, RefreshCw, AlertCircle, Paintbrush, Brain, Heart, Lightbulb } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  creatives: CreativeResult[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const CONCEPT_TYPE_CONFIG: Record<string, { label: string; icon: typeof Brain; color: string }> = {
  rational: { label: 'שכלית', icon: Brain, color: 'text-blue-500' },
  emotional: { label: 'רגשית', icon: Heart, color: 'text-rose-500' },
  creative: { label: 'שנונה', icon: Lightbulb, color: 'text-amber-500' },
};

const StepCreativeResults = ({ creatives, isLoading, error, onRetry }: Props) => {
  const [generatingImages, setGeneratingImages] = useState<Record<string, boolean>>({});
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, string>>({});

  const handleGenerateImage = async (creative: CreativeResult) => {
    setGeneratingImages(prev => ({ ...prev, [creative.id]: true }));
    setImageErrors(prev => ({ ...prev, [creative.id]: '' }));

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-image', {
        body: {
          visualPrompt: creative.visualLogic,
          textPrompt: creative.headline,
          style: 'ultra-realistic',
          engine: 'nano-banana',
        },
      });

      if (fnError) throw fnError;

      if (data?.imageUrl) {
        setImageUrls(prev => ({ ...prev, [creative.id]: data.imageUrl }));
        // Log model used
        const modelName = data.model || data.layers?.visual?.model || 'unknown';
        console.log(`[ADKOP] Image generated with model: ${modelName}`);
        toast.success(`העיצוב נוצר בהצלחה! (${modelName.includes('3.1-flash') ? '🍌 Nano Banana 2' : modelName})`);
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'שגיאה ביצירת העיצוב';
      setImageErrors(prev => ({ ...prev, [creative.id]: msg }));
      toast.error(msg);
    } finally {
      setGeneratingImages(prev => ({ ...prev, [creative.id]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-rubik font-bold text-foreground">מייצר קונספטים...</h2>
          <p className="text-muted-foreground mt-2">הסוכן הקריאטיבי עובד על 3 אופציות: שכלית, רגשית ושנונה</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 gap-6">
          <div className="relative">
            <Loader2 className="w-16 h-16 text-primary animate-spin" />
            <Sparkles className="w-6 h-6 text-primary absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-foreground font-medium">הסוכן מנתח את ה-MRI האסטרטגי שלכם...</p>
            <p className="text-sm text-muted-foreground">זה יכול לקחת כ-15-30 שניות</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-rubik font-bold text-foreground">תוצרים קריאטיביים</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-foreground font-medium">{error}</p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" className="gap-2 mt-2">
              <RefreshCw className="w-4 h-4" />
              נסה שוב
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (creatives.length === 0) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-rubik font-bold text-foreground">תוצרים קריאטיביים</h2>
          <p className="text-muted-foreground mt-2">הקונספטים ייווצרו אוטומטית כשתגיעו לשלב זה</p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground">
          <Sparkles className="w-12 h-12" />
          <p>מלאו את השלבים הקודמים כדי לקבל קריאייטיב מותאם</p>
        </div>
      </div>
    );
  }

  const conceptTypes = ['rational', 'emotional', 'creative'];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-rubik font-bold text-foreground">תוצרים קריאטיביים</h2>
        <p className="text-muted-foreground mt-2">{creatives.length} סקיצות מוכנות — שכלית, רגשית ושנונה</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {creatives.map((creative, index) => {
          const typeKey = conceptTypes[index] || 'rational';
          const typeConfig = CONCEPT_TYPE_CONFIG[typeKey];
          const TypeIcon = typeConfig?.icon || Brain;
          const imageUrl = imageUrls[creative.id] || creative.imageUrl;
          const isGenerating = generatingImages[creative.id];
          const imageError = imageErrors[creative.id];

          return (
            <div
              key={creative.id}
              className="group relative bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              {/* Type badge */}
              <div className="absolute top-3 right-3 z-10">
                <Badge variant="secondary" className="gap-1 bg-card/90 backdrop-blur-sm">
                  <TypeIcon className={`w-3.5 h-3.5 ${typeConfig?.color}`} />
                  {typeConfig?.label || `אופציה ${index + 1}`}
                </Badge>
              </div>

              {/* Image Area */}
              <div className="h-52 bg-gradient-to-br from-primary/10 via-muted to-primary/5 flex items-center justify-center relative">
                {imageUrl ? (
                  <img src={imageUrl} alt={creative.headline} className="w-full h-full object-cover" />
                ) : isGenerating ? (
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <span className="text-xs">מייצר עיצוב...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Sparkles className="w-8 h-8 text-muted-foreground" />
                    <Button
                      onClick={() => handleGenerateImage(creative)}
                      variant="outline"
                      size="sm"
                      className="gap-2 bg-card/80 backdrop-blur-sm"
                    >
                      <Paintbrush className="w-4 h-4" />
                      צור עיצוב
                    </Button>
                    {imageError && (
                      <p className="text-xs text-destructive px-4 text-center">{imageError}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5 space-y-3">
                <h3 className="text-lg font-bold font-rubik text-foreground leading-tight">
                  {creative.headline}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{creative.bodyText}</p>
                <div className="flex items-center justify-between pt-2">
                  <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">
                    {creative.cta}
                  </Badge>
                  {!imageUrl && !isGenerating && (
                    <Button
                      onClick={() => handleGenerateImage(creative)}
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-xs text-muted-foreground"
                    >
                      <Paintbrush className="w-3 h-3" />
                      עיצוב
                    </Button>
                  )}
                </div>
              </div>

              {/* Visual Logic Tooltip */}
              {creative.visualLogic && (
                <div className="absolute top-3 left-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="w-8 h-8 rounded-full bg-card/90 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-card transition-colors">
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[240px] text-sm">
                      <p className="font-semibold mb-1">לוגיקה ויזואלית:</p>
                      <p>{creative.visualLogic}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {onRetry && (
        <div className="flex justify-center pt-2">
          <Button onClick={onRetry} variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <RefreshCw className="w-4 h-4" />
            צור קונספטים חדשים
          </Button>
        </div>
      )}
    </div>
  );
};

export default StepCreativeResults;
