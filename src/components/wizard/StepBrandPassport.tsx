import { WizardData } from '@/types/wizard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, ArrowRight, Building2, Palette, Type, Image } from 'lucide-react';
import { toast } from 'sonner';

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
          הנה ה"דרכון" של המותג שלכם - בדקו שהכל מדויק
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
                  דרכון מותג
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
              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
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
                  טיפוגרפיה
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
