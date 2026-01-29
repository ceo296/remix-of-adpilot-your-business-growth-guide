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
  Check
} from 'lucide-react';
import { BudgetAudienceStep } from '@/components/campaign/BudgetAudienceStep';
import { StudioQuoteStep, QuoteData, MediaItem } from '@/components/studio/StudioQuoteStep';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const CAMPAIGN_GOALS = [
  { id: 'sale', label: 'מבצע/סייל', description: 'מכירות מיידיות', icon: Target, gradient: 'from-emerald-500 to-teal-600' },
  { id: 'branding', label: 'מיתוג', description: 'חיזוק המותג', icon: Sparkles, gradient: 'from-violet-500 to-purple-600' },
  { id: 'launch', label: 'השקה', description: 'מוצר/שירות חדש', icon: Zap, gradient: 'from-orange-500 to-amber-600' },
  { id: 'event', label: 'אירוע', description: 'כנס/אירוע', icon: Heart, gradient: 'from-rose-500 to-pink-600' },
];

type WizardStep = 'brief' | 'media' | 'quote';

const FastTrackWizard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useClientProfile();
  const { isAgency, clients, selectedClient, selectedClientId, setSelectedClientId, loading: agencyLoading } = useAgencyClients();
  
  // Check if we're in media-only mode
  const isMediaOnlyMode = searchParams.get('mode') === 'media-only';
  
  // Current step
  const [currentStep, setCurrentStep] = useState<WizardStep>(isMediaOnlyMode ? 'media' : 'brief');
  
  // Campaign Brief
  const [campaignName, setCampaignName] = useState('');
  const [campaignOffer, setCampaignOffer] = useState('');
  const [goal, setGoal] = useState<string | null>(null);
  
  // Media Selection
  const [budget, setBudget] = useState(0);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [targetStream, setTargetStream] = useState('general');
  const [targetGender, setTargetGender] = useState('');
  const [targetCity, setTargetCity] = useState('nationwide');
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [manualMediaSelection, setManualMediaSelection] = useState<any>(null);
  
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
      setCurrentStep('media');
      // Set default campaign name for media-only
      setCampaignName('רכישת מדיה');
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
    // Save brief data to session storage and navigate to Creative Studio
    const briefData = {
      campaignName,
      campaignOffer,
      goal,
      clientProfileId: activeProfile?.id,
    };
    sessionStorage.setItem('campaignBrief', JSON.stringify(briefData));
    navigate('/studio');
  };

  const handleProceedToMedia = () => {
    setCurrentStep('media');
  };

  const handleProceedToQuote = () => {
    setCurrentStep('quote');
  };

  const handleBackFromMedia = () => {
    if (isMediaOnlyMode) {
      navigate('/dashboard');
    } else {
      setCurrentStep('brief');
    }
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
          name: campaignName || 'רכישת מדיה',
          goal: isMediaOnlyMode ? 'media_purchase' : goal,
          status: 'pending_approval',
          budget,
          start_date: startDate?.toISOString().split('T')[0],
          end_date: endDate?.toISOString().split('T')[0],
          target_stream: targetStream,
          target_gender: targetGender,
          target_city: targetCity,
          selected_media: quoteData.mediaItems as any,
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
    return campaignOffer.trim().length > 0 && goal !== null;
  };

  const canProceedMedia = () => {
    return budget > 0 && targetStream && targetGender && (selectedPackage || manualMediaSelection);
  };

  // Render Brief Step
  const renderBriefStep = () => (
    <div className="space-y-10 animate-fade-in">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-6 shadow-lg shadow-primary/30">
          <Gift className="w-10 h-10 text-primary-foreground" />
        </div>
        <h2 className="text-4xl font-bold text-foreground mb-3">מה המסר הפרסומי?</h2>
        <p className="text-xl text-muted-foreground">בלי זה אי אפשר להתחיל - ספר לנו מה רוצים לפרסם</p>
      </div>

      {/* Campaign Name */}
      <div className="space-y-4">
        <Label htmlFor="campaign-name" className="text-xl font-semibold text-foreground flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-md">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          שם הקמפיין (לשימוש פנימי)
        </Label>
        <Input
          id="campaign-name"
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
          placeholder="לדוגמה: מבצע פסח תשפ״ה, השקת קולקציית חורף..."
          className="text-xl h-14 px-5"
        />
      </div>

      {/* Campaign Offer - REQUIRED */}
      <div className="space-y-4">
        <Label htmlFor="campaign-offer" className="text-xl font-semibold text-foreground flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md shadow-primary/30">
            <Gift className="w-5 h-5 text-primary-foreground" />
          </div>
          מה ההצעה הפרסומית? *
        </Label>
        <Textarea
          id="campaign-offer"
          value={campaignOffer}
          onChange={(e) => setCampaignOffer(e.target.value)}
          placeholder="תאר בקצרה את המסר המרכזי של הקמפיין. לדוגמה: 30% הנחה על כל מערכות הישיבה, השקת טעמים חדשים לסדרת המאפים..."
          className="min-h-[140px] text-lg p-5"
        />
        <p className="text-base text-muted-foreground">
          זה יעזור לנו לכוון את הקריאייטיב והמסרים
        </p>
      </div>

      {/* Campaign Goal */}
      <div className="space-y-5">
        <Label className="text-xl font-semibold text-foreground">מה המטרה של הקמפיין? *</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CAMPAIGN_GOALS.map((g) => (
            <div
              key={g.id}
              onClick={() => setGoal(g.id)}
              className={`p-6 rounded-2xl border-2 cursor-pointer transition-all text-center hover:scale-[1.02] ${
                goal === g.id
                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                  : 'border-border hover:border-primary/40 hover:shadow-md'
              }`}
            >
              <div className={`w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-md ${
                goal === g.id 
                  ? `bg-gradient-to-br ${g.gradient}` 
                  : `bg-gradient-to-br ${g.gradient} opacity-60`
              }`}>
                <g.icon className="w-7 h-7 text-white" />
              </div>
              <p className="text-lg font-bold text-foreground mb-1">{g.label}</p>
              <p className="text-sm text-muted-foreground">{g.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-8">
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
        {currentStep === 'media' && renderMediaStep()}
        {currentStep === 'quote' && renderQuoteStep()}
      </main>
    </div>
  );
};

export default FastTrackWizard;