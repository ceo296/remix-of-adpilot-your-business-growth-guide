import { useState, useRef } from 'react';
import { WizardData } from '@/types/wizard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Globe, Sparkles, Loader2, Keyboard, ArrowLeft, Wand2, Upload, FileText, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { getYourWord, getGreeting } from '@/lib/honorific-utils';
import { BrandingStudio } from './BrandingStudio';

interface UploadedFile {
  name: string;
  type: string;
  dataUrl: string;
}

interface StepMagicLinkProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  onNext: () => void;
  onPrev?: () => void;
}

type InputMode = null | 'website' | 'manual';

// URL validation helper
const isValidUrl = (urlString: string): boolean => {
  if (!urlString.trim()) return true; // Empty is valid (optional field)
  try {
    const url = new URL(urlString.startsWith('http') ? urlString : `https://${urlString}`);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const StepMagicLink = ({ data, updateData, onNext, onPrev }: StepMagicLinkProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [url, setUrl] = useState(data.websiteUrl);
  const [inputMode, setInputMode] = useState<InputMode>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [socialUrlError, setSocialUrlError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<UploadedFile | null>(null);
  const [showBrandingStudio, setShowBrandingStudio] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newFile: UploadedFile = {
          name: file.name,
          type: file.type,
          dataUrl: event.target?.result as string,
        };
        setLogoFile(newFile);
        // Update wizard data with the logo
        updateData({
          brand: {
            ...data.brand,
            logo: event.target?.result as string,
          }
        });
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    updateData({
      brand: {
        ...data.brand,
        logo: null,
      }
    });
  };

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
        
        // Use AI-detected business name if available
        const detectedName = predictions.businessName || data.brand.name;
        
        // Update wizard data with predictions
        updateData({
          websiteUrl: url,
          isScanning: false,
          brand: {
            ...data.brand,
            name: detectedName,
          },
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

  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (value.trim() && !isValidUrl(value)) {
      setUrlError('כתובת האתר אינה תקינה. יש להזין כתובת מלאה (לדוגמה: www.example.co.il)');
    } else {
      setUrlError(null);
    }
  };

  const handleSocialUrlChange = (value: string) => {
    updateData({ socialUrl: value });
    if (value.trim() && !isValidUrl(value)) {
      setSocialUrlError('כתובת הלינק אינה תקינה. יש להזין כתובת מלאה');
    } else {
      setSocialUrlError(null);
    }
  };

  const handleScan = async () => {
    const targetUrl = url.trim() || data.socialUrl?.trim();
    if (!targetUrl) return;
    
    // Validate before scanning
    if (url.trim() && !isValidUrl(url)) {
      setUrlError('כתובת האתר אינה תקינה. יש להזין כתובת מלאה (לדוגמה: www.example.co.il)');
      return;
    }
    if (data.socialUrl?.trim() && !isValidUrl(data.socialUrl)) {
      setSocialUrlError('כתובת הלינק אינה תקינה. יש להזין כתובת מלאה');
      return;
    }
    
    setIsScanning(true);
    updateData({ websiteUrl: url, isScanning: true });

    try {
      // First, try to scrape the website with Firecrawl
      console.log('Scraping website with Firecrawl:', targetUrl);
      
      const { data: scrapeResult, error: scrapeError } = await supabase.functions.invoke('scrape-website', {
        body: { 
          url: targetUrl,
          options: {
            formats: ['markdown', 'branding'],
            onlyMainContent: true,
          }
        }
      });

      if (scrapeError) {
        console.error('Firecrawl scrape error:', scrapeError);
        // Fallback to AI prediction if scraping fails
        await handleAnalyze();
      } else if (scrapeResult?.success && scrapeResult?.data) {
        console.log('Firecrawl scrape successful:', scrapeResult);
        
        // Extract data from Firecrawl response
        const scrapedData = scrapeResult.data;
        const branding = scrapedData.branding;
        const markdown = scrapedData.markdown || '';
        
        // Show sparkles animation
        setShowSparkles(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setShowSparkles(false);
        
        // Now use AI to analyze the scraped content
        const { data: aiResult, error: aiError } = await supabase.functions.invoke('predict-business', {
          body: { 
            brandName: data.brand.name,
            websiteUrl: targetUrl,
            scrapedContent: markdown.substring(0, 3000), // Limit content for AI
            brandingInfo: branding,
          }
        });

        if (aiError) {
          console.error('AI analysis error:', aiError);
        }

        const predictions = aiResult?.predictions || {};
        
        // Use AI-detected business name if available (more accurate than user-entered name)
        const detectedName = predictions.businessName || data.brand.name;
        
        // Combine scraped branding with AI predictions
        updateData({
          websiteUrl: url,
          socialUrl: data.socialUrl,
          isScanning: false,
          brand: {
            ...data.brand,
            name: detectedName,
          },
          websiteInsights: {
            industry: predictions.industry || '',
            seniority: predictions.seniority || '',
            coreOffering: predictions.coreOffering || '',
            audience: predictions.audience || '',
            confirmed: false,
          },
          // Save scraped branding colors if available
          scrapedBranding: branding ? {
            primaryColor: branding.colors?.primary,
            secondaryColor: branding.colors?.secondary,
            backgroundColor: branding.colors?.background,
            logo: branding.images?.logo || branding.logo,
          } : undefined,
        });
        
        toast.success('שאבנו נתונים מהאתר בהצלחה!');
        onNext();
      } else {
        // Firecrawl returned but no data - fallback to AI
        console.log('No scrape data, falling back to AI prediction');
        await handleAnalyze();
      }
    } catch (error) {
      console.error('Scan error:', error);
      // Fallback to AI prediction on any error
      await handleAnalyze();
    }
    
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
              ✨ מנתחים את העסק {getYourWord(data.honorific)} ✨
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
      <>
        <div className="space-y-10">
          {/* Header - larger */}
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg">
              <Sparkles className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              אז {data.userName || 'חבר'}, בואו נלמד על {data.brand.name || 'העסק'}
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto">
              קודם כל, נעלה את הלוגו ואז נלמד עוד על העסק
            </p>
          </div>

          {/* Logo Upload Section - Required */}
          <Card className="max-w-2xl mx-auto border-2 border-primary/20 shadow-xl">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-md shadow-indigo-500/30 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <label className="text-base font-semibold text-foreground flex items-center gap-2">
                  העלה לוגו / ספר מותג
                  <span className="text-destructive text-lg">*</span>
                </label>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              {/* Upload area or preview */}
              {logoFile || data.brand.logo ? (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
                  {(logoFile?.type?.startsWith('image/') || (data.brand.logo && !data.brand.logo.startsWith('data:application/pdf'))) ? (
                    <img
                      src={logoFile?.dataUrl || data.brand.logo || ''}
                      alt="לוגו"
                      className="h-16 w-16 object-contain rounded-lg bg-white"
                    />
                  ) : (
                    <div className="h-16 w-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-md shadow-green-500/30">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <span className="flex-1 text-base font-medium text-foreground truncate">
                    {logoFile?.name || 'לוגו העסק'}
                  </span>
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-destructive" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full min-h-[120px] rounded-2xl border-3 border-dashed flex items-center justify-center overflow-hidden transition-all cursor-pointer group border-indigo-300 hover:border-indigo-500 bg-gradient-to-br from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100"
                >
                  <div className="text-center p-6 group-hover:scale-105 transition-transform">
                    <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-md shadow-indigo-500/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-base font-medium text-indigo-700">לחץ להעלאה</span>
                    <span className="text-sm text-indigo-500 block mt-1">(תמונות או PDF)</span>
                  </div>
                </div>
              )}

              {/* No branding button */}
              {!logoFile && !data.brand.logo && (
                <button
                  type="button"
                  onClick={() => setShowBrandingStudio(true)}
                  className="w-full p-4 rounded-xl border-2 border-dashed border-violet-300 hover:border-violet-500 bg-gradient-to-br from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 transition-all flex items-center justify-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-md shadow-violet-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-semibold text-violet-700">אין לי מיתוג - תעזרו לי</span>
                </button>
              )}
            </CardContent>
          </Card>

          {/* Choice Cards - How to learn about the business */}
          {(logoFile || data.brand.logo) && (
            <>
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">מעולה! עכשיו איך נלמד עוד על העסק?</p>
              </div>
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
                      תנו לנו לינק ונלמד את השפה והסגנון אוטומטית
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
            </>
          )}

          {/* Back to previous step - always visible */}
          {onPrev && (
            <div className="text-center pt-6">
              <Button
                onClick={onPrev}
                variant="outline"
                size="lg"
                className="text-lg gap-2 px-8 h-14"
              >
                ← חזרה לשלב הקודם
              </Button>
            </div>
          )}
        </div>

        {/* Branding Studio Modal */}
        <BrandingStudio 
          isOpen={showBrandingStudio} 
          onClose={() => setShowBrandingStudio(false)} 
        />
      </>
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

        {/* Back Options - more visible */}
        <div className="text-center space-y-3">
          <Button
            onClick={() => setInputMode(null)}
            variant="ghost"
            size="lg"
            className="text-base"
          >
            ← חזרה לבחירה
          </Button>
          {onPrev && (
            <div>
              <Button
                onClick={onPrev}
                variant="outline"
                size="lg"
                className="border-2 border-muted-foreground/30 hover:border-primary hover:bg-primary/5"
              >
                ← חזרה לשלב הקודם
              </Button>
            </div>
          )}
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
            תנו לנו את הלינק לאתר ואנחנו נלמד את השפה {getYourWord(data.honorific)} בעצמנו
        </p>
      </div>

      {/* URL Input - larger */}
      <Card className="max-w-2xl mx-auto border-2 border-primary/30 hover:border-primary transition-colors shadow-xl">
        <CardContent className="p-8 md:p-10">
          {!isScanning && !isAnalyzing ? (
            <div className="space-y-8">
              {/* Primary: Website URL */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  <label className="text-base font-semibold text-foreground">
                    לינק לאתר (עדיפות עליונה)
                  </label>
                </div>
                <Input
                  type="url"
                  placeholder="https://www.example.co.il"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className={`text-xl h-16 text-left ltr ${urlError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  dir="ltr"
                />
                {urlError && (
                  <p className="text-sm text-red-500 mt-1">{urlError}</p>
                )}
              </div>

              {/* Optional: Social Media Link */}
              <div className="space-y-3 pt-2 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📱</span>
                  <label className="text-sm font-medium text-muted-foreground">
                    או לינק לרשת חברתית (אופציונלי)
                  </label>
                </div>
                <Input
                  type="url"
                  placeholder="לינק לפייסבוק, אינסטגרם, לינקדאין..."
                  value={data.socialUrl || ''}
                  onChange={(e) => handleSocialUrlChange(e.target.value)}
                  className={`text-lg h-14 text-left ltr ${socialUrlError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  dir="ltr"
                />
                {socialUrlError && (
                  <p className="text-sm text-red-500 mt-1">{socialUrlError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  אם אין לכם אתר, נוכל לשאוב מידע גם מהרשתות החברתיות
                </p>
              </div>
              
              <Button
                onClick={handleScan}
                disabled={(!url.trim() && !data.socialUrl?.trim()) || !!urlError || !!socialUrlError}
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
                  מנתחים את העסק {getYourWord(data.honorific)}...
                </p>
                <p className="text-lg text-muted-foreground animate-pulse">
                  רק רגע, הקסם קורה...
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Back Options - more visible */}
      {!isScanning && !isAnalyzing && (
        <div className="text-center space-y-3">
          <Button
            onClick={() => setInputMode(null)}
            variant="ghost"
            size="lg"
            className="text-base"
          >
            ← חזרה לבחירה
          </Button>
          {onPrev && (
            <div>
              <Button
                onClick={onPrev}
                variant="outline"
                size="lg"
                className="border-2 border-muted-foreground/30 hover:border-primary hover:bg-primary/5"
              >
                ← חזרה לשלב הקודם
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StepMagicLink;
