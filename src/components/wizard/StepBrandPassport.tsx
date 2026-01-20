import { useState, useEffect } from 'react';
import { WizardData } from '@/types/wizard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Check, Sparkles, ArrowRight, Palette, Type, Image, Target, Layers, Zap, Anchor, Loader2, Building2, Users, Award, Pencil, X, Heart, Package, Trophy, Tag, FileText, AlertTriangle, Lightbulb, Bot, RefreshCw, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getYourWord } from '@/lib/honorific-utils';

interface ValidationIssue {
  type: 'warning' | 'suggestion';
  category: 'inconsistency' | 'sparse_data' | 'improvement';
  message: string;
  field?: string;
}

interface StepBrandPassportProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  onComplete: () => void;
  onPrev: () => void;
}

const StepBrandPassport = ({ data, updateData, onComplete, onPrev }: StepBrandPassportProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtractingColors, setIsExtractingColors] = useState(false);
  const [editMode, setEditMode] = useState<'fonts' | 'business' | null>(null);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [hasValidated, setHasValidated] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editFieldValue, setEditFieldValue] = useState('');
  
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

  // Run validation on mount
  useEffect(() => {
    if (!hasValidated) {
      runValidation();
    }
  }, []);

  const runValidation = async () => {
    setIsValidating(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('validate-brand-passport', {
        body: {
          businessName: data.brand.name,
          industry: data.websiteInsights?.industry || '',
          seniority: data.websiteInsights?.seniority || '',
          audience: data.websiteInsights?.audience || '',
          coreOffering: data.websiteInsights?.coreOffering || '',
          xFactors: data.strategicMRI.xFactors,
          primaryXFactor: data.strategicMRI.primaryXFactor,
          otherXFactor: data.strategicMRI.otherXFactor || '',
          advantageType: data.strategicMRI.advantageType,
          pricePosition: data.strategicMRI.myPosition.x,
          stylePosition: data.strategicMRI.myPosition.y,
          competitors: data.strategicMRI.competitors,
          noCompetitors: data.strategicMRI.noCompetitors,
          endConsumer: data.strategicMRI.endConsumer || '',
          decisionMaker: data.strategicMRI.decisionMaker || '',
        },
      });

      if (error) {
        console.error('Validation error:', error);
      } else if (result?.issues) {
        setValidationIssues(result.issues);
      }
    } catch (e) {
      console.error('Failed to validate:', e);
    } finally {
      setIsValidating(false);
      setHasValidated(true);
    }
  };

  const handleExtractColorsFromLogo = async () => {
    const logoUrl = data.brand.logo;
    if (!logoUrl) {
      toast.error('אין לוגו בפרופיל');
      return;
    }

    if (logoUrl.toLowerCase().endsWith('.pdf')) {
      toast.error('לא ניתן לחלץ צבעים מקובץ PDF. נא להעלות לוגו כתמונה.');
      return;
    }

    setIsExtractingColors(true);
    toast.loading('מנתח צבעים מהלוגו...', { id: 'passport-color-extract' });

    try {
      const { data: result, error } = await supabase.functions.invoke('extract-logo-colors', {
        body: { imageUrl: logoUrl },
      });

      if (error) throw error;

      const colors = result?.colors as { primary: string; secondary: string; background: string } | undefined;
      if (!colors?.primary || !colors?.secondary || !colors?.background) {
        throw new Error('לא התקבלו צבעים מהניתוח');
      }

      updateData({
        brand: {
          ...data.brand,
          colors: {
            primary: colors.primary,
            secondary: colors.secondary,
            background: colors.background,
          },
        },
      });

      toast.success('צבעי המותג עודכנו לפי הלוגו');
    } catch (e: any) {
      const msg = typeof e?.message === 'string' ? e.message : 'שגיאה בחילוץ צבעים מהלוגו';
      toast.error(msg);
    } finally {
      toast.dismiss('passport-color-extract');
      setIsExtractingColors(false);
    }
  };

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

  // Field label mapping for display
  const fieldLabels: Record<string, string> = {
    'תחום פעילות': 'תחום פעילות',
    'מתחרים': 'מתחרים',
    'גורם מבדל עיקרי': 'גורם מבדל עיקרי',
    'מקבל ההחלטות': 'מקבל ההחלטות',
    'שם העסק': 'שם העסק',
    'מיקום מחיר/סגנון': 'מיקום מחיר/סגנון',
  };

  const getFieldValue = (field: string): string => {
    switch (field) {
      case 'תחום פעילות':
        return data.websiteInsights?.industry || '';
      case 'מתחרים':
        return data.strategicMRI.competitors.join(', ');
      case 'גורם מבדל עיקרי':
        if (data.strategicMRI.primaryXFactor === 'veteran') return 'הוותק והניסיון';
        if (data.strategicMRI.primaryXFactor === 'product') return 'עליונות מוצרית';
        if (data.strategicMRI.primaryXFactor === 'price') return 'המחיר';
        if (data.strategicMRI.primaryXFactor === 'service') return 'השירות והיחס';
        if (data.strategicMRI.primaryXFactor === 'brand') return 'הבטחה פרסומית';
        if (data.strategicMRI.primaryXFactor === 'other') return data.strategicMRI.otherXFactor || '';
        return '';
      case 'מקבל ההחלטות':
        return data.strategicMRI.decisionMaker || '';
      case 'שם העסק':
        return data.brand.name || '';
      default:
        return '';
    }
  };

  const handleOpenFieldEdit = (field: string) => {
    setEditingField(field);
    setEditFieldValue(getFieldValue(field));
  };

  const handleSaveFieldEdit = () => {
    if (!editingField) return;
    
    switch (editingField) {
      case 'תחום פעילות':
        updateData({
          websiteInsights: {
            ...data.websiteInsights,
            industry: editFieldValue,
          }
        });
        break;
      case 'מתחרים':
        updateData({
          strategicMRI: {
            ...data.strategicMRI,
            competitors: editFieldValue.split(',').map(c => c.trim()).filter(Boolean),
          }
        });
        break;
      case 'גורם מבדל עיקרי':
        // Store as otherXFactor (free text override) while keeping primaryXFactor unchanged
        updateData({
          strategicMRI: {
            ...data.strategicMRI,
            otherXFactor: editFieldValue,
          }
        });
        break;
      case 'מקבל ההחלטות':
        updateData({
          strategicMRI: {
            ...data.strategicMRI,
            decisionMaker: editFieldValue,
          }
        });
        break;
      case 'שם העסק':
        updateData({
          brand: {
            ...data.brand,
            name: editFieldValue,
          }
        });
        break;
    }
    
    setEditingField(null);
    setEditFieldValue('');
    toast.success('השדה עודכן בהצלחה');
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
          הנה ה"דרכון" של המותג והקמפיין {getYourWord(data.honorific)} - בדקו שהכל מדויק
        </p>
      </div>

      {/* AI Validation Section */}
      {(isValidating || validationIssues.length > 0) && (
        <div className="max-w-2xl mx-auto">
          <Card className={`border-2 overflow-hidden ${
            validationIssues.some(i => i.type === 'warning') 
              ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50' 
              : validationIssues.length > 0 
                ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50'
                : 'border-primary/20'
          }`}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isValidating 
                    ? 'bg-primary/20' 
                    : validationIssues.some(i => i.type === 'warning')
                      ? 'bg-amber-100'
                      : 'bg-blue-100'
                }`}>
                  {isValidating ? (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  ) : validationIssues.some(i => i.type === 'warning') ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  ) : (
                    <Lightbulb className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div>
                      <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Bot className="w-5 h-5 text-primary" />
                        {isValidating ? 'בודק את המידע...' : 'דברים שקפצו לנו'}
                      </h4>
                      {!isValidating && validationIssues.length > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          מומלץ לשים לב ולערוך, אבל לא חייבים
                        </p>
                      )}
                    </div>
                    {!isValidating && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-xs gap-1"
                        onClick={runValidation}
                      >
                        <RefreshCw className="w-3 h-3" />
                        בדוק שוב
                      </Button>
                    )}
                  </div>
                  
                  {isValidating ? (
                    <p className="text-sm text-muted-foreground">
                      המערכת מנתחת את המידע ומחפשת חוסרי התאמה או הזדמנויות לשיפור...
                    </p>
                  ) : validationIssues.length > 0 ? (
                    <div className="space-y-2">
                      {validationIssues.map((issue, index) => (
                        <div 
                          key={index}
                          className={`p-3 rounded-lg text-sm cursor-pointer transition-all hover:shadow-md ${
                            issue.type === 'warning' 
                              ? 'bg-amber-100/50 border border-amber-200 hover:bg-amber-100' 
                              : 'bg-blue-100/50 border border-blue-200 hover:bg-blue-100'
                          }`}
                          onClick={() => issue.field && handleOpenFieldEdit(issue.field)}
                        >
                          <div className="flex items-start gap-2">
                            {issue.type === 'warning' ? (
                              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <Lightbulb className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <span className={issue.type === 'warning' ? 'text-amber-800' : 'text-blue-800'}>
                                {issue.message}
                              </span>
                              {issue.field && (
                                <Badge 
                                  variant="secondary" 
                                  className="mr-2 text-xs cursor-pointer hover:bg-secondary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenFieldEdit(issue.field!);
                                  }}
                                >
                                  <Pencil className="w-2 h-2 ml-1" />
                                  {issue.field}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-green-700 flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      הכל נראה תקין! לא נמצאו בעיות או חוסרי התאמה.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                  {data.brand.logo.toLowerCase().endsWith('.pdf') ? (
                    <FileText className="w-8 h-8 text-primary" />
                  ) : (
                    <img 
                      src={data.brand.logo} 
                      alt="Logo" 
                      className="max-w-full max-h-full object-contain"
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Brand Identity Section */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Colors */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground flex items-center gap-2 justify-between">
                  <span className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-primary" />
                    פלטת הצבעים
                  </span>
                  {data.brand.logo && !data.brand.logo.toLowerCase().endsWith('.pdf') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs gap-1"
                      onClick={handleExtractColorsFromLogo}
                      disabled={isExtractingColors}
                    >
                      {isExtractingColors ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      חלץ מהלוגו
                    </Button>
                  )}
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

            {/* Strategic Positioning Section */}
            <div className="pt-4 border-t border-border space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                מיצוב אסטרטגי
              </h4>
              
              <div className="grid md:grid-cols-2 gap-3">
                {/* Advantage Type */}
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    {data.strategicMRI.advantageType === 'hard' ? (
                      <Package className="w-3 h-3" />
                    ) : (
                      <Heart className="w-3 h-3" />
                    )}
                    סוג היתרון
                  </p>
                  <p className="font-medium text-sm">
                    {data.strategicMRI.advantageType === 'hard' ? 'יתרון פיזי מובהק' : 'יתרון תדמיתי/רגשי'}
                  </p>
                </div>

                {/* Primary X-Factor */}
                {data.strategicMRI.primaryXFactor && (
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      הגורם המבדל העיקרי
                    </p>
                    <p className="font-medium text-sm">
                      {data.strategicMRI.primaryXFactor === 'veteran' && 'הוותק והניסיון'}
                      {data.strategicMRI.primaryXFactor === 'product' && 'עליונות מוצרית'}
                      {data.strategicMRI.primaryXFactor === 'price' && 'המחיר'}
                      {data.strategicMRI.primaryXFactor === 'service' && 'השירות והיחס'}
                      {data.strategicMRI.primaryXFactor === 'brand' && 'הבטחה פרסומית'}
                    </p>
                  </div>
                )}

                {/* Price Positioning */}
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    מיצוב מחיר
                  </p>
                  <p className="font-medium text-sm">
                    {data.strategicMRI.myPosition.x < -30 ? 'זול / משתלם' : 
                     data.strategicMRI.myPosition.x > 30 ? 'פרימיום / יוקרה' : 'מחיר ביניים'}
                  </p>
                </div>

                {/* Style Positioning */}
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    סגנון
                  </p>
                  <p className="font-medium text-sm">
                    {data.strategicMRI.myPosition.y < -30 ? 'קלאסי ומסורתי' : 
                     data.strategicMRI.myPosition.y > 30 ? 'מודרני וחדשני' : 'מאוזן'}
                  </p>
                </div>

                {/* Winning Feature - if exists */}
                {data.strategicMRI.winningFeature && (
                  <div className="p-3 rounded-lg bg-secondary/50 md:col-span-2">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      הפיצ'ר המנצח
                    </p>
                    <p className="font-medium text-sm">{data.strategicMRI.winningFeature}</p>
                  </div>
                )}
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

      {/* Field Edit Dialog */}
      <Dialog open={!!editingField} onOpenChange={(open) => !open && setEditingField(null)}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">עריכת {editingField}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              ערוך את השדה ולחץ שמור. השינוי יעודכן מיד בדרכון המותג.
            </p>
            {editingField === 'מתחרים' ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">מתחרים (מופרדים בפסיקים)</label>
                <Textarea
                  value={editFieldValue}
                  onChange={(e) => setEditFieldValue(e.target.value)}
                  placeholder="למשל: חברה א, חברה ב, חברה ג"
                  className="min-h-[100px]"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">{editingField}</label>
                <Input
                  value={editFieldValue}
                  onChange={(e) => setEditFieldValue(e.target.value)}
                  className="text-base"
                />
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditingField(null)}>
              ביטול
            </Button>
            <Button onClick={handleSaveFieldEdit}>
              <Check className="w-4 h-4 ml-2" />
              שמור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StepBrandPassport;
