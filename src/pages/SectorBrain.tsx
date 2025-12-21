import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Brain, Trophy, AlertOctagon, Palette, Upload, X, FileImage, FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface UploadedAsset {
  id: string;
  name: string;
  type: 'image' | 'document';
  zone: 'fame' | 'redlines' | 'assets';
  preview?: string;
}

type UploadZone = 'fame' | 'redlines' | 'assets';

const SectorBrain = () => {
  const [uploads, setUploads] = useState<UploadedAsset[]>([]);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [isTraining, setIsTraining] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent, zone: UploadZone) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    
    const newUploads: UploadedAsset[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' : 'document',
      zone,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));

    setUploads(prev => [...prev, ...newUploads]);
    
    const zoneNames = {
      fame: 'היכל התהילה',
      redlines: 'הקו האדום',
      assets: 'נכסי המותג',
    };
    
    toast.success(`${files.length} קבצים נוספו ל${zoneNames[zone]}`);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeUpload = (id: string) => {
    setUploads(prev => prev.filter(u => u.id !== id));
  };

  const getZoneUploads = (zone: UploadZone) => uploads.filter(u => u.zone === zone);

  const startTraining = async () => {
    if (uploads.length === 0) {
      toast.error('יש להעלות לפחות קובץ אחד ללימוד');
      return;
    }

    setIsTraining(true);
    setTrainingProgress(0);

    // Simulate training progress
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setTrainingProgress(i);
    }

    setIsTraining(false);
    toast.success('המערכת למדה בהצלחה! כעת היא מכירה את הסגנון שלכם');
  };

  const UploadZoneCard = ({ 
    zone, 
    title, 
    description, 
    icon: Icon, 
    color 
  }: { 
    zone: UploadZone; 
    title: string; 
    description: string; 
    icon: React.ElementType;
    color: string;
  }) => (
    <Card 
      className="border-2 border-dashed transition-all hover:border-primary/50"
      onDrop={(e) => handleDrop(e, zone)}
      onDragOver={handleDragOver}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className={`h-5 w-5 ${color}`} />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="min-h-[150px] bg-muted/30 rounded-lg flex flex-col items-center justify-center p-4 border border-border/50">
          {getZoneUploads(zone).length === 0 ? (
            <>
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground text-center">
                גרור ושחרר קבצים לכאן
              </p>
            </>
          ) : (
            <div className="w-full space-y-2">
              {getZoneUploads(zone).map(upload => (
                <div 
                  key={upload.id}
                  className="flex items-center gap-3 bg-background rounded-lg p-2 border border-border"
                >
                  {upload.type === 'image' && upload.preview ? (
                    <img 
                      src={upload.preview} 
                      alt={upload.name}
                      className="h-10 w-10 rounded object-cover"
                    />
                  ) : upload.type === 'image' ? (
                    <FileImage className="h-10 w-10 text-primary" />
                  ) : (
                    <FileText className="h-10 w-10 text-muted-foreground" />
                  )}
                  <span className="flex-1 truncate text-sm">{upload.name}</span>
                  <button 
                    onClick={() => removeUpload(upload.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowRight className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold font-assistant flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                בית הספר של האלגוריתם
              </h1>
              <p className="text-sm text-muted-foreground">
                כאן מלמדים את המערכת מה זה 'פרסום חרדי איכותי' ומה זה 'אסור בתכלית האיסור'
              </p>
            </div>
          </div>
          <Link to="/studio">
            <Button variant="outline" size="sm">
              חזרה לסטודיו
              <Sparkles className="h-4 w-4 mr-2" />
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Training Status */}
        {isTraining && (
          <Card className="mb-6 border-primary/30 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Brain className="h-8 w-8 text-primary animate-pulse" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">לימוד המערכת בתהליך...</h3>
                  <Progress value={trainingProgress} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-1">
                    {trainingProgress}% - האלגוריתם לומד את הסגנון שלכם
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="bg-success/10 border-success/30">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-success">{getZoneUploads('fame').length}</div>
              <div className="text-sm text-muted-foreground">דוגמאות מוצלחות</div>
            </CardContent>
          </Card>
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-destructive">{getZoneUploads('redlines').length}</div>
              <div className="text-sm text-muted-foreground">קווים אדומים</div>
            </CardContent>
          </Card>
          <Card className="bg-primary/10 border-primary/30">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-primary">{getZoneUploads('assets').length}</div>
              <div className="text-sm text-muted-foreground">נכסי מותג</div>
            </CardContent>
          </Card>
        </div>

        {/* Upload Zones */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <UploadZoneCard
            zone="fame"
            title="היכל התהילה"
            description="העלו קמפיינים מוצלחים מהעבר. האלגוריתם ילמד מה עובד אצלכם"
            icon={Trophy}
            color="text-success"
          />
          <UploadZoneCard
            zone="redlines"
            title="הקו האדום - סייגים"
            description="העלו דוגמאות לדברים אסורים - תמונות או טקסטים שלא עוברים"
            icon={AlertOctagon}
            color="text-destructive"
          />
          <UploadZoneCard
            zone="assets"
            title="נכסי המותג"
            description="לוגו, פונטים מיוחדים, אייקונים - כל מה שמייחד את המותג"
            icon={Palette}
            color="text-primary"
          />
        </div>

        {/* Digital Mashgiach Info */}
        <Card className="mb-8 bg-muted/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">המשגיח הדיגיטלי</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  לפני שכל יצירה מוצגת לכם, המערכת מריצה "בדיקת כשרות" אוטומטית.
                  היא משווה את התוצאה לדוגמאות שהעלתם כאן ומסננת תוכן בעייתי.
                </p>
                <div className="flex gap-3">
                  <Badge className="bg-success text-success-foreground">
                    מאושר בסינון ראשוני ✓
                  </Badge>
                  <Badge className="bg-warning text-warning-foreground">
                    דורש בדיקה אנושית ⚠️
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Train Button */}
        <div className="text-center">
          <Button
            onClick={startTraining}
            disabled={isTraining || uploads.length === 0}
            size="xl"
            variant="gradient"
            className="px-12"
          >
            {isTraining ? (
              'המערכת לומדת...'
            ) : (
              <>
                <Brain className="h-5 w-5 ml-2" />
                התחל לימוד המערכת
              </>
            )}
          </Button>
          <p className="text-sm text-muted-foreground mt-3">
            ככל שתעלו יותר דוגמאות, המערכת תבין טוב יותר את הסגנון שלכם
          </p>
        </div>
      </div>
    </div>
  );
};

export default SectorBrain;
