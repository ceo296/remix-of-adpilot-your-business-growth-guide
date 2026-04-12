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
  Users, 
  Target, 
  Sparkles,
  User,
  Upload,
  Save,
  ArrowRight,
  X,
  Plus,
  RefreshCw,
  FileText,
  MessageCircle,
  LayoutTemplate,
  Check,
  Image,
  Phone,
  Mail,
  MapPin,
  Globe,
  Youtube,
  Facebook,
  Instagram,
  Linkedin,
  Music2,
  Clock,
  Building2,
  Star,
  Package,
  Edit2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { HonorificType } from '@/types/wizard';

interface BrandColor {
  hex: string;
  name: string;
  number: string;
}
import { getGreeting } from '@/lib/honorific-utils';

const X_FACTORS = [
  { id: 'veteran', label: 'ותק וניסיון', emoji: '🏆' },
  { id: 'product', label: 'עליונות מוצרית', emoji: '📦' },
  { id: 'price', label: 'מחיר', emoji: '💰' },
  { id: 'service', label: 'שירות ויחס', emoji: '❤️' },
  { id: 'brand', label: 'סיפור המותג', emoji: '✨' },
] as const;

const AUDIENCE_OPTIONS = [
  { id: 'broad', label: 'קהל רחב', sub: 'שפה פשוטה ובגובה העיניים', emoji: '👥' },
  { id: 'premium', label: 'פרימיום', sub: 'שפה גבוהה, דגש על איכות', emoji: '👑' },
  { id: 'b2b', label: 'עסקי (B2B)', sub: 'שפה מקצועית ועניינית', emoji: '💼' },
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
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  
  // Editable fields
  const [businessName, setBusinessName] = useState(profile?.business_name || '');
  const [logoUrl, setLogoUrl] = useState(profile?.logo_url || '');
  const [primaryColor, setPrimaryColor] = useState(profile?.primary_color || '');
  const [secondaryColor, setSecondaryColor] = useState(profile?.secondary_color || '');
  const [xFactors, setXFactors] = useState<string[]>(profile?.x_factors || []);
  const [competitors, setCompetitors] = useState<string[]>(profile?.competitors || []);
  const [newCompetitor, setNewCompetitor] = useState('');
  const [advantageSlider, setAdvantageSlider] = useState(profile?.advantage_slider || 50);
  const [targetAudience, setTargetAudience] = useState(profile?.target_audience || '');
  const [targetAudienceDesc, setTargetAudienceDesc] = useState(profile?.target_audience || '');
  const [honorificPreference, setHonorificPreference] = useState<HonorificType>(
    ((profile as any)?.honorific_preference as HonorificType) || 'neutral'
  );
  
  // Contact & business details
  const [contactPhone, setContactPhone] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [contactYoutube, setContactYoutube] = useState('');
  const [socialFacebook, setSocialFacebook] = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialTiktok, setSocialTiktok] = useState('');
  const [socialLinkedin, setSocialLinkedin] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [branches, setBranches] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [newService, setNewService] = useState('');

  const [availableTemplates, setAvailableTemplates] = useState<{id: string; name: string; description: string | null}[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(profile?.default_template_id || null);
  const [brandColors, setBrandColors] = useState<BrandColor[]>([]);
  // Sync state when profile loads
  useEffect(() => {
    if (profile) {
      setBusinessName(profile.business_name);
      setLogoUrl(profile.logo_url || '');
      setPrimaryColor(profile.primary_color || '');
      setSecondaryColor(profile.secondary_color || '');
      setXFactors(profile.x_factors || []);
      setCompetitors(profile.competitors || []);
      setAdvantageSlider(profile.advantage_slider || 50);
      setTargetAudience((profile as any).audience_tone || '');
      setTargetAudienceDesc(profile.target_audience || '');
      setHonorificPreference(((profile as any).honorific_preference as HonorificType) || 'neutral');
      setSelectedTemplateId(profile.default_template_id || null);
      // Sync brand colors
      const rawColors = (profile as any).brand_colors;
      const colors: BrandColor[] = Array.isArray(rawColors) && rawColors.length > 0
        ? rawColors
        : [
            { hex: profile.primary_color || '#000000', name: (profile as any).primary_color_name || '', number: '' },
            ...(profile.secondary_color ? [{ hex: profile.secondary_color, name: (profile as any).secondary_color_name || '', number: '' }] : []),
          ];
      setBrandColors(colors);
    }
  }, [profile]);

  // Fetch available templates
  useEffect(() => {
    const fetchTemplates = async () => {
      const { data } = await supabase
        .from('ad_layout_templates')
        .select('id, name, description')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (data) setAvailableTemplates(data);
    };
    fetchTemplates();
  }, []);

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


  const handleSave = async () => {
    setIsSaving(true);
    try {
      const validColors = brandColors.filter(c => c.hex.trim());
      await updateProfile({
        business_name: businessName,
        logo_url: logoUrl,
        primary_color: validColors[0]?.hex || primaryColor,
        secondary_color: validColors[1]?.hex || secondaryColor,
        brand_colors: validColors,
        primary_color_name: validColors[0]?.name || null,
        secondary_color_name: validColors[1]?.name || null,
        x_factors: xFactors,
        competitors: competitors,
        advantage_slider: advantageSlider,
        audience_tone: targetAudience,
        target_audience: targetAudienceDesc,
        honorific_preference: honorificPreference,
        default_template_id: selectedTemplateId,
      } as any);
      toast.success('הפרופיל עודכן בהצלחה!');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || 'שגיאה בעדכון הפרופיל');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingLogo(true);
    try {
      let uploadFile: File | Blob = file;
      let fileExt = file.name.split('.').pop();
      
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        toast.loading('ממיר PDF ל-PNG...', { id: 'pdf-convert' });
        const { fileToLogoDataUrl } = await import('@/lib/logo-utils');
        const { dataUrl } = await fileToLogoDataUrl(file);
        const res = await fetch(dataUrl);
        uploadFile = await res.blob();
        fileExt = 'png';
        toast.success('PDF הומר בהצלחה!', { id: 'pdf-convert' });
      }
      
      const filePath = `${user.id}/logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('brand-assets')
        .upload(filePath, uploadFile, { contentType: uploadFile instanceof Blob ? uploadFile.type : file.type, upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('brand-assets')
        .getPublicUrl(filePath);

      setLogoUrl(publicUrl);
      await updateProfile({ logo_url: publicUrl } as any);
      toast.success('הלוגו הועלה בהצלחה! מחלץ צבעים...');
      
      // Auto-extract colors
      extractColorsFromImage(publicUrl);
    } catch (error: any) {
      toast.error(typeof error?.message === 'string' ? error.message : 'שגיאה בהעלאת הלוגו');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handlePastMaterialUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !user || !profile) return;

    const currentMaterials: string[] = Array.isArray((profile as any).past_materials) ? (profile as any).past_materials : [];
    const newUrls: string[] = [...currentMaterials];

    for (const file of Array.from(files)) {
      try {
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/materials-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('brand-assets')
          .upload(filePath, file, { contentType: file.type, upsert: true });
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('brand-assets')
          .getPublicUrl(filePath);
        
        newUrls.push(publicUrl);
      } catch (err) {
        console.error('Failed to upload material:', err);
      }
    }

    await updateProfile({ past_materials: newUrls } as any);
    toast.success(`${files.length} חומרים הועלו בהצלחה`);
  };

  const removePastMaterial = async (index: number) => {
    if (!profile) return;
    const currentMaterials: string[] = Array.isArray((profile as any).past_materials) ? [...(profile as any).past_materials] : [];
    currentMaterials.splice(index, 1);
    await updateProfile({ past_materials: currentMaterials } as any);
    toast.success('החומר הוסר');
  };

  const extractColorsFromImage = async (imageUrl: string) => {
    setIsExtractingColors(true);
    toast.loading('מנתח צבעים...', { id: 'profile-color-extract' });

    try {
      const { data, error } = await supabase.functions.invoke('extract-logo-colors', {
        body: { imageUrl },
      });

      if (error) throw error;

      const colors = data?.colors as { primary: string; secondary: string; background: string } | undefined;
      if (!colors?.primary || !colors?.secondary || !colors?.background) {
        throw new Error('לא התקבלו צבעים מהניתוח');
      }

      const newColors: BrandColor[] = [
        { hex: colors.primary, name: '', number: '' },
        { hex: colors.secondary, name: '', number: '' },
      ];
      
      const merged = [...brandColors];
      for (const nc of newColors) {
        if (!merged.some(c => c.hex.toLowerCase() === nc.hex.toLowerCase())) {
          merged.push(nc);
        }
      }
      
      if (merged.length > brandColors.length) {
        setBrandColors(merged);
      } else {
        const updated = [...brandColors];
        if (updated.length > 0) updated[0] = { ...updated[0], hex: colors.primary };
        if (updated.length > 1) updated[1] = { ...updated[1], hex: colors.secondary };
        else updated.push({ hex: colors.secondary, name: '', number: '' });
        setBrandColors(updated);
      }

      await updateProfile({
        primary_color: colors.primary,
        secondary_color: colors.secondary,
        background_color: colors.background,
      } as any);

      setPrimaryColor(colors.primary);
      setSecondaryColor(colors.secondary);

      const fonts = data?.fonts;
      if (fonts?.headerFont) {
        await updateProfile({
          header_font: fonts.headerFont,
          body_font: fonts.bodyFont || 'Heebo',
        } as any);
      }

      toast.success('צבעים חולצו ועודכנו בהצלחה!');
    } catch (e: any) {
      const msg = typeof e?.message === 'string' ? e.message : 'שגיאה בחילוץ צבעים';
      toast.error(msg);
    } finally {
      toast.dismiss('profile-color-extract');
      setIsExtractingColors(false);
    }
  };

  const handleExtractColorsFromLogo = async () => {
    if (!profile.logo_url) {
      toast.error('אין לוגו בפרופיל');
      return;
    }
    extractColorsFromImage(profile.logo_url);
  };

  const handleExtractColorsFromMaterial = async (materialUrl: string) => {
    extractColorsFromImage(materialUrl);
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
              <Button variant="gradient" size="lg" onClick={handleSave} disabled={isSaving} className="text-base px-6 py-3 shadow-lg">
                <Save className="w-5 h-5 ml-2" />
                {isSaving ? 'שומר...' : 'שמור שינויים'}
              </Button>
            ) : (
              <Button 
                variant="gradient" 
                size="lg" 
                onClick={() => setIsEditing(true)}
                className="text-base px-6 py-3 shadow-lg"
              >
                <Sparkles className="w-5 h-5 ml-2" />
                ערוך פרופיל
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Personal Greeting Preference */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                העדפת פנייה
              </CardTitle>
              <CardDescription>איך נפנה אליך באפליקציה?</CardDescription>
            </div>
            {!isEditing && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="text-muted-foreground hover:text-primary">
                <Sparkles className="w-4 h-4 ml-1" />
                עריכה
              </Button>
            )}
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
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                זהות המותג
              </CardTitle>
              <CardDescription>הלוגו, הצבעים והפונטים שלכם</CardDescription>
            </div>
            {!isEditing && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="text-muted-foreground hover:text-primary">
                <Sparkles className="w-4 h-4 ml-1" />
                עריכה
              </Button>
            )}
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
                {isEditing ? (
                  <div className="flex items-center gap-3 mt-2">
                    {logoUrl ? (
                      logoUrl.toLowerCase().endsWith('.pdf') ? (
                        <div className="h-16 w-16 bg-primary/10 rounded-lg flex items-center justify-center">
                          <FileText className="w-8 h-8 text-primary" />
                        </div>
                      ) : (
                        <img src={logoUrl} alt="Logo" className="h-16 object-contain rounded-lg border border-border" />
                      )
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                        <Upload className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleLogoUpload}
                          className="hidden"
                          disabled={isUploadingLogo}
                        />
                        <Button variant="outline" size="sm" asChild disabled={isUploadingLogo}>
                          <span>
                            <Upload className="w-4 h-4 ml-2" />
                            {isUploadingLogo ? 'מעלה...' : logoUrl ? 'החלף לוגו' : 'העלה לוגו'}
                          </span>
                        </Button>
                      </label>
                      {logoUrl && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setLogoUrl('')}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="w-4 h-4 ml-2" />
                          הסר לוגו
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {(logoUrl || profile.logo_url) ? (
                      (logoUrl || profile.logo_url)?.toLowerCase().endsWith('.pdf') ? (
                        <div className="h-12 w-12 mt-1 bg-primary/10 rounded-lg flex items-center justify-center">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                      ) : (
                        <img src={logoUrl || profile.logo_url} alt="Logo" className="h-12 mt-1 object-contain" />
                      )
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                          <Upload className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between gap-3">
                <Label>צבעי המותג</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleExtractColorsFromLogo}
                    disabled={isExtractingColors || !profile.logo_url}
                  >
                    <Sparkles className="w-4 h-4 ml-2" />
                    {isExtractingColors ? 'מחלץ...' : 'חלץ מהלוגו'}
                  </Button>
                  {isEditing && (
                    <Button variant="outline" size="sm" onClick={() => setBrandColors(prev => [...prev, { hex: '#888888', name: '', number: '' }])}>
                      <Plus className="w-3.5 h-3.5 ml-1" />
                      הוסף צבע
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-3 mt-3" dir="rtl">
                {brandColors.map((color, i) => (
                  <div key={i} className="flex items-center gap-3 bg-muted/30 rounded-lg p-2.5">
                    {/* Color swatch / picker */}
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-lg border border-border shadow-sm overflow-hidden" style={{ backgroundColor: color.hex }}>
                        {isEditing && (
                          <input
                            type="color"
                            value={color.hex}
                            onChange={(e) => setBrandColors(prev => prev.map((c, idx) => idx === i ? { ...c, hex: e.target.value } : c))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        )}
                      </div>
                    </div>

                    {/* Hex */}
                    <div className="space-y-0.5 shrink-0">
                      <span className="text-[10px] text-muted-foreground">קוד צבע</span>
                      {isEditing ? (
                        <Input
                          value={color.hex}
                          onChange={(e) => setBrandColors(prev => prev.map((c, idx) => idx === i ? { ...c, hex: e.target.value } : c))}
                          className="h-7 text-xs w-24 font-mono text-center"
                          dir="ltr"
                          maxLength={7}
                        />
                      ) : (
                        <p className="text-xs font-mono text-foreground">{color.hex}</p>
                      )}
                    </div>


                    {/* Number */}
                    <div className="space-y-0.5 shrink-0">
                      <span className="text-[10px] text-muted-foreground">מספר צבע</span>
                      {isEditing ? (
                        <Input
                          value={color.number}
                          onChange={(e) => setBrandColors(prev => prev.map((c, idx) => idx === i ? { ...c, number: e.target.value } : c))}
                          placeholder="T-450"
                          className="h-7 text-xs w-20 font-mono text-center"
                          dir="ltr"
                          maxLength={15}
                        />
                      ) : (
                        <p className="text-xs font-mono text-foreground">{color.number || '—'}</p>
                      )}
                    </div>

                    {/* Remove */}
                    {isEditing && brandColors.length > 1 && (
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0" onClick={() => setBrandColors(prev => prev.filter((_, idx) => idx !== i))}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
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

        {/* Past Advertising Materials */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5 text-primary" />
                חומרי פרסום קודמים
              </CardTitle>
              <CardDescription>העלו מודעות ופרסומים מהעבר - נחלץ מהם צבעים וסגנון</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-primary/5">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePastMaterialUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="w-8 h-8" />
                <span className="text-sm font-medium text-foreground">העלו חומרי פרסום קודמים</span>
                <span className="text-xs">תמונות של מודעות, פליירים, באנרים</span>
              </div>
            </div>

            {(() => {
              const materials: string[] = Array.isArray((profile as any).past_materials) ? (profile as any).past_materials : [];
              if (materials.length === 0) return null;
              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {materials.map((url: string, i: number) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden border border-border">
                      <img
                        src={url}
                        alt={`חומר פרסום ${i + 1}`}
                        className="w-full h-28 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleExtractColorsFromMaterial(url)}
                          disabled={isExtractingColors}
                        >
                          <Sparkles className="w-3 h-3 ml-1" />
                          חלץ צבעים
                        </Button>
                        <button
                          onClick={() => removePastMaterial(i)}
                          className="bg-destructive/80 text-white rounded-full p-1.5 hover:bg-destructive transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {availableTemplates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-primary" />
                תבנית מודעה ברירת מחדל
              </CardTitle>
              <CardDescription>בחר תבנית שתופעל אוטומטית בסטודיו הקריאייטיב</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedTemplateId(null)}
                  className={`p-4 rounded-xl border-2 transition-all text-right ${
                    !selectedTemplateId
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">סגנונות מובנים</span>
                    {!selectedTemplateId && <Check className="w-4 h-4 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">שימוש בסגנונות הלייאאוט הקלאסיים</p>
                </button>
                {availableTemplates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-right ${
                      selectedTemplateId === tpl.id
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">🧩 {tpl.name}</span>
                      {selectedTemplateId === tpl.id && <Check className="w-4 h-4 text-primary" />}
                    </div>
                    {tpl.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tpl.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Strategic DNA */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                ה-DNA האסטרטגי
              </CardTitle>
              <CardDescription>מה מבדל אתכם מהמתחרים</CardDescription>
            </div>
            {!isEditing && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="text-muted-foreground hover:text-primary">
                <Sparkles className="w-4 h-4 ml-1" />
                עריכה
              </Button>
            )}
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
                      <span className="ml-1">{factor.emoji}</span>
                      {factor.label}
                    </Badge>
                  ) : isSelected ? (
                    <Badge key={factor.id} variant="default">
                      <span className="ml-1">{factor.emoji}</span>
                      {factor.label}
                    </Badge>
                  ) : null;
                })}
                {!isEditing && xFactors.length === 0 && (
                  <span className="text-muted-foreground text-sm">לא הוגדר</span>
                )}
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Competitors */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                מתחרים
              </CardTitle>
              <CardDescription>מי המתחרים המרכזיים שלכם בשוק?</CardDescription>
            </div>
            {!isEditing && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="text-muted-foreground hover:text-primary">
                <Sparkles className="w-4 h-4 ml-1" />
                עריכה
              </Button>
            )}
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
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                קהל יעד וטון תקשורת
              </CardTitle>
              <CardDescription>למי אנחנו מדברים ואיך?</CardDescription>
            </div>
            {!isEditing && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="text-muted-foreground hover:text-primary">
                <Sparkles className="w-4 h-4 ml-1" />
                עריכה
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>טון תקשורת</Label>
              <div className="grid md:grid-cols-3 gap-3 mt-2">
                {AUDIENCE_OPTIONS.map((option) => {
                  const audienceTone = (profile as any).audience_tone || '';
                  const currentTone = isEditing ? targetAudience : audienceTone;
                  return (
                    <div
                      key={option.id}
                      onClick={() => isEditing && setTargetAudience(option.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-center ${
                        currentTone === option.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border'
                      } ${isEditing ? 'cursor-pointer hover:border-primary/50' : ''}`}
                    >
                      <span className="text-2xl">{option.emoji}</span>
                      <p className="font-medium text-foreground mt-1">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.sub}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <Label>תיאור קהל יעד</Label>
              {isEditing ? (
                <Textarea
                  value={targetAudienceDesc}
                  onChange={(e) => setTargetAudienceDesc(e.target.value)}
                  placeholder="תארו את קהל היעד שלכם..."
                  className="mt-1"
                  rows={2}
                />
              ) : (
                <p className="text-foreground text-sm mt-1">
                  {profile.target_audience || 'לא הוגדר'}
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
