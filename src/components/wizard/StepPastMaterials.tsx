import { useState, useRef } from 'react';
import { WizardData, WizardDataUpdate, UploadedMaterial, AdLayoutAnalysis, FONT_OPTIONS } from '@/types/wizard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Upload, FileText, X, ArrowLeft, ArrowRight, Loader2, Eye, Palette, Layout, Type, MapPin, Sparkles, Camera, Star, ArrowLeftRight, Plus, Trash2, RefreshCw, Layers, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface StepPastMaterialsProps {
  data: WizardData;
  updateData: (data: WizardDataUpdate) => void;
  onNext: () => void;
  onPrev: () => void;
}

const StepPastMaterials = ({ data, updateData, onNext, onPrev }: StepPastMaterialsProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  const [viewingAnalysis, setViewingAnalysis] = useState<UploadedMaterial | null>(null);
  const [newService, setNewService] = useState('');
  const [isExtractingColors, setIsExtractingColors] = useState(false);
  const [showNoMaterialsFlow, setShowNoMaterialsFlow] = useState(false);
  const [validationError, setValidationError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const businessPhotoInputRef = useRef<HTMLInputElement>(null);

  const handleNext = () => {
    const hasService = (data.websiteInsights?.services || []).length > 0;
    const hasPrimaryColor = !!data.brand?.colors?.primary && data.brand.colors.primary.trim() !== '';
    
    if (!hasService && !hasPrimaryColor) {
      setValidationError('יש להגדיר לפחות שירות אחד וצבע ראשי לפני שממשיכים');
      toast.error('יש להגדיר לפחות שירות אחד וצבע ראשי');
      return;
    }
    if (!hasService) {
      setValidationError('יש להוסיף לפחות שירות אחד');
      toast.error('יש להוסיף לפחות שירות אחד');
      return;
    }
    if (!hasPrimaryColor) {
      setValidationError('יש להגדיר צבע ראשי');
      toast.error('יש להגדיר צבע ראשי');
      return;
    }
    setValidationError('');
    onNext();
  };

  // --- Services ---
  const services = data.websiteInsights?.services || [];

  const addService = () => {
    const trimmed = newService.trim();
    if (!trimmed) return;
    if (services.includes(trimmed)) { toast.error('שירות כבר קיים'); return; }
    updateData({ websiteInsights: { ...data.websiteInsights, services: [...services, trimmed] } });
    setNewService('');
  };

  const removeService = (idx: number) => {
    updateData({ websiteInsights: { ...data.websiteInsights, services: services.filter((_, i) => i !== idx) } });
  };

  // --- Colors ---
  const handleColorChange = (colorType: 'primary' | 'secondary' | 'background', value: string) => {
    updateData({ brand: { colors: { [colorType]: value } } });
  };

  const handleSwapColors = () => {
    const p = data.brand.colors.primary;
    const s = data.brand.colors.secondary;
    updateData({ brand: { colors: { primary: s, secondary: p } } });
    toast.success('הצבעים הוחלפו!');
  };

  const handleManualExtractColors = async () => {
    if (!data.brand.logo) { toast.error('אין לוגו – העלו לוגו קודם'); return; }
    setIsExtractingColors(true);
    toast.loading('מחלץ צבעים מהלוגו...', { id: 'manual-color-extract' });
    try {
      const isBase64 = data.brand.logo.startsWith('data:');
      const { data: result, error } = await supabase.functions.invoke('extract-logo-colors', {
        body: isBase64 ? { imageBase64: data.brand.logo } : { imageUrl: data.brand.logo },
      });
      if (!error && result?.colors) {
        updateData({ brand: { colors: { primary: result.colors.primary, secondary: result.colors.secondary, background: result.colors.background } } });
        toast.success('צבעים חולצו בהצלחה!', { id: 'manual-color-extract' });
      } else {
        toast.error('לא הצלחנו לחלץ צבעים', { id: 'manual-color-extract' });
      }
    } catch (err) {
      console.error('Color extraction failed:', err);
      toast.error('שגיאה בחילוץ צבעים', { id: 'manual-color-extract' });
    } finally {
      setIsExtractingColors(false);
    }
  };

  // --- Fonts ---
  const handleFontChange = (fontType: 'headerFont' | 'bodyFont', value: string) => {
    updateData({ brand: { [fontType]: value } });
  };

  // --- Business Photos ---
  const handleBusinessPhotos = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const photo: UploadedMaterial = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: 'image',
          preview: event.target?.result as string,
        };
        updateData({ businessPhotos: [...(data.businessPhotos || []), photo] });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeBusinessPhoto = (id: string) => {
    updateData({ businessPhotos: (data.businessPhotos || []).filter((p) => p.id !== id) });
  };

  // --- Past Materials ---
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setShowNoMaterialsFlow(false);
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

  const extractColorsFromMaterial = async (imageDataUrl: string) => {
    const colors = data.brand.colors;
    const isDefault = (c: string) => !c || c === '#000000' || c === '#FFFFFF' || c === '#ffffff';
    if (!isDefault(colors.primary) && !isDefault(colors.secondary)) return;
    try {
      const { data: result, error } = await supabase.functions.invoke('extract-logo-colors', {
        body: { imageBase64: imageDataUrl }
      });
      if (!error && result?.colors) {
        updateData({ brand: { colors: { primary: result.colors.primary, secondary: result.colors.secondary, background: result.colors.background || '#FFFFFF' } } });
        toast.success('צבעי מותג חולצו מהחומרים!', { icon: '🎨' });
      }
    } catch (err) { console.error('Color extraction from material failed:', err); }
  };

  const analyzeAd = async (material: UploadedMaterial, currentMaterials: UploadedMaterial[]) => {
    setAnalyzingIds(prev => new Set([...prev, material.id]));
    try {
      const { data: result, error } = await supabase.functions.invoke('analyze-ad-layout', {
        body: { imageDataUrl: material.preview }
      });
      if (error) throw error;
      if (result?.analysis) {
        const analysis: AdLayoutAnalysis = {
          logoPosition: result.analysis.logoPosition || '',
          gridStructure: result.analysis.gridStructure || '',
          colorPalette: result.analysis.colorPalette || [],
          typography: result.analysis.typography || '',
          detectedFonts: result.analysis.detectedFonts || undefined,
          layoutNotes: result.analysis.layoutNotes || '',
        };
        const updatedMaterials = currentMaterials.map(m => m.id === material.id ? { ...m, adAnalysis: analysis } : m);
        updateData({ pastMaterials: updatedMaterials });

        // Auto-fill colors from first analysis
        const colors = data.brand.colors;
        const isDefault = (c: string) => !c || c === '#000000' || c === '#FFFFFF' || c === '#ffffff';
        if (isDefault(colors.primary) && isDefault(colors.secondary) && analysis.colorPalette.length >= 2) {
          const palette = analysis.colorPalette.filter(c => c !== '#FFFFFF' && c !== '#ffffff' && c !== '#000000');
          if (palette.length >= 1) {
            updateData({ brand: { colors: { primary: palette[0] || colors.primary, secondary: palette[1] || palette[0] || colors.secondary, background: colors.background || '#FFFFFF' } } });
            toast.success('צבעי מותג עודכנו מהמודעה!', { icon: '🎨' });
          }
        }

        // Auto-fill fonts
        if (analysis.detectedFonts && analysis.detectedFonts.confidence === 'high') {
          const isDefaultFont = (f: string) => f === 'Assistant' || f === 'Heebo';
          if (isDefaultFont(data.brand.headerFont) && isDefaultFont(data.brand.bodyFont)) {
            updateData({ brand: { headerFont: analysis.detectedFonts.recommendedHeaderFont || data.brand.headerFont, bodyFont: analysis.detectedFonts.recommendedBodyFont || data.brand.bodyFont } });
            toast.success('פונטים זוהו מהמודעה הקודמת!', { icon: '🔤' });
          }
        }
        toast.success(`ניתוח "${material.name}" הושלם!`);
      }
    } catch (err) {
      console.error('Ad analysis error:', err);
      toast.error(`שגיאה בניתוח "${material.name}"`);
    } finally {
      setAnalyzingIds(prev => { const next = new Set(prev); next.delete(material.id); return next; });
    }
  };

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const removeMaterial = (id: string) => { updateData({ pastMaterials: data.pastMaterials.filter((m) => m.id !== id) }); };

  const hasBothColors = data.brand.colors.primary && data.brand.colors.secondary &&
    data.brand.colors.primary !== '#FFFFFF' && data.brand.colors.secondary !== '#FFFFFF' &&
    data.brand.colors.primary !== '' && data.brand.colors.secondary !== '';

  const hasAnalyzedMaterials = data.pastMaterials.some(m => m.adAnalysis);

  const analysisFields = [
    { key: 'logoPosition' as const, icon: MapPin, label: 'מיקום לוגו', color: 'text-blue-400' },
    { key: 'gridStructure' as const, icon: Layout, label: 'גריד וליאאוט', color: 'text-emerald-400' },
    { key: 'typography' as const, icon: Type, label: 'טיפוגרפיה', color: 'text-amber-400' },
    { key: 'layoutNotes' as const, icon: Eye, label: 'תובנות נוספות', color: 'text-violet-400' },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Layers className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
          תעודת הזהות העיצובית שלכם
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto">
          הכל מתחיל פה. ככל שנקבל יותר מידע — ככה המודעות ייצאו יותר מדויקות ומקצועיות.
        </p>
      </div>

      {/* ═══════════════ SECTION 1: Services ═══════════════ */}
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">השירותים שלכם</h3>
            <p className="text-sm text-muted-foreground">מה אתם מציעים? זה ישפיע על הטקסטים במודעות ובמצגות.</p>
          </div>
        </div>

        <Card className="border-2 border-emerald-500/20">
          <CardContent className="p-6">
            {services.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-4">
                {services.map((service, idx) => (
                  <Badge key={idx} variant="secondary" className="text-sm py-1.5 px-3 gap-2">
                    {service}
                    <button onClick={() => removeService(idx)} className="hover:text-destructive transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-4">לא זוהו שירותים. הוסיפו ידנית 👇</p>
            )}
            <div className="flex gap-2">
              <Input
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addService()}
                placeholder="הוסיפו שירות (לדוגמא: ייעוץ, עיצוב, הדרכה...)"
                className="flex-1"
              />
              <Button variant="outline" size="icon" onClick={addService} disabled={!newService.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════ SECTION 2: Color Palette ═══════════════ */}
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
            <Palette className="w-5 h-5 text-pink-500" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">פלטת הצבעים</h3>
            <p className="text-sm text-muted-foreground">אישור הצבעים שנמצאו מהלוגו. לא מדויק? שנו ידנית.</p>
          </div>
        </div>

        <Card className="border-2 border-pink-500/20">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Primary */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary fill-primary" />
                  <span className="text-sm font-bold text-foreground">צבע ראשי</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={data.brand.colors.primary || '#FFFFFF'}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="w-14 h-14 rounded-xl cursor-pointer border-2 border-primary/30 shadow-md ring-2 ring-primary/20"
                  />
                  <span className="text-sm text-muted-foreground font-mono uppercase">{data.brand.colors.primary || '—'}</span>
                </div>
              </div>

              {/* Secondary */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">צבע משני</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={data.brand.colors.secondary || '#FFFFFF'}
                    onChange={(e) => handleColorChange('secondary', e.target.value)}
                    className="w-14 h-14 rounded-xl cursor-pointer border-2 border-border shadow-md"
                  />
                  <span className="text-sm text-muted-foreground font-mono uppercase">{data.brand.colors.secondary || '—'}</span>
                </div>
              </div>

              {/* Background */}
              <div className="space-y-2">
                <span className="text-sm font-bold text-foreground">צבע רקע</span>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={data.brand.colors.background || '#FFFFFF'}
                    onChange={(e) => handleColorChange('background', e.target.value)}
                    className="w-14 h-14 rounded-xl cursor-pointer border-2 border-border shadow-md"
                  />
                  <span className="text-sm text-muted-foreground font-mono uppercase">{data.brand.colors.background || '#FFFFFF'}</span>
                </div>
              </div>
            </div>

            {/* Actions row */}
            <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-border/50">
              {hasBothColors && (
                <Button variant="ghost" size="sm" onClick={handleSwapColors} className="text-xs gap-1.5 text-muted-foreground hover:text-primary">
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  החלף ראשי ↔ משני
                </Button>
              )}
              {data.brand.logo && (
                <Button variant="ghost" size="sm" onClick={handleManualExtractColors} disabled={isExtractingColors} className="text-xs gap-1.5 text-muted-foreground hover:text-primary">
                  {isExtractingColors ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  חלץ מחדש מהלוגו
                </Button>
              )}
            </div>

            {/* Color preview bar */}
            {hasBothColors && (
              <div className="mt-4 rounded-xl overflow-hidden h-10 flex shadow-inner border border-border/50">
                <div className="flex-1" style={{ backgroundColor: data.brand.colors.primary }} />
                <div className="flex-1" style={{ backgroundColor: data.brand.colors.secondary }} />
                <div className="w-20" style={{ backgroundColor: data.brand.colors.background || '#FFFFFF' }} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════ SECTION 3: Fonts ═══════════════ */}
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Type className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">הפונטים</h3>
            <p className="text-sm text-muted-foreground">הפונטים שישמשו בכותרות ובטקסט של המודעות.</p>
          </div>
        </div>

        <Card className="border-2 border-amber-500/20">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">פונט כותרות</label>
                <Select value={data.brand.headerFont} onValueChange={(v) => handleFontChange('headerFont', v)}>
                  <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((font) => (
                      <SelectItem key={font} value={font}>{font}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-2xl font-bold text-foreground" style={{ fontFamily: data.brand.headerFont }}>
                  דוגמה לכותרת
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">פונט גוף</label>
                <Select value={data.brand.bodyFont} onValueChange={(v) => handleFontChange('bodyFont', v)}>
                  <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((font) => (
                      <SelectItem key={font} value={font}>{font}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-base text-muted-foreground" style={{ fontFamily: data.brand.bodyFont }}>
                  דוגמה לטקסט גוף רגיל שיופיע במודעות
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════ SECTION 4: Past Ads ═══════════════ */}
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 h-px bg-border"></div>
          <div className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-primary" />
            <span className="text-base font-bold text-foreground">חומרי פרסום קודמים לניתוח גריד</span>
          </div>
          <div className="flex-1 h-px bg-border"></div>
        </div>

        <p className="text-center text-sm text-muted-foreground mb-6">
          העלו מודעה ישנה ונלמד ממנה את הגריד, הפריסה ומיקום הלוגו. ככה נמשיך את הקו שלכם. 
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        <Card
          className={`border-2 transition-all cursor-pointer shadow-lg ${
            isDragging ? 'border-primary bg-primary/10 shadow-glow' : 'border-border hover:border-primary/50 hover:shadow-xl'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="p-8 md:p-12">
            {data.pastMaterials.length === 0 ? (
              <div className="text-center space-y-4">
                <div className="inline-flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-foreground">גררו לפה מודעה או לחצו להעלאה</p>
                    <p className="text-sm text-muted-foreground">תמונות, PDF — נקרא את הגריד ומיקום הלוגו</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {data.pastMaterials.map((material) => {
                  const isAnalyzing = analyzingIds.has(material.id);
                  const hasAnalysis = !!material.adAnalysis;
                  return (
                    <div key={material.id} className="relative group rounded-xl overflow-hidden border-2 border-border shadow-md" onClick={(e) => e.stopPropagation()}>
                      {material.type === 'image' ? (
                        <img src={material.preview} alt={material.name} className="w-full h-36 object-cover" />
                      ) : (
                        <div className="w-full h-36 bg-secondary flex items-center justify-center"><FileText className="w-10 h-10 text-muted-foreground" /></div>
                      )}
                      <div className="absolute top-2 right-2">
                        {isAnalyzing && (<Badge className="bg-primary/90 text-primary-foreground gap-1 animate-pulse"><Loader2 className="h-3 w-3 animate-spin" />מנתח...</Badge>)}
                        {hasAnalysis && !isAnalyzing && (<Badge className="bg-emerald-600 text-white gap-1 cursor-pointer hover:bg-emerald-700" onClick={() => setViewingAnalysis(material)}><Sparkles className="h-3 w-3" />נותח ✓</Badge>)}
                      </div>
                      {hasAnalysis && !isAnalyzing && (
                        <button onClick={() => setViewingAnalysis(material)} className="absolute inset-0 bg-foreground/0 hover:bg-foreground/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="bg-background/90 text-foreground px-3 py-1.5 rounded-lg text-sm font-medium">צפה בניתוח</span>
                        </button>
                      )}
                      <button onClick={() => removeMaterial(material.id)} className="absolute top-2 left-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><X className="w-3.5 h-3.5" /></button>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <p className="text-xs text-white truncate font-medium">{material.name}</p>
                      </div>
                    </div>
                  );
                })}
                <div className="rounded-xl border-2 border-dashed border-primary/40 flex items-center justify-center h-36 hover:border-primary hover:bg-primary/5 transition-all">
                  <div className="text-center"><Upload className="w-6 h-6 mx-auto text-primary mb-1" /><span className="text-xs font-medium text-primary">הוסף עוד</span></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* No materials flow */}
        {data.pastMaterials.length === 0 && !showNoMaterialsFlow && (
          <div className="text-center mt-4">
            <Button variant="ghost" size="sm" onClick={() => setShowNoMaterialsFlow(true)} className="text-muted-foreground hover:text-foreground">
              אין לי חומרי פרסום קודמים
            </Button>
          </div>
        )}

        {showNoMaterialsFlow && data.pastMaterials.length === 0 && (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <Card className="border-2 border-amber-400/50 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-xl bg-amber-400/20 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-amber-500" />
                </div>
                <h4 className="text-lg font-bold text-foreground">אין בעיה! נבנה לכם גריד חדש מאפס</h4>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  המערכת תבנה לכם תבנית עיצובית חדשה על בסיס הלוגו, הצבעים, הפונטים וההעדפות שהגדרתם. 
                  זה אומר שהמודעות הראשונות שלכם יראו מקצועיות אבל לא ימשיכו קו עיצובי קיים.
                </p>
                <div className="flex justify-center gap-4">
                  <Button variant="default" size="lg" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-5 h-5 ml-2" />
                    בעצם יש לי משהו
                  </Button>
                  <Button variant="outline" size="lg" onClick={handleNext}>
                    מעולה, תבנו לי חדש
                    <ArrowLeft className="w-5 h-5 mr-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>


      {/* ═══════════════ Navigation ═══════════════ */}
      <div className="flex flex-col items-center gap-4 max-w-3xl mx-auto pt-6">
        <Button variant="gradient" size="xl" onClick={handleNext} className="w-full max-w-md h-16 text-xl font-bold">
          קדימה, ממשיכים
          <ArrowLeft className="w-6 h-6 mr-2" />
        </Button>
        {validationError && (
          <p className="text-sm text-destructive font-medium">{validationError}</p>
        )}
        <Button variant="outline" size="lg" onClick={onPrev} className="text-base">
          <ArrowRight className="w-5 h-5 ml-2" />
          חזרה
        </Button>
      </div>

      {/* Analysis Dialog */}
      <Dialog open={!!viewingAnalysis} onOpenChange={() => setViewingAnalysis(null)}>
        <DialogContent className="max-w-2xl" dir="rtl">
          {viewingAnalysis && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                {viewingAnalysis.type === 'image' && (
                  <img src={viewingAnalysis.preview} alt={viewingAnalysis.name} className="w-24 h-24 object-cover rounded-lg border border-border" />
                )}
                <div>
                  <h3 className="text-xl font-bold text-foreground">{viewingAnalysis.name}</h3>
                  <p className="text-sm text-muted-foreground">ניתוח מבנה מודעה</p>
                </div>
              </div>
              {viewingAnalysis.adAnalysis && (
                <div className="space-y-4">
                  {analysisFields.map(({ key, icon: Icon, label, color }) => (
                    <div key={key} className="p-4 rounded-xl bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 mb-2"><Icon className={`h-5 w-5 ${color}`} /><h4 className="font-bold text-foreground">{label}</h4></div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{viewingAnalysis.adAnalysis![key]}</p>
                    </div>
                  ))}
                  {viewingAnalysis.adAnalysis.colorPalette?.length > 0 && (
                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 mb-3"><Palette className="h-5 w-5 text-pink-400" /><h4 className="font-bold text-foreground">פלטת צבעים</h4></div>
                      <div className="flex gap-3 flex-wrap">
                        {viewingAnalysis.adAnalysis.colorPalette.map((color, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg border-2 border-border shadow-sm" style={{ backgroundColor: color }} />
                            <span className="text-xs font-mono text-muted-foreground">{color}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {viewingAnalysis.adAnalysis.detectedFonts && (
                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <Type className="h-5 w-5 text-cyan-400" />
                        <h4 className="font-bold text-foreground">פונטים מזוהים</h4>
                        <Badge variant="outline" className="text-xs">
                          {viewingAnalysis.adAnalysis.detectedFonts.confidence === 'high' ? 'ביטחון גבוה' : viewingAnalysis.adAnalysis.detectedFonts.confidence === 'medium' ? 'ביטחון בינוני' : 'ביטחון נמוך'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-background border border-border">
                          <p className="text-xs text-muted-foreground mb-1">פונט כותרות</p>
                          <p className="font-bold text-foreground">{viewingAnalysis.adAnalysis.detectedFonts.recommendedHeaderFont}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-background border border-border">
                          <p className="text-xs text-muted-foreground mb-1">פונט גוף</p>
                          <p className="font-bold text-foreground">{viewingAnalysis.adAnalysis.detectedFonts.recommendedBodyFont}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StepPastMaterials;
