import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Receipt, Sparkles, MessageCircle, Check, Loader2, Newspaper, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MediaItem {
  id: string;
  name: string;
  price: number;
}

export interface QuoteData {
  mediaItems: MediaItem[];
  creativeMode: 'autopilot' | 'manual' | 'uploaded';
  creativeCost: number;
}

interface StudioQuoteStepProps {
  quoteData: QuoteData;
  isSubmitting: boolean;
  onApprove: () => void;
  onConsult: () => void;
}

const CREATIVE_MODE_LABELS: Record<QuoteData['creativeMode'], string> = {
  autopilot: 'יצירת AI מלאה (אוטופילוט)',
  manual: 'יצירת AI ידנית',
  uploaded: 'חומר שהועלה ע"י הלקוח',
};

export const StudioQuoteStep = ({
  quoteData,
  isSubmitting,
  onApprove,
  onConsult,
}: StudioQuoteStepProps) => {
  const mediaCost = quoteData.mediaItems.reduce((sum, item) => sum + item.price, 0);
  const totalCost = mediaCost + quoteData.creativeCost;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Receipt className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">סיכום ביניים (לפני מע"מ)</h2>
        <p className="text-muted-foreground">הצעת המחיר שלך מוכנה</p>
      </div>

      <Card className="mb-6 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            פירוט הזמנה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Media Section */}
          {quoteData.mediaItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Newspaper className="h-4 w-4" />
                מדיה ופרסום
              </div>
              {quoteData.mediaItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-primary font-semibold">{formatPrice(item.price)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2">
                <span className="font-medium">סה"כ מדיה</span>
                <span className="font-bold text-lg">{formatPrice(mediaCost)}</span>
              </div>
            </div>
          )}

          {quoteData.mediaItems.length > 0 && quoteData.creativeCost > 0 && (
            <Separator />
          )}

          {/* Creative Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Palette className="h-4 w-4" />
              סטודיו וקריאייטיב
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="font-medium">{CREATIVE_MODE_LABELS[quoteData.creativeMode]}</span>
                {quoteData.creativeMode === 'autopilot' && (
                  <Badge variant="secondary" className="text-xs">
                    <Sparkles className="h-3 w-3 ml-1" />
                    AI
                  </Badge>
                )}
              </div>
              <span className={cn(
                "font-semibold",
                quoteData.creativeCost > 0 ? "text-primary" : "text-success"
              )}>
                {quoteData.creativeCost > 0 ? formatPrice(quoteData.creativeCost) : 'ללא עלות'}
              </span>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Total */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xl font-bold">סה"כ לתשלום</span>
            <span className="text-3xl font-bold text-primary">{formatPrice(totalCost)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <p className="text-center text-sm text-muted-foreground mb-6 px-4">
        * המחיר הוא אומדן בלבד וכפוף לאישור זמינות במערכת.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          size="lg"
          className="flex-1 h-14 text-lg"
          onClick={onApprove}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 ml-2 animate-spin" />
              שולח...
            </>
          ) : (
            <>
              <Check className="h-5 w-5 ml-2" />
              מאשר, שלח לביצוע!
            </>
          )}
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="flex-1 h-14 text-lg"
          onClick={onConsult}
          disabled={isSubmitting}
        >
          <MessageCircle className="h-5 w-5 ml-2" />
          התייעצות עם נציג
        </Button>
      </div>
    </div>
  );
};
