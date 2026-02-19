import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MediaBudgetItem } from '@/types/adkop';
import { Download, CheckCircle2, Loader2, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

interface Props {
  items: MediaBudgetItem[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const StepMediaBudget = ({ items, isLoading, error, onRetry }: Props) => {
  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-rubik font-bold text-foreground">בונה תמהיל מדיה...</h2>
          <p className="text-muted-foreground mt-2">סוכן המדיה סורק את מאגר הערוצים ובונה תמהיל מותאם</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 gap-6">
          <Loader2 className="w-16 h-16 text-primary animate-spin" />
          <div className="text-center space-y-2">
            <p className="text-foreground font-medium">ממפה ערוצי מדיה רלוונטיים מהמאגר...</p>
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
          <h2 className="text-3xl font-rubik font-bold text-foreground">סיכום מדיה ותקציב</h2>
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

  if (items.length === 0) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-rubik font-bold text-foreground">סיכום מדיה ותקציב</h2>
          <p className="text-muted-foreground mt-2">התמהיל ייבנה אוטומטית כשתגיעו לשלב זה</p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground">
          <Sparkles className="w-12 h-12" />
          <p>מלאו את השלבים הקודמים כדי לקבל תמהיל מדיה מותאם</p>
        </div>
      </div>
    );
  }

  const totalEstimate = items.reduce((sum, item) => {
    const num = parseInt(item.estimatedPrice.replace(/[^\d]/g, ''), 10);
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-rubik font-bold text-foreground">סיכום מדיה ותקציב</h2>
        <p className="text-muted-foreground mt-2">פירוט הערוצים, ההיגיון והעלויות</p>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right font-bold">ערוץ</TableHead>
              <TableHead className="text-right font-bold">היגיון חשיפה</TableHead>
              <TableHead className="text-right font-bold">מחיר משוער</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, i) => (
              <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-semibold text-foreground">{item.channel}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.reachReasoning}</TableCell>
                <TableCell className="font-bold text-primary">{item.estimatedPrice}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Total */}
        <div className="flex justify-between items-center px-6 py-4 bg-muted/30 border-t border-border">
          <span className="font-bold text-foreground">סה״כ משוער</span>
          <span className="text-xl font-bold text-primary">₪{totalEstimate.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex justify-center gap-4 pt-4">
        <Button size="lg" className="gap-2 text-base px-8">
          <CheckCircle2 className="w-5 h-5" />
          אשר והורד
        </Button>
        <Button size="lg" variant="outline" className="gap-2 text-base px-8">
          <Download className="w-5 h-5" />
          הורד PDF
        </Button>
      </div>

      {onRetry && (
        <div className="flex justify-center">
          <Button onClick={onRetry} variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <RefreshCw className="w-4 h-4" />
            בנה תמהיל חדש
          </Button>
        </div>
      )}
    </div>
  );
};

export default StepMediaBudget;
