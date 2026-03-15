import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, Sparkles, Loader2, Copy, Download, RefreshCw, PartyPopper } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useClientProfile } from '@/hooks/useClientProfile';
import TopNavbar from '@/components/dashboard/TopNavbar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const OCCASION_LABELS: Record<string, string> = {
  'rosh-hashana': 'ראש השנה',
  'sukkot': 'סוכות',
  'chanukah': 'חנוכה',
  'purim': 'פורים',
  'pesach': 'פסח',
  'shavuot': 'שבועות',
  'wedding': 'חתונה',
  'bar-mitzvah': 'בר מצווה',
  'birthday': 'יום הולדת',
  'general': 'ברכה כללית',
};

interface GreetingResult {
  headline: string;
  greetingText: string;
  closingLine: string;
}

const GreetingStudio = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const occasion = searchParams.get('occasion') || 'general';
  const { user } = useAuth();
  const { profile } = useClientProfile();
  const [recipientName, setRecipientName] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GreetingResult | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const profileData = {
        businessName: profile?.business_name,
        phone: profile?.contact_phone,
        email: profile?.contact_email,
        website: profile?.website_url,
      };

      const { data, error } = await supabase.functions.invoke('generate-internal-material', {
        body: {
          type: 'greeting',
          profileData,
          extraContext: {
            occasion,
            recipientName,
            userPrompt: customPrompt,
          },
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data.result);
      toast.success('הברכה נוצרה בהצלחה!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה ביצירת הברכה');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    const text = `${result.headline}\n\n${result.greetingText}\n\n${result.closingLine}\n${profile?.business_name || ''}`;
    navigator.clipboard.writeText(text);
    toast.success('הברכה הועתקה!');
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNavbar />
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/internal-studio')} className="mb-4">
          <ArrowRight className="w-4 h-4 ml-2" />
          חזרה לסטודיו
        </Button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <PartyPopper className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">ברכת {OCCASION_LABELS[occasion] || occasion}</h1>
          <p className="text-muted-foreground">יצירת ברכה ממותגת עבור {profile?.business_name || 'העסק שלך'}</p>
        </div>

        {/* Input Form */}
        <Card className="mb-6">
          <CardContent className="p-6 space-y-4" dir="rtl">
            <div>
              <Label className="text-sm font-medium">שם הנמען (אופציונלי)</Label>
              <Input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="למשל: משפחת כהן, חיים גולדברג..."
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">הנחיות נוספות (אופציונלי)</Label>
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="למשל: טון חם ואישי, הדגש את הקשר העסקי..."
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
                <><Loader2 className="w-5 h-5 ml-2 animate-spin" />יוצר ברכה...</>
              ) : (
                <><Sparkles className="w-5 h-5 ml-2" />צור ברכה</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-8 text-center" dir="rtl">
              <h2 className="text-2xl font-bold text-foreground mb-4">{result.headline}</h2>
              <p className="text-lg text-foreground/90 leading-relaxed mb-4 whitespace-pre-line">{result.greetingText}</p>
              <p className="text-base text-muted-foreground italic mb-2">{result.closingLine}</p>
              <p className="text-sm font-medium text-primary">{profile?.business_name}</p>

              <div className="flex gap-3 justify-center mt-6">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="w-4 h-4 ml-1" />העתק
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

export default GreetingStudio;
