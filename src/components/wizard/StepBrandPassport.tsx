import { WizardData } from '@/types/wizard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, ArrowRight, Palette, Type, Image, Target, CalendarDays, Layers, Zap, Anchor } from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';

interface StepBrandPassportProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  onComplete: () => void;
  onPrev: () => void;
}

const StepBrandPassport = ({ data, updateData, onComplete, onPrev }: StepBrandPassportProps) => {
  const handleConfirm = () => {
    updateData({ confirmed: true });
    toast.success('בשעה טובה! זה הולך להיות גישמאק!');
    onComplete();
  };

  const { strategy } = data;

  const getDurationText = () => {
    if (!strategy.startDate || !strategy.endDate) return null;
    const days = differenceInDays(strategy.endDate, strategy.startDate);
    if (days === 0) return 'יום אחד';
    if (days === 1) return 'יומיים';
    if (days < 7) return `${days + 1} ימים`;
    if (days < 14) return 'שבוע וקצת';
    if (days < 21) return 'שבועיים וקצת';
    if (days < 30) return 'כשלושה שבועות';
    return 'חודש ומעלה';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-3xl font-bold text-foreground">
          אז בוא נראה אם הבנו אתכם נכון
        </h2>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          הנה ה"דרכון" של המותג והקמפיין שלכם - בדקו שהכל מדויק
        </p>
      </div>

      {/* Brand Passport Card */}
      <div className="max-w-2xl mx-auto">
        <Card className="border-2 border-primary/20 overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-l from-primary to-primary/80 p-6 text-primary-foreground">
            <div className="flex items-center justify-between">
              <div>
                <Badge variant="secondary" className="bg-white/20 text-white border-0 mb-2">
                  דרכון מותג + קמפיין
                </Badge>
                <h3 className="text-2xl font-bold">{data.brand.name || 'שם העסק'}</h3>
              </div>
              {data.brand.logo && (
                <div className="w-16 h-16 rounded-xl bg-white p-2 flex items-center justify-center">
                  <img 
                    src={data.brand.logo} 
                    alt="Logo" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Brand Identity Section */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Colors */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" />
                  פלטת הצבעים
                </h4>
                <div className="flex gap-3">
                  <div className="text-center">
                    <div 
                      className="w-14 h-14 rounded-xl border-2 border-border shadow-sm"
                      style={{ backgroundColor: data.brand.colors.primary }}
                    />
                    <span className="text-xs text-muted-foreground mt-1 block">ראשי</span>
                  </div>
                  <div className="text-center">
                    <div 
                      className="w-14 h-14 rounded-xl border-2 border-border shadow-sm"
                      style={{ backgroundColor: data.brand.colors.secondary }}
                    />
                    <span className="text-xs text-muted-foreground mt-1 block">משני</span>
                  </div>
                  <div className="text-center">
                    <div 
                      className="w-14 h-14 rounded-xl border-2 border-border shadow-sm"
                      style={{ backgroundColor: data.brand.colors.background }}
                    />
                    <span className="text-xs text-muted-foreground mt-1 block">רקע</span>
                  </div>
                </div>
              </div>

              {/* Fonts */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Type className="w-4 h-4 text-primary" />
                  טיפוגרפיה
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                    <span className="text-sm text-muted-foreground">כותרות</span>
                    <span className="font-medium">{data.brand.headerFont}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                    <span className="text-sm text-muted-foreground">טקסט</span>
                    <span className="font-medium">{data.brand.bodyFont}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign Strategy Section */}
            <div className="pt-4 border-t border-border space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                תוכנית הקמפיין
              </h4>
              
              <div className="grid md:grid-cols-3 gap-4">
                {/* Design Direction */}
                <div className="p-3 rounded-lg bg-secondary/50 text-center">
                  <div className="w-10 h-10 mx-auto rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    {strategy.designDirection === 'consistent' ? (
                      <Anchor className="w-5 h-5 text-primary" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">כיוון עיצובי</p>
                  <p className="font-medium text-sm">
                    {strategy.designDirection === 'consistent' ? 'הקו המוכר' : 'רענון'}
                  </p>
                </div>

                {/* Duration */}
                <div className="p-3 rounded-lg bg-secondary/50 text-center">
                  <div className="w-10 h-10 mx-auto rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <CalendarDays className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">משך הקמפיין</p>
                  <p className="font-medium text-sm">{getDurationText() || '-'}</p>
                  {strategy.startDate && strategy.endDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(strategy.startDate, 'dd/MM', { locale: he })} - {format(strategy.endDate, 'dd/MM', { locale: he })}
                    </p>
                  )}
                </div>

                {/* Structure */}
                <div className="p-3 rounded-lg bg-secondary/50 text-center">
                  <div className="w-10 h-10 mx-auto rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    {strategy.structure === 'single' ? (
                      <Zap className="w-5 h-5 text-primary" />
                    ) : (
                      <Layers className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">מבנה</p>
                  <p className="font-medium text-sm">
                    {strategy.structure === 'single' ? 'זבנג וגמרנו' : 'סדרה'}
                  </p>
                </div>
              </div>
            </div>

            {/* Past Materials */}
            {data.pastMaterials.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Image className="w-4 h-4 text-primary" />
                  חומרים קודמים ({data.pastMaterials.length})
                </h4>
                <div className="flex gap-2 flex-wrap">
                  {data.pastMaterials.slice(0, 4).map((material) => (
                    <div 
                      key={material.id}
                      className="w-16 h-16 rounded-lg overflow-hidden border border-border"
                    >
                      {material.type === 'image' ? (
                        <img 
                          src={material.preview} 
                          alt={material.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-secondary flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">PDF</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {data.pastMaterials.length > 4 && (
                    <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center">
                      <span className="text-sm text-muted-foreground">
                        +{data.pastMaterials.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Summary Stats */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-center gap-4 flex-wrap text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Check className="w-4 h-4 text-green-500" />
                  זהות מותגית
                </div>
                <div className="flex items-center gap-1">
                  <Check className="w-4 h-4 text-green-500" />
                  פלטת צבעים
                </div>
                <div className="flex items-center gap-1">
                  <Check className="w-4 h-4 text-green-500" />
                  אסטרטגיה
                </div>
                <div className="flex items-center gap-1">
                  <Check className="w-4 h-4 text-green-500" />
                  תזמון
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex justify-between max-w-2xl mx-auto pt-6">
        <Button variant="outline" size="lg" onClick={onPrev}>
          <ArrowRight className="w-4 h-4 ml-2" />
          חזרה
        </Button>
        <Button variant="gradient" size="xl" onClick={handleConfirm} className="gap-2">
          <Check className="w-5 h-5" />
          בול! אפשר להתקדם
        </Button>
      </div>
    </div>
  );
};

export default StepBrandPassport;
