import { WizardData } from '@/types/wizard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowRight } from 'lucide-react';

interface StepBriefProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const StepBrief = ({ data, updateData, onNext, onPrev }: StepBriefProps) => {
  const isValid = data.businessName && data.whatYouSell && data.targetAudience && data.activityArea;

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-foreground">ספר לנו על העסק</h1>
        <p className="text-lg text-muted-foreground">
          המידע הזה יעזור לנו ליצור קמפיינים מדויקים
        </p>
      </div>

      <div className="space-y-6 bg-card p-6 rounded-xl border border-border">
        <div className="space-y-2">
          <Label htmlFor="businessName" className="text-foreground">שם העסק</Label>
          <Input
            id="businessName"
            placeholder="לדוגמה: מסעדת השף"
            value={data.businessName}
            onChange={(e) => updateData({ businessName: e.target.value })}
            className="text-right"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatYouSell" className="text-foreground">מה אתה מוכר?</Label>
          <Textarea
            id="whatYouSell"
            placeholder="תאר את המוצרים או השירותים שלך..."
            value={data.whatYouSell}
            onChange={(e) => updateData({ whatYouSell: e.target.value })}
            className="text-right min-h-24"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetAudience" className="text-foreground">קהל היעד שלך</Label>
          <Textarea
            id="targetAudience"
            placeholder="מי הלקוחות האידיאליים שלך? גיל, מיקום, תחומי עניין..."
            value={data.targetAudience}
            onChange={(e) => updateData({ targetAudience: e.target.value })}
            className="text-right min-h-24"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="activityArea" className="text-foreground">אזור פעילות</Label>
          <Input
            id="activityArea"
            placeholder="לדוגמה: תל אביב והמרכז, כל הארץ..."
            value={data.activityArea}
            onChange={(e) => updateData({ activityArea: e.target.value })}
            className="text-right"
          />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button 
          variant="gradient" 
          size="lg"
          onClick={onNext}
          disabled={!isValid}
        >
          המשך
        </Button>
        <Button 
          variant="ghost" 
          size="lg"
          onClick={onPrev}
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          חזור
        </Button>
      </div>
    </div>
  );
};

export default StepBrief;
