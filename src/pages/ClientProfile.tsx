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
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const X_FACTORS = [
  { id: 'veteran', label: 'הוותק והניסיון', icon: Trophy },
  { id: 'product', label: 'עליונות מוצרית', icon: Package },
  { id: 'price', label: 'המחיר', icon: Tag },
  { id: 'service', label: 'השירות והיחס', icon: Heart },
  { id: 'brand', label: 'הבטחה פרסומית', icon: Sparkles },
] as const;

const ClientProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading, updateProfile } = useClientProfile();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Editable fields
  const [businessName, setBusinessName] = useState(profile?.business_name || '');
  const [primaryColor, setPrimaryColor] = useState(profile?.primary_color || '#E31E24');
  const [secondaryColor, setSecondaryColor] = useState(profile?.secondary_color || '#000000');
  const [xFactors, setXFactors] = useState<string[]>(profile?.x_factors || []);
  const [competitors, setCompetitors] = useState<string[]>(profile?.competitors || []);
  const [newCompetitor, setNewCompetitor] = useState('');
  const [advantageSlider, setAdvantageSlider] = useState(profile?.advantage_slider || 50);
  const [targetAudience, setTargetAudience] = useState(profile?.target_audience || '');

  // Sync state when profile loads
  useState(() => {
    if (profile) {
      setBusinessName(profile.business_name);
      setPrimaryColor(profile.primary_color || '#E31E24');
      setSecondaryColor(profile.secondary_color || '#000000');
      setXFactors(profile.x_factors || []);
      setCompetitors(profile.competitors || []);
      setAdvantageSlider(profile.advantage_slider || 50);
      setTargetAudience(profile.target_audience || '');
    }
  });

  // Handle redirects in useEffect to avoid render-time navigation
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else if (!loading && !profile) {
      navigate('/onboarding');
    }
  }, [user, loading, profile, navigate]);

  if (!user || loading || !profile) {
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
      });
      toast.success('הפרופיל עודכן בהצלחה!');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || 'שגיאה בעדכון הפרופיל');
    } finally {
      setIsSaving(false);
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
                  <img src={profile.logo_url} alt="Logo" className="h-12 mt-1 object-contain" />
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
              <Label>צבעי המותג</Label>
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
