/**
 * Print Export Dialog — lets user choose format, orientation, bleed, and quality before exporting.
 */

import { useState } from 'react';
import { FileDown, Printer, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

export interface PrintSettings {
  format: 'a4' | 'a3' | 'a5' | 'letter';
  orientation: 'portrait' | 'landscape';
  bleed: number;
  cropMarks: boolean;
  quality: 'draft' | 'standard' | 'high';
}

interface PrintExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (settings: PrintSettings) => void;
  imageCount?: number;
}

const FORMAT_INFO: Record<string, { label: string; size: string; use: string }> = {
  a4: { label: 'A4', size: '210×297 מ"מ', use: 'מודעות עיתון, פליירים' },
  a3: { label: 'A3', size: '297×420 מ"מ', use: 'פוסטרים, מודעות גדולות' },
  a5: { label: 'A5', size: '148×210 מ"מ', use: 'פליירים קטנים, הזמנות' },
  letter: { label: 'Letter (US)', size: '216×279 מ"מ', use: 'פורמט אמריקאי' },
};

const QUALITY_INFO: Record<string, { label: string; dpi: string; desc: string }> = {
  high: { label: 'גבוהה', dpi: '300 DPI', desc: 'דפוס מקצועי' },
  standard: { label: 'רגילה', dpi: '200 DPI', desc: 'דפוס ביתי / דיגיטלי' },
  draft: { label: 'טיוטה', dpi: '100 DPI', desc: 'צפייה מקדימה בלבד' },
};

export function PrintExportDialog({ open, onClose, onExport, imageCount = 1 }: PrintExportDialogProps) {
  const [settings, setSettings] = useState<PrintSettings>({
    format: 'a4',
    orientation: 'portrait',
    bleed: 3,
    cropMarks: true,
    quality: 'high',
  });

  const formatInfo = FORMAT_INFO[settings.format];
  const qualityInfo = QUALITY_INFO[settings.quality];

  // Visual preview of the page
  const isLandscape = settings.orientation === 'landscape';
  const previewW = isLandscape ? 120 : 85;
  const previewH = isLandscape ? 85 : 120;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-primary" />
            הגדרות ייצוא לדפוס
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Format */}
          <div className="space-y-2">
            <Label>פורמט נייר</Label>
            <Select
              value={settings.format}
              onValueChange={(v) => setSettings(s => ({ ...s, format: v as PrintSettings['format'] }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FORMAT_INFO).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    <span className="font-medium">{info.label}</span>
                    <span className="text-muted-foreground mr-2 text-xs">({info.size})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{formatInfo.use}</p>
          </div>

          {/* Orientation */}
          <div className="space-y-2">
            <Label>כיוון</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={settings.orientation === 'portrait' ? 'default' : 'outline'}
                size="sm"
                className="flex-1 gap-2"
                onClick={() => setSettings(s => ({ ...s, orientation: 'portrait' }))}
              >
                <div className="w-4 h-5 border-2 border-current rounded-sm" />
                לאורך
              </Button>
              <Button
                type="button"
                variant={settings.orientation === 'landscape' ? 'default' : 'outline'}
                size="sm"
                className="flex-1 gap-2"
                onClick={() => setSettings(s => ({ ...s, orientation: 'landscape' }))}
              >
                <div className="w-5 h-4 border-2 border-current rounded-sm" />
                לרוחב
              </Button>
            </div>
          </div>

          {/* Quality */}
          <div className="space-y-2">
            <Label>איכות</Label>
            <Select
              value={settings.quality}
              onValueChange={(v) => setSettings(s => ({ ...s, quality: v as PrintSettings['quality'] }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(QUALITY_INFO).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    <span className="font-medium">{info.label}</span>
                    <Badge variant="secondary" className="mr-2 text-[10px]">{info.dpi}</Badge>
                    <span className="text-muted-foreground text-xs mr-1">— {info.desc}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bleed & Crop Marks */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label className="text-sm">סימני חיתוך</Label>
              <p className="text-xs text-muted-foreground">קווים שמראים לבית הדפוס איפה לחתוך</p>
            </div>
            <Switch
              checked={settings.cropMarks}
              onCheckedChange={(v) => setSettings(s => ({ ...s, cropMarks: v }))}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label className="text-sm">דימום (Bleed)</Label>
              <p className="text-xs text-muted-foreground">שוליים נוספים למניעת פסים לבנים בחיתוך</p>
            </div>
            <Select
              value={String(settings.bleed)}
              onValueChange={(v) => setSettings(s => ({ ...s, bleed: Number(v) }))}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">ללא</SelectItem>
                <SelectItem value="2">2 מ"מ</SelectItem>
                <SelectItem value="3">3 מ"מ</SelectItem>
                <SelectItem value="5">5 מ"מ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          <div className="flex justify-center pt-2">
            <div
              className="border-2 border-dashed border-muted-foreground/30 rounded flex items-center justify-center bg-muted/30 relative transition-all"
              style={{ width: previewW, height: previewH }}
            >
              {settings.cropMarks && (
                <>
                  <div className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 border-muted-foreground/40" />
                  <div className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-muted-foreground/40" />
                  <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-muted-foreground/40" />
                  <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 border-muted-foreground/40" />
                </>
              )}
              <span className="text-[10px] text-muted-foreground">{formatInfo.label} {isLandscape ? '↔' : '↕'}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            ביטול
          </Button>
          <Button onClick={() => onExport(settings)} className="gap-2">
            <FileDown className="h-4 w-4" />
            {imageCount > 1 ? `ייצוא ${imageCount} תמונות` : 'ייצוא PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
