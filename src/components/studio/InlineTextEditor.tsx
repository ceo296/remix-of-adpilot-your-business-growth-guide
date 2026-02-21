import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, RefreshCw, Type, Check, X, Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface TextMeta {
  headline: string;
  businessName: string;
  phone: string;
}

interface InlineTextEditorProps {
  imageUrl: string;
  visualOnlyUrl: string;
  textMeta: TextMeta;
  onImageUpdate: (newUrl: string, newMeta: TextMeta) => void;
  onOpenFullEditor: () => void;
}

export const InlineTextEditor = ({
  imageUrl,
  visualOnlyUrl,
  textMeta,
  onImageUpdate,
  onOpenFullEditor,
}: InlineTextEditorProps) => {
  const [editingField, setEditingField] = useState<keyof TextMeta | null>(null);
  const [editValues, setEditValues] = useState<TextMeta>(textMeta);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const hasChanges = editValues.headline !== textMeta.headline ||
    editValues.businessName !== textMeta.businessName ||
    editValues.phone !== textMeta.phone;

  const handleFieldClick = (field: keyof TextMeta) => {
    if (editingField === field) return;
    setEditingField(field);
  };

  const handleFieldBlur = () => {
    setEditingField(null);
  };

  const handleRegenerate = useCallback(async () => {
    if (!hasChanges) {
      toast.info('לא בוצעו שינויים בטקסט');
      return;
    }

    setIsRegenerating(true);
    try {
      // Call a lightweight edge function to re-run Layer 2 only
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          visualPrompt: '', // Not needed for Layer 2 re-run
          textPrompt: editValues.headline,
          style: 'ultra-realistic',
          engine: 'nano-banana',
          brandContext: {
            businessName: editValues.businessName,
            contactPhone: editValues.phone,
          },
          campaignContext: {
            offer: editValues.headline,
          },
          // Pass the visual-only image to skip Layer 1
          _visualOnlyUrl: visualOnlyUrl,
        }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        onImageUpdate(data.imageUrl, editValues);
        toast.success('הטקסט עודכן בהצלחה!');
        setEditingField(null);
      }
    } catch (err) {
      console.error('Error regenerating text:', err);
      toast.error('שגיאה בעדכון הטקסט. נסה שוב.');
    } finally {
      setIsRegenerating(false);
    }
  }, [editValues, hasChanges, visualOnlyUrl, onImageUpdate]);

  const fieldConfig = [
    { key: 'businessName' as const, label: 'שם העסק', icon: '🏢' },
    { key: 'headline' as const, label: 'כותרת ראשית', icon: '📝' },
    { key: 'phone' as const, label: 'טלפון', icon: '📞' },
  ];

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Image preview */}
      <div className="flex-1 flex items-center justify-center p-4 bg-muted/10 min-h-0">
        <div className="relative max-w-full max-h-full">
          <img
            src={imageUrl}
            alt="תצוגה מקדימה"
            className="max-w-full max-h-[60vh] object-contain rounded-lg"
          />
          {isRegenerating && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-lg">
              <div className="flex items-center gap-2 text-primary">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="font-medium">מעדכן טקסט...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Text fields editing area */}
      <div className="border-t border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-sm flex items-center gap-1.5">
            <Type className="h-4 w-4 text-primary" />
            עריכת טקסטים
          </h4>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1 text-muted-foreground"
            onClick={onOpenFullEditor}
          >
            <Plus className="h-3 w-3" />
            הוסף שורת טקסט חופשית
          </Button>
        </div>

        {fieldConfig.map(({ key, label, icon }) => (
          <div key={key} className="group">
            <label className="text-xs text-muted-foreground mb-1 block">{icon} {label}</label>
            {editingField === key ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editValues[key]}
                  onChange={(e) => setEditValues(prev => ({ ...prev, [key]: e.target.value }))}
                  className="text-right text-sm flex-1"
                  dir="rtl"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleFieldBlur();
                    if (e.key === 'Escape') {
                      setEditValues(prev => ({ ...prev, [key]: textMeta[key] }));
                      setEditingField(null);
                    }
                  }}
                />
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleFieldBlur}>
                  <Check className="h-4 w-4 text-primary" />
                </Button>
              </div>
            ) : (
              <div
                className="flex items-center justify-between p-2.5 rounded-md border border-transparent hover:border-border hover:bg-muted/50 cursor-pointer transition-colors group"
                onClick={() => handleFieldClick(key)}
              >
                <span className={`text-sm ${editValues[key] ? '' : 'text-muted-foreground italic'}`}>
                  {editValues[key] || `ללא ${label}`}
                </span>
                <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>
        ))}

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleRegenerate}
            disabled={!hasChanges || isRegenerating}
            className="flex-1 gap-2"
            variant={hasChanges ? 'default' : 'outline'}
          >
            {isRegenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {hasChanges ? 'עדכן טקסט על התמונה' : 'שנה טקסט כדי לעדכן'}
          </Button>
        </div>
      </div>
    </div>
  );
};
