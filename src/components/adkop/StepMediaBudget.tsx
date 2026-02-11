import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MediaBudgetItem } from '@/types/adkop';
import { Download, CheckCircle2 } from 'lucide-react';

interface Props {
  items: MediaBudgetItem[];
}

const PLACEHOLDER_ITEMS: MediaBudgetItem[] = [
  { channel: 'המודיע - עמוד שלם', reachReasoning: 'חדירה של 80% בציבור הליטאי, מתאים לקהל יעד שמרן', estimatedPrice: '₪4,500' },
  { channel: 'בחדרי חרדים - באנר ראשי', reachReasoning: 'חשיפה דיגיטלית רחבה, 500K+ כניסות חודשיות', estimatedPrice: '₪2,200' },
  { channel: 'שילוט רחוב - בני ברק', reachReasoning: 'נוכחות פיזית באזור מגורים מרכזי של קהל היעד', estimatedPrice: '₪1,800' },
  { channel: 'רדיו קול חי - ספוט 30 שניות', reachReasoning: 'שעות שיא האזנה בקרב גברים, חדירה גבוהה', estimatedPrice: '₪3,000' },
];

const StepMediaBudget = ({ items }: Props) => {
  const displayItems = items.length > 0 ? items : PLACEHOLDER_ITEMS;
  
  const totalEstimate = displayItems.reduce((sum, item) => {
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
            {displayItems.map((item, i) => (
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
    </div>
  );
};

export default StepMediaBudget;
