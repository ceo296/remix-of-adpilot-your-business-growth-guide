import { useState, useRef } from 'react';
import { WizardData, FONT_OPTIONS } from '@/types/wizard';
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
import { Upload, Palette, Type, Check, ArrowRight, ArrowLeft, Pencil, FileText } from 'lucide-react';

interface StepBrandIdentityProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const StepBrandIdentity = ({ data, updateData, onNext, onPrev }: StepBrandIdentityProps) => {
  const [editingColor, setEditingColor] = useState<'primary' | 'secondary' | 'background' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        updateData({
          brand: {
            ...data.brand,
            logo: event.target?.result as string,
          },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorChange = (colorType: 'primary' | 'secondary' | 'background', value: string) => {
    updateData({
      brand: {
        ...data.brand,
        colors: {
          ...data.brand.colors,
          [colorType]: value,
        },
      },
    });
  };

  const handleFontChange = (fontType: 'headerFont' | 'bodyFont', value: string) => {
    updateData({
      brand: {
        ...data.brand,
        [fontType]: value,
      },
    });
  };

  const handleNameChange = (name: string) => {
    updateData({
      brand: {
        ...data.brand,
        name,
      },
    });
  };

  const colorLabels = {
    primary: 'צבע ראשי',
    secondary: 'צבע משני',
    background: 'רקע',
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Palette className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-3xl font-bold text-foreground">
          זה מה שתפסנו עליכם, מדויק?
        </h2>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          אם משהו לא מדויק - לחצו ותקנו. אנחנו לא נעלבים.
        </p>
      </div>

      {/* Brand Name */}
      <div className="max-w-xl mx-auto">
        <Card className="border-2 border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Pencil className="w-5 h-5 text-muted-foreground" />
              <Input
                value={data.brand.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="שם העסק"
                className="text-2xl font-bold border-0 p-0 h-auto focus-visible:ring-0"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Brand Cards Grid */}
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {/* Logo Card */}
        <Card className="border-2 border-border hover:border-primary/50 transition-colors cursor-pointer group">
          <CardContent className="p-6 text-center space-y-4">
            <h3 className="font-semibold text-foreground flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" />
              הלוגו שלך
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
              className="w-32 h-32 mx-auto rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
            >
              {data.brand.logo ? (
                data.brand.logo.startsWith('data:application/pdf') ? (
                  <div className="w-full h-full bg-primary/10 flex flex-col items-center justify-center">
                    <FileText className="w-10 h-10 text-primary mb-1" />
                    <span className="text-xs text-primary">ספר מותג</span>
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
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <span className="text-xs text-muted-foreground">לחץ להעלאה</span>
                  <span className="text-[10px] text-muted-foreground block">(תמונה או PDF)</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Colors Card */}
        <Card className="border-2 border-border">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center justify-center gap-2">
              <Palette className="w-4 h-4" />
              הצבעים שלכם
            </h3>
            <p className="text-xs text-muted-foreground text-center">
              שלא ייצא בטעות כתום במקום אדום...
            </p>
            
            <div className="space-y-3">
              {(['primary', 'secondary', 'background'] as const).map((colorType) => (
                <div key={colorType} className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="color"
                      value={data.brand.colors[colorType]}
                      onChange={(e) => handleColorChange(colorType, e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border-2 border-border"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{colorLabels[colorType]}</p>
                    <p className="text-xs text-muted-foreground uppercase">
                      {data.brand.colors[colorType]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Fonts Card */}
        <Card className="border-2 border-border">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center justify-center gap-2">
              <Type className="w-4 h-4" />
              הפונטים
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">כותרות</label>
                <Select
                  value={data.brand.headerFont}
                  onValueChange={(value) => handleFontChange('headerFont', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((font) => (
                      <SelectItem key={font} value={font}>
                        {font}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">טקסט רגיל</label>
                <Select
                  value={data.brand.bodyFont}
                  onValueChange={(value) => handleFontChange('bodyFont', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((font) => (
                      <SelectItem key={font} value={font}>
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

      {/* Navigation */}
      <div className="flex justify-between max-w-4xl mx-auto pt-6">
        <Button variant="outline" size="lg" onClick={onPrev}>
          <ArrowRight className="w-4 h-4 ml-2" />
          חזרה
        </Button>
        <Button variant="gradient" size="lg" onClick={onNext}>
          נראה טוב, ממשיכים
          <ArrowLeft className="w-4 h-4 mr-2" />
        </Button>
      </div>
    </div>
  );
};

export default StepBrandIdentity;
