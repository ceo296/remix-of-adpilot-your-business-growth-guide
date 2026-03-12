import { useState, useEffect } from 'react';
import { WizardData, WizardDataUpdate } from '@/types/wizard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Check, Sparkles, ArrowRight, Palette, Type, Image, Target, Layers, Zap, Anchor, Loader2, Building2, Users, Award, Pencil, X, Heart, Package, Trophy, Tag, FileText, AlertTriangle, Lightbulb, Bot, RefreshCw, ArrowLeft, Camera, Plus } from 'lucide-react';
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
  updateData: (data: WizardDataUpdate) => void;
  onComplete: () => void;
  onPrev: () => void;
}

const StepBrandPassport = ({ data, updateData, onComplete, onPrev }: StepBrandPassportProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtractingColors, setIsExtractingColors] = useState(false);
  const [editMode, setEditMode] = useState<'fonts' | 'business' | 'colors' | null>(null);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [hasValidated, setHasValidated] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editFieldValue, setEditFieldValue] = useState('');
  const [newService, setNewService] = useState('');
  
  // Editable local state
  const [editedFonts, setEditedFonts] = useState({
    headerFont: data.brand.headerFont,
    bodyFont: data.brand.bodyFont,
  });
  const [editedColors, setEditedColors] = useState({
    primary: data.brand.colors.primary,
    secondary: data.brand.colors.secondary,
    background: data.brand.colors.background,
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

  // Sync edited colors when data changes (e.g. from DB load)
  useEffect(() => {
    setEditedColors({
      primary: data.brand.colors.primary,
      secondary: data.brand.colors.secondary,
      background: data.brand.colors.background,
    });
  }, [data.brand.colors.primary, data.brand.colors.secondary, data.brand.colors.background]);

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
          xFactorDetails: data.strategicMRI.xFactorDetails || {},
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

    setIsExtractingColors(true);
    toast.loading('מנתח צבעים מהלוגו...', { id: 'passport-color-extract' });

    try {
      // Send as imageUrl for storage URLs, or imageBase64 for data URLs
      const isBase64 = logoUrl.startsWith('data:');
      const { data: result, error } = await supabase.functions.invoke('extract-logo-colors', {
        body: isBase64 ? { imageBase64: logoUrl } : { imageUrl: logoUrl },
      });

      if (error) throw error;

      const colors = result?.colors as { primary: string; secondary: string; background: string } | undefined;
      if (!colors?.primary || !colors?.secondary || !colors?.background) {
        throw new Error('לא התקבלו צבעים מהניתוח');
      }

      updateData({
        brand: {
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
        headerFont: editedFonts.headerFont,
        bodyFont: editedFonts.bodyFont,
      }
    });
    setEditMode(null);
    toast.success('הפונטים עודכנו');
  };

  const handleSaveColors = () => {
    updateData({
      brand: {
        colors: {
          primary: editedColors.primary,
          secondary: editedColors.secondary,
          background: editedColors.background,
        },
      }
    });
    setEditMode(null);
    toast.success('הצבעים עודכנו');
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
      case 'שם העסק':
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

  // Helper for brand presence label
  const getBrandPresenceLabel = () => {
    switch (data.strategicMRI.brandPresence) {
      case 'known': return 'מותג מוכר';
      case 'expert': return 'מומחה בתחום';
      case 'active': return 'שחקן פעיל';
      default: return '';
    }
  };

  const getAudienceToneLabel = () => {
    switch (data.strategicMRI.audienceTone) {
      case 'broad': return 'רחב - פשוט וברור';
      case 'premium': return 'פרימיום - יוקרתי';
      case 'b2b': return 'עסקי - מקצועי';
      default: return '';
    }
  };

  const getXFactorLabel = (factor: string) => {
    switch (factor) {
      case 'veteran': return 'ותק וניסיון';
      case 'product': return 'עליונות מוצרית';
      case 'price': return 'מחיר תחרותי';
      case 'service': return 'שירות ויחס';
      case 'brand': return 'הבטחה פרסומית';
      default: return factor;
    }
  };

  const getQualitySignatureLabel = (type: string) => {
    switch (type) {
      case 'experience': return 'שנות ניסיון';
      case 'technology': return 'טכנולוגיה';
      case 'service': return 'שירות';
      case 'trust': return 'אמון';
      case 'scale': return 'היקף';
      default: return type;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Layers className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-3xl font-bold text-foreground">
          תעודת הזהות שלכם
        </h2>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          הכל מתחיל פה. ככל שנקבל יותר מידע — ככה המודעות ייצאו יותר מדויקות ומקצועיות.
        </p>
      </div>

      {/* AI Validation Section - same as before */}
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
                  <div className="mb-3">
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

      {/* Full Identity Card */}
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ─── Card 1: Brand Identity (Logo, Colors, Fonts) ─── */}
        <Card className="border-2 border-primary/20 overflow-hidden">
          <div 
            className="p-6 text-white"
            style={{ 
              background: `linear-gradient(135deg, ${data.brand.colors.primary || 'hsl(var(--primary))'} 0%, ${data.brand.colors.secondary || data.brand.colors.primary || 'hsl(var(--primary))'} 100%)`
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <Badge variant="secondary" className="bg-white/20 text-white border-0 mb-2">
                  זהות מותגית
                </Badge>
                <h3 className="text-2xl font-bold">{data.brand.name || 'שם העסק'}</h3>
                {websiteInsights?.industry && (
                  <p className="text-white/80 text-sm mt-1">{websiteInsights.industry}</p>
                )}
              </div>
              {data.brand.logo && (
                <div className="w-20 h-20 rounded-xl bg-white p-2 flex items-center justify-center shadow-lg">
                  {data.brand.logo.startsWith('data:application/pdf') || data.brand.logo.toLowerCase().endsWith('.pdf') ? (
                    <FileText className="w-10 h-10 text-primary" />
                  ) : (
                    <img 
                      src={data.brand.logo} 
                      alt="Logo" 
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Colors & Fonts */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Colors */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground flex items-center gap-2 justify-between">
                  <span className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-primary" />
                    פלטת הצבעים
                  </span>
                  <div className="flex gap-1">
                    {editMode === 'colors' ? (
                      <>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditMode(null)}>
                          <X className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-green-600" onClick={handleSaveColors}>
                          <Check className="w-3 h-3" />
                        </Button>
                      </>
                    ) : (
                      <>
                        {data.brand.logo && !data.brand.logo.startsWith('data:application/pdf') && !data.brand.logo.toLowerCase().endsWith('.pdf') && (
                          <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={handleExtractColorsFromLogo} disabled={isExtractingColors}>
                            {isExtractingColors ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            חלץ מהלוגו
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditMode('colors')}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </h4>
                {editMode === 'colors' ? (
                  <div className="flex gap-3">
                    {(['primary', 'secondary', 'background'] as const).map((key) => (
                      <div key={key} className="text-center space-y-2">
                        <input type="color" value={editedColors[key]} onChange={(e) => setEditedColors(prev => ({ ...prev, [key]: e.target.value }))} className="w-14 h-14 rounded-xl border-2 border-border shadow-sm cursor-pointer" />
                        <span className="text-xs text-muted-foreground block">{key === 'primary' ? 'ראשי' : key === 'secondary' ? 'משני' : 'רקע'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-3">
                    {[
                      { color: data.brand.colors.primary, label: 'ראשי' },
                      { color: data.brand.colors.secondary, label: 'משני' },
                      { color: data.brand.colors.background, label: 'רקע' },
                    ].map((c) => (
                      <div key={c.label} className="text-center">
                        <div className="w-14 h-14 rounded-xl border-2 border-border shadow-sm" style={{ backgroundColor: c.color }} />
                        <span className="text-xs text-muted-foreground mt-1 block">{c.label}</span>
                      </div>
                    ))}
                  </div>
                )}
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
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditMode(null)}><X className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-green-600" onClick={handleSaveFonts}><Check className="w-3 h-3" /></Button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditMode('fonts')}><Pencil className="w-3 h-3" /></Button>
                  )}
                </h4>
                {editMode === 'fonts' ? (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">פונט כותרות</label>
                      <Input value={editedFonts.headerFont} onChange={(e) => setEditedFonts(prev => ({ ...prev, headerFont: e.target.value }))} className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">פונט טקסט</label>
                      <Input value={editedFonts.bodyFont} onChange={(e) => setEditedFonts(prev => ({ ...prev, bodyFont: e.target.value }))} className="h-8 text-sm" />
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
          </CardContent>
        </Card>

        {/* ─── Card 2: Services & Business Info ─── */}
        <Card className="border-2 border-border overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                השירותים שלכם
              </h3>
              <p className="text-sm text-white/80">מה אתם מציעים? זה ישפיע על הטקסטים במודעות ובמצגות.</p>
            </div>
            <CardContent className="p-6 space-y-4">
              {/* Services tags with editing */}
              <div className="space-y-3">
                {(websiteInsights?.services || []).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {(websiteInsights?.services || []).map((service, idx) => (
                      <Badge key={idx} variant="secondary" className="px-4 py-2 text-sm font-medium gap-2">
                        {service}
                        <button 
                          onClick={() => {
                            const updated = [...(data.websiteInsights?.services || [])];
                            updated.splice(idx, 1);
                            updateData({ websiteInsights: { ...data.websiteInsights, services: updated } });
                          }}
                          className="hover:text-destructive transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newService.trim()) {
                        updateData({ websiteInsights: { ...data.websiteInsights, services: [...(data.websiteInsights?.services || []), newService.trim()] } });
                        setNewService('');
                      }
                    }}
                    placeholder="הוסיפו שירות (לדוגמא: ייעוץ, עיצוב, הדרכה...)"
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => {
                      if (newService.trim()) {
                        updateData({ websiteInsights: { ...data.websiteInsights, services: [...(data.websiteInsights?.services || []), newService.trim()] } });
                        setNewService('');
                      }
                    }}
                    disabled={!newService.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Business details grid */}
              <div className="grid md:grid-cols-2 gap-3">
                {editMode === 'business' ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">תחום פעילות</label>
                      <Input value={editedBusiness.industry} onChange={(e) => setEditedBusiness(prev => ({ ...prev, industry: e.target.value }))} className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">ותק בשוק</label>
                      <Input value={editedBusiness.seniority} onChange={(e) => setEditedBusiness(prev => ({ ...prev, seniority: e.target.value }))} className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">קהל יעד</label>
                      <Input value={editedBusiness.audience} onChange={(e) => setEditedBusiness(prev => ({ ...prev, audience: e.target.value }))} className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">הצעת הערך</label>
                      <Input value={editedBusiness.coreOffering} onChange={(e) => setEditedBusiness(prev => ({ ...prev, coreOffering: e.target.value }))} className="h-8 text-sm" />
                    </div>
                    <div className="md:col-span-2 flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditMode(null)}>ביטול</Button>
                      <Button size="sm" onClick={handleSaveBusiness}><Check className="w-3 h-3 ml-1" />שמור</Button>
                    </div>
                  </>
                ) : (
                  <>
                    {websiteInsights?.seniority && (
                      <div className="p-3 rounded-lg bg-secondary/50">
                        <p className="text-xs text-muted-foreground mb-1">ותק בשוק</p>
                        <p className="font-medium text-sm">{websiteInsights.seniority}</p>
                      </div>
                    )}
                    {websiteInsights?.coreOffering && (
                      <div className="p-3 rounded-lg bg-secondary/50">
                        <p className="text-xs text-muted-foreground mb-1">הצעת הערך</p>
                        <p className="font-medium text-sm">{websiteInsights.coreOffering}</p>
                      </div>
                    )}
                    {websiteInsights?.audience && (
                      <div className="p-3 rounded-lg bg-secondary/50">
                        <p className="text-xs text-muted-foreground mb-1">קהל יעד</p>
                        <p className="font-medium text-sm">{websiteInsights.audience}</p>
                      </div>
                    )}
                    <div className="flex justify-end md:col-span-2">
                      <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setEditMode('business')}>
                        <Pencil className="w-3 h-3" />
                        ערוך פרטי עסק
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

        {/* ─── Card 3: Strategic DNA ─── */}
        <Card className="border-2 border-border overflow-hidden">
          <div className="bg-gradient-to-r from-violet-600 to-indigo-700 p-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5" />
              ה-DNA האסטרטגי
            </h3>
            <p className="text-sm text-white/80">מה מבדל אתכם, למי אתם מדברים, ואיך אתם נתפסים.</p>
          </div>
          <CardContent className="p-6 space-y-5">
            {/* Brand Presence & Audience Tone */}
            <div className="grid md:grid-cols-2 gap-3">
              {data.strategicMRI.brandPresence && (
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Anchor className="w-3 h-3" />
                    נוכחות מותגית
                  </p>
                  <p className="font-medium text-sm">{getBrandPresenceLabel()}</p>
                </div>
              )}
              {data.strategicMRI.audienceTone && (
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    טון דיבור
                  </p>
                  <p className="font-medium text-sm">{getAudienceToneLabel()}</p>
                </div>
              )}
            </div>

            {/* X-Factors */}
            {data.strategicMRI.xFactors.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  גורמי בידול
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.strategicMRI.xFactors.map((factor) => (
                    <Badge 
                      key={factor} 
                      variant={factor === data.strategicMRI.primaryXFactor ? 'default' : 'secondary'}
                      className="px-3 py-1.5"
                    >
                      {factor === data.strategicMRI.primaryXFactor && <Zap className="w-3 h-3 ml-1" />}
                      {getXFactorLabel(factor)}
                    </Badge>
                  ))}
                </div>
                {data.strategicMRI.primaryXFactor && data.strategicMRI.xFactorDetails[data.strategicMRI.primaryXFactor] && (
                  <p className="text-sm text-muted-foreground bg-secondary/30 p-2 rounded-lg">
                    "{data.strategicMRI.xFactorDetails[data.strategicMRI.primaryXFactor]}"
                  </p>
                )}
              </div>
            )}

            {/* Quality Signatures */}
            {data.strategicMRI.qualitySignatures.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  תבלינים חזקים (הוכחות)
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.strategicMRI.qualitySignatures.map((sig, idx) => (
                    <Badge key={idx} variant="outline" className="px-3 py-1.5 text-sm">
                      {getQualitySignatureLabel(sig.type)}: {sig.value}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Target Audience */}
            <div className="grid md:grid-cols-2 gap-3">
              {data.strategicMRI.endConsumer && (
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1">צרכן קצה</p>
                  <p className="font-medium text-sm">{data.strategicMRI.endConsumer}</p>
                </div>
              )}
              {data.strategicMRI.decisionMaker && (
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1">מקבל ההחלטות</p>
                  <p className="font-medium text-sm">{data.strategicMRI.decisionMaker}</p>
                </div>
              )}
            </div>

            {/* Competitors */}
            {(data.strategicMRI.competitors.length > 0 || data.strategicMRI.noCompetitors) && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  מתחרים
                </p>
                {data.strategicMRI.noCompetitors ? (
                  <p className="text-sm text-muted-foreground">אין מתחרים ישירים</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {data.strategicMRI.competitors.map((comp, idx) => (
                      <Badge key={idx} variant="outline" className="px-3 py-1.5">{comp}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Positioning */}
            <div className="grid md:grid-cols-2 gap-3">
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
            </div>
          </CardContent>
        </Card>

        {/* ─── Card 4: Past Materials (if any) ─── */}
        {data.pastMaterials.length > 0 && (
          <Card className="border-2 border-border overflow-hidden">
            <div className="bg-gradient-to-r from-slate-600 to-gray-700 p-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Image className="w-5 h-5" />
                חומרים קודמים ({data.pastMaterials.length})
              </h3>
            </div>
            <CardContent className="p-6">
              <div className="flex gap-2 flex-wrap">
                {data.pastMaterials.slice(0, 6).map((material) => (
                  <div key={material.id} className="w-20 h-20 rounded-lg overflow-hidden border border-border">
                    {material.type === 'image' ? (
                      <img src={material.preview} alt={material.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-secondary flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">PDF</span>
                      </div>
                    )}
                  </div>
                ))}
                {data.pastMaterials.length > 6 && (
                  <div className="w-20 h-20 rounded-lg bg-secondary flex items-center justify-center">
                    <span className="text-sm text-muted-foreground">+{data.pastMaterials.length - 6}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Card 5: Business Photos (read-only summary) ─── */}
        {data.businessPhotos && data.businessPhotos.length > 0 && (
          <Card className="border-2 border-border overflow-hidden">
            <div className="bg-gradient-to-r from-teal-600 to-emerald-700 p-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Camera className="w-5 h-5" />
                תמונות מהעסק ({data.businessPhotos.length})
              </h3>
              <p className="text-sm text-white/80">תמונות שיוכלו לשמש בחומרי הפרסום</p>
            </div>
            <CardContent className="p-6">
              <div className="flex gap-2 flex-wrap">
                {data.businessPhotos.slice(0, 8).map((photo) => (
                  <div key={photo.id} className="w-20 h-20 rounded-lg overflow-hidden border border-border">
                    <img src={photo.preview} alt={photo.name} className="w-full h-full object-cover" />
                  </div>
                ))}
                {data.businessPhotos.length > 8 && (
                  <div className="w-20 h-20 rounded-lg bg-secondary flex items-center justify-center">
                    <span className="text-sm text-muted-foreground">+{data.businessPhotos.length - 8}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-center gap-4 flex-wrap text-sm text-muted-foreground py-2">
          <div className="flex items-center gap-1">
            <Check className="w-4 h-4 text-green-500" />
            זהות מותגית
          </div>
          {websiteInsights?.services?.length > 0 && (
            <div className="flex items-center gap-1">
              <Check className="w-4 h-4 text-green-500" />
              שירותים
            </div>
          )}
          <div className="flex items-center gap-1">
            <Check className="w-4 h-4 text-green-500" />
            אסטרטגיה
          </div>
          {data.pastMaterials.length > 0 && (
            <div className="flex items-center gap-1">
              <Check className="w-4 h-4 text-green-500" />
              חומרים
            </div>
          )}
        </div>
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
