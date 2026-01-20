import { useState } from 'react';
import { WizardData } from '@/types/wizard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Globe, Sparkles, Loader2, Keyboard, ArrowLeft, Wand2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

interface StepMagicLinkProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  onNext: () => void;
}

type InputMode = null | 'website' | 'manual';

const StepMagicLink = ({ data, updateData, onNext }: StepMagicLinkProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [url, setUrl] = useState(data.websiteUrl);
  const [inputMode, setInputMode] = useState<InputMode>(null);

  const handleAnalyze = async () => {
    if (!data.brand.name && !url.trim()) {
      toast.error('נא להזין שם עסק או כתובת אתר');
      return;
    }
    
    setIsAnalyzing(true);
    updateData({ websiteUrl: url });

    try {
      const { data: result, error } = await supabase.functions.invoke('predict-business', {
        body: { 
          brandName: data.brand.name,
          websiteUrl: url.trim() || null
        }
      });

      if (error) throw error;

      const predictions = result?.predictions;
      
      if (predictions) {
        // Show sparkles animation
        setShowSparkles(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setShowSparkles(false);
        
        // Update wizard data with predictions
        updateData({
          websiteUrl: url,
          isScanning: false,
          websiteInsights: {
            industry: predictions.industry || '',
            seniority: predictions.seniority || '',
            coreOffering: predictions.coreOffering || '',
            audience: predictions.audience || '',
            confirmed: false,
          },
        });
        
        toast.success('ניתחנו את העסק בהצלחה!');
        onNext();
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      toast.error('שגיאה בניתוח, נסו שוב או המשיכו ידנית');
      setIsAnalyzing(false);
    }
  };

  const handleScan = async () => {
    if (!url.trim()) return;
    
    setIsScanning(true);
    updateData({ websiteUrl: url, isScanning: true });

    // Simulate initial scanning then proceed
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Use AI to analyze
    await handleAnalyze();
    setIsScanning(false);
  };

  const handleManualContinue = () => {
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
    });
    onNext();
  };

  // Sparkles animation overlay
  if (showSparkles) {
    return (
      <div className="space-y-10">
        <div className="text-center space-y-8">
          <div className="relative w-40 h-40 mx-auto">
            {/* Sparkle animations */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-20 h-20 text-primary animate-pulse" />
            </div>
            {/* Floating sparkles */}
            <div className="absolute top-0 left-4 animate-bounce delay-100">
              <Sparkles className="w-8 h-8 text-yellow-400" />
            </div>
            <div className="absolute top-4 right-2 animate-bounce delay-200">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <div className="absolute bottom-4 left-2 animate-bounce delay-300">
              <Sparkles className="w-6 h-6 text-yellow-500" />
            </div>
            <div className="absolute bottom-0 right-4 animate-bounce">
              <Sparkles className="w-7 h-7 text-primary/80" />
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-3xl font-bold text-foreground animate-pulse">
              ✨ מנתחים את העסק שלכם ✨
            </p>
            <p className="text-lg text-muted-foreground">
              הקסם קורה עכשיו...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Choice Screen
  if (inputMode === null) {
    return (
      <div className="space-y-10">
        {/* Header - larger */}
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg">
            <Sparkles className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            אז {data.userName || 'חבר'}, איך נלמד על {data.brand.name || 'העסק'}?
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto">
            נלמד על העסק שלכם כדי להתאים את הקמפיין בצורה מושלמת
          </p>
        </div>

        {/* Choice Cards - larger and more prominent */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Option A: Website */}
          <Card 
            className="border-3 border-primary/30 hover:border-primary cursor-pointer transition-all hover:shadow-2xl group hover:scale-[1.02]"
            onClick={() => setInputMode('website')}
          >
            <CardContent className="p-10 text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Globe className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                תשאבו מהאתר שלי
              </h3>
              <p className="text-muted-foreground text-base">
                תנו לנו לינק ונלמד את השפה, הצבעים והסגנון שלכם אוטומטית
              </p>
              <div className="pt-4">
                <span className="inline-flex items-center gap-2 text-primary text-lg font-bold bg-primary/10 px-4 py-2 rounded-full">
                  ⚡ המהיר ביותר
                  <ArrowLeft className="w-5 h-5" />
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Option B: Manual */}
          <Card 
            className="border-2 border-muted hover:border-primary/50 cursor-pointer transition-all hover:shadow-xl group hover:scale-[1.02]"
            onClick={() => setInputMode('manual')}
          >
            <CardContent className="p-10 text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                <Keyboard className="w-10 h-10 text-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                אני אקליד ידנית
              </h3>
              <p className="text-muted-foreground text-base">
                אין לי אתר או שאני מעדיף להזין את הפרטים בעצמי
              </p>
              <div className="pt-4">
                <span className="inline-flex items-center gap-2 text-muted-foreground text-base font-medium">
                  🎯 שליטה מלאה
                  <ArrowLeft className="w-5 h-5" />
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Manual Mode - With input fields
  if (inputMode === 'manual') {
    const insights = data.websiteInsights || { industry: '', seniority: '', coreOffering: '', audience: '', confirmed: false };
    
    const handleManualFieldChange = (field: string, value: string) => {
      updateData({
        websiteInsights: {
          ...insights,
          [field]: value,
        },
      });
    };

    const handleManualSubmit = () => {
      if (!insights.industry?.trim() || !insights.coreOffering?.trim()) {
        toast.error('נא למלא לפחות את תחום העיסוק ומה אתם מציעים');
        return;
      }
      updateData({
        websiteInsights: {
          ...insights,
          confirmed: true,
        },
      });
      onNext();
    };

    return (
      <div className="space-y-10">
        {/* Header - larger */}
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg">
            <Keyboard className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            מעולה {data.userName ? data.userName : ''}! ספרו לנו על {data.brand.name || 'העסק'}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto">
            מלאו את הפרטים הבאים כדי שנוכל להתאים את הקמפיין
          </p>
        </div>

        {/* Manual Input Form - larger fields */}
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-primary/20 shadow-xl">
            <CardContent className="p-8 md:p-10 space-y-8">
              {/* Industry */}
              <div className="space-y-3">
                <label className="text-base font-semibold text-foreground block">
                  תחום העיסוק *
                </label>
                <Input
                  placeholder="לדוגמה: אופנה, מסעדנות, טכנולוגיה..."
                  value={insights.industry || ''}
                  onChange={(e) => handleManualFieldChange('industry', e.target.value)}
                  className="text-lg h-14"
                />
              </div>

              {/* Core Offering */}
              <div className="space-y-3">
                <label className="text-base font-semibold text-foreground block">
                  מה אתם מציעים? *
                </label>
                <Textarea
                  placeholder="תארו בקצרה את המוצר או השירות שלכם..."
                  value={insights.coreOffering || ''}
                  onChange={(e) => handleManualFieldChange('coreOffering', e.target.value)}
                  className="text-lg min-h-[100px]"
                />
              </div>

              {/* Seniority */}
              <div className="space-y-3">
                <label className="text-base font-semibold text-foreground block">
                  ותק וניסיון
                </label>
                <Input
                  placeholder="לדוגמה: 5 שנים, חדשים בתחום..."
                  value={insights.seniority || ''}
                  onChange={(e) => handleManualFieldChange('seniority', e.target.value)}
                  className="text-lg h-14"
                />
              </div>

              {/* Target Audience */}
              <div className="space-y-3">
                <label className="text-base font-semibold text-foreground block">
                  קהל היעד
                </label>
                <Input
                  placeholder="לדוגמה: משפחות צעירות, עסקים קטנים..."
                  value={insights.audience || ''}
                  onChange={(e) => handleManualFieldChange('audience', e.target.value)}
                  className="text-lg h-14"
                />
              </div>
              
              {/* AI Auto-fill button */}
              {data.brand.name && (
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  size="lg"
                  variant="outline"
                  className="w-full h-14 text-lg border-primary/50 text-primary hover:bg-primary/10"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-6 h-6 ml-2 animate-spin" />
                      מנתח...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-6 h-6 ml-2" />
                      מלא אוטומטית עם AI ✨
                    </>
                  )}
                </Button>
              )}
              
              <Button
                onClick={handleManualSubmit}
                size="xl"
                variant="gradient"
                className="w-full h-16 text-xl font-bold"
              >
                <Sparkles className="w-6 h-6 ml-2" />
                המשך
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Back Option - more visible */}
        <div className="text-center">
          <Button
            onClick={() => setInputMode(null)}
            variant="ghost"
            size="lg"
            className="text-base"
          >
            ← חזרה לבחירה
          </Button>
        </div>
      </div>
    );
  }

  // Website Mode
  return (
    <div className="space-y-10">
      {/* Header - larger */}
      <div className="text-center space-y-6">
        <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg">
          <Globe className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
          בואו נכיר רגע, בלי דיבורים מיותרים
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto">
          תנו לנו את הלינק לאתר ואנחנו נלמד את השפה שלכם בעצמנו
        </p>
      </div>

      {/* URL Input - larger */}
      <Card className="max-w-2xl mx-auto border-2 border-primary/30 hover:border-primary transition-colors shadow-xl">
        <CardContent className="p-8 md:p-10">
          {!isScanning && !isAnalyzing ? (
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-base font-semibold text-foreground block">
                  שימו פה לינק לאתר
                </label>
                <Input
                  type="url"
                  placeholder="https://www.example.co.il"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="text-xl h-16 text-left ltr"
                  dir="ltr"
                />
              </div>
              
              <Button
                onClick={handleScan}
                disabled={!url.trim()}
                size="xl"
                variant="gradient"
                className="w-full h-16 text-xl font-bold"
              >
                <Wand2 className="w-6 h-6 ml-2" />
                נתח את העסק אוטומטית ✨
              </Button>

              <p className="text-base text-muted-foreground text-center bg-muted/50 p-4 rounded-xl">
                💡 נשתמש בבינה מלאכותית לזהות את סוג העסק, קהל היעד והמוצרים שלכם
              </p>
            </div>
          ) : (
            <div className="py-16 text-center space-y-8">
              <div className="relative w-28 h-28 mx-auto">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <div className="relative w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-14 h-14 text-primary animate-spin" />
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-2xl font-bold text-foreground">
                  מנתחים את העסק שלכם...
                </p>
                <p className="text-lg text-muted-foreground animate-pulse">
                  רק רגע, הקסם קורה...
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Back Option - more visible */}
      {!isScanning && !isAnalyzing && (
        <div className="text-center">
          <Button
            onClick={() => setInputMode(null)}
            variant="ghost"
            size="lg"
            className="text-base"
          >
            ← חזרה לבחירה
          </Button>
        </div>
      )}
    </div>
  );
};

export default StepMagicLink;
