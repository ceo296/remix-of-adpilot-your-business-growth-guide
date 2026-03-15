import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Sparkles, Loader2, Copy, RefreshCw, Newspaper, Quote } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useClientProfile } from '@/hooks/useClientProfile';
import TopNavbar from '@/components/dashboard/TopNavbar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const STYLE_LABELS: Record<string, string> = {
  'product': 'כתבת מוצר',
  'story': 'כתבת סיפור',
  'expert': 'כתבת מומחה',
  'seasonal': 'כתבה עונתית',
};

interface ArticleResult {
  headline: string;
  subheadline: string;
  body: string;
  pullQuote: string;
  callToAction: string;
}

const ArticleStudio = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const style = searchParams.get('style') || 'product';
  const { user } = useAuth();
  const { profile } = useClientProfile();
  const [articleTopic, setArticleTopic] = useState('');
  const [targetLength, setTargetLength] = useState('medium');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<ArticleResult | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const profileData = {
        businessName: profile?.business_name,
        phone: profile?.contact_phone,
        email: profile?.contact_email,
        address: profile?.contact_address,
        website: profile?.website_url,
        xFactors: profile?.x_factors,
        targetAudience: profile?.target_audience,
        winningFeature: profile?.winning_feature,
        openingHours: profile?.opening_hours,
      };

      const { data, error } = await supabase.functions.invoke('generate-internal-material', {
        body: {
          type: 'article',
          profileData,
          extraContext: {
            articleStyle: style,
            articleTopic,
            targetLength,
            userPrompt: customPrompt,
          },
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data.result);
      toast.success('הכתבה נוצרה בהצלחה!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה ביצירת הכתבה');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    const text = `${result.headline}\n${result.subheadline}\n\n${result.body}\n\n"${result.pullQuote}"\n\n${result.callToAction}`;
    navigator.clipboard.writeText(text);
    toast.success('הכתבה הועתקה!');
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNavbar />
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/internal-studio')} className="mb-4">
          <ArrowRight className="w-4 h-4 ml-2" />
          חזרה לסטודיו
        </Button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Newspaper className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{STYLE_LABELS[style] || 'כתבה פרסומית'}</h1>
          <p className="text-muted-foreground">יצירת כתבת תוכן שיווקי עבור {profile?.business_name || 'העסק שלך'}</p>
        </div>

        {/* Input Form */}
        <Card className="mb-6">
          <CardContent className="p-6 space-y-4" dir="rtl">
            <div>
              <Label className="text-sm font-medium">נושא הכתבה</Label>
              <Input
                value={articleTopic}
                onChange={(e) => setArticleTopic(e.target.value)}
                placeholder="למשל: השקת שירות חדש, טיפים מקצועיים, סיפור הקמת העסק..."
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">אורך מבוקש</Label>
              <Select value={targetLength} onValueChange={setTargetLength}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">קצר (200-300 מילים)</SelectItem>
                  <SelectItem value="medium">בינוני (400-600 מילים)</SelectItem>
                  <SelectItem value="long">ארוך (700-1000 מילים)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">הנחיות נוספות (אופציונלי)</Label>
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="למשל: הדגש את הניסיון של 20 שנה, ציין לקוחות מרוצים..."
                rows={2}
                className="mt-1"
              />
            </div>
            <Button
              variant="gradient"
              size="lg"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <><Loader2 className="w-5 h-5 ml-2 animate-spin" />כותב כתבה...</>
              ) : (
                <><Sparkles className="w-5 h-5 ml-2" />צור כתבה</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <Card className="border-primary/20">
            <CardContent className="p-8" dir="rtl">
              <h2 className="text-2xl font-bold text-foreground mb-2">{result.headline}</h2>
              <h3 className="text-lg text-muted-foreground mb-6">{result.subheadline}</h3>
              
              <div className="prose prose-lg max-w-none text-foreground/90 leading-relaxed mb-6 whitespace-pre-line">
                {result.body}
              </div>

              {result.pullQuote && (
                <div className="border-r-4 border-primary pr-4 py-2 my-6 bg-primary/5 rounded-l-lg">
                  <Quote className="w-5 h-5 text-primary mb-1" />
                  <p className="text-lg font-medium text-foreground italic">"{result.pullQuote}"</p>
                </div>
              )}

              {result.callToAction && (
                <p className="text-base text-primary font-medium mt-4">{result.callToAction}</p>
              )}

              <div className="flex gap-3 mt-8">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="w-4 h-4 ml-1" />העתק כתבה
                </Button>
                <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isGenerating}>
                  <RefreshCw className="w-4 h-4 ml-1" />נסה שוב
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ArticleStudio;
