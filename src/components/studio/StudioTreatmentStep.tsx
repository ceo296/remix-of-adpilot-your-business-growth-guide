import { useState, useRef } from 'react';
import { Image, Sparkles, Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

type TreatmentChoice = 'as-is' | 'ai-magic';

interface StudioTreatmentStepProps {
  treatment: TreatmentChoice | null;
  onTreatmentChange: (choice: TreatmentChoice) => void;
  uploadedImage: File | null;
  onImageUpload: (file: File) => void;
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
  onImageUpload 
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">מה עושים עם התמונה?</h2>
        <p className="text-muted-foreground">העלה את התמונה ובחר סוג עיבוד</p>
      </div>

      {/* Image Upload */}
      <div className="max-w-xl mx-auto">
        <Label className="block mb-2 font-medium">
          תעלו את הקובץ (רצוי איכותי...)
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

      {/* Treatment Options */}
      {uploadedImage && (
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
    </div>
  );
};
