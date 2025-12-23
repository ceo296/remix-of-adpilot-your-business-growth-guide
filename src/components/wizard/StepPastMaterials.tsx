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
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <FolderOpen className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-3xl font-bold text-foreground">
          מה עשיתם עד היום? אל תתקמצנו...
        </h2>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          תעלו לפה חומרי פרסום שעשיתם לאחרונה. זה יעזור לנו לשמור על הקו שלכם.
        </p>
      </div>

      {/* Drop Zone */}
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
          className={`border-2 border-dashed transition-all cursor-pointer ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/30 hover:border-primary/50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="p-12">
            {data.pastMaterials.length === 0 ? (
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-secondary flex items-center justify-center">
                  <Upload className="w-10 h-10 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-semibold text-foreground">
                    גררו לפה קבצים או לחצו להעלאה
                  </p>
                  <p className="text-muted-foreground">
                    תמונות, PDF, כל מה שיש לכם
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.pastMaterials.map((material) => (
                  <div
                    key={material.id}
                    className="relative group rounded-lg overflow-hidden border border-border"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {material.type === 'image' ? (
                      <img
                        src={material.preview}
                        alt={material.name}
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <div className="w-full h-32 bg-secondary flex items-center justify-center">
                        <FileText className="w-10 h-10 text-muted-foreground" />
                      </div>
                    )}
                    <button
                      onClick={() => removeMaterial(material.id)}
                      className="absolute top-2 left-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-xs text-white truncate">{material.name}</p>
                    </div>
                  </div>
                ))}
                
                {/* Add More */}
                <div className="rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center h-32 hover:border-primary/50 transition-colors">
                  <div className="text-center">
                    <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">הוסף עוד</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Skip Message */}
      {data.pastMaterials.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          חבל, זה יכול לעזור לנו לדייק. בטוח אין איזה PDF ישן?
        </p>
      )}

      {/* Navigation */}
      <div className="flex flex-col items-center gap-4 max-w-3xl mx-auto pt-6">
        {/* Primary CTA - only enabled when materials uploaded */}
        <Button 
          variant="gradient" 
          size="lg" 
          onClick={onNext}
          disabled={data.pastMaterials.length === 0}
          className="w-full max-w-md"
        >
          קדימה, ממשיכים
          <ArrowLeft className="w-4 h-4 mr-2" />
        </Button>
        
        {/* Secondary skip option */}
        {data.pastMaterials.length === 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onNext}
            className="text-muted-foreground hover:text-foreground"
          >
            אין לי שום חומרי פרסום להציג
          </Button>
        )}
        
        {/* Back button */}
        <Button variant="outline" size="sm" onClick={onPrev} className="mt-2">
          <ArrowRight className="w-4 h-4 ml-2" />
          חזרה
        </Button>
      </div>
    </div>
  );
};

export default StepPastMaterials;
