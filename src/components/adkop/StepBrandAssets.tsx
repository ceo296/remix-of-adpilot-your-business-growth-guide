import { useCallback, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Upload, Image, X } from 'lucide-react';
import { BrandAssetsData } from '@/types/adkop';

interface Props {
  data: BrandAssetsData;
  onChange: (data: BrandAssetsData) => void;
}

const StepBrandAssets = ({ data, onChange }: Props) => {
  const handleLogoDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
        const { fileToLogoDataUrl } = await import('@/lib/logo-utils');
        const { dataUrl } = await fileToLogoDataUrl(file);
        onChange({ ...data, logoFile: file, logoPreview: dataUrl, extractedColors: [] });
      }
    },
    [data, onChange]
  );

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const { fileToLogoDataUrl } = await import('@/lib/logo-utils');
      const { dataUrl } = await fileToLogoDataUrl(file);
      onChange({ ...data, logoFile: file, logoPreview: dataUrl, extractedColors: [] });
    }
  };

  const handleAdFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      onChange({ ...data, previousAds: [...data.previousAds, ...files] });
    }
  };

  const removeAd = (index: number) => {
    const next = data.previousAds.filter((_, i) => i !== index);
    onChange({ ...data, previousAds: next });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-rubik font-bold text-foreground">זהות מותגית ונכסים</h2>
        <p className="text-muted-foreground mt-2">העלו לוגו ומודעות קודמות</p>
      </div>

      {/* Logo Upload */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">לוגו</Label>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleLogoDrop}
          className="relative border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-primary/5"
        >
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleLogoSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {data.logoPreview ? (
            <div className="flex flex-col items-center gap-4">
              <img src={data.logoPreview} alt="Logo" className="max-h-32 object-contain rounded-lg" />
              <span className="text-sm text-muted-foreground">לחצו או גררו להחלפת הלוגו</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Upload className="w-10 h-10" />
              <span className="font-medium text-foreground">גררו לוגו לכאן</span>
              <span className="text-sm">או לחצו לבחירת קובץ</span>
            </div>
          )}
        </div>
      </div>

      {/* Extracted Colors */}
      {data.extractedColors.length > 0 && (
        <div className="space-y-2">
          <Label className="text-base font-semibold">צבעים שחולצו מהלוגו</Label>
          <div className="flex gap-3">
            {data.extractedColors.map((color, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className="w-12 h-12 rounded-lg border border-border shadow-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-muted-foreground font-mono">{color}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Previous Ads Upload */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">מודעות קודמות (אופציונלי)</Label>
        <div className="relative border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-primary/5">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleAdFiles}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Image className="w-8 h-8" />
            <span className="text-sm font-medium text-foreground">העלו מודעות קודמות</span>
          </div>
        </div>

        {data.previousAds.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mt-3">
            {data.previousAds.map((file, i) => (
              <div key={i} className="relative group rounded-lg overflow-hidden border border-border">
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full h-24 object-cover"
                />
                <button
                  onClick={() => removeAd(i)}
                  className="absolute top-1 left-1 bg-foreground/70 text-background rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StepBrandAssets;
