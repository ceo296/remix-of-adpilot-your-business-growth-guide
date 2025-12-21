import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ImageIcon, Wand2, ZoomIn, Type, Loader2, Camera, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type EngineType = 'nano-banana' | 'flux-realism';
type StyleType = 'ultra-realistic' | '3d-character' | 'oil-painting';

const ENGINES: { id: EngineType; label: string; sublabel: string; icon: React.ReactNode }[] = [
  { 
    id: 'nano-banana', 
    label: 'ננו-בננה Pro', 
    sublabel: 'מודל טקסט-תמונה (מומלץ למודעות)',
    icon: <Type className="h-5 w-5" />
  },
  { 
    id: 'flux-realism', 
    label: 'פוטו-ריאליסטי', 
    sublabel: 'מודל פוטו-ריאליסטי (ללא טקסט)',
    icon: <Camera className="h-5 w-5" />
  },
];

const STYLES: { id: StyleType; label: string; icon: string }[] = [
  { id: 'ultra-realistic', label: 'צילום אמיתי', icon: '📷' },
  { id: '3d-character', label: 'תלת מימד - פיקסאר', icon: '🧊' },
  { id: 'oil-painting', label: 'ציור שמן - יוקרה', icon: '🖼️' },
];

interface GeneratedImage {
  id: string;
  url: string;
  status: 'approved' | 'needs-review' | 'pending';
}

const CreativeStudio = () => {
  const [selectedEngine, setSelectedEngine] = useState<EngineType>('nano-banana');
  const [selectedStyle, setSelectedStyle] = useState<StyleType>('ultra-realistic');
  const [visualPrompt, setVisualPrompt] = useState('');
  const [textPrompt, setTextPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  const handleGenerate = async () => {
    if (!visualPrompt.trim()) {
      toast.error('נא להזין תיאור לתמונה');
      return;
    }

    if (selectedEngine === 'nano-banana' && !textPrompt.trim()) {
      toast.warning('ננו-בננה מתמחה בטקסט עברי - מומלץ להוסיף טקסט למודעה');
    }

    setIsGenerating(true);
    toast.info('מייצר טיפוגרפיה בעברית... 🎨');

    try {
      // Generate 4 images
      const results: GeneratedImage[] = [];
      
      for (let i = 0; i < 4; i++) {
        const { data, error } = await supabase.functions.invoke('generate-image', {
          body: {
            visualPrompt,
            textPrompt: selectedEngine === 'nano-banana' ? textPrompt : '',
            style: selectedStyle,
            engine: selectedEngine,
          }
        });

        if (error) {
          console.error('Error generating image:', error);
          toast.error(error.message || 'שגיאה ביצירת התמונה');
          continue;
        }

        if (data?.imageUrl) {
          results.push({
            id: `${Date.now()}-${i}`,
            url: data.imageUrl,
            status: data.status === 'needs-review' ? 'needs-review' : 'approved',
          });
        }
      }

      if (results.length > 0) {
        setGeneratedImages(results);
        toast.success('הסקיצות מוכנות! בסייעתא דשמיא');
      } else {
        toast.error('לא הצלחנו ליצור תמונות. נסה שוב.');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('שגיאה ביצירת התמונות');
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusBadge = (status: GeneratedImage['status']) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success text-success-foreground">מאושר בסינון ראשוני ✓</Badge>;
      case 'needs-review':
        return <Badge className="bg-warning text-warning-foreground">דורש בדיקה אנושית ⚠️</Badge>;
      default:
        return null;
    }
  };

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
                <Wand2 className="h-5 w-5 text-primary" />
                סטודיו יצירתי
              </h1>
              <p className="text-sm text-muted-foreground">יוצרים מודעות בסייעתא דשמיא</p>
            </div>
          </div>
          <Link to="/brain">
            <Button variant="outline" size="sm">
              בית הספר של האלגוריתם
              <Sparkles className="h-4 w-4 mr-2" />
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-6 min-h-[calc(100vh-120px)]">
          {/* Left Side - Controls */}
          <div className="space-y-6">
            {/* Engine Selector */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" />
                  בחר מנוע יצירה
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {ENGINES.map(engine => (
                    <button
                      key={engine.id}
                      onClick={() => setSelectedEngine(engine.id)}
                      className={`p-4 rounded-lg border-2 transition-all text-right flex items-center gap-4 ${
                        selectedEngine === engine.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${selectedEngine === engine.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        {engine.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{engine.label}</div>
                        <div className="text-sm text-muted-foreground">{engine.sublabel}</div>
                      </div>
                      {engine.id === 'nano-banana' && (
                        <Badge variant="secondary" className="bg-success/10 text-success">מומלץ</Badge>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Visual Prompt */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label className="font-semibold mb-2 block">תאר את התמונה</Label>
                  <Textarea
                    value={visualPrompt}
                    onChange={(e) => setVisualPrompt(e.target.value)}
                    placeholder="למשל: משפחה חרדית שמחה סביב שולחן שבת, אור חם, אווירה חגיגית..."
                    className="min-h-[100px] resize-none"
                  />
                </div>

                {selectedEngine === 'nano-banana' && (
                  <div>
                    <Label className="font-semibold mb-2 block">מה הטקסט שיהיה כתוב בתמונה?</Label>
                    <Input
                      value={textPrompt}
                      onChange={(e) => setTextPrompt(e.target.value)}
                      placeholder="למשל: שבת שלום, מבצע ענק, חג שמח..."
                      className="text-lg"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      ננו-בננה Pro מתמחה ברינדור טקסט עברי מושלם
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Style Toggle */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">סגנון עיצובי</h3>
                <div className="grid grid-cols-3 gap-3">
                  {STYLES.map(style => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                        selectedStyle === style.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="text-2xl">{style.icon}</span>
                      <span className="font-medium text-sm text-center">{style.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !visualPrompt.trim()}
              className="w-full h-14 text-lg"
              variant="gradient"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin ml-2" />
                  מייצר טיפוגרפיה בעברית...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 ml-2" />
                  צור סקיצה עם ננו-בננה
                </>
              )}
            </Button>
          </div>

          {/* Right Side - Canvas */}
          <div className="bg-muted/30 rounded-xl border border-border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              הסקיצות שלך
            </h3>

            {generatedImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
                <ImageIcon className="h-16 w-16 mb-4 opacity-30" />
                <p>הסקיצות יופיעו כאן</p>
                <p className="text-sm">מלא את הפרטים ולחץ על "צור"</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {generatedImages.map((image) => (
                  <Card key={image.id} className="overflow-hidden group">
                    <div className="relative aspect-square bg-muted">
                      <img
                        src={image.url}
                        alt={`Generated ${image.id}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        {getStatusBadge(image.status)}
                      </div>
                      {/* Action Buttons */}
                      <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="sm" variant="secondary">
                          <Wand2 className="h-4 w-4 ml-1" />
                          עריכה
                        </Button>
                        <Button size="sm" variant="secondary">
                          <ZoomIn className="h-4 w-4 ml-1" />
                          הגדלה
                        </Button>
                        <Button size="sm" variant="secondary">
                          <Type className="h-4 w-4 ml-1" />
                          טקסט
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreativeStudio;
