import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Newspaper, Palette, ArrowLeft, Zap, Sparkles } from 'lucide-react';
import { HonorificType } from '@/types/wizard';

interface StepFlowChoiceProps {
  userName?: string;
  brandName?: string;
  honorific: HonorificType;
  onChooseMedia: () => void;
  onChooseCampaign: () => void;
  onPrev?: () => void;
}

const StepFlowChoice = ({ 
  userName, 
  brandName, 
  honorific, 
  onChooseMedia, 
  onChooseCampaign,
  onPrev 
}: StepFlowChoiceProps) => {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center space-y-6">
        <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30 flex items-center justify-center">
          <Zap className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
          מה נעשה היום{userName ? `, ${userName}` : ''}?
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto">
          {brandName ? `נתחיל עם ${brandName} - ` : ''}בחר את המסלול המתאים
        </p>
      </div>

      {/* Choice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Option A: Full Campaign Creation */}
        <Card 
          className="border-3 border-primary/30 hover:border-primary cursor-pointer transition-all hover:shadow-2xl group hover:scale-[1.02]"
          onClick={onChooseCampaign}
        >
          <CardContent className="p-10 text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Palette className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">
              יצירת קמפיין מלא
            </h3>
            <p className="text-muted-foreground text-base leading-relaxed">
              נלמד על העסק, נבנה אסטרטגיה, ניצור קריאייטיב ונבחר מדיה מתאימה
            </p>
            <div className="pt-4">
              <span className="inline-flex items-center gap-2 text-violet-600 text-lg font-bold bg-violet-100 px-4 py-2 rounded-full">
                <Sparkles className="w-5 h-5" />
                מומלץ למותגים חדשים
                <ArrowLeft className="w-5 h-5" />
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Option B: Media Only */}
        <Card 
          className="border-2 border-muted hover:border-amber-500/50 cursor-pointer transition-all hover:shadow-xl group hover:scale-[1.02]"
          onClick={onChooseMedia}
        >
          <CardContent className="p-10 text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Newspaper className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">
              רכישת מדיה בלבד
            </h3>
            <p className="text-muted-foreground text-base leading-relaxed">
              יש לי חומרים מוכנים, רק רוצה לבחור איפה לפרסם ולהגדיר תקציב
            </p>
            <div className="pt-4">
              <span className="inline-flex items-center gap-2 text-amber-600 text-base font-medium bg-amber-100 px-4 py-2 rounded-full">
                ⚡ מהיר ויעיל
                <ArrowLeft className="w-5 h-5" />
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Back button */}
      {onPrev && (
        <div className="text-center pt-6">
          <Button
            onClick={onPrev}
            variant="outline"
            size="lg"
            className="text-lg gap-2 px-8 h-14"
          >
            ← חזרה לשלב הקודם
          </Button>
        </div>
      )}

      {/* Trust Note */}
      <p className="text-center text-base text-muted-foreground">
        💡 תמיד אפשר לחזור ולשנות - המערכת שומרת את כל הנתונים שלך
      </p>
    </div>
  );
};

export default StepFlowChoice;
