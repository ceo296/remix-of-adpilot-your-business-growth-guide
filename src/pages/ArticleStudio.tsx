import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Sparkles, Loader2, Copy, Pencil, Newspaper, Quote, Check } from 'lucide-react';
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
  const [isEditing, setIsEditing] = useState(false);
  const [editResult, setEditResult] = useState<ArticleResult | null>(null);
  const [revisionNote, setRevisionNote] = useState('');
  const [isRevising, setIsRevising] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setIsEditing(false);
    setRevisionNote('');
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
      setEditResult(data.result);
      toast.success('הכתבה נוצרה בהצלחה!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה ביצירת הכתבה');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevision = async () => {
    if (!revisionNote.trim() || !result) return;
    setIsRevising(true);
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
            userPrompt: `הכתבה הקיימת:\nכותרת: ${result.headline}\nכותרת משנה: ${result.subheadline}\nגוף: ${result.body}\nציטוט: ${result.pullQuote}\nCTA: ${result.callToAction}\n\nהנחיות תיקון (חובה ליישם): ${revisionNote}`,
          },
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data.result);
      setEditResult(data.result);
      setRevisionNote('');
      toast.success('הכתבה עודכנה בהצלחה!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה בתיקון הכתבה');
    } finally {
      setIsRevising(false);
    }
  };

  const copyToClipboard = () => {
    if (!editResult) return;
    const text = `${editResult.headline}\n${editResult.subheadline}\n\n${editResult.body}\n\n"${editResult.pullQuote}"\n\n${editResult.callToAction}`;
    navigator.clipboard.writeText(text);
    toast.success('הכתבה הועתקה!');
  };

  const displayResult = isEditing ? editResult : result;

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
        {displayResult && (
          <Card className="border-primary/20">
            <CardContent className="p-8" dir="rtl">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">כותרת</Label>
                    <Input value={editResult?.headline || ''} onChange={e => setEditResult(prev => prev ? {...prev, headline: e.target.value} : prev)} className="text-xl font-bold mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">כותרת משנה</Label>
                    <Input value={editResult?.subheadline || ''} onChange={e => setEditResult(prev => prev ? {...prev, subheadline: e.target.value} : prev)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">גוף הכתבה</Label>
                    <Textarea value={editResult?.body || ''} onChange={e => setEditResult(prev => prev ? {...prev, body: e.target.value} : prev)} rows={12} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">ציטוט</Label>
                    <Input value={editResult?.pullQuote || ''} onChange={e => setEditResult(prev => prev ? {...prev, pullQuote: e.target.value} : prev)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">הנעה לפעולה</Label>
                    <Input value={editResult?.callToAction || ''} onChange={e => setEditResult(prev => prev ? {...prev, callToAction: e.target.value} : prev)} className="mt-1" />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => { setResult(editResult); setIsEditing(false); toast.success('השינויים נשמרו'); }}>
                      <Check className="w-4 h-4 ml-1" />שמור שינויים
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setEditResult(result); setIsEditing(false); }}>ביטול</Button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-foreground mb-2">{displayResult.headline}</h2>
                  <h3 className="text-lg text-muted-foreground mb-6">{displayResult.subheadline}</h3>
                  
                  <div className="prose prose-lg max-w-none text-foreground/90 leading-relaxed mb-6 whitespace-pre-line">
                    {displayResult.body}
                  </div>

                  {displayResult.pullQuote && (
                    <div className="border-r-4 border-primary pr-4 py-2 my-6 bg-primary/5 rounded-l-lg">
                      <Quote className="w-5 h-5 text-primary mb-1" />
                      <p className="text-lg font-medium text-foreground italic">"{displayResult.pullQuote}"</p>
                    </div>
                  )}

                  {displayResult.callToAction && (
                    <p className="text-base text-primary font-medium mt-4">{displayResult.callToAction}</p>
                  )}

                  {/* Revision area */}
                  <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border space-y-3">
                    <Label className="text-sm font-medium">בקש תיקון מה-AI</Label>
                    <Textarea
                      value={revisionNote}
                      onChange={e => setRevisionNote(e.target.value)}
                      placeholder="למשל: הארך את הכתבה, שנה את הכותרת, הוסף ציטוט נוסף, הדגש יותר את השירות..."
                      rows={2}
                    />
                    <div className="flex gap-3 flex-wrap">
                      <Button size="sm" onClick={handleRevision} disabled={isRevising || !revisionNote.trim()}>
                        {isRevising ? <Loader2 className="w-4 h-4 ml-1 animate-spin" /> : <Sparkles className="w-4 h-4 ml-1" />}
                        {isRevising ? 'מתקן...' : 'בקש תיקון'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Pencil className="w-4 h-4 ml-1" />עריכה ידנית
                      </Button>
                      <Button variant="outline" size="sm" onClick={copyToClipboard}>
                        <Copy className="w-4 h-4 ml-1" />העתק כתבה
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ArticleStudio;
