import { useState, useRef } from 'react';
import { WizardData, UploadedMaterial } from '@/types/wizard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Image, FileText, X, ArrowRight, ArrowLeft, FolderOpen } from 'lucide-react';
import { getYourWord } from '@/lib/honorific-utils';

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
      {/* Header - simpler without folder icon */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
          מה עשיתם עד היום?
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto">
          תעלו לפה חומרי פרסום שעשיתם לאחרונה. זה יעזור לנו לשמור על הקו.
        </p>
      </div>

      {/* Drop Zone - framed with upload icon and text together */}
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
          className={`border-2 transition-all cursor-pointer shadow-lg ${
            isDragging
              ? 'border-primary bg-primary/10 shadow-glow'
              : 'border-border hover:border-primary/50 hover:shadow-xl'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="p-12 md:p-16">
            {data.pastMaterials.length === 0 ? (
              <div className="text-center space-y-6">
                {/* Framed upload area with icon and text */}
                <div className="inline-flex flex-col items-center gap-4 p-8 rounded-2xl border-3 border-dashed border-primary/40 bg-primary/5">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Upload className="w-10 h-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-bold text-foreground">
                      גררו לפה קבצים או לחצו להעלאה
                    </p>
                    <p className="text-base text-muted-foreground">
                      תמונות, PDF, כל מה שיש לכם
                    </p>
                  </div>
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
          <div className="w-full max-w-xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-2xl border-2 border-amber-300 shadow-lg">
              <p className="text-center text-lg font-medium text-amber-900">
                💡 חבל, זה יכול לעזור לנו לדייק. בטוח אין איזה PDF ישן?
              </p>
            </div>
            <div className="flex justify-center gap-6">
              <Button 
                variant="default" 
                size="xl" 
                onClick={() => fileInputRef.current?.click()}
                className="h-14 px-8 text-lg font-bold shadow-lg hover:shadow-xl transition-shadow"
              >
                <Upload className="w-6 h-6 ml-2" />
                בעצם יש לי משהו
              </Button>
              <Button 
                variant="outline" 
                size="xl" 
                onClick={onNext}
                className="h-14 px-8 text-lg font-medium"
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
