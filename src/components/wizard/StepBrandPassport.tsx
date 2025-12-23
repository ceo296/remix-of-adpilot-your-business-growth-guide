import { useState } from 'react';
import { WizardData } from '@/types/wizard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Check, Sparkles, ArrowRight, Palette, Type, Image, Target, Layers, Zap, Anchor, Loader2, Building2, Users, Award, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface StepBrandPassportProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  onComplete: () => void;
  onPrev: () => void;
}

const StepBrandPassport = ({ data, updateData, onComplete, onPrev }: StepBrandPassportProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editMode, setEditMode] = useState<'fonts' | 'business' | null>(null);
  
  // Editable local state
  const [editedFonts, setEditedFonts] = useState({
    headerFont: data.brand.headerFont,
    bodyFont: data.brand.bodyFont,
  });
  const [editedBusiness, setEditedBusiness] = useState({
    industry: data.websiteInsights?.industry || '',
    seniority: data.websiteInsights?.seniority || '',
    audience: data.websiteInsights?.audience || '',
    coreOffering: data.websiteInsights?.coreOffering || '',
  });

  const handleSaveFonts = () => {
    updateData({
      brand: {
        ...data.brand,
        headerFont: editedFonts.headerFont,
        bodyFont: editedFonts.bodyFont,
      }
    });
    setEditMode(null);
    toast.success('הפונטים עודכנו');
  };

  const handleSaveBusiness = () => {
    updateData({
      websiteInsights: {
        ...data.websiteInsights,
        ...editedBusiness,
      }
    });
    setEditMode(null);
    toast.success('פרטי העסק עודכנו');
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('יש להתחבר כדי לשמור את הפרופיל');
        setIsSubmitting(false);
        return;
      }

      // Prepare competitor positions as JSON
      const competitorPositions = data.strategicMRI.competitorPositions.map(cp => ({
        id: cp.id,
        name: cp.name,
        x: cp.x,
        y: cp.y,
      }));

      // Save client profile
      const { error } = await supabase.from('client_profiles').upsert({
        user_id: user.id,
        business_name: data.brand.name || 'עסק ללא שם',
        website_url: data.websiteUrl || null,
        primary_color: data.brand.colors.primary,
        secondary_color: data.brand.colors.secondary,
        background_color: data.brand.colors.background,
        header_font: data.brand.headerFont,
        body_font: data.brand.bodyFont,
        x_factors: data.strategicMRI.xFactors,
        primary_x_factor: data.strategicMRI.primaryXFactor,
        advantage_type: data.strategicMRI.advantageType,
        advantage_slider: data.strategicMRI.advantageSlider,
        winning_feature: data.strategicMRI.winningFeature || null,
        competitors: data.strategicMRI.competitors,
        my_position_x: data.strategicMRI.myPosition.x,
        my_position_y: data.strategicMRI.myPosition.y,
        competitor_positions: competitorPositions,
        end_consumer: data.strategicMRI.endConsumer || null,
        decision_maker: data.strategicMRI.decisionMaker || null,
        onboarding_completed: true,
      }, {
        onConflict: 'user_id',
      });

      if (error) throw error;

      updateData({ confirmed: true });
      toast.success('בשעה טובה! הפרופיל נשמר בהצלחה!');
      onComplete();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error(error.message || 'שגיאה בשמירת הפרופיל');
    } finally {
      setIsSubmitting(false);
    }
  };

  const { strategy, websiteInsights } = data;

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
                <h4 className="font-semibold text-foreground flex items-center gap-2 justify-between">
                  <span className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-primary" />
                    טיפוגרפיה
                  </span>
                  {editMode === 'fonts' ? (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditMode(null)}>
                        <X className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-green-600" onClick={handleSaveFonts}>
                        <Check className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditMode('fonts')}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                  )}
                </h4>
                {editMode === 'fonts' ? (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">פונט כותרות</label>
                      <Input
                        value={editedFonts.headerFont}
                        onChange={(e) => setEditedFonts(prev => ({ ...prev, headerFont: e.target.value }))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">פונט טקסט</label>
                      <Input
                        value={editedFonts.bodyFont}
                        onChange={(e) => setEditedFonts(prev => ({ ...prev, bodyFont: e.target.value }))}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                ) : (
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
                )}
              </div>
            </div>

            {/* Business Insights Section */}
            {websiteInsights && (
              <div className="pt-4 border-t border-border space-y-4">
                <h4 className="font-semibold text-foreground flex items-center gap-2 justify-between">
                  <span className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    אודות העסק
                  </span>
                  {editMode === 'business' ? (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditMode(null)}>
                        <X className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-green-600" onClick={handleSaveBusiness}>
                        <Check className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditMode('business')}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                  )}
                </h4>
                {editMode === 'business' ? (
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">תחום פעילות</label>
                      <Input
                        value={editedBusiness.industry}
                        onChange={(e) => setEditedBusiness(prev => ({ ...prev, industry: e.target.value }))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">ותק בשוק</label>
                      <Input
                        value={editedBusiness.seniority}
                        onChange={(e) => setEditedBusiness(prev => ({ ...prev, seniority: e.target.value }))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">קהל יעד</label>
                      <Input
                        value={editedBusiness.audience}
                        onChange={(e) => setEditedBusiness(prev => ({ ...prev, audience: e.target.value }))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">הצעת הערך</label>
                      <Input
                        value={editedBusiness.coreOffering}
                        onChange={(e) => setEditedBusiness(prev => ({ ...prev, coreOffering: e.target.value }))}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-3">
                    {websiteInsights.industry && (
                      <div className="p-3 rounded-lg bg-secondary/50">
                        <p className="text-xs text-muted-foreground mb-1">תחום פעילות</p>
                        <p className="font-medium text-sm">{websiteInsights.industry}</p>
                      </div>
                    )}
                    {websiteInsights.seniority && (
                      <div className="p-3 rounded-lg bg-secondary/50">
                        <p className="text-xs text-muted-foreground mb-1">ותק בשוק</p>
                        <p className="font-medium text-sm">{websiteInsights.seniority}</p>
                      </div>
                    )}
                    {websiteInsights.audience && (
                      <div className="p-3 rounded-lg bg-secondary/50">
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          קהל יעד
                        </p>
                        <p className="font-medium text-sm">{websiteInsights.audience}</p>
                      </div>
                    )}
                    {websiteInsights.coreOffering && (
                      <div className="p-3 rounded-lg bg-secondary/50">
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          הצעת הערך
                        </p>
                        <p className="font-medium text-sm">{websiteInsights.coreOffering}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Campaign Strategy Section */}
            <div className="pt-4 border-t border-border space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                תוכנית הקמפיין
              </h4>
              
              <div className="grid md:grid-cols-2 gap-4">
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
                    {strategy.structure === 'single' ? 'פרסום נקודתי' : 'סדרה'}
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
        <Button variant="outline" size="lg" onClick={onPrev} disabled={isSubmitting}>
          <ArrowRight className="w-4 h-4 ml-2" />
          חזרה
        </Button>
        <Button variant="gradient" size="xl" onClick={handleConfirm} disabled={isSubmitting} className="gap-2">
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              שומר...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              בול! אפשר להתקדם
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default StepBrandPassport;
