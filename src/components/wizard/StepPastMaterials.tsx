import { useState, useRef } from 'react';
import { WizardData, UploadedMaterial } from '@/types/wizard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Image, FileText, X, ArrowRight, ArrowLeft, FolderOpen } from 'lucide-react';

interface StepPastMaterialsProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const StepPastMaterials = ({ data, updateData, onNext, onPrev }: StepPastMaterialsProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const newMaterials: UploadedMaterial[] = [];
    
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const material: UploadedMaterial = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'document',
          preview: event.target?.result as string,
        };
        
        updateData({
          pastMaterials: [...data.pastMaterials, material],
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeMaterial = (id: string) => {
    updateData({
      pastMaterials: data.pastMaterials.filter((m) => m.id !== id),
    });
  };

  return (
    <div className="space-y-10">
      {/* Header - larger and more prominent */}
      <div className="text-center space-y-6">
        <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg">
          <FolderOpen className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
          מה עשיתם עד היום? אל תתקמצנו...
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto">
          תעלו לפה חומרי פרסום שעשיתם לאחרונה. זה יעזור לנו לשמור על הקו שלכם.
        </p>
      </div>

      {/* Drop Zone - larger and more prominent */}
      <div className="max-w-3xl mx-auto">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        
        <Card
          className={`border-3 border-dashed transition-all cursor-pointer ${
            isDragging
              ? 'border-primary bg-primary/10 shadow-glow'
              : 'border-primary/40 hover:border-primary hover:bg-primary/5'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="p-12 md:p-16">
            {data.pastMaterials.length === 0 ? (
              <div className="text-center space-y-6">
                <div className="w-24 h-24 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Upload className="w-12 h-12 text-primary" />
                </div>
                <div className="space-y-3">
                  <p className="text-2xl font-bold text-foreground">
                    גררו לפה קבצים או לחצו להעלאה
                  </p>
                  <p className="text-lg text-muted-foreground">
                    תמונות, PDF, כל מה שיש לכם
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {data.pastMaterials.map((material) => (
                  <div
                    key={material.id}
                    className="relative group rounded-xl overflow-hidden border-2 border-border shadow-md"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {material.type === 'image' ? (
                      <img
                        src={material.preview}
                        alt={material.name}
                        className="w-full h-36 object-cover"
                      />
                    ) : (
                      <div className="w-full h-36 bg-secondary flex items-center justify-center">
                        <FileText className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    <button
                      onClick={() => removeMaterial(material.id)}
                      className="absolute top-3 left-3 w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                      <p className="text-sm text-white truncate font-medium">{material.name}</p>
                    </div>
                  </div>
                ))}
                
                {/* Add More */}
                <div className="rounded-xl border-3 border-dashed border-primary/40 flex items-center justify-center h-36 hover:border-primary hover:bg-primary/5 transition-all">
                  <div className="text-center">
                    <Upload className="w-8 h-8 mx-auto text-primary mb-2" />
                    <span className="text-sm font-medium text-primary">הוסף עוד</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Navigation - larger buttons */}
      <div className="flex flex-col items-center gap-6 max-w-3xl mx-auto pt-6">
        {/* Primary CTA - only enabled when materials uploaded */}
        <Button 
          variant="gradient" 
          size="xl" 
          onClick={onNext}
          disabled={data.pastMaterials.length === 0}
          className="w-full max-w-md h-16 text-xl font-bold"
        >
          קדימה, ממשיכים
          <ArrowLeft className="w-6 h-6 mr-2" />
        </Button>
        
        {/* Secondary skip option - show nudge on first click */}
        {data.pastMaterials.length === 0 && !showNudge && (
          <Button 
            variant="ghost" 
            size="lg" 
            onClick={() => setShowNudge(true)}
            className="text-muted-foreground hover:text-foreground text-base"
          >
            אין לי שום חומרי פרסום להציג
          </Button>
        )}

        {/* Nudge message after clicking skip */}
        {showNudge && data.pastMaterials.length === 0 && (
          <div className="w-full max-w-xl space-y-4">
            <p className="text-center text-base text-muted-foreground bg-amber-50 p-4 rounded-xl border border-amber-200">
              💡 חבל, זה יכול לעזור לנו לדייק. בטוח אין איזה PDF ישן?
            </p>
            <div className="flex justify-center gap-4">
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => fileInputRef.current?.click()}
                className="text-base"
              >
                <Upload className="w-5 h-5 ml-2" />
                בעצם יש לי משהו
              </Button>
              <Button 
                variant="ghost" 
                size="lg" 
                onClick={onNext}
                className="text-muted-foreground text-base"
              >
                באמת אין לי, נמשיך
              </Button>
            </div>
          </div>
        )}
        
        {/* Back button - more visible */}
        <Button variant="outline" size="lg" onClick={onPrev} className="mt-2 text-base">
          <ArrowRight className="w-5 h-5 ml-2" />
          חזרה
        </Button>
      </div>
    </div>
  );
};

export default StepPastMaterials;
