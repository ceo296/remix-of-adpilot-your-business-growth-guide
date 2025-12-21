import { WizardData } from '@/types/wizard';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, Upload, Sparkles, Image } from 'lucide-react';
import { useState } from 'react';

interface StepAssetsProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const StepAssets = ({ data, updateData, onNext, onPrev }: StepAssetsProps) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      updateData({ uploadedFiles: [...data.uploadedFiles, ...files], hasAssets: true });
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      updateData({ uploadedFiles: [...data.uploadedFiles, ...files], hasAssets: true });
    }
  };

  const removeFile = (index: number) => {
    const updated = data.uploadedFiles.filter((_, i) => i !== index);
    updateData({ uploadedFiles: updated });
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-foreground">חומרים יצירתיים</h1>
        <p className="text-lg text-muted-foreground">
          העלה לוגו, תמונות או סרטונים לקמפיינים שלך
        </p>
      </div>

      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
          ${dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-border bg-card hover:border-primary/50'
          }
          ${data.createAutomatically ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={data.createAutomatically}
        />
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            <Upload className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">גרור קבצים לכאן</p>
            <p className="text-sm text-muted-foreground">או לחץ לבחירה</p>
          </div>
        </div>
      </div>

      {/* Uploaded Files */}
      {data.uploadedFiles.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {data.uploadedFiles.map((file, index) => (
            <div 
              key={index}
              className="relative aspect-square rounded-lg bg-muted overflow-hidden group"
            >
              {file.type.startsWith('image/') ? (
                <img 
                  src={URL.createObjectURL(file)} 
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <button
                onClick={() => removeFile(index)}
                className="absolute top-1 left-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground 
                         opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Auto Generate Option */}
      <div className={`
        p-5 rounded-xl border-2 transition-all duration-300
        ${data.createAutomatically 
          ? 'border-primary bg-primary/5' 
          : 'border-border bg-card'
        }
      `}>
        <div className="flex items-center gap-4">
          <Checkbox
            id="autoCreate"
            checked={data.createAutomatically}
            onCheckedChange={(checked) => updateData({ createAutomatically: !!checked })}
          />
          <label htmlFor="autoCreate" className="flex items-center gap-3 cursor-pointer flex-1">
            <div className={`
              w-10 h-10 rounded-lg flex items-center justify-center
              ${data.createAutomatically 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
              }
            `}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-right">
              <p className="font-medium text-foreground">אין לי חומרים - צרו עבורי אוטומטית</p>
              <p className="text-sm text-muted-foreground">ניצור קריאייטיבים מותאמים לעסק שלך</p>
            </div>
          </label>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button 
          variant="gradient" 
          size="lg"
          onClick={onNext}
        >
          המשך
        </Button>
        <Button 
          variant="ghost" 
          size="lg"
          onClick={onPrev}
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          חזור
        </Button>
      </div>
    </div>
  );
};

export default StepAssets;
