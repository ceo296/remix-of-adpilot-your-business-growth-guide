import { WizardData, MEDIA_CATALOG, CreativeVibe, CampaignGoal } from '@/types/wizard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, CheckCircle, Sparkles, Users, Palette, Newspaper, Send, Zap, Crown, Heart } from 'lucide-react';
import { toast } from 'sonner';

interface StepSummaryProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  onComplete: () => void;
  onPrev: () => void;
}

const vibeLabels: Record<CreativeVibe, { label: string; tag: string; icon: React.ReactNode; color: string }> = {
  aggressive: { label: 'צועק ומכירתי', tag: 'STYLE_AGGRESSIVE', icon: <Zap className="w-5 h-5" />, color: 'bg-primary' },
  prestige: { label: 'יוקרתי ונקי', tag: 'STYLE_PRESTIGE', icon: <Crown className="w-5 h-5" />, color: 'bg-foreground' },
  heimish: { label: 'היימיש ומחבר', tag: 'STYLE_HEIMISH', icon: <Heart className="w-5 h-5" />, color: 'bg-orange-400' },
};

const goalLabels: Record<CampaignGoal, string> = {
  sale: 'מבצע / חיסול',
  branding: 'מיתוג יוקרתי',
  launch: 'השקה חדשה',
  event: 'אירוע / כנס',
};

const sectorLabels: Record<string, string> = {
  litvish: 'ליטאי',
  chassidish: 'חסידי',
  sefardi: 'ספרדי-חרדי',
  modern: 'חרדי-מודרני',
  general: 'כללי',
};

const StepSummary = ({ data, updateData, onComplete, onPrev }: StepSummaryProps) => {
  const selectedMediaNames = MEDIA_CATALOG
    .filter(m => data.selectedMedia.includes(m.id))
    .map(m => m.name);

  const vibeInfo = data.creativeVibe ? vibeLabels[data.creativeVibe] : null;

  const handleSubmit = () => {
    if (!data.contactName || !data.contactPhone) {
      toast.error('אוי, חסרים פרטים. נא למלא שם וטלפון');
      return;
    }
    
    toast.success('בשעה טובה! זה הולך להיות גישמאק 🎉');
    onComplete();
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success text-sm font-medium">
          <CheckCircle className="w-4 h-4" />
          שלב 4 מתוך 4 – כמעט סיימנו!
        </div>
        <h1 className="text-3xl font-bold text-foreground">בשעה טובה!</h1>
        <p className="text-lg text-muted-foreground">
          הנה הבריף שלך – הכל מוכן לייצור בעזה״י
        </p>
      </div>

      {/* Campaign Brief Card */}
      <div className="bg-gradient-to-br from-primary/5 via-card to-primary/5 rounded-2xl border-2 border-primary/20 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-primary p-6 text-primary-foreground">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6" />
            <span className="text-sm font-medium opacity-90">בריף קמפיין | בס״ד</span>
          </div>
          <h2 className="text-2xl font-bold">
            {data.mainOffer || 'קמפיין חדש'}
          </h2>
        </div>

        {/* Brief Content */}
        <div className="p-6 space-y-6">
          {/* Vibe Badge */}
          {vibeInfo && (
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl ${vibeInfo.color} flex items-center justify-center text-primary-foreground`}>
                {vibeInfo.icon}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">סגנון הקריאייטיב</p>
                <p className="text-xl font-bold text-foreground">{vibeInfo.label}</p>
                <code className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                  TAG: {vibeInfo.tag}
                </code>
              </div>
            </div>
          )}

          <div className="h-px bg-border" />

          {/* Summary Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Target Audience */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4" />
                <span className="text-sm">קהל יעד</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.sectors.map(sector => (
                  <span key={sector} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    {sectorLabels[sector]}
                  </span>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                אזורים: {data.regions.join(', ')}
              </p>
            </div>

            {/* Campaign Goal */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Palette className="w-4 h-4" />
                <span className="text-sm">מטרת הקמפיין</span>
              </div>
              <p className="text-lg font-semibold text-foreground">
                {data.campaignGoal ? goalLabels[data.campaignGoal] : '-'}
              </p>
            </div>

            {/* Selected Media */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Newspaper className="w-4 h-4" />
                <span className="text-sm">ערוצי פרסום נבחרים</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedMediaNames.map(name => (
                  <span key={name} className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm font-medium text-foreground">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">פרטים ליצירת קשר (שנדע למי להתקשר 📞)</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contactName">שם מלא</Label>
            <Input
              id="contactName"
              placeholder="ישראל ישראלי"
              value={data.contactName}
              onChange={(e) => updateData({ contactName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPhone">טלפון</Label>
            <Input
              id="contactPhone"
              placeholder="050-0000000"
              value={data.contactPhone}
              onChange={(e) => updateData({ contactPhone: e.target.value })}
              dir="ltr"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button 
          variant="gradient" 
          size="xl"
          onClick={handleSubmit}
          className="gap-2"
        >
          <Send className="w-5 h-5" />
          שגר את הקמפיין!
        </Button>
        <Button 
          variant="ghost" 
          size="lg"
          onClick={onPrev}
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          רגע, חזרה
        </Button>
      </div>
    </div>
  );
};

export default StepSummary;
