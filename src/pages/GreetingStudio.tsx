import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, Sparkles, Loader2, Copy, Download, RefreshCw, PartyPopper, Check, Pencil, Palette, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useClientProfile } from '@/hooks/useClientProfile';
import TopNavbar from '@/components/dashboard/TopNavbar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import html2canvas from 'html-to-image';

const OCCASIONS = [
  { id: 'rosh-hashana', label: 'ראש השנה', emoji: '🍯', color: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30' },
  { id: 'sukkot', label: 'סוכות', emoji: '🌿', color: 'from-green-500/20 to-emerald-500/20 border-green-500/30' },
  { id: 'chanukah', label: 'חנוכה', emoji: '🕎', color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30' },
  { id: 'purim', label: 'פורים', emoji: '🎭', color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30' },
  { id: 'pesach', label: 'פסח', emoji: '🍷', color: 'from-red-500/20 to-rose-500/20 border-red-500/30' },
  { id: 'shavuot', label: 'שבועות', emoji: '🌸', color: 'from-pink-500/20 to-fuchsia-500/20 border-pink-500/30' },
  { id: 'wedding', label: 'חתונה', emoji: '💍', color: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30' },
  { id: 'bar-mitzvah', label: 'בר מצווה', emoji: '📜', color: 'from-sky-500/20 to-blue-500/20 border-sky-500/30' },
  { id: 'birthday', label: 'יום הולדת', emoji: '🎂', color: 'from-orange-500/20 to-red-500/20 border-orange-500/30' },
  { id: 'general', label: 'ברכה כללית', emoji: '✨', color: 'from-primary/20 to-primary/10 border-primary/30' },
];

interface GreetingResult {
  headline: string;
  greetingText: string;
  closingLine: string;
}

type Step = 'pick' | 'input' | 'edit' | 'design';

const DESIGN_LAYOUTS = [
  { id: 'centered', label: 'ממורכז', desc: 'טקסט במרכז עם מסגרת' },
  { id: 'elegant', label: 'אלגנטי', desc: 'פס צבעוני עליון + תחתון' },
  { id: 'bold', label: 'דרמטי', desc: 'רקע צבע מלא + טקסט לבן' },
];

const GreetingStudio = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialOccasion = searchParams.get('occasion') || '';
  const { user } = useAuth();
  const { profile } = useClientProfile();
  
  const [step, setStep] = useState<Step>(initialOccasion ? 'input' : 'pick');
  const [selectedOccasion, setSelectedOccasion] = useState(initialOccasion);
  const [recipientName, setRecipientName] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GreetingResult | null>(null);
  
  // Editable fields
  const [editHeadline, setEditHeadline] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editClosing, setEditClosing] = useState('');
  
  // Design step
  const [selectedLayout, setSelectedLayout] = useState('centered');
  const designRef = useRef<HTMLDivElement>(null);

  const primaryColor = profile?.primary_color || '#E34870';
  const secondaryColor = profile?.secondary_color || '#333333';
  const businessName = profile?.business_name || 'העסק שלך';

  const handlePickOccasion = (id: string) => {
    setSelectedOccasion(id);
    setStep('input');
  };

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
            occasion: selectedOccasion,
            recipientName,
            userPrompt: customPrompt,
          },
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data.result);
      setEditHeadline(data.result.headline);
      setEditBody(data.result.greetingText);
      setEditClosing(data.result.closingLine);
      setStep('edit');
      toast.success('הברכה נוצרה בהצלחה!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה ביצירת הברכה');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    const text = `${editHeadline}\n\n${editBody}\n\n${editClosing}\n${businessName}`;
    navigator.clipboard.writeText(text);
    toast.success('הברכה הועתקה!');
  };

  const handleDownloadImage = async () => {
    if (!designRef.current) return;
    try {
      const dataUrl = await html2canvas.toPng(designRef.current, { quality: 1, pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `greeting-${selectedOccasion}-${businessName}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('הברכה הורדה כתמונה!');
    } catch {
      toast.error('שגיאה בהורדת התמונה');
    }
  };

  const occasionData = OCCASIONS.find(o => o.id === selectedOccasion);

  const handleBack = () => {
    if (step === 'design') setStep('edit');
    else if (step === 'edit') setStep('input');
    else if (step === 'input') { setStep('pick'); setSelectedOccasion(''); }
    else navigate('/internal-studio');
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNavbar />
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowRight className="w-4 h-4 ml-2" />
          {step === 'pick' ? 'חזרה לסטודיו' : 'חזרה'}
        </Button>

        {/* ===== STEP 1: Pick Occasion ===== */}
        {step === 'pick' && (
          <div dir="rtl">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-foreground mb-1">בחר אירוע</h1>
              <p className="text-sm text-muted-foreground">ברכה ממותגת בצבעי {businessName}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {OCCASIONS.map((occ) => (
                <Card
                  key={occ.id}
                  className={`cursor-pointer transition-all hover:scale-105 hover:shadow-md border bg-gradient-to-br ${occ.color}`}
                  onClick={() => handlePickOccasion(occ.id)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl mb-1">{occ.emoji}</div>
                    <div className="text-sm font-semibold text-foreground">{occ.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ===== STEP 2: Input ===== */}
        {step === 'input' && (
          <div dir="rtl">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">{occasionData?.emoji}</div>
              <h1 className="text-2xl font-bold text-foreground mb-1">ברכת {occasionData?.label}</h1>
              <p className="text-sm text-muted-foreground">עבור {businessName}</p>
            </div>

            <Card>
              <CardContent className="p-6 space-y-4">
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
          </div>
        )}

        {/* ===== STEP 3: Edit Text ===== */}
        {step === 'edit' && (
          <div dir="rtl">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Pencil className="w-5 h-5 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">עריכת הברכה</h1>
              </div>
              <p className="text-sm text-muted-foreground">ערוך את הטקסט כרצונך ואז המשך לעיצוב</p>
            </div>

            <Card className="mb-6">
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label className="text-sm font-medium">כותרת</Label>
                  <Input
                    value={editHeadline}
                    onChange={(e) => setEditHeadline(e.target.value)}
                    className="mt-1 text-lg font-bold"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">גוף הברכה</Label>
                  <Textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={5}
                    className="mt-1 leading-relaxed"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">שורת סיום</Label>
                  <Input
                    value={editClosing}
                    onChange={(e) => setEditClosing(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card className="mb-6 border-primary/20">
              <CardContent className="p-6 text-center">
                <h3 className="text-xs text-muted-foreground mb-3 flex items-center justify-center gap-1">
                  <Eye className="w-3 h-3" /> תצוגה מקדימה
                </h3>
                <h2 className="text-xl font-bold text-foreground mb-3">{editHeadline}</h2>
                <p className="text-foreground/90 leading-relaxed whitespace-pre-line mb-3">{editBody}</p>
                <p className="text-muted-foreground italic mb-1">{editClosing}</p>
                <p className="text-sm font-medium" style={{ color: primaryColor }}>{businessName}</p>
              </CardContent>
            </Card>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={copyToClipboard}>
                <Copy className="w-4 h-4 ml-1" />העתק טקסט
              </Button>
              <Button variant="outline" onClick={() => { setResult(null); setStep('input'); }}>
                <RefreshCw className="w-4 h-4 ml-1" />צור מחדש
              </Button>
              <Button variant="gradient" onClick={() => setStep('design')}>
                <Palette className="w-4 h-4 ml-1" />המשך לעיצוב
              </Button>
            </div>
          </div>
        )}

        {/* ===== STEP 4: Design ===== */}
        {step === 'design' && (
          <div dir="rtl">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Palette className="w-5 h-5 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">עיצוב הברכה</h1>
              </div>
              <p className="text-sm text-muted-foreground">בחר סגנון עיצוב בצבעי המותג</p>
            </div>

            {/* Layout picker */}
            <div className="flex gap-3 justify-center mb-6">
              {DESIGN_LAYOUTS.map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => setSelectedLayout(layout.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedLayout === layout.id
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {layout.label}
                </button>
              ))}
            </div>

            {/* Designed Card Preview */}
            <div className="flex justify-center mb-6">
              <div
                ref={designRef}
                className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
                style={{ aspectRatio: '1/1' }}
              >
                {selectedLayout === 'centered' && (
                  <div className="w-full h-full flex flex-col items-center justify-center p-10 text-center relative" style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}10)` }}>
                    <div className="absolute inset-4 border-2 rounded-xl" style={{ borderColor: `${primaryColor}40` }} />
                    <div className="text-4xl mb-4">{occasionData?.emoji}</div>
                    <h2 className="text-2xl font-bold mb-4" style={{ color: primaryColor }}>{editHeadline}</h2>
                    <p className="text-sm leading-relaxed mb-4 max-w-sm" style={{ color: secondaryColor }}>{editBody}</p>
                    <p className="text-xs italic mb-3" style={{ color: `${secondaryColor}99` }}>{editClosing}</p>
                    <div className="mt-auto pt-4 flex flex-col items-center gap-2">
                      {profile?.logo_url && <img src={profile.logo_url} alt="" className="h-10 object-contain" />}
                      <span className="text-xs font-medium" style={{ color: primaryColor }}>{businessName}</span>
                      {profile?.website_url && <span className="text-[10px]" style={{ color: `${secondaryColor}80` }}>{profile.website_url}</span>}
                    </div>
                  </div>
                )}

                {selectedLayout === 'elegant' && (
                  <div className="w-full h-full flex flex-col relative" style={{ background: '#FFFFFF' }}>
                    <div className="h-3 w-full" style={{ background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` }} />
                    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                      <div className="text-3xl mb-3">{occasionData?.emoji}</div>
                      <h2 className="text-2xl font-bold mb-4" style={{ color: primaryColor }}>{editHeadline}</h2>
                      <div className="w-16 h-0.5 mx-auto mb-4" style={{ background: primaryColor }} />
                      <p className="text-sm leading-relaxed mb-4 max-w-sm text-gray-700">{editBody}</p>
                      <p className="text-xs italic text-gray-500 mb-3">{editClosing}</p>
                    </div>
                    <div className="py-4 px-6 flex items-center justify-between" style={{ background: `${primaryColor}10` }}>
                      <div className="flex items-center gap-2">
                        {profile?.logo_url && <img src={profile.logo_url} alt="" className="h-8 object-contain" />}
                        <span className="text-xs font-medium" style={{ color: primaryColor }}>{businessName}</span>
                      </div>
                      {profile?.website_url && <span className="text-[10px]" style={{ color: `${secondaryColor}80` }}>{profile.website_url}</span>}
                    </div>
                    <div className="h-3 w-full" style={{ background: `linear-gradient(90deg, ${secondaryColor}, ${primaryColor})` }} />
                  </div>
                )}

                {selectedLayout === 'bold' && (
                  <div className="w-full h-full flex flex-col items-center justify-center p-10 text-center" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
                    <div className="text-4xl mb-4">{occasionData?.emoji}</div>
                    <h2 className="text-3xl font-bold mb-4 text-white">{editHeadline}</h2>
                    <p className="text-sm leading-relaxed mb-4 max-w-sm text-white/90">{editBody}</p>
                    <p className="text-xs italic text-white/70 mb-6">{editClosing}</p>
                    <div className="mt-auto pt-4 flex flex-col items-center gap-2">
                      {profile?.logo_url && <img src={profile.logo_url} alt="" className="h-10 object-contain brightness-0 invert" />}
                      <span className="text-xs font-medium text-white/90">{businessName}</span>
                      {profile?.website_url && <span className="text-[10px] text-white/60">{profile.website_url}</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setStep('edit')}>
                <Pencil className="w-4 h-4 ml-1" />חזרה לעריכה
              </Button>
              <Button variant="outline" onClick={copyToClipboard}>
                <Copy className="w-4 h-4 ml-1" />העתק טקסט
              </Button>
              <Button variant="gradient" onClick={handleDownloadImage}>
                <Download className="w-4 h-4 ml-1" />הורד כתמונה
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GreetingStudio;
