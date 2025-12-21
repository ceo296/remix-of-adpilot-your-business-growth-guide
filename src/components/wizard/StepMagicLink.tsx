import { useState } from 'react';
import { WizardData } from '@/types/wizard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Globe, Sparkles, Loader2 } from 'lucide-react';

interface StepMagicLinkProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  onNext: () => void;
}

const StepMagicLink = ({ data, updateData, onNext }: StepMagicLinkProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [url, setUrl] = useState(data.websiteUrl);

  const handleScan = async () => {
    if (!url.trim()) return;
    
    setIsScanning(true);
    updateData({ websiteUrl: url, isScanning: true });

    // Simulate scanning with mock data
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Extract brand name from URL (mock)
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const brandName = urlObj.hostname
      .replace('www.', '')
      .split('.')[0]
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());

    updateData({
      isScanning: false,
      brand: {
        ...data.brand,
        name: brandName,
        colors: {
          primary: '#E31E24',
          secondary: '#1a1a2e',
          background: '#FFFFFF',
        },
      },
    });

    setIsScanning(false);
    onNext();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Globe className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-3xl font-bold text-foreground">
          בוא נכיר רגע, בלי דיבורים מיותרים
        </h2>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          תן לנו את הלינק לאתר שלך ואנחנו נלמד את השפה שלכם בעצמנו
        </p>
      </div>

      {/* URL Input */}
      <Card className="max-w-xl mx-auto border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors">
        <CardContent className="p-8">
          {!isScanning ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  שים פה לינק לאתר שלך
                </label>
                <Input
                  type="url"
                  placeholder="https://www.example.co.il"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="text-lg h-14 text-left ltr"
                  dir="ltr"
                />
              </div>
              
              <Button
                onClick={handleScan}
                disabled={!url.trim()}
                size="xl"
                variant="gradient"
                className="w-full"
              >
                <Sparkles className="w-5 h-5 ml-2" />
                יאללה, תלמדו אותי
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                אנחנו נסרוק את האתר ונזהה את הלוגו, הצבעים והסגנון שלכם
              </p>
            </div>
          ) : (
            <div className="py-12 text-center space-y-6">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <div className="relative w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xl font-semibold text-foreground">
                  לומדים את השפה שלכם...
                </p>
                <p className="text-muted-foreground animate-pulse">
                  רק רגע, מעיינים בנתונים...
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skip Option */}
      {!isScanning && (
        <div className="text-center">
          <button
            onClick={() => {
              updateData({
                brand: {
                  ...data.brand,
                  name: 'העסק שלי',
                },
              });
              onNext();
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            אין לי אתר עדיין, אני רוצה להמשיך ידנית
          </button>
        </div>
      )}
    </div>
  );
};

export default StepMagicLink;
