import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ImageIcon, Wand2, ZoomIn, Type, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type FormatType = 'instagram' | 'newspaper-strip' | 'full-page' | 'banner';
type StyleType = 'photorealistic' | 'vector' | '3d' | 'classic';

const FORMATS: { id: FormatType; label: string; size: string }[] = [
  { id: 'instagram', label: 'סטורי אינסטגרם', size: '1080x1920' },
  { id: 'newspaper-strip', label: 'פס עיתון', size: '1200x300' },
  { id: 'full-page', label: 'עמוד מלא', size: '2480x3508' },
  { id: 'banner', label: 'באנר לאתר', size: '1920x600' },
];

const STYLES: { id: StyleType; label: string; icon: string }[] = [
  { id: 'photorealistic', label: 'צילום ריאליסטי', icon: '📷' },
  { id: 'vector', label: 'וקטור/איור', icon: '🎨' },
  { id: '3d', label: 'תלת מימד', icon: '🧊' },
  { id: 'classic', label: 'ציור קלאסי', icon: '🖼️' },
];

interface GeneratedImage {
  id: string;
  url: string;
  status: 'approved' | 'needs-review' | 'pending';
}

const CreativeStudio = () => {
  const [selectedFormat, setSelectedFormat] = useState<FormatType>('instagram');
  const [selectedStyle, setSelectedStyle] = useState<StyleType>('photorealistic');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('נא להזין תיאור למודעה');
      return;
    }

    setIsGenerating(true);
    toast.info('הרובוט עובד על זה... 🤖');

    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Mock generated images with kosher check status
    const mockImages: GeneratedImage[] = [
      { id: '1', url: '/placeholder.svg', status: 'approved' },
      { id: '2', url: '/placeholder.svg', status: 'approved' },
      { id: '3', url: '/placeholder.svg', status: 'needs-review' },
      { id: '4', url: '/placeholder.svg', status: 'approved' },
    ];

    setGeneratedImages(mockImages);
    setIsGenerating(false);
    toast.success('הסקיצות מוכנות! בסייעתא דשמיא');
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
            {/* Format Selector */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  בחר פורמט
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {FORMATS.map(format => (
                    <button
                      key={format.id}
                      onClick={() => setSelectedFormat(format.id)}
                      className={`p-4 rounded-lg border-2 transition-all text-right ${
                        selectedFormat === format.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium">{format.label}</div>
                      <div className="text-sm text-muted-foreground">{format.size}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Prompt Input */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">תאר מה תרצה לראות במודעה</h3>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="למשל: משפחה חרדית שמחה סביב שולחן שבת, אור חם, אווירה חגיגית..."
                  className="min-h-[120px] resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  ככל שתפרט יותר, התוצאה תהיה מדויקת יותר
                </p>
              </CardContent>
            </Card>

            {/* Style Toggle */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">סגנון עיצובי</h3>
                <div className="grid grid-cols-2 gap-3">
                  {STYLES.map(style => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                        selectedStyle === style.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="text-2xl">{style.icon}</span>
                      <span className="font-medium">{style.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full h-14 text-lg"
              variant="gradient"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin ml-2" />
                  הרובוט עובד על זה...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 ml-2" />
                  צור סקיצות בסייעתא דשמיא
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
