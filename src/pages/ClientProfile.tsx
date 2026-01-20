import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useClientProfile } from '@/hooks/useClientProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { 
  Palette, 
  Type, 
  Users, 
  Target, 
  Trophy, 
  Package, 
  Tag, 
  Heart, 
  Sparkles,
  User,
  Upload,
  Save,
  ArrowRight,
  X,
  Plus,
  RefreshCw,
  FileText,
  AlertOctagon,
  Star,
  MessageCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { HonorificType } from '@/types/wizard';
import { getGreeting } from '@/lib/honorific-utils';

const X_FACTORS = [
  { id: 'veteran', label: 'הוותק והניסיון', icon: Trophy },
  { id: 'product', label: 'עליונות מוצרית', icon: Package },
  { id: 'price', label: 'המחיר', icon: Tag },
  { id: 'service', label: 'השירות והיחס', icon: Heart },
  { id: 'brand', label: 'הבטחה פרסומית', icon: Sparkles },
] as const;

const HONORIFIC_OPTIONS: { value: HonorificType; label: string; description: string }[] = [
  { value: 'mr', label: 'אדון', description: 'פניה בלשון זכר' },
  { value: 'mrs', label: 'גברת', description: 'פניה בלשון נקבה' },
  { value: 'neutral', label: 'ניטרלי', description: 'פניה בלשון רבים' },
];

const ClientProfilePage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading, updateProfile } = useClientProfile();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExtractingColors, setIsExtractingColors] = useState(false);
  
  // Editable fields
  const [businessName, setBusinessName] = useState(profile?.business_name || '');
  const [primaryColor, setPrimaryColor] = useState(profile?.primary_color || '#E31E24');
  const [secondaryColor, setSecondaryColor] = useState(profile?.secondary_color || '#000000');
  const [xFactors, setXFactors] = useState<string[]>(profile?.x_factors || []);
  const [competitors, setCompetitors] = useState<string[]>(profile?.competitors || []);
  const [newCompetitor, setNewCompetitor] = useState('');
  const [advantageSlider, setAdvantageSlider] = useState(profile?.advantage_slider || 50);
  const [targetAudience, setTargetAudience] = useState(profile?.target_audience || '');
  const [honorificPreference, setHonorificPreference] = useState<HonorificType>(
    ((profile as any)?.honorific_preference as HonorificType) || 'neutral'
  );
  
  // Personal Hall of Fame and Red Lines
  const [successfulCampaigns, setSuccessfulCampaigns] = useState<string[]>((profile as any)?.successful_campaigns || []);
  const [personalRedLines, setPersonalRedLines] = useState<string[]>((profile as any)?.personal_red_lines || []);
  const [newCampaign, setNewCampaign] = useState('');
  const [newRedLine, setNewRedLine] = useState('');

  // Sync state when profile loads
  useEffect(() => {
    if (profile) {
      setBusinessName(profile.business_name);
      setPrimaryColor(profile.primary_color || '#E31E24');
      setSecondaryColor(profile.secondary_color || '#000000');
      setXFactors(profile.x_factors || []);
      setCompetitors(profile.competitors || []);
      setAdvantageSlider(profile.advantage_slider || 50);
      setTargetAudience(profile.target_audience || '');
      setSuccessfulCampaigns((profile as any).successful_campaigns || []);
      setPersonalRedLines((profile as any).personal_red_lines || []);
      setHonorificPreference(((profile as any).honorific_preference as HonorificType) || 'neutral');
    }
  }, [profile]);

  // Wait for auth/profile to load before redirecting
  useEffect(() => {
    if (authLoading || loading) return;

    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }

    if (!profile) {
      navigate('/onboarding', { replace: true });
    }
  }, [authLoading, loading, user, profile, navigate]);

  if (authLoading || loading || !user || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">טוען...</div>
      </div>
    );
  }

  const toggleXFactor = (factor: string) => {
    setXFactors(prev => 
      prev.includes(factor) 
        ? prev.filter(f => f !== factor)
        : [...prev, factor]
    );
  };

  const addCompetitor = () => {
    if (newCompetitor.trim() && competitors.length < 5) {
      setCompetitors([...competitors, newCompetitor.trim()]);
      setNewCompetitor('');
    }
  };

  const removeCompetitor = (index: number) => {
    setCompetitors(competitors.filter((_, i) => i !== index));
  };

  const addCampaign = () => {
    if (newCampaign.trim() && successfulCampaigns.length < 10) {
      setSuccessfulCampaigns([...successfulCampaigns, newCampaign.trim()]);
      setNewCampaign('');
    }
  };

  const removeCampaign = (index: number) => {
    setSuccessfulCampaigns(successfulCampaigns.filter((_, i) => i !== index));
  };

  const addRedLine = () => {
    if (newRedLine.trim() && personalRedLines.length < 10) {
      setPersonalRedLines([...personalRedLines, newRedLine.trim()]);
      setNewRedLine('');
    }
  };

  const removeRedLine = (index: number) => {
    setPersonalRedLines(personalRedLines.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        business_name: businessName,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        x_factors: xFactors,
        competitors: competitors,
        advantage_slider: advantageSlider,
        target_audience: targetAudience,
        successful_campaigns: successfulCampaigns,
        personal_red_lines: personalRedLines,
        honorific_preference: honorificPreference,
      } as any);
      toast.success('הפרופיל עודכן בהצלחה!');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || 'שגיאה בעדכון הפרופיל');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExtractColorsFromLogo = async () => {
    if (!profile.logo_url) {
      toast.error('אין לוגו בפרופיל');
      return;
    }

    if (profile.logo_url.toLowerCase().endsWith('.pdf')) {
      toast.error('לא ניתן לחלץ צבעים מקובץ PDF. נא להעלות לוגו כתמונה.');
      return;
    }

    setIsExtractingColors(true);
    toast.loading('מנתח צבעים מהלוגו...', { id: 'profile-color-extract' });

    try {
      const { data, error } = await supabase.functions.invoke('extract-logo-colors', {
        body: { imageUrl: profile.logo_url },
      });

      if (error) {
        // supabase-js wraps non-2xx errors into `error`
        throw error;
      }

      const colors = data?.colors as { primary: string; secondary: string; background: string } | undefined;
      if (!colors?.primary || !colors?.secondary || !colors?.background) {
        throw new Error('לא התקבלו צבעים מהניתוח');
      }

      await updateProfile({
        primary_color: colors.primary,
        secondary_color: colors.secondary,
        background_color: colors.background,
      } as any);

      setPrimaryColor(colors.primary);
      setSecondaryColor(colors.secondary);

      toast.success('עודכנתי צבעי המותג לפי הלוגו');
    } catch (e: any) {
      const msg = typeof e?.message === 'string' ? e.message : 'שגיאה בחילוץ צבעים מהלוגו';
      toast.error(msg);
    } finally {
      toast.dismiss('profile-color-extract');
      setIsExtractingColors(false);
    }
  };

  const handleRestartOnboarding = async () => {
    try {
      // Reset onboarding_completed flag
      await supabase
        .from('client_profiles')
        .update({ onboarding_completed: false })
        .eq('user_id', user.id);
      
      toast.success('מעביר לאונבורדינג...');
      navigate('/onboarding');
    } catch (error: any) {
      toast.error('שגיאה בהתחלת האונבורדינג מחדש');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">ה-DNA העסקי שלנו</h1>
            <p className="text-sm text-muted-foreground">כאן מעדכנים פרטים קבועים, כדי שלא נשאל אתכם כל פעם מחדש</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowRight className="w-4 h-4 ml-2" />
              חזרה לדשבורד
            </Button>
            {isEditing ? (
              <Button variant="gradient" onClick={handleSave} disabled={isSaving}>
                <Save className="w-4 h-4 ml-2" />
                {isSaving ? 'שומר...' : 'שמור שינויים'}
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                ערוך פרופיל
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Personal Greeting Preference */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              העדפת פנייה
            </CardTitle>
            <CardDescription>איך נפנה אליך באפליקציה?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-2">
                {getGreeting(honorificPreference, businessName)}
              </div>
              {isEditing ? (
                <div className="grid grid-cols-3 gap-3">
                  {HONORIFIC_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setHonorificPreference(option.value)}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        honorificPreference === option.value
                          ? option.value === 'mr' 
                            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-md'
                            : option.value === 'mrs'
                            ? 'border-pink-500 bg-gradient-to-br from-pink-50 to-rose-50 shadow-md'
                            : 'border-purple-500 bg-gradient-to-br from-purple-50 to-violet-50 shadow-md'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}
                    >
                      <span className={`font-bold text-lg ${
                        honorificPreference === option.value 
                          ? option.value === 'mr' ? 'text-blue-700' 
                            : option.value === 'mrs' ? 'text-pink-700' 
                            : 'text-purple-700'
                          : ''
                      }`}>{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <Badge variant="default" className="text-sm">
                  {HONORIFIC_OPTIONS.find(o => o.value === honorificPreference)?.label || 'ניטרלי'} - {HONORIFIC_OPTIONS.find(o => o.value === honorificPreference)?.description}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Business Identity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              זהות המותג
            </CardTitle>
            <CardDescription>הלוגו, הצבעים והפונטים שלכם</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>שם העסק</Label>
                {isEditing ? (
                  <Input 
                    value={businessName} 
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-foreground font-medium mt-1">{profile.business_name}</p>
                )}
              </div>
              
              <div>
                <Label>לוגו</Label>
                {profile.logo_url ? (
                  profile.logo_url.toLowerCase().endsWith('.pdf') ? (
                    <div className="h-12 w-12 mt-1 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                  ) : (
                    <img src={profile.logo_url} alt="Logo" className="h-12 mt-1 object-contain" />
                  )
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <Upload className="w-5 h-5 text-muted-foreground" />
                    </div>
                    {isEditing && (
                      <Button variant="outline" size="sm">העלה לוגו</Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between gap-3">
                <Label>צבעי המותג</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExtractColorsFromLogo}
                  disabled={isExtractingColors || !profile.logo_url || profile.logo_url.toLowerCase().endsWith('.pdf')}
                >
                  <Sparkles className="w-4 h-4 ml-2" />
                  {isExtractingColors ? 'מחלץ...' : 'חלץ מהלוגו'}
                </Button>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">ראשי:</span>
                  {isEditing ? (
                    <input 
                      type="color" 
                      value={primaryColor} 
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                  ) : (
                    <div 
                      className="w-10 h-10 rounded border border-border" 
                      style={{ backgroundColor: profile.primary_color || '#E31E24' }} 
                    />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">משני:</span>
                  {isEditing ? (
                    <input 
                      type="color" 
                      value={secondaryColor} 
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                  ) : (
                    <div 
                      className="w-10 h-10 rounded border border-border" 
                      style={{ backgroundColor: profile.secondary_color || '#000000' }} 
                    />
                  )}
                </div>
              </div>
              {profile.logo_url?.toLowerCase().endsWith('.pdf') && (
                <p className="text-xs text-muted-foreground mt-2">הלוגו הוא PDF, לכן כפתור החילוץ מושבת.</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>פונט כותרות</Label>
                <p className="text-foreground mt-1" style={{ fontFamily: profile.header_font || 'Assistant' }}>
                  {profile.header_font || 'Assistant'}
                </p>
              </div>
              <div>
                <Label>פונט גוף</Label>
                <p className="text-foreground mt-1" style={{ fontFamily: profile.body_font || 'Heebo' }}>
                  {profile.body_font || 'Heebo'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Strategic DNA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              ה-DNA האסטרטגי
            </CardTitle>
            <CardDescription>מה מבדל אתכם מהמתחרים</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>גורמים מבדלים (X-Factors)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {X_FACTORS.map((factor) => {
                  const isSelected = xFactors.includes(factor.id);
                  return isEditing ? (
                    <Badge
                      key={factor.id}
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleXFactor(factor.id)}
                    >
                      <factor.icon className="w-3 h-3 ml-1" />
                      {factor.label}
                    </Badge>
                  ) : isSelected ? (
                    <Badge key={factor.id} variant="default">
                      <factor.icon className="w-3 h-3 ml-1" />
                      {factor.label}
                    </Badge>
                  ) : null;
                })}
                {!isEditing && xFactors.length === 0 && (
                  <span className="text-muted-foreground text-sm">לא הוגדר</span>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <Label>סוג היתרון</Label>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>יתרון פיזי מובהק</span>
                  <span>יתרון תדמיתי/רגשי</span>
                </div>
                {isEditing ? (
                  <Slider
                    value={[advantageSlider]}
                    onValueChange={([value]) => setAdvantageSlider(value)}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                ) : (
                  <div className="h-2 bg-muted rounded-full relative">
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary"
                      style={{ left: `${profile.advantage_slider || 50}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Competitors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              מתחרים
            </CardTitle>
            <CardDescription>מי מפריע לכם לישון בלילה?</CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing && (
              <div className="flex gap-2 mb-4">
                <Input
                  value={newCompetitor}
                  onChange={(e) => setNewCompetitor(e.target.value)}
                  placeholder="שם מתחרה..."
                  onKeyDown={(e) => e.key === 'Enter' && addCompetitor()}
                />
                <Button variant="outline" onClick={addCompetitor} disabled={competitors.length >= 5}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {competitors.map((comp, idx) => (
                <Badge key={idx} variant="secondary" className="text-sm">
                  {comp}
                  {isEditing && (
                    <button onClick={() => removeCompetitor(idx)} className="mr-1 hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              ))}
              {competitors.length === 0 && (
                <span className="text-muted-foreground text-sm">לא הוגדרו מתחרים</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Target Audience */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              קהל יעד
            </CardTitle>
            <CardDescription>למי אנחנו מדברים?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { id: 'end_user', label: 'הצרכן הסופי', desc: 'הבחור ישיבה שקונה את החליפה' },
                { id: 'decision_maker', label: 'מקבל ההחלטות', desc: 'האמא/האישה שמשלמת' },
              ].map((option) => (
                <div
                  key={option.id}
                  onClick={() => isEditing && setTargetAudience(option.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    (isEditing ? targetAudience : profile.target_audience) === option.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border'
                  } ${isEditing ? 'cursor-pointer hover:border-primary/50' : ''}`}
                >
                  <p className="font-medium text-foreground">{option.label}</p>
                  <p className="text-sm text-muted-foreground">{option.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Personal Hall of Fame */}
        <Card className="border-success/30 bg-success/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-success" />
              היכל התהילה האישי שלי
            </CardTitle>
            <CardDescription>
              מה עבד לכם בעבר? תארו קמפיינים מוצלחים, סגנונות שעבדו, או מסרים שהצליחו - הAI ילמד מה הסגנון שעובד לכם
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing && (
              <div className="flex gap-2 mb-4">
                <Input
                  value={newCampaign}
                  onChange={(e) => setNewCampaign(e.target.value)}
                  placeholder="למשל: קמפיין החגים עם הסלוגן 'טעם של בית' הצליח מאוד..."
                  onKeyDown={(e) => e.key === 'Enter' && addCampaign()}
                />
                <Button variant="outline" onClick={addCampaign} disabled={successfulCampaigns.length >= 10}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
            <div className="space-y-2">
              {successfulCampaigns.map((campaign, idx) => (
                <div key={idx} className="flex items-start gap-2 p-3 bg-background rounded-lg border border-border">
                  <Trophy className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span className="flex-1 text-sm">{campaign}</span>
                  {isEditing && (
                    <button onClick={() => removeCampaign(idx)} className="text-muted-foreground hover:text-destructive">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {successfulCampaigns.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-4">
                  עדיין לא הוספתם דוגמאות להצלחות. שתפו אותנו מה עבד לכם בעבר!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Personal Red Lines */}
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-destructive" />
              הקווים האדומים שלי
            </CardTitle>
            <CardDescription>
              מה לא לומר או להציג בפרסומות שלכם? מילים שאתם לא אוהבים, נושאים רגישים, דברים שלא רוצים להזכיר
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing && (
              <div className="flex gap-2 mb-4">
                <Input
                  value={newRedLine}
                  onChange={(e) => setNewRedLine(e.target.value)}
                  placeholder="למשל: לא להזכיר את המתחרה X, לא להשתמש במילה 'זול'..."
                  onKeyDown={(e) => e.key === 'Enter' && addRedLine()}
                />
                <Button variant="outline" onClick={addRedLine} disabled={personalRedLines.length >= 10}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {personalRedLines.map((redLine, idx) => (
                <Badge key={idx} variant="destructive" className="text-sm py-1.5 px-3">
                  {redLine}
                  {isEditing && (
                    <button onClick={() => removeRedLine(idx)} className="mr-2 hover:text-white/70">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              ))}
              {personalRedLines.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  לא הוגדרו קווים אדומים אישיים
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        {/* Restart Onboarding */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-muted-foreground" />
              התחל אונבורדינג מחדש
            </CardTitle>
            <CardDescription>
              רוצה לעדכן את כל הנתונים מההתחלה? לחץ כאן לחזור לתהליך האונבורדינג המלא
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={handleRestartOnboarding}
              className="w-full md:w-auto"
            >
              <RefreshCw className="w-4 h-4 ml-2" />
              התחל אונבורדינג מחדש
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ClientProfilePage;
