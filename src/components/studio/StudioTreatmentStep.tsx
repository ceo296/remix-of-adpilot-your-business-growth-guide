import { useState, useRef } from 'react';
import { Image, Sparkles, Upload, Package, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type TreatmentChoice = 'as-is' | 'ai-magic';
type FlowType = 'full-campaign' | 'has-visual' | 'default';

interface StudioTreatmentStepProps {
  treatment: TreatmentChoice | null;
  onTreatmentChange: (choice: TreatmentChoice) => void;
  uploadedImage: File | null;
  onImageUpload: (file: File) => void;
  flowType?: FlowType;
  // For full-campaign flow - copy text input
  copyText?: string;
  onCopyTextChange?: (text: string) => void;
}

const TREATMENT_OPTIONS: { id: TreatmentChoice; label: string; description: string; icon: React.ReactNode }[] = [
  {
    id: 'as-is',
    label: 'כמו שהיא (As Is)',
    description: 'התמונה מעולה, רק תוסיפו כיתוב ורקע פשוט',
    icon: <Image className="h-6 w-6" />,
  },
  {
    id: 'ai-magic',
    label: 'שדרגו לי אותה (AI Magic)',
    description: 'המוצר נשאר אותו דבר, אבל הרקע והאווירה משתנים לגמרי באמצעות AI',
    icon: <Sparkles className="h-6 w-6" />,
  },
];

export const StudioTreatmentStep = ({ 
  treatment, 
  onTreatmentChange, 
  uploadedImage, 
  onImageUpload,
  flowType = 'default',
  copyText = '',
  onCopyTextChange,
}: StudioTreatmentStepProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Customize content based on flow type
  const getTitle = () => {
    switch (flowType) {
      case 'full-campaign':
        return 'העלה את חומרי הקמפיין';
      case 'has-visual':
        return 'העלה את הויז\'ואל שלך';
      default:
        return 'מה עושים עם התמונה?';
    }
  };

  const getSubtitle = () => {
    switch (flowType) {
      case 'full-campaign':
        return 'יש לך גם תמונה וגם קופי מוכנים? מעולה! העלה הכל';
      case 'has-visual':
        return 'העלה את התמונה ואנחנו נכתוב את הקופי המושלם';
      default:
        return 'העלה את התמונה ובחר סוג עיבוד';
    }
  };

  const showTreatmentOptions = flowType === 'default';
  const showCopyInput = flowType === 'full-campaign';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">{getTitle()}</h2>
        <p className="text-muted-foreground">{getSubtitle()}</p>
      </div>

      {/* Image Upload */}
      <div className="max-w-xl mx-auto">
        <Label className="block mb-2 font-medium">
          {flowType === 'full-campaign' ? 'העלאת ויז\'ואל הקמפיין' : 'תעלו את הקובץ (רצוי איכותי...)'}
        </Label>
        <div 
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
            previewUrl ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          
          {previewUrl ? (
            <div className="space-y-4">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="max-h-48 mx-auto rounded-lg object-contain"
              />
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 ml-2" />
                החלף תמונה
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">לחץ או גרור תמונה לכאן</p>
              <p className="text-xs text-muted-foreground">PNG, JPG עד 10MB</p>
            </div>
          )}
        </div>
      </div>

      {/* Copy Text Input for full-campaign flow */}
      {showCopyInput && uploadedImage && (
        <div className="max-w-xl mx-auto mt-6 animate-slide-up">
          <Label className="block mb-2 font-medium">
            <FileText className="h-4 w-4 inline ml-2" />
            הקופי של הקמפיין (אופציונלי)
          </Label>
          <Textarea
            value={copyText}
            onChange={(e) => onCopyTextChange?.(e.target.value)}
            placeholder="הכנס את הטקסט שאמור להופיע במודעה..."
            className="min-h-[100px] text-right"
            dir="rtl"
          />
          <p className="text-xs text-muted-foreground mt-2">
            אם הטקסט כבר מופיע בתמונה, אפשר להשאיר ריק
          </p>
        </div>
      )}

      {/* Treatment Options - only for default flow */}
      {showTreatmentOptions && uploadedImage && (
        <div className="grid gap-4 max-w-xl mx-auto mt-8 animate-slide-up">
          <Label className="font-medium">איך נעבד את התמונה?</Label>
          {TREATMENT_OPTIONS.map((option) => (
            <Card
              key={option.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                treatment === option.id
                  ? 'ring-2 ring-primary bg-primary/5'
                  : 'hover:border-primary/50'
              }`}
              onClick={() => onTreatmentChange(option.id)}
            >
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`p-3 rounded-lg ${
                  treatment === option.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {option.icon}
                </div>
                <div className="flex-1 text-right">
                  <div className="font-semibold">{option.label}</div>
                  <div className="text-sm text-muted-foreground">{option.description}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Success message for has-visual flow */}
      {flowType === 'has-visual' && uploadedImage && (
        <div className="text-center mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20 animate-scale-in max-w-xl mx-auto">
          <p className="text-primary font-medium">
            מעולה! אנחנו נכתוב קופי שמוכר לתמונה שלך ✍️
          </p>
        </div>
      )}

      {/* Success message for full-campaign flow */}
      {flowType === 'full-campaign' && uploadedImage && (
        <div className="text-center mt-6 p-4 bg-success/10 rounded-lg border border-success/20 animate-scale-in max-w-xl mx-auto">
          <p className="text-success font-medium">
            הכל מוכן! רק נשאר ללחוץ על "שלח קמפיין" 📦
          </p>
        </div>
      )}
    </div>
  );
};
