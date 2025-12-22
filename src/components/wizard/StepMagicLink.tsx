import { useState } from 'react';
import { WizardData } from '@/types/wizard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Globe, Sparkles, Loader2, Keyboard, ArrowLeft } from 'lucide-react';

interface StepMagicLinkProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  onNext: () => void;
}

type InputMode = null | 'website' | 'manual';

const StepMagicLink = ({ data, updateData, onNext }: StepMagicLinkProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [url, setUrl] = useState(data.websiteUrl);
  const [inputMode, setInputMode] = useState<InputMode>(null);

  const handleScan = async () => {
    if (!url.trim()) return;
    
    setIsScanning(true);
    updateData({ websiteUrl: url, isScanning: true });

    // Simulate initial scanning
    await new Promise(resolve => setTimeout(resolve, 1500));

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

  const handleManualContinue = () => {
    // Set default empty values and skip to insights step with manual mode
    updateData({
      websiteUrl: '',
      isScanning: false,
      websiteInsights: {
        industry: '',
        seniority: '',
        coreOffering: '',
        audience: '',
        confirmed: false,
      },
      brand: {
        ...data.brand,
        name: '',
      },
    });
    onNext();
  };

  // Choice Screen
  if (inputMode === null) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">
            איך נכיר את העסק?
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            נלמד על העסק שלכם כדי להתאים את הקמפיין בצורה מושלמת
          </p>
        </div>

        {/* Choice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Option A: Website */}
          <Card 
            className="border-2 border-muted hover:border-primary/50 cursor-pointer transition-all hover:shadow-lg group"
            onClick={() => setInputMode('website')}
          >
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Globe className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                תשאבו מהאתר שלי
              </h3>
              <p className="text-muted-foreground text-sm">
                תנו לנו לינק ונלמד את השפה, הצבעים והסגנון שלכם אוטומטית
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1 text-primary text-sm font-medium">
                  המהיר ביותר
                  <ArrowLeft className="w-4 h-4" />
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Option B: Manual */}
          <Card 
            className="border-2 border-muted hover:border-primary/50 cursor-pointer transition-all hover:shadow-lg group"
            onClick={() => setInputMode('manual')}
          >
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-xl bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                <Keyboard className="w-8 h-8 text-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                אני אקליד ידנית
              </h3>
              <p className="text-muted-foreground text-sm">
                אין לי אתר או שאני מעדיף להזין את הפרטים בעצמי
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1 text-muted-foreground text-sm font-medium">
                  שליטה מלאה
                  <ArrowLeft className="w-4 h-4" />
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Manual Mode - Skip directly to insights
  if (inputMode === 'manual') {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Keyboard className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">
            מעולה! ספרו לנו על העסק
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            בשלב הבא נאסוף כמה פרטים חשובים על העסק שלכם
          </p>
        </div>

        {/* Continue Button */}
        <div className="max-w-xl mx-auto">
          <Card className="border-2 border-primary/20">
            <CardContent className="p-8 text-center space-y-6">
              <div className="space-y-2">
                <p className="text-foreground font-medium">
                  נשאל אתכם כמה שאלות קצרות:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• שם העסק</li>
                  <li>• תחום העיסוק</li>
                  <li>• ותק וניסיון</li>
                  <li>• קהל היעד</li>
                </ul>
              </div>
              
              <Button
                onClick={handleManualContinue}
                size="xl"
                variant="gradient"
                className="w-full"
              >
                <Sparkles className="w-5 h-5 ml-2" />
                יאללה, בואו נתחיל
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Back Option */}
        <div className="text-center">
          <button
            onClick={() => setInputMode(null)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            חזרה לבחירה
          </button>
        </div>
      </div>
    );
  }

  // Website Mode
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

      {/* Back Option */}
      {!isScanning && (
        <div className="text-center">
          <button
            onClick={() => setInputMode(null)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            חזרה לבחירה
          </button>
        </div>
      )}
    </div>
  );
};

export default StepMagicLink;
