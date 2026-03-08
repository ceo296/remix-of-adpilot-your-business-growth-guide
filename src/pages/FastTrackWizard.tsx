import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useClientProfile } from '@/hooks/useClientProfile';
import { useAgencyClients } from '@/hooks/useAgencyClients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Rocket, 
  ArrowLeft, 
  ArrowRight, 
  Target, 
  Zap, 
  Sparkles, 
  Heart,
  Wand2,
  Building2,
  Gift,
  Lightbulb,
  Newspaper,
  Check,
  Upload,
  Image,
  X,
  Radio,
  Signpost,
  Monitor,
  Mail,
  MessageCircle,
  LayoutGrid
} from 'lucide-react';
import { BudgetAudienceStep } from '@/components/campaign/BudgetAudienceStep';
import { StudioQuoteStep, QuoteData, MediaItem } from '@/components/studio/StudioQuoteStep';
import { StudioBriefStep, CampaignBrief } from '@/components/studio/StudioBriefStep';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const CAMPAIGN_GOALS = [
  { id: 'sale', label: 'מבצע/סייל', description: 'מכירות מיידיות', icon: Target, gradient: 'from-emerald-500 to-teal-600' },
  { id: 'branding', label: 'מיתוג', description: 'חיזוק המותג', icon: Sparkles, gradient: 'from-violet-500 to-purple-600' },
  { id: 'launch', label: 'השקה', description: 'מוצר/שירות חדש', icon: Zap, gradient: 'from-orange-500 to-amber-600' },
  { id: 'event', label: 'אירוע', description: 'כנס/אירוע', icon: Heart, gradient: 'from-rose-500 to-pink-600' },
];

const MEDIA_TYPES = [
  { id: 'newspapers', label: 'עיתונות', description: 'עיתונים ומגזינים', icon: Newspaper, gradient: 'from-slate-600 to-slate-700' },
  { id: 'radio', label: 'רדיו', description: 'פרסום קולי', icon: Radio, gradient: 'from-blue-500 to-cyan-600' },
  { id: 'signage', label: 'שילוט', description: 'שלטי חוצות ומודעות', icon: Signpost, gradient: 'from-amber-500 to-orange-600' },
  { id: 'digital', label: 'דיגיטל', description: 'אתרים ובאנרים', icon: Monitor, gradient: 'from-violet-500 to-purple-600' },
  { id: 'email', label: 'מיילים', description: 'קמפיין מייל', icon: Mail, gradient: 'from-green-500 to-emerald-600' },
  { id: 'whatsapp', label: 'ווטסאפ', description: 'הודעות ממוקדות', icon: MessageCircle, gradient: 'from-green-600 to-green-700' },
];

type WizardStep = 'brief' | 'mediaType' | 'mediaScope' | 'media' | 'quote';
type MediaScope = 'national' | 'local' | 'both';

const FastTrackWizard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useClientProfile();
  const { isAgency, clients, selectedClient, selectedClientId, setSelectedClientId, loading: agencyLoading } = useAgencyClients();
  
  // Check if we're in media-only mode
  const isMediaOnlyMode = searchParams.get('mode') === 'media-only';
  
  // Current step
  const [currentStep, setCurrentStep] = useState<WizardStep>(isMediaOnlyMode ? 'mediaType' : 'brief');
  
  // Media Type Selection (for media-only mode)
  const [selectedMediaTypes, setSelectedMediaTypes] = useState<string[]>([]);
  const [mediaScope, setMediaScope] = useState<MediaScope | null>(null);
  // Campaign Brief - using guided StudioBriefStep
  const [campaignBrief, setCampaignBrief] = useState<CampaignBrief>({
    title: '',
    offer: '',
    goal: null,
    structure: null,
    contactSelection: {
      phone: false, whatsapp: false, email: false, address: false,
      youtube: false, facebook: false, instagram: false, logoOnly: false,
      customText: '', openingHours: false, selectedBranches: [],
    },
    colorSelection: { mode: 'brand', primaryColor: null, secondaryColor: null, backgroundColor: null },
    adGoal: null,
    showPriceOrBenefit: null,
    priceOrBenefit: '',
    isTimeLimited: null,
    timeLimitText: '',
    emotionalTone: null,
    desiredAction: null,
    desiredActions: [],
  });
  
  // Media Selection
  const [budget, setBudget] = useState(0);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [targetStream, setTargetStream] = useState('general');
  const [targetGender, setTargetGender] = useState('');
  const [targetCity, setTargetCity] = useState('nationwide');
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [manualMediaSelection, setManualMediaSelection] = useState<any>(null);
  
  // Creative Upload (for media-only mode)
  const [uploadedCreativeUrl, setUploadedCreativeUrl] = useState<string | null>(null);
  const [isUploadingCreative, setIsUploadingCreative] = useState(false);
  
  // Quote
  const [isSubmitting, setIsSubmitting] = useState(false);

  // The active client profile (for agencies: selected client, for regular users: their own profile)
  const activeProfile = isAgency ? selectedClient : profile;

  // Wait for auth/profile to load before redirecting
  useEffect(() => {
    if (authLoading || profileLoading || agencyLoading) return;

    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }

    if (profile && !profile.onboarding_completed) {
      navigate('/onboarding', { replace: true });
    }
  }, [authLoading, profileLoading, agencyLoading, user, profile, navigate]);

  // Update step when mode changes
  useEffect(() => {
    if (isMediaOnlyMode) {
      setCurrentStep('mediaType');
      setCampaignBrief(prev => ({ ...prev, title: 'רכישת מדיה' }));
    }
  }, [isMediaOnlyMode]);

  if (authLoading || profileLoading || agencyLoading || !user || !profile?.onboarding_completed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">טוען...</div>
      </div>
    );
  }

  const handleProceedToStudio = () => {
    // Save full guided brief data to session storage and navigate to Creative Studio
    const briefData = {
      campaignName: campaignBrief.title,
      campaignOffer: campaignBrief.offer,
      goal: campaignBrief.goal,
      clientProfileId: activeProfile?.id,
      // Pass the full guided brief
      guidedBrief: campaignBrief,
    };
    sessionStorage.setItem('campaignBrief', JSON.stringify(briefData));
    navigate('/studio');
  };

  const handleProceedToMediaType = () => {
    setCurrentStep('mediaType');
  };

  const handleProceedToMedia = () => {
    setCurrentStep('media');
  };

  const handleProceedToQuote = () => {
    setCurrentStep('quote');
  };

  const handleBackFromMediaType = () => {
    navigate('/dashboard');
  };

  const handleBackFromMedia = () => {
    if (isMediaOnlyMode) {
      setCurrentStep('mediaType');
    } else {
      setCurrentStep('brief');
    }
  };

  const toggleMediaType = (mediaTypeId: string) => {
    setSelectedMediaTypes(prev => 
      prev.includes(mediaTypeId) 
        ? prev.filter(id => id !== mediaTypeId)
        : [...prev, mediaTypeId]
    );
  };

  const canProceedMediaType = () => {
    return selectedMediaTypes.length > 0;
  };

  const handleBackFromQuote = () => {
    setCurrentStep('media');
  };

  const getQuoteData = (): QuoteData => {
    const mediaItems: MediaItem[] = [];
    
    if (selectedPackage) {
      selectedPackage.items.forEach((item: any) => {
        mediaItems.push({
          id: item.id,
          name: item.name,
          price: item.price,
        });
      });
    } else if (manualMediaSelection) {
      // Handle manual selection
      Object.values(manualMediaSelection).forEach((item: any) => {
        if (item.selected) {
          mediaItems.push({
            id: item.id,
            name: item.name,
            price: item.price || 0,
          });
        }
      });
    }

    return {
      mediaItems,
      creativeMode: isMediaOnlyMode ? 'uploaded' : 'autopilot',
      creativeCost: isMediaOnlyMode ? 0 : 500,
    };
  };

  const handleApproveQuote = async () => {
    setIsSubmitting(true);
    
    try {
      const quoteData = getQuoteData();
      
      if (!activeProfile?.id) {
        throw new Error('No active profile');
      }

      // Create campaign in database
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert({
          user_id: user.id,
          client_profile_id: activeProfile.id,
          name: campaignBrief.title || 'רכישת מדיה',
          goal: isMediaOnlyMode ? 'media_purchase' : campaignBrief.goal,
          status: 'pending_approval',
          budget,
          start_date: startDate?.toISOString().split('T')[0],
          end_date: endDate?.toISOString().split('T')[0],
          target_stream: targetStream,
          target_gender: targetGender,
          target_city: targetCity,
          selected_media: quoteData.mediaItems as any,
          creatives: uploadedCreativeUrl ? [{ url: uploadedCreativeUrl, type: 'uploaded' }] : [],
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'ההזמנה נשלחה בהצלחה! 🎉',
        description: 'נציג יצור איתך קשר בהקדם לאישור סופי.',
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: 'שגיאה בשליחת ההזמנה',
        description: 'אנא נסה שוב.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConsult = () => {
    toast({
      title: 'נפתחה פנייה לנציג',
      description: 'נציג שלנו יצור איתך קשר בקרוב.',
    });
  };

  const canProceedBrief = () => {
    const words = campaignBrief.offer.trim().split(/\s+/).filter(w => w.length > 0);
    const cs = campaignBrief.contactSelection;
    const hasContactSelected = cs.phone || cs.whatsapp || cs.email || cs.address || cs.youtube || cs.facebook || cs.instagram || cs.logoOnly || cs.openingHours || (cs.selectedBranches || []).length > 0;
    return !!campaignBrief.adGoal && !!campaignBrief.emotionalTone && campaignBrief.desiredActions.length > 0 && words.length >= 12 && !!campaignBrief.structure && hasContactSelected;
  };

  const canProceedMedia = () => {
    return budget > 0 && targetStream && targetGender && (selectedPackage || manualMediaSelection);
  };

  // Render Brief Step — uses the guided StudioBriefStep component
  const renderBriefStep = () => (
    <div className="space-y-8 animate-fade-in">
      <StudioBriefStep
        value={campaignBrief}
        onChange={setCampaignBrief}
        businessName={activeProfile?.business_name}
        contactInfo={activeProfile ? {
          contact_phone: activeProfile.contact_phone,
          contact_whatsapp: activeProfile.contact_whatsapp,
          contact_email: activeProfile.contact_email,
          contact_address: activeProfile.contact_address,
          contact_youtube: activeProfile.contact_youtube,
          social_facebook: activeProfile.social_facebook,
          social_instagram: activeProfile.social_instagram,
          opening_hours: activeProfile.opening_hours,
          branches: activeProfile.branches,
          logo_url: activeProfile.logo_url,
        } : undefined}
        brandColors={activeProfile ? {
          primary_color: activeProfile.primary_color,
          secondary_color: activeProfile.secondary_color,
          background_color: activeProfile.background_color,
        } : undefined}
      />

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
          <ArrowRight className="w-4 h-4 ml-2" />
          ביטול
        </Button>
        
        <Button onClick={handleProceedToStudio} disabled={!canProceedBrief()} variant="gradient">
          <Wand2 className="w-4 h-4 ml-2" />
          קדימה ליצירה!
          <ArrowLeft className="w-4 h-4 mr-2" />
        </Button>
      </div>
    </div>
  );

  // Handle creative file upload
  const handleCreativeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCreative(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('brand-assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('brand-assets')
        .getPublicUrl(fileName);

      setUploadedCreativeUrl(publicUrl);
      toast({
        title: 'הקריאייטיב הועלה בהצלחה',
        description: 'הקובץ נשמר ויצורף להזמנה',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'שגיאה בהעלאה',
        description: 'אנא נסה שוב',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingCreative(false);
    }
  };

  const removeUploadedCreative = () => {
    setUploadedCreativeUrl(null);
  };

  // Render Media Type Selection Step (for media-only mode)
  const renderMediaTypeStep = () => (
    <div className="space-y-10 animate-fade-in">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-6 shadow-lg shadow-amber-500/30">
          <LayoutGrid className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-3">איזה סוגי מדיה אתה צריך?</h2>
        <p className="text-lg text-muted-foreground">בחר את סוגי המדיה שברצונך לרכוש (ניתן לבחור כמה)</p>
      </div>

      {/* Media Type Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {MEDIA_TYPES.map((mediaType) => {
          const isSelected = selectedMediaTypes.includes(mediaType.id);
          return (
            <div
              key={mediaType.id}
              onClick={() => toggleMediaType(mediaType.id)}
              className={`p-6 rounded-2xl border-2 cursor-pointer transition-all text-center hover:scale-[1.02] ${
                isSelected
                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                  : 'border-border hover:border-primary/40 hover:shadow-md'
              }`}
            >
              <div className={`w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-md relative ${
                isSelected 
                  ? `bg-gradient-to-br ${mediaType.gradient}` 
                  : `bg-gradient-to-br ${mediaType.gradient} opacity-60`
              }`}>
                <mediaType.icon className="w-7 h-7 text-white" />
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </div>
              <p className="text-lg font-bold text-foreground mb-1">{mediaType.label}</p>
              <p className="text-sm text-muted-foreground">{mediaType.description}</p>
            </div>
          );
        })}
      </div>

      {/* Selected Summary */}
      {selectedMediaTypes.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <p className="text-center text-foreground">
            נבחרו: <span className="font-bold text-primary">
              {selectedMediaTypes.map(id => MEDIA_TYPES.find(m => m.id === id)?.label).join(', ')}
            </span>
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-8">
        <Button variant="ghost" onClick={handleBackFromMediaType}>
          <ArrowRight className="w-4 h-4 ml-2" />
          ביטול
        </Button>
        
        <Button onClick={handleProceedToMedia} disabled={!canProceedMediaType()} variant="gradient">
          <Check className="w-4 h-4 ml-2" />
          המשך לבחירת מדיה
          <ArrowLeft className="w-4 h-4 mr-2" />
        </Button>
      </div>
    </div>
  );

  // Render Media Step
  const renderMediaStep = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-6 shadow-lg shadow-amber-500/30">
          <Newspaper className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-3">
          {isMediaOnlyMode ? 'רכישת מדיה' : 'בחירת מדיה'}
        </h2>
        <p className="text-lg text-muted-foreground">
          {isMediaOnlyMode 
            ? 'הגדר תקציב, תאריכים ובחר את אפיקי הפרסום' 
            : 'בחר היכן לפרסם את הקמפיין שלך'}
        </p>
      </div>


      <BudgetAudienceStep
        budget={budget}
        onBudgetChange={setBudget}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        targetStream={targetStream}
        onTargetStreamChange={setTargetStream}
        targetGender={targetGender}
        onTargetGenderChange={setTargetGender}
        targetCity={targetCity}
        onTargetCityChange={setTargetCity}
        selectedPackage={selectedPackage}
        onPackageSelect={setSelectedPackage}
        onManualMediaSelect={setManualMediaSelection}
        manualMediaSelection={manualMediaSelection}
      />

      {/* Navigation */}
      <div className="flex justify-between pt-8">
        <Button variant="ghost" onClick={handleBackFromMedia}>
          <ArrowRight className="w-4 h-4 ml-2" />
          {isMediaOnlyMode ? 'ביטול' : 'חזרה'}
        </Button>
        
        <Button onClick={handleProceedToQuote} disabled={!canProceedMedia()} variant="gradient">
          <Check className="w-4 h-4 ml-2" />
          להצעת מחיר
          <ArrowLeft className="w-4 h-4 mr-2" />
        </Button>
      </div>
    </div>
  );

  // Render Quote Step
  const renderQuoteStep = () => (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" onClick={handleBackFromQuote} className="mb-4">
        <ArrowRight className="w-4 h-4 ml-2" />
        חזרה לבחירת מדיה
      </Button>

      <StudioQuoteStep
        quoteData={getQuoteData()}
        isSubmitting={isSubmitting}
        onApprove={handleApproveQuote}
        onConsult={handleConsult}
      />

      {/* Creative Upload Section - Only in media-only mode, after quote */}
      {isMediaOnlyMode && (
        <div className="bg-card border border-border rounded-2xl p-6 mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
              <Image className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">העלאת קריאייטיב (אופציונלי)</h3>
              <p className="text-sm text-muted-foreground">יש לך חומר פרסומי מוכן? העלה אותו לפני אישור ההזמנה</p>
            </div>
          </div>

          {uploadedCreativeUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-border bg-muted/30">
              <img 
                src={uploadedCreativeUrl} 
                alt="Uploaded creative" 
                className="w-full max-h-48 object-contain"
              />
              <button
                onClick={removeUploadedCreative}
                className="absolute top-2 left-2 w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleCreativeUpload}
                className="hidden"
                disabled={isUploadingCreative}
              />
              {isUploadingCreative ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-muted-foreground">מעלה...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">לחץ להעלאת קובץ</span>
                  <span className="text-xs text-muted-foreground/70">תמונה או PDF</span>
                </div>
              )}
            </label>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              {isMediaOnlyMode ? (
                <Newspaper className="w-5 h-5 text-primary-foreground" />
              ) : (
                <Rocket className="w-5 h-5 text-primary-foreground" />
              )}
            </div>
            <div>
              <span className="text-xl font-bold text-foreground">
                {isMediaOnlyMode ? 'רכישת מדיה' : 'קמפיין חדש'}
              </span>
              <span className="text-sm text-muted-foreground mr-2">| {activeProfile?.business_name}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Client selector for agencies */}
            {isAgency && clients.length > 0 && (
              <Select value={selectedClientId || ''} onValueChange={setSelectedClientId}>
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <SelectValue placeholder="בחר לקוח" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.business_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {currentStep === 'brief' && renderBriefStep()}
        {currentStep === 'mediaType' && renderMediaTypeStep()}
        {currentStep === 'media' && renderMediaStep()}
        {currentStep === 'quote' && renderQuoteStep()}
      </main>
    </div>
  );
};

export default FastTrackWizard;