import { CreativeResult } from '@/types/adkop';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Sparkles } from 'lucide-react';

interface Props {
  creatives: CreativeResult[];
}

const PLACEHOLDER_CREATIVES: CreativeResult[] = [
  {
    id: '1',
    headline: 'הפתרון שחיכיתם לו',
    bodyText: 'איכות ללא פשרות, שירות שמדבר בגובה העיניים. הגיע הזמן לחוויה אחרת.',
    cta: 'לפרטים נוספים →',
    imageUrl: '',
    visualLogic: 'שימוש בגווני זהב ליצירת תחושת יוקרה בהתאם לרגש המטרה שנבחר',
  },
  {
    id: '2',
    headline: 'מה שאחרים מבטיחים, אנחנו עושים',
    bodyText: 'למעלה מ-20 שנות ניסיון בשירות הקהילה. ההבדל מורגש בכל פרט.',
    cta: 'התקשרו עכשיו',
    imageUrl: '',
    visualLogic: 'טיפוגרפיה קלאסית עם ניגודיות חזקה לביטוי יציבות ואמינות',
  },
  {
    id: '3',
    headline: 'בשעה טובה, הגענו אליכם',
    bodyText: 'מוצר חדש שמשנה את הכללים. פשוט, נוח, ומדויק בדיוק בשבילכם.',
    cta: 'הזמינו היום',
    imageUrl: '',
    visualLogic: 'עיצוב חם ומזמין עם שפה היימישית שמתחברת לקהל היעד',
  },
];

const StepCreativeResults = ({ creatives }: Props) => {
  const displayCreatives = creatives.length > 0 ? creatives : PLACEHOLDER_CREATIVES;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-rubik font-bold text-foreground">תוצרים קריאטיביים</h2>
        <p className="text-muted-foreground mt-2">3 אופציות מוכנות לבחירתכם</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayCreatives.map((creative, index) => (
          <div
            key={creative.id}
            className="group relative bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            {/* Image Area */}
            <div className="h-48 bg-gradient-to-br from-primary/10 via-muted to-primary/5 flex items-center justify-center">
              {creative.imageUrl ? (
                <img src={creative.imageUrl} alt={creative.headline} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Sparkles className="w-8 h-8" />
                  <span className="text-xs">אופציה {index + 1}</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-5 space-y-3">
              <h3 className="text-lg font-bold font-rubik text-foreground leading-tight">
                {creative.headline}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{creative.bodyText}</p>
              <div className="pt-2">
                <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">
                  {creative.cta}
                </Badge>
              </div>
            </div>

            {/* Visual Logic Tooltip */}
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default StepCreativeResults;
