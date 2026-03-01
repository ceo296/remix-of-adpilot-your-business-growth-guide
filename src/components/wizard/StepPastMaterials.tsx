import { useState, useRef } from 'react';
import { WizardData, UploadedMaterial, AdLayoutAnalysis } from '@/types/wizard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, X, ArrowLeft, ArrowRight, Loader2, Eye, Palette, Layout, Type, MapPin, Sparkles, Camera } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface StepPastMaterialsProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const StepPastMaterials = ({ data, updateData, onNext, onPrev }: StepPastMaterialsProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  const [viewingAnalysis, setViewingAnalysis] = useState<UploadedMaterial | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const businessPhotoInputRef = useRef<HTMLInputElement>(null);

  const handleBusinessPhotos = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const photo: UploadedMaterial = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: 'image',
          preview: event.target?.result as string,
        };
        updateData({ businessPhotos: [...(data.businessPhotos || []), photo] });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeBusinessPhoto = (id: string) => {
    updateData({
      businessPhotos: (data.businessPhotos || []).filter((p) => p.id !== id),
    });
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const material: UploadedMaterial = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'document',
          preview: event.target?.result as string,
        };
        
        const updatedMaterials = [...data.pastMaterials, material];
        updateData({ pastMaterials: updatedMaterials });

        // Auto-analyze images
        if (file.type.startsWith('image/')) {
          analyzeAd(material, updatedMaterials);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const analyzeAd = async (material: UploadedMaterial, currentMaterials: UploadedMaterial[]) => {
    setAnalyzingIds(prev => new Set([...prev, material.id]));
    
    try {
      const { data: result, error } = await supabase.functions.invoke('analyze-ad-layout', {
        body: { imageDataUrl: material.preview }
      });

      if (error) throw error;

      if (result?.analysis) {
        const analysis: AdLayoutAnalysis = {
          logoPosition: result.analysis.logoPosition || '',
          gridStructure: result.analysis.gridStructure || '',
          colorPalette: result.analysis.colorPalette || [],
          typography: result.analysis.typography || '',
          layoutNotes: result.analysis.layoutNotes || '',
        };

        updateData({
          pastMaterials: currentMaterials.map(m =>
            m.id === material.id ? { ...m, adAnalysis: analysis } : m
          )
        });
        toast.success(`ניתוח "${material.name}" הושלם!`);
      }
    } catch (err) {
      console.error('Ad analysis error:', err);
      toast.error(`שגיאה בניתוח "${material.name}"`);
    } finally {
      setAnalyzingIds(prev => {
        const next = new Set(prev);
        next.delete(material.id);
        return next;
      });
    }
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

  const handleDragLeave = () => setIsDragging(false);

  const removeMaterial = (id: string) => {
    updateData({
      pastMaterials: data.pastMaterials.filter((m) => m.id !== id),
    });
  };

  const analysisFields = [
    { key: 'logoPosition' as const, icon: MapPin, label: 'מיקום לוגו', color: 'text-blue-400' },
    { key: 'gridStructure' as const, icon: Layout, label: 'גריד וליאאוט', color: 'text-emerald-400' },
    { key: 'typography' as const, icon: Type, label: 'טיפוגרפיה', color: 'text-amber-400' },
    { key: 'layoutNotes' as const, icon: Eye, label: 'תובנות נוספות', color: 'text-violet-400' },
  ];

  return (
    <div className="space-y-10">
      <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
          מה עשיתם עד היום?
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto">
          תעלו מודעה שעשיתם לאחרונה. המערכת תנתח את הגריד, מיקום הלוגו, הצבעים והטיפוגרפיה.
        </p>
      </div>

      {/* Business / Product Photos Section */}
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Camera className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">תמונות מהעסק או המוצר</h3>
            <p className="text-sm text-muted-foreground">
              תמונות שנוכל להשתמש בהן בחומרי הפרסום — מוצרים, חנות, צוות, לפני/אחרי...
            </p>
          </div>
        </div>
        
        <input
          ref={businessPhotoInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleBusinessPhotos(e.target.files)}
          className="hidden"
        />
        
        <Card 
          className="border-2 border-dashed border-primary/30 hover:border-primary/60 transition-all cursor-pointer"
          onClick={() => businessPhotoInputRef.current?.click()}
        >
          <CardContent className="p-6">
            {data.businessPhotos && data.businessPhotos.length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                {data.businessPhotos.map((photo) => (
                  <div key={photo.id} className="relative group rounded-lg overflow-hidden border border-border" onClick={(e) => e.stopPropagation()}>
                    <img src={photo.preview} alt={photo.name} className="w-full h-28 object-cover" />
                    <button
                      onClick={() => removeBusinessPhoto(photo.id)}
                      className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                      <p className="text-xs text-white truncate">{photo.name}</p>
                    </div>
                  </div>
                ))}
                <div className="rounded-lg border-2 border-dashed border-primary/30 flex items-center justify-center h-28 hover:border-primary hover:bg-primary/5 transition-all">
                  <div className="text-center">
                    <Camera className="w-6 h-6 mx-auto text-primary mb-1" />
                    <span className="text-xs font-medium text-primary">הוסף עוד</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3 py-4">
                <div className="inline-flex items-center gap-3 text-muted-foreground">
                  <Camera className="w-8 h-8 text-primary/50" />
                  <span className="text-base">העלו תמונות מהמוצר, החנות, או כל דבר שרלוונטי לפרסום</span>
                </div>
                <p className="text-sm text-muted-foreground/70">אופציונלי — אבל עוזר לנו ליצור קריאייטיב אותנטי ומדויק</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Divider */}
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-border"></div>
          <span className="text-sm text-muted-foreground font-medium">מודעות קודמות לניתוח</span>
          <div className="flex-1 h-px bg-border"></div>
        </div>
      </div>

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
                <div className="inline-flex flex-col items-center gap-4 p-8 rounded-2xl border-3 border-dashed border-primary/40 bg-primary/5">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Upload className="w-10 h-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-bold text-foreground">
                      גררו לפה מודעה או לחצו להעלאה
                    </p>
                    <p className="text-base text-muted-foreground">
                      תמונות, PDF — נקרא את הגריד ומיקום הלוגו
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {data.pastMaterials.map((material) => {
                  const isAnalyzing = analyzingIds.has(material.id);
                  const hasAnalysis = !!material.adAnalysis;
                  
                  return (
                    <div
                      key={material.id}
                      className="relative group rounded-xl overflow-hidden border-2 border-border shadow-md"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {material.type === 'image' ? (
                        <img
                          src={material.preview}
                          alt={material.name}
                          className="w-full h-40 object-cover"
                        />
                      ) : (
                        <div className="w-full h-40 bg-secondary flex items-center justify-center">
                          <FileText className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      
                      {/* Status badges */}
                      <div className="absolute top-2 right-2">
                        {isAnalyzing && (
                          <Badge className="bg-primary/90 text-primary-foreground gap-1 animate-pulse">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            מנתח...
                          </Badge>
                        )}
                        {hasAnalysis && !isAnalyzing && (
                          <Badge 
                            className="bg-emerald-600 text-white gap-1 cursor-pointer hover:bg-emerald-700"
                            onClick={() => setViewingAnalysis(material)}
                          >
                            <Sparkles className="h-3 w-3" />
                            נותח ✓
                          </Badge>
                        )}
                      </div>

                      {/* View analysis button */}
                      {hasAnalysis && !isAnalyzing && (
                        <button
                          onClick={() => setViewingAnalysis(material)}
                          className="absolute inset-0 bg-foreground/0 hover:bg-foreground/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                        >
                          <span className="bg-background/90 text-foreground px-3 py-1.5 rounded-lg text-sm font-medium">
                            צפה בניתוח
                          </span>
                        </button>
                      )}

                      <button
                        onClick={() => removeMaterial(material.id)}
                        className="absolute top-2 left-2 w-7 h-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <p className="text-sm text-white truncate font-medium">{material.name}</p>
                      </div>
                    </div>
                  );
                })}
                
                {/* Add More */}
                <div className="rounded-xl border-3 border-dashed border-primary/40 flex items-center justify-center h-40 hover:border-primary hover:bg-primary/5 transition-all">
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

      {/* Navigation */}
      <div className="flex flex-col items-center gap-6 max-w-3xl mx-auto pt-6">
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

        {showNudge && data.pastMaterials.length === 0 && (
          <div className="w-full max-w-xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-2xl border-2 border-amber-300 shadow-lg">
              <p className="text-center text-lg font-medium text-amber-900">
                💡 חבל, זה יכול לעזור לנו לדייק. בטוח אין איזה מודעה ישנה?
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
        
        <Button variant="outline" size="lg" onClick={onPrev} className="mt-2 text-base">
          <ArrowRight className="w-5 h-5 ml-2" />
          חזרה
        </Button>
      </div>

      {/* Analysis Details Dialog */}
      <Dialog open={!!viewingAnalysis} onOpenChange={() => setViewingAnalysis(null)}>
        <DialogContent className="max-w-2xl" dir="rtl">
          {viewingAnalysis && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                {viewingAnalysis.type === 'image' && (
                  <img 
                    src={viewingAnalysis.preview} 
                    alt={viewingAnalysis.name}
                    className="w-24 h-24 object-cover rounded-lg border border-border"
                  />
                )}
                <div>
                  <h3 className="text-xl font-bold text-foreground">{viewingAnalysis.name}</h3>
                  <p className="text-sm text-muted-foreground">ניתוח מבנה מודעה</p>
                </div>
              </div>

              {viewingAnalysis.adAnalysis && (
                <div className="space-y-4">
                  {analysisFields.map(({ key, icon: Icon, label, color }) => (
                    <div key={key} className="p-4 rounded-xl bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`h-5 w-5 ${color}`} />
                        <h4 className="font-bold text-foreground">{label}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {viewingAnalysis.adAnalysis![key]}
                      </p>
                    </div>
                  ))}

                  {/* Color palette visual */}
                  {viewingAnalysis.adAnalysis.colorPalette?.length > 0 && (
                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <Palette className={`h-5 w-5 text-pink-400`} />
                        <h4 className="font-bold text-foreground">פלטת צבעים</h4>
                      </div>
                      <div className="flex gap-3 flex-wrap">
                        {viewingAnalysis.adAnalysis.colorPalette.map((color, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div 
                              className="w-10 h-10 rounded-lg border-2 border-border shadow-sm"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-xs font-mono text-muted-foreground">{color}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StepPastMaterials;
