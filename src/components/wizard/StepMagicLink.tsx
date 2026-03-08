import { useState, useRef } from 'react';
import { WizardData, WizardDataUpdate, UploadedMaterial, ContactAssets } from '@/types/wizard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Globe, Sparkles, Loader2, Keyboard, ArrowLeft, Wand2, Upload, FileText, X, Image, Link as LinkIcon, Palette, Type, Star, Eye, CheckCircle2, Pencil, Phone, Mail, MapPin, MessageCircle, Youtube, Facebook, Instagram, Linkedin, Music2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { getYourWord, getGreeting } from '@/lib/honorific-utils';
import { BrandingStudio } from './BrandingStudio';
import LogoUploadGuidelines from '@/components/shared/LogoUploadGuidelines';

interface UploadedFile {
  name: string;
  type: string;
  dataUrl: string;
}

interface StepMagicLinkProps {
  data: WizardData;
  updateData: (data: WizardDataUpdate) => void;
  onNext: () => void;
  onPrev?: () => void;
}

// URL validation helper
const isValidUrl = (urlString: string): boolean => {
  if (!urlString.trim()) return true;
  try {
    const url = new URL(urlString.startsWith('http') ? urlString : `https://${urlString}`);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const StepMagicLink = ({ data, updateData, onNext, onPrev }: StepMagicLinkProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [url, setUrl] = useState(data.websiteUrl);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<UploadedFile | null>(null);
  const [showBrandingStudio, setShowBrandingStudio] = useState(false);
  const [showSnapshot, setShowSnapshot] = useState(false);
  const [analyzingMaterials, setAnalyzingMaterials] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const materialsInputRef = useRef<HTMLInputElement>(null);

  // ═══ Logo Upload ═══
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    try {
      const { fileToLogoDataUrl } = await import('@/lib/logo-utils');
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      
      if (isPdf) {
        toast.loading('ממיר PDF ל-PNG...', { id: 'pdf-convert' });
      }
      
      const { dataUrl, hadWhiteBackground } = await fileToLogoDataUrl(file);
      
      if (hadWhiteBackground) {
        toast.success('זיהינו רקע לבן בלוגו והסרנו אותו אוטומטית 🎨');
      }
      
      if (isPdf) {
        toast.success('PDF הומר בהצלחה!', { id: 'pdf-convert' });
      }

      const newFile: UploadedFile = { name: file.name, type: file.type, dataUrl };
      setLogoFile(newFile);
      updateData({ brand: { logo: dataUrl } });

      // Auto-extract colors from logo
      toast.loading('מחלץ צבעים מהלוגו...', { id: 'auto-color-extract' });
      try {
        const { data: result, error } = await supabase.functions.invoke('extract-logo-colors', {
          body: { imageBase64: dataUrl }
        });
        if (!error && result?.colors) {
          updateData({
            brand: {
              logo: dataUrl,
              colors: {
                primary: result.colors.primary,
                secondary: result.colors.secondary,
                background: result.colors.background,
              },
            },
          });
          const fontMsg = result.fonts?.headerFont ? ` | פונט: ${result.fonts.headerFont}` : '';
          toast.success(`צבעים חולצו בהצלחה מהלוגו!${fontMsg}`, { id: 'auto-color-extract' });
          if (result.fonts?.headerFont) {
            updateData({
              brand: {
                logo: dataUrl,
                colors: { primary: result.colors.primary, secondary: result.colors.secondary, background: result.colors.background },
                headerFont: result.fonts.headerFont,
                bodyFont: result.fonts.bodyFont || 'Heebo',
              },
            });
          }
        } else {
          toast.dismiss('auto-color-extract');
        }
      } catch (err) {
        console.error('Auto color extraction failed:', err);
        toast.dismiss('auto-color-extract');
      }
    } catch (err) {
      console.error('Logo upload failed:', err);
      toast.error('שגיאה בהעלאת הלוגו');
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    updateData({ brand: { ...data.brand, logo: null } });
  };

  // ═══ Past Materials Upload ═══
  const handleMaterialsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleMaterialFiles(e.target.files);
    e.target.value = '';
  };

  const handleMaterialFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const reader = new FileReader();
      reader.onload = async (event) => {
        let preview = event.target?.result as string;
        if (isPdf) {
          try {
            const { pdfToImage } = await import('@/lib/pdf-utils');
            preview = await pdfToImage(preview, { scale: 2 });
          } catch (err) { console.error('PDF conversion failed:', err); }
        }
        const material: UploadedMaterial = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: 'image',
          preview,
        };
        const updatedMaterials = [...data.pastMaterials, material];
        updateData({ pastMaterials: updatedMaterials });
        analyzeAd(material, updatedMaterials);
      };
      reader.readAsDataURL(file);
    });
  };

  const analyzeAd = async (material: UploadedMaterial, currentMaterials: UploadedMaterial[]) => {
    setAnalyzingMaterials(prev => new Set([...prev, material.id]));
    try {
      const { data: result, error } = await supabase.functions.invoke('analyze-ad-layout', {
        body: { imageDataUrl: material.preview }
      });
      if (error) throw error;
      if (result?.analysis) {
        const analysis = {
          logoPosition: result.analysis.logoPosition || '',
          gridStructure: result.analysis.gridStructure || '',
          colorPalette: result.analysis.colorPalette || [],
          typography: result.analysis.typography || '',
          detectedFonts: result.analysis.detectedFonts || undefined,
          layoutNotes: result.analysis.layoutNotes || '',
        };
        const updatedMaterials = currentMaterials.map(m => m.id === material.id ? { ...m, adAnalysis: analysis } : m);
        updateData({ pastMaterials: updatedMaterials });

        // Auto-fill colors if still default
        const colors = data.brand.colors;
        const isDefault = (c: string) => !c || c === '#000000' || c === '#FFFFFF' || c === '#ffffff';
        if (isDefault(colors.primary) && isDefault(colors.secondary) && analysis.colorPalette.length >= 2) {
          const palette = analysis.colorPalette.filter((c: string) => c !== '#FFFFFF' && c !== '#ffffff' && c !== '#000000');
          if (palette.length >= 1) {
            updateData({ brand: { colors: { primary: palette[0], secondary: palette[1] || palette[0], background: colors.background || '#FFFFFF' } } });
            toast.success('צבעי מותג עודכנו מהמודעה!', { icon: '🎨' });
          }
        }
        toast.success(`ניתוח "${material.name}" הושלם!`);
      }
    } catch (err) {
      console.error('Ad analysis error:', err);
    } finally {
      setAnalyzingMaterials(prev => { const next = new Set(prev); next.delete(material.id); return next; });
    }
  };

  const removeMaterial = (id: string) => {
    updateData({ pastMaterials: data.pastMaterials.filter((m) => m.id !== id) });
  };

  // ═══ Website Scanning ═══
  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (value.trim() && !isValidUrl(value)) {
      setUrlError('כתובת האתר אינה תקינה');
    } else {
      setUrlError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!data.brand.name && !url.trim()) {
      toast.error('נא להזין שם עסק או כתובת אתר');
      return;
    }
    
    setIsAnalyzing(true);
    updateData({ websiteUrl: url });

    try {
      const { data: result, error } = await supabase.functions.invoke('predict-business', {
        body: { brandName: data.brand.name, websiteUrl: url.trim() || null }
      });
      if (error) throw error;
      const predictions = result?.predictions;
      if (predictions) {
        setShowSparkles(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setShowSparkles(false);
        
        updateData({
          websiteUrl: url,
          isScanning: false,
          brand: { ...data.brand, name: predictions.businessName || data.brand.name },
          websiteInsights: {
            industry: predictions.industry || '',
            seniority: predictions.seniority || '',
            coreOffering: predictions.coreOffering || '',
            audience: predictions.audience || '',
            services: Array.isArray(predictions.services) ? predictions.services : [],
            confirmed: false,
          },
        });
        toast.success('ניתחנו את העסק בהצלחה!');
        setShowSnapshot(true);
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      toast.error('שגיאה בניתוח, נסו שוב');
    }
    setIsAnalyzing(false);
  };

  const handleScan = async () => {
    const targetUrl = url.trim();
    if (!targetUrl) return;
    if (!isValidUrl(targetUrl)) {
      setUrlError('כתובת האתר אינה תקינה');
      return;
    }
    
    setIsScanning(true);
    updateData({ websiteUrl: url, isScanning: true });

    try {
      const { data: scrapeResult, error: scrapeError } = await supabase.functions.invoke('scrape-website', {
        body: { url: targetUrl, options: { formats: ['markdown', 'branding'], onlyMainContent: true } }
      });

      if (scrapeError || !scrapeResult?.success) {
        await handleAnalyze();
      } else {
        const scrapedData = scrapeResult.data;
        const branding = scrapedData.branding;
        const markdown = scrapedData.markdown || '';
        
        setShowSparkles(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setShowSparkles(false);
        
        const { data: aiResult } = await supabase.functions.invoke('predict-business', {
          body: { brandName: data.brand.name, websiteUrl: targetUrl, scrapedContent: markdown.substring(0, 3000), brandingInfo: branding }
        });

        const predictions = aiResult?.predictions || {};
        
        updateData({
          websiteUrl: url,
          isScanning: false,
          brand: { ...data.brand, name: predictions.businessName || data.brand.name },
          websiteInsights: {
            industry: predictions.industry || '',
            seniority: predictions.seniority || '',
            coreOffering: predictions.coreOffering || '',
            audience: predictions.audience || '',
            services: Array.isArray(predictions.services) ? predictions.services : [],
            confirmed: false,
          },
          scrapedBranding: branding ? {
            primaryColor: branding.colors?.primary,
            secondaryColor: branding.colors?.secondary,
            backgroundColor: branding.colors?.background,
            logo: branding.images?.logo || branding.logo,
          } : undefined,
        });
        
        toast.success('שאבנו נתונים מהאתר בהצלחה!');
        setShowSnapshot(true);
      }
    } catch (error) {
      console.error('Scan error:', error);
      await handleAnalyze();
    }
    
    setIsScanning(false);
  };

  // ═══ Editable snapshot fields ═══
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (field: string, value: string) => {
    setEditingField(field);
    setEditValue(value);
  };

  const saveEdit = (field: string) => {
    if (field === 'industry' || field === 'coreOffering' || field === 'audience' || field === 'seniority') {
      updateData({ websiteInsights: { ...data.websiteInsights, [field]: editValue } });
    } else if (field === 'businessName') {
      updateData({ brand: { name: editValue } });
    }
    setEditingField(null);
  };

  const updateContact = (key: keyof ContactAssets, value: string) => {
    updateData({ contactAssets: { ...data.contactAssets, [key]: value } });
  };

  const handleContinueFromSnapshot = () => {
    onNext();
  };

  const handleSkipToNext = () => {
    updateData({
      websiteUrl: '',
      isScanning: false,
      websiteInsights: { industry: '', seniority: '', coreOffering: '', audience: '', services: [], confirmed: false },
    });
    setShowSnapshot(true);
  };

  const hasLogo = !!(logoFile || data.brand.logo);
  const hasMaterials = data.pastMaterials.length > 0;
  const hasColors = data.brand.colors.primary && data.brand.colors.primary !== '#FFFFFF' && data.brand.colors.primary !== '';

  // ═══ Sparkles Animation ═══
  if (showSparkles) {
    return (
      <div className="space-y-10">
        <div className="text-center space-y-8">
          <div className="relative w-40 h-40 mx-auto">
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-20 h-20 text-primary animate-pulse" />
            </div>
            <div className="absolute top-0 left-4 animate-bounce delay-100">
              <Sparkles className="w-8 h-8 text-yellow-400" />
            </div>
            <div className="absolute top-4 right-2 animate-bounce delay-200">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <div className="absolute bottom-4 left-2 animate-bounce delay-300">
              <Sparkles className="w-6 h-6 text-yellow-500" />
            </div>
            <div className="absolute bottom-0 right-4 animate-bounce">
              <Sparkles className="w-7 h-7 text-primary/80" />
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-3xl font-bold text-foreground animate-pulse">
              ✨ מנתחים את העסק {getYourWord(data.honorific)} ✨
            </p>
            <p className="text-lg text-muted-foreground">הקסם קורה עכשיו...</p>
          </div>
        </div>
      </div>
    );
  }

  // ═══ Snapshot / Summary View ═══
  if (showSnapshot) {
    const insights = data.websiteInsights;
    const contact = data.contactAssets;

    const EditableField = ({ label, field, value }: { label: string; field: string; value: string }) => (
      <div className="space-y-1">
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        {editingField === field ? (
          <div className="flex gap-2">
            <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-8 text-sm" dir="rtl" autoFocus />
            <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => saveEdit(field)}>✓</Button>
            <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setEditingField(null)}>✕</Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group">
            <p className="text-sm font-medium text-foreground flex-1">{value}</p>
            <button onClick={() => startEdit(field, value)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted">
              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>
    );

    const CONTACT_FIELDS_CONFIG = [
      { key: 'contact_phone' as keyof ContactAssets, label: 'טלפון', icon: Phone, placeholder: '03-1234567', type: 'tel' },
      { key: 'contact_whatsapp' as keyof ContactAssets, label: 'וואטסאפ', icon: MessageCircle, placeholder: '050-1234567', type: 'tel' },
      { key: 'contact_email' as keyof ContactAssets, label: 'מייל', icon: Mail, placeholder: 'info@business.com', type: 'email' },
      { key: 'contact_address' as keyof ContactAssets, label: 'כתובת', icon: MapPin, placeholder: 'רחוב הדוגמה 10, בני ברק', type: 'text' },
      { key: 'website_url' as keyof ContactAssets, label: 'אתר', icon: Globe, placeholder: 'www.example.co.il', type: 'url' },
      { key: 'social_facebook' as keyof ContactAssets, label: 'פייסבוק', icon: Facebook, placeholder: 'facebook.com/page', type: 'text' },
      { key: 'social_instagram' as keyof ContactAssets, label: 'אינסטגרם', icon: Instagram, placeholder: '@username', type: 'text' },
      { key: 'contact_youtube' as keyof ContactAssets, label: 'יוטיוב', icon: Youtube, placeholder: 'youtube.com/@channel', type: 'text' },
      { key: 'social_tiktok' as keyof ContactAssets, label: 'טיקטוק', icon: Music2, placeholder: '@username', type: 'text' },
      { key: 'social_linkedin' as keyof ContactAssets, label: 'לינקדאין', icon: Linkedin, placeholder: 'linkedin.com/company/...', type: 'text' },
    ];

    return (
      <div className="space-y-10 animate-fade-in">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center shadow-lg">
            <Eye className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            תמונת מצב - {data.brand.name || 'העסק שלכם'}
          </h2>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            הנה מה שאספנו עד כה. בדקו שהכל מדויק, השלימו פרטים חסרים וממשיכים!
          </p>
        </div>

        <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-6">
          {/* Brand Identity Card */}
          <Card className="border-2 border-primary/20 shadow-lg">
            <CardContent className="p-6 space-y-5">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                זהות מותגית
              </h3>

              {/* Logo */}
              {hasLogo && (
                <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/50">
                  <img
                    src={logoFile?.dataUrl || data.brand.logo || ''}
                    alt="לוגו"
                    className="h-14 w-14 object-contain rounded-lg bg-white border border-border"
                  />
                  <span className="text-sm font-medium text-foreground">הלוגו שלכם ✓</span>
                </div>
              )}

              {/* Colors */}
              <div className="space-y-2">
                <span className="text-sm font-semibold text-foreground">פלטת צבעים</span>
                <div className="flex items-center gap-3">
                  {data.brand.colors.primary && data.brand.colors.primary !== '#FFFFFF' && (
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg border-2 border-border shadow-sm" style={{ backgroundColor: data.brand.colors.primary }} />
                      <div>
                        <p className="text-xs text-muted-foreground">ראשי</p>
                        <p className="text-xs font-mono uppercase">{data.brand.colors.primary}</p>
                      </div>
                    </div>
                  )}
                  {data.brand.colors.secondary && data.brand.colors.secondary !== '#FFFFFF' && (
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg border-2 border-border shadow-sm" style={{ backgroundColor: data.brand.colors.secondary }} />
                      <div>
                        <p className="text-xs text-muted-foreground">משני</p>
                        <p className="text-xs font-mono uppercase">{data.brand.colors.secondary}</p>
                      </div>
                    </div>
                  )}
                  {!hasColors && (
                    <p className="text-sm text-muted-foreground">לא זוהו צבעים עדיין</p>
                  )}
                </div>
              </div>

              {/* Fonts */}
              <div className="space-y-1">
                <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Type className="w-4 h-4" /> פונטים
                </span>
                <p className="text-sm text-muted-foreground">
                  כותרות: <span className="font-medium text-foreground">{data.brand.headerFont}</span>
                  {' | '}
                  גוף: <span className="font-medium text-foreground">{data.brand.bodyFont}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Activity Card */}
          <Card className="border-2 border-emerald-500/20 shadow-lg">
            <CardContent className="p-6 space-y-5">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                פירוט פעילות
              </h3>

              {insights?.industry && (
                <EditableField label="תחום" field="industry" value={insights.industry} />
              )}
              {insights?.coreOffering && (
                <EditableField label="מה מציעים" field="coreOffering" value={insights.coreOffering} />
              )}
              {insights?.audience && (
                <EditableField label="קהל יעד" field="audience" value={insights.audience} />
              )}
              {insights?.seniority && (
                <EditableField label="ותק" field="seniority" value={insights.seniority} />
              )}

              {insights?.services && insights.services.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground">שירותים</span>
                  <div className="flex flex-wrap gap-1.5">
                    {insights.services.map((s, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-700 font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {hasMaterials && (
                <div className="space-y-1 pt-2 border-t border-border/50">
                  <span className="text-xs font-semibold text-muted-foreground">חומרי פרסום</span>
                  <p className="text-sm font-medium text-foreground">{data.pastMaterials.length} קבצים הועלו ונותחו</p>
                </div>
              )}

              {!insights?.industry && !insights?.coreOffering && (
                <p className="text-sm text-muted-foreground">לא הוזנו פרטי פעילות עדיין — נמשיך לשלב הבא</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Contact Info Card */}
        <Card className="max-w-3xl mx-auto border-2 border-primary/20 shadow-lg">
          <CardContent className="p-6 space-y-5">
            <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              פרטי יצירת קשר
            </h3>
            <p className="text-sm text-muted-foreground">
              השלימו או תקנו — הפרטים ישמשו בקמפיינים הבאים שלכם
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {CONTACT_FIELDS_CONFIG.map(({ key, label, icon: Icon, placeholder, type }) => (
                <div key={key} className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </label>
                  <Input
                    type={type}
                    value={contact[key] || ''}
                    onChange={(e) => updateContact(key, e.target.value)}
                    placeholder={placeholder}
                    className="h-9 text-sm text-left"
                    dir="ltr"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Materials Preview */}
        {hasMaterials && (
          <div className="max-w-3xl mx-auto">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">חומרי פרסום שהועלו:</h4>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {data.pastMaterials.map((m) => (
                <div key={m.id} className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 border-border shadow-sm">
                  <img src={m.preview} alt={m.name} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Continue */}
        <div className="max-w-xl mx-auto space-y-4">
          <Button
            onClick={handleContinueFromSnapshot}
            size="xl"
            variant="gradient"
            className="w-full h-16 text-xl font-bold"
          >
            <Sparkles className="w-6 h-6 ml-2" />
            מעולה, ממשיכים! ✨
          </Button>
          <Button
            onClick={() => setShowSnapshot(false)}
            variant="ghost"
            size="lg"
            className="w-full text-base"
          >
            ← חזרה לעריכה
          </Button>
        </div>
      </div>
    );
  }

  // ═══ Main Collection View ═══
  return (
    <>
      <div className="space-y-10">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg">
            <Sparkles className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            אז {data.userName || 'חבר'}, בואו נלמד על {data.brand.name || 'העסק'}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto">
            ככל שתעלו יותר חומרים — ככה התוצאות ייצאו יותר מדויקות
          </p>
        </div>

        {/* ═══ SECTION 1: Logo Upload ═══ */}
        <Card className="max-w-2xl mx-auto border-2 border-primary/20 shadow-xl">
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-md shadow-indigo-500/30 flex items-center justify-center">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <label className="text-base font-semibold text-foreground flex items-center gap-2">
                העלה לוגו / ספר מותג
                <span className="text-destructive text-lg">*</span>
              </label>
              <LogoUploadGuidelines />
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,application/pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            {hasLogo ? (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
                {(logoFile?.type?.startsWith('image/') || (data.brand.logo && !data.brand.logo.startsWith('data:application/pdf'))) ? (
                  <img
                    src={logoFile?.dataUrl || data.brand.logo || ''}
                    alt="לוגו"
                    className="h-16 w-16 object-contain rounded-lg bg-white"
                  />
                ) : (
                  <div className="h-16 w-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-md shadow-green-500/30">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                )}
                <span className="flex-1 text-base font-medium text-foreground truncate">
                  {logoFile?.name || 'לוגו העסק'}
                </span>
                <button type="button" onClick={removeLogo} className="p-2 hover:bg-red-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-destructive" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full min-h-[120px] rounded-2xl border-3 border-dashed flex items-center justify-center overflow-hidden transition-all cursor-pointer group border-indigo-300 hover:border-indigo-500 bg-gradient-to-br from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100"
              >
                <div className="text-center p-6 group-hover:scale-105 transition-transform">
                  <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-md shadow-indigo-500/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-base font-medium text-indigo-700">לחץ להעלאה</span>
                  <span className="text-sm text-indigo-500 block mt-1">(תמונות או PDF)</span>
                </div>
              </div>
            )}

            {/* No branding button */}
            {!hasLogo && (
              <button
                type="button"
                onClick={() => setShowBrandingStudio(true)}
                className="w-full p-4 rounded-xl border-2 border-dashed border-violet-300 hover:border-violet-500 bg-gradient-to-br from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 transition-all flex items-center justify-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-md shadow-violet-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-semibold text-violet-700">אין לי מיתוג - תעזרו לי</span>
              </button>
            )}
          </CardContent>
        </Card>

        {/* ═══ SECTION 2: Past Materials Upload ═══ */}
        <Card className="max-w-2xl mx-auto border-2 border-amber-500/20 shadow-lg">
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-md shadow-amber-500/30 flex items-center justify-center">
                <Image className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <label className="text-base font-semibold text-foreground">
                  העלו חומרי פרסום
                </label>
                <p className="text-sm text-muted-foreground">
                  מודעות, פרוספקטים, ברושורים — ככל שיותר, יותר טוב!
                </p>
              </div>
            </div>

            <input
              ref={materialsInputRef}
              type="file"
              accept="image/*,.pdf,application/pdf"
              multiple
              onChange={handleMaterialsUpload}
              className="hidden"
            />

            {/* Uploaded Materials Grid */}
            {hasMaterials && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {data.pastMaterials.map((m) => (
                  <div key={m.id} className="relative group rounded-xl overflow-hidden border-2 border-border aspect-square">
                    <img src={m.preview} alt={m.name} className="w-full h-full object-cover" />
                    {analyzingMaterials.has(m.id) && (
                      <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                      </div>
                    )}
                    {m.adAnalysis && (
                      <div className="absolute top-1 right-1">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 drop-shadow-md" />
                      </div>
                    )}
                    <button
                      onClick={() => removeMaterial(m.id)}
                      className="absolute top-1 left-1 w-6 h-6 rounded-full bg-destructive/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {/* Add more button */}
                <div
                  onClick={() => materialsInputRef.current?.click()}
                  className="rounded-xl border-2 border-dashed border-amber-300 hover:border-amber-500 aspect-square flex items-center justify-center cursor-pointer hover:bg-amber-50 transition-colors"
                >
                  <Upload className="w-6 h-6 text-amber-500" />
                </div>
              </div>
            )}

            {!hasMaterials && (
              <div
                onClick={() => materialsInputRef.current?.click()}
                className="w-full min-h-[100px] rounded-2xl border-3 border-dashed border-amber-300 hover:border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 flex items-center justify-center cursor-pointer transition-all group"
              >
                <div className="text-center p-6 group-hover:scale-105 transition-transform">
                  <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-md shadow-amber-500/30 flex items-center justify-center mb-3">
                    <Upload className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-base font-medium text-amber-700">לחצו להעלאת חומרי פרסום</span>
                  <span className="text-sm text-amber-500 block mt-1">מודעות, פרוספקטים, PDF</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ═══ SECTION 3: Website / Link ═══ */}
        <Card className="max-w-2xl mx-auto border-2 border-blue-500/20 shadow-lg">
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-md shadow-blue-500/30 flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <label className="text-base font-semibold text-foreground">
                  קישור לאתר / רשת חברתית
                </label>
                <p className="text-sm text-muted-foreground">
                  נלמד עליכם אוטומטית מהאתר
                </p>
              </div>
            </div>

            <Input
              type="url"
              placeholder="https://www.example.co.il"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              className={`text-lg h-14 text-left ltr ${urlError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              dir="ltr"
            />
            {urlError && <p className="text-sm text-red-500">{urlError}</p>}

            {url.trim() && !urlError && (
              <Button
                onClick={handleScan}
                disabled={isScanning || isAnalyzing}
                size="lg"
                variant="outline"
                className="w-full h-12 text-base border-blue-500/50 text-blue-600 hover:bg-blue-50"
              >
                {isScanning || isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    מנתח...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 ml-2" />
                    נתח את האתר אוטומטית ⚡
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* ═══ Continue Button ═══ */}
        <div className="max-w-2xl mx-auto space-y-4">
          {hasLogo && (
            <Button
              onClick={() => {
                if (url.trim() && !urlError && !data.websiteInsights?.industry) {
                  // Has URL but hasn't scanned yet — scan first
                  handleScan();
                } else {
                  setShowSnapshot(true);
                }
              }}
              disabled={isScanning || isAnalyzing}
              size="xl"
              variant="gradient"
              className="w-full h-16 text-xl font-bold"
            >
              {isScanning || isAnalyzing ? (
                <>
                  <Loader2 className="w-6 h-6 ml-2 animate-spin" />
                  מנתחים...
                </>
              ) : (
                <>
                  <Eye className="w-6 h-6 ml-2" />
                  הצג תמונת מצב ←
                </>
              )}
            </Button>
          )}

          {!hasLogo && (
            <p className="text-center text-muted-foreground text-base bg-muted/50 p-4 rounded-xl">
              ☝️ יש להעלות לוגו כדי להמשיך
            </p>
          )}

          {onPrev && (
            <div className="text-center">
              <Button onClick={onPrev} variant="outline" size="lg" className="text-lg gap-2 px-8 h-14">
                ← חזרה לשלב הקודם
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Branding Studio Modal */}
      <BrandingStudio 
        isOpen={showBrandingStudio} 
        onClose={() => setShowBrandingStudio(false)}
        businessName={data.brand.name}
      />
    </>
  );
};

export default StepMagicLink;
