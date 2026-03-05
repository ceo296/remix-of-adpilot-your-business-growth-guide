import { useState } from 'react';
import { HelpCircle, CheckCircle2, XCircle, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * Inline tooltip that shows brief logo upload guidelines.
 */
export const LogoUploadTooltip = () => (
  <TooltipProvider delayDuration={200}>
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
          <HelpCircle className="w-4 h-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[280px] text-right" dir="rtl">
        <p className="text-xs leading-relaxed">
          <strong>טיפ:</strong> העלו PNG עם רקע <strong>שקוף</strong> (לא לבן!).
          <br />קבצי PDF ו-SVG נתמכים גם כן.
          <br />גודל מומלץ: לפחות 500×500 פיקסלים.
        </p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

/**
 * Help button that opens a detailed modal with visual examples.
 */
export const LogoUploadHelpModal = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          איך מעלים לוגו נכון?
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-right">
            מדריך העלאת לוגו
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Good examples */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              כך כן ✅
            </h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground mr-6">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-green-500">•</span>
                <span><strong>PNG עם רקע שקוף</strong> — הלוגו ישתלב חלק על כל רקע</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-green-500">•</span>
                <span><strong>קובץ PDF / SVG</strong> — המערכת ממירה אוטומטית לתמונה</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-green-500">•</span>
                <span><strong>רזולוציה גבוהה</strong> — מינימום 500×500 פיקסלים</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-green-500">•</span>
                <span><strong>רק הלוגו</strong> — ללא טקסט מיותר מסביב</span>
              </li>
            </ul>
          </div>

          {/* Bad examples */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-destructive">
              <XCircle className="w-4 h-4" />
              כך לא ❌
            </h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground mr-6">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-destructive">•</span>
                <span><strong>PNG עם רקע לבן</strong> — ייצור ריבוע לבן מכוער על המודעה</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-destructive">•</span>
                <span><strong>JPG</strong> — תמיד יש רקע (לא שקוף), עדיף להמנע</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-destructive">•</span>
                <span><strong>לוגו על תמונת רקע</strong> — חותך אותו מהקשר שלו</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-destructive">•</span>
                <span><strong>תמונה מטושטשת / קטנה</strong> — תיראה גרוע בהדפסה</span>
              </li>
            </ul>
          </div>

          {/* Auto-fix note */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">💡 טיפ:</strong> אם תעלו לוגו עם רקע לבן,
              המערכת תנסה להסיר אותו אוטומטית. עם זאת, התוצאה הטובה ביותר תמיד תהיה
              עם קובץ PNG שקוף מהמקור.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Combined component: tooltip + help link
 */
const LogoUploadGuidelines = () => (
  <div className="flex items-center gap-2">
    <LogoUploadTooltip />
    <LogoUploadHelpModal />
  </div>
);

export default LogoUploadGuidelines;
