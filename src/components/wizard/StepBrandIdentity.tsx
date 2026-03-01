import { useState, useRef, useEffect } from 'react';
import { WizardData, WizardDataUpdate, FONT_OPTIONS } from '@/types/wizard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, Palette, Type, Check, ArrowRight, ArrowLeft, Pencil, FileText, RefreshCw, Loader2 } from 'lucide-react';

interface StepBrandIdentityProps {
  data: WizardData;
  updateData: (data: WizardDataUpdate) => void;
  onNext: () => void;
  onPrev: () => void;
}

const StepBrandIdentity = ({ data, updateData, onNext, onPrev }: StepBrandIdentityProps) => {
  const [editingColor, setEditingColor] = useState<'primary' | 'secondary' | 'background' | null>(null);
  const [isExtractingColors, setIsExtractingColors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasAttemptedAutoExtract = useRef(false);

  // Auto-extract colors if logo exists but colors are all default/white
  useEffect(() => {
    if (hasAttemptedAutoExtract.current) return;
    if (!data.brand.logo) return;
    
    const colors = data.brand.colors;
    const isDefault = (c: string) => !c || c === '#000000' || c === '#FFFFFF' || c === '#ffffff';
    const allDefault = isDefault(colors.primary) && isDefault(colors.secondary);
    
    if (!allDefault) return;
    
    hasAttemptedAutoExtract.current = true;
    
    const extractColors = async () => {
      toast.loading('מחלץ צבעים מהלוגו...', { id: 'auto-color-extract' });
      try {
        const { data: result, error } = await supabase.functions.invoke('extract-logo-colors', {
          body: { imageBase64: data.brand.logo }
        });
        if (!error && result?.colors) {
          updateData({
            brand: {
              colors: {
                primary: result.colors.primary,
                secondary: result.colors.secondary,
                background: result.colors.background,
              },
            },
          });
          toast.success('צבעים חולצו בהצלחה מהלוגו!', { id: 'auto-color-extract' });
        } else {
          toast.dismiss('auto-color-extract');
        }
      } catch (err) {
        console.error('Auto color extraction failed:', err);
        toast.error('לא הצלחנו לחלץ צבעים מהלוגו', { id: 'auto-color-extract' });
      }
    };
    
    extractColors();
  }, [data.brand.logo]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Auto-convert PDF to PNG
    const { fileToLogoDataUrl } = await import('@/lib/logo-utils');
    
    try {
      let dataUrl: string;
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        toast.loading('ממיר PDF ל-PNG...', { id: 'pdf-convert' });
        const result = await fileToLogoDataUrl(file);
        dataUrl = result.dataUrl;
        toast.success('PDF הומר בהצלחה!', { id: 'pdf-convert' });
      } else {
        const result = await fileToLogoDataUrl(file);
        dataUrl = result.dataUrl;
      }
      
      updateData({
        brand: { logo: dataUrl },
      });

      // Auto-extract colors from logo (supports images and PDFs)
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
            toast.success('צבעים חולצו בהצלחה מהלוגו!', { id: 'auto-color-extract' });
          } else {
            toast.dismiss('auto-color-extract');
          }
      } catch (err) {
        console.error('Auto color extraction failed:', err);
        toast.error('לא הצלחנו לחלץ צבעים מהלוגו', { id: 'auto-color-extract' });
      }
    } catch (err) {
      console.error('Logo upload failed:', err);
      toast.error('שגיאה בהעלאת הלוגו');
    }
  };

  const handleColorChange = (colorType: 'primary' | 'secondary' | 'background', value: string) => {
    updateData({
      brand: {
        colors: { [colorType]: value },
      },
    });
  };

  const handleFontChange = (fontType: 'headerFont' | 'bodyFont', value: string) => {
    updateData({
      brand: { [fontType]: value },
    });
  };

  const handleNameChange = (name: string) => {
    updateData({
      brand: { name },
    });
  };

  const handleManualExtractColors = async () => {
    if (!data.brand.logo) {
      toast.error('אין לוגו – העלו לוגו קודם');
      return;
    }
    setIsExtractingColors(true);
    toast.loading('מחלץ צבעים מהלוגו...', { id: 'manual-color-extract' });
    try {
      const { data: result, error } = await supabase.functions.invoke('extract-logo-colors', {
        body: { imageBase64: data.brand.logo }
      });
      if (!error && result?.colors) {
        updateData({
          brand: {
            colors: {
              primary: result.colors.primary,
              secondary: result.colors.secondary,
              background: result.colors.background,
            },
          },
        });
        toast.success('צבעים חולצו בהצלחה!', { id: 'manual-color-extract' });
      } else {
        console.error('Color extraction error:', error, result);
        toast.error('לא הצלחנו לחלץ צבעים', { id: 'manual-color-extract' });
      }
    } catch (err) {
      console.error('Manual color extraction failed:', err);
      toast.error('שגיאה בחילוץ צבעים', { id: 'manual-color-extract' });
    } finally {
      setIsExtractingColors(false);
    }
  };

  const colorLabels = {
    primary: 'צבע ראשי',
    secondary: 'צבע משני',
    background: 'רקע',
  };

  return (
    <div className="space-y-10">
      {/* Header - larger and more prominent */}
      <div className="text-center space-y-6">
        <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg">
          <Palette className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
          זה מה שתפסנו עליכם, מדויק?
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto">
          אם משהו לא מדויק - לחצו ותקנו. אנחנו לא נעלבים.
        </p>
      </div>

      {/* Brand Name - larger */}
      <div className="max-w-2xl mx-auto">
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardContent className="p-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Pencil className="w-6 h-6 text-primary" />
              </div>
              <Input
                value={data.brand.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="שם העסק"
                className="text-3xl font-bold border-0 p-0 h-auto focus-visible:ring-0"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Brand Cards Grid - larger cards */}
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {/* Logo Card */}
        <Card className="border-2 border-border hover:border-primary/50 transition-colors cursor-pointer group shadow-lg">
          <CardContent className="p-8 text-center space-y-6">
            <h3 className="font-bold text-lg text-foreground flex items-center justify-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              הלוגו שלכם
            </h3>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,application/pdf"
              onChange={handleLogoUpload}
              className="hidden"
            />
            
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-36 h-36 mx-auto rounded-2xl border-3 border-dashed border-primary/40 flex items-center justify-center overflow-hidden hover:border-primary transition-all cursor-pointer group-hover:bg-primary/5"
            >
              {data.brand.logo ? (
                data.brand.logo.startsWith('data:application/pdf') ? (
                  <div className="w-full h-full bg-primary/10 flex flex-col items-center justify-center">
                    <FileText className="w-12 h-12 text-primary mb-2" />
                    <span className="text-sm text-primary font-medium">ספר מותג</span>
                  </div>
                ) : (
                  <img 
                    src={data.brand.logo} 
                    alt="Logo" 
                    className="w-full h-full object-contain"
                  />
                )
              ) : (
                <div className="text-center p-4">
                  <Upload className="w-10 h-10 mx-auto text-primary mb-3" />
                  <span className="text-sm font-medium text-foreground">לחץ להעלאה</span>
                  <span className="text-xs text-muted-foreground block mt-1">(תמונה או PDF)</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Colors Card */}
        <Card className="border-2 border-border shadow-lg">
          <CardContent className="p-8 space-y-6">
            <h3 className="font-bold text-lg text-foreground flex items-center justify-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              הצבעים שלכם
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              שלא ייצא בטעות כתום במקום אדום...
            </p>
            
            {data.brand.logo && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualExtractColors}
                disabled={isExtractingColors}
                className="w-full"
              >
                {isExtractingColors ? (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 ml-2" />
                )}
                חלץ צבעים מהלוגו
              </Button>
            )}
            
            <div className="space-y-4">
              {(['primary', 'secondary', 'background'] as const).map((colorType) => (
                <div key={colorType} className="flex items-center gap-4">
                  <div className="relative">
                    <input
                      type="color"
                      value={data.brand.colors[colorType] || '#FFFFFF'}
                      onChange={(e) => handleColorChange(colorType, e.target.value)}
                      className="w-14 h-14 rounded-xl cursor-pointer border-2 border-border shadow-md"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-semibold">{colorLabels[colorType]}</p>
                    <p className="text-sm text-muted-foreground uppercase">
                      {data.brand.colors[colorType] || '—'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Fonts Card */}
        <Card className="border-2 border-border shadow-lg">
          <CardContent className="p-8 space-y-6">
            <h3 className="font-bold text-lg text-foreground flex items-center justify-center gap-2">
              <Type className="w-5 h-5 text-primary" />
              הפונטים
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-base font-semibold text-foreground">כותרות</label>
                <Select
                  value={data.brand.headerFont}
                  onValueChange={(value) => handleFontChange('headerFont', value)}
                >
                  <SelectTrigger className="h-14 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((font) => (
                      <SelectItem key={font} value={font} className="text-base py-3">
                        {font}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-base font-semibold text-foreground">טקסט רגיל</label>
                <Select
                  value={data.brand.bodyFont}
                  onValueChange={(value) => handleFontChange('bodyFont', value)}
                >
                  <SelectTrigger className="h-14 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((font) => (
                      <SelectItem key={font} value={font} className="text-base py-3">
                        {font}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation - larger buttons */}
      <div className="flex justify-between max-w-5xl mx-auto pt-8">
        <Button variant="outline" size="lg" onClick={onPrev} className="h-14 px-8 text-lg">
          <ArrowRight className="w-5 h-5 ml-2" />
          חזרה
        </Button>
        <Button variant="gradient" size="xl" onClick={onNext} className="h-14 px-10 text-lg font-bold">
          נראה טוב, ממשיכים
          <ArrowLeft className="w-5 h-5 mr-2" />
        </Button>
      </div>
    </div>
  );
};

export default StepBrandIdentity;
