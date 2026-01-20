import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useClientProfile } from '@/hooks/useClientProfile';
import { useAgencyClients } from '@/hooks/useAgencyClients';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  Calendar as CalendarIcon, 
  Target, 
  Zap, 
  Sparkles, 
  Heart,
  Wand2,
  Building2,
  Gift,
  Lightbulb
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { BudgetAudienceStep } from '@/components/campaign/BudgetAudienceStep';

const CAMPAIGN_GOALS = [
  { id: 'sale', label: 'מבצע/סייל', description: 'מכירות מיידיות', icon: Target },
  { id: 'branding', label: 'מיתוג', description: 'חיזוק המותג', icon: Sparkles },
  { id: 'launch', label: 'השקה', description: 'מוצר/שירות חדש', icon: Zap },
  { id: 'event', label: 'אירוע', description: 'כנס/אירוע', icon: Heart },
];

interface MediaPackage {
  id: string;
  name: string;
  description: string;
  totalPrice: number;
  items: {
    id: string;
    name: string;
    price: number;
    reach?: string;
  }[];
  recommended?: boolean;
}

const FastTrackWizard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useClientProfile();
  const { isAgency, clients, selectedClient, selectedClientId, setSelectedClientId, loading: agencyLoading } = useAgencyClients();
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Step 1: Campaign Brief
  const [campaignName, setCampaignName] = useState('');
  const [campaignOffer, setCampaignOffer] = useState('');
  const [goal, setGoal] = useState<string | null>(null);
  
  // Step 2: Dates
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  
  // Step 3: Budget & Audience data
  const [budget, setBudget] = useState<number>(0);
  const [targetStream, setTargetStream] = useState<string>('');
  const [targetGender, setTargetGender] = useState<string>('');
  const [targetCity, setTargetCity] = useState<string>('');
  const [selectedPackage, setSelectedPackage] = useState<MediaPackage | null>(null);

  const TOTAL_STEPS = 3;

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

  if (authLoading || profileLoading || agencyLoading || !user || !profile?.onboarding_completed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">טוען...</div>
      </div>
    );
  }

  const nextStep = () => {
    if (step < TOTAL_STEPS) {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!activeProfile || !selectedPackage) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('campaigns').insert({
        client_profile_id: activeProfile.id,
        user_id: user.id,
        name: campaignName || `קמפיין ${format(new Date(), 'dd/MM/yyyy')}`,
        goal,
        vibe: activeProfile.advantage_type || 'default',
        start_date: startDate?.toISOString().split('T')[0],
        end_date: endDate?.toISOString().split('T')[0],
        selected_media: selectedPackage.items.map(item => ({ id: item.id, name: item.name, price: item.price })),
        budget,
        target_stream: targetStream,
        target_gender: targetGender,
        target_city: targetCity,
        status: 'draft',
      });

      if (error) throw error;

      toast.success('הקמפיין נוצר בהצלחה!');
      navigate('/studio');
    } catch (error: any) {
      toast.error(error.message || 'שגיאה ביצירת הקמפיין');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return campaignOffer.trim().length > 0 && goal !== null;
      case 2:
        return startDate !== undefined;
      case 3:
        return selectedPackage !== null;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Rocket className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-xl font-bold text-foreground">קמפיין חדש</span>
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
            <div className="text-sm text-muted-foreground">
              שלב {step} מתוך {TOTAL_STEPS}
            </div>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="h-1 bg-muted">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Step 1: Campaign Brief - Message & Goal */}
        {step === 1 && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                <Gift className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">מה המסר הפרסומי?</h2>
              <p className="text-muted-foreground">בלי זה אי אפשר להתחיל - ספר לנו מה רוצים לפרסם</p>
            </div>

            {/* Campaign Name */}
            <div className="space-y-3">
              <Label htmlFor="campaign-name" className="text-foreground font-medium flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                שם הקמפיין (לשימוש פנימי)
              </Label>
              <Input
                id="campaign-name"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="לדוגמה: מבצע פסח תשפ״ה, השקת קולקציית חורף..."
                className="text-lg"
              />
            </div>

            {/* Campaign Offer - REQUIRED */}
            <div className="space-y-3">
              <Label htmlFor="campaign-offer" className="text-foreground font-medium flex items-center gap-2">
                <Gift className="w-4 h-4 text-primary" />
                מה ההצעה הפרסומית? *
              </Label>
              <Textarea
                id="campaign-offer"
                value={campaignOffer}
                onChange={(e) => setCampaignOffer(e.target.value)}
                placeholder="תאר בקצרה את המסר המרכזי של הקמפיין. לדוגמה: 30% הנחה על כל מערכות הישיבה, השקת טעמים חדשים לסדרת המאפים..."
                className="min-h-[120px] text-base"
              />
              <p className="text-xs text-muted-foreground">
                זה יעזור לנו לכוון את הקריאייטיב והמסרים
              </p>
            </div>

            {/* Campaign Goal */}
            <div className="space-y-4">
              <Label className="text-foreground font-medium">מה המטרה של הקמפיין? *</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {CAMPAIGN_GOALS.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${
                      goal === g.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center ${
                      goal === g.id ? 'bg-primary/20' : 'bg-muted'
                    }`}>
                      <g.icon className={`w-5 h-5 ${goal === g.id ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <p className="font-medium text-foreground">{g.label}</p>
                    <p className="text-xs text-muted-foreground">{g.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Dates */}
        {step === 2 && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">מתי מתחילים?</h2>
              <p className="text-muted-foreground">קבע את תאריכי הקמפיין</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>תאריך התחלה</CardTitle>
                </CardHeader>
                <CardContent>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="w-4 h-4 ml-2" />
                        {startDate ? format(startDate, 'dd/MM/yyyy', { locale: he }) : 'בחר תאריך'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>תאריך סיום</CardTitle>
                </CardHeader>
                <CardContent>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="w-4 h-4 ml-2" />
                        {endDate ? format(endDate, 'dd/MM/yyyy', { locale: he }) : 'בחר תאריך'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => startDate ? date < startDate : false}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step 3: Budget & Media Selection */}
        {step === 3 && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">תקציב וקהל יעד</h2>
              <p className="text-muted-foreground">הגדר תקציב ובחר חבילת מדיה מותאמת</p>
            </div>

            <BudgetAudienceStep
              budget={budget}
              onBudgetChange={setBudget}
              targetStream={targetStream}
              onTargetStreamChange={setTargetStream}
              targetGender={targetGender}
              onTargetGenderChange={setTargetGender}
              targetCity={targetCity}
              onTargetCityChange={setTargetCity}
              selectedPackage={selectedPackage}
              onPackageSelect={setSelectedPackage}
            />

            {/* Summary */}
            {selectedPackage && (
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-primary">סיכום הקמפיין</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">עסק:</span> {activeProfile?.business_name}</p>
                  <p><span className="text-muted-foreground">מטרה:</span> {CAMPAIGN_GOALS.find(g => g.id === goal)?.label}</p>
                  {startDate && <p><span className="text-muted-foreground">תאריכים:</span> {format(startDate, 'dd/MM/yyyy')} {endDate && `- ${format(endDate, 'dd/MM/yyyy')}`}</p>}
                  <p><span className="text-muted-foreground">תקציב:</span> ₪{budget.toLocaleString()}</p>
                  <p><span className="text-muted-foreground">חבילה:</span> {selectedPackage.name}</p>
                  <p><span className="text-muted-foreground">סה"כ מדיה:</span> ₪{selectedPackage.totalPrice.toLocaleString()}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-8">
          {step > 1 ? (
            <Button variant="ghost" onClick={prevStep}>
              <ArrowRight className="w-4 h-4 ml-2" />
              חזרה
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowRight className="w-4 h-4 ml-2" />
              ביטול
            </Button>
          )}
          
          {step < TOTAL_STEPS ? (
            <Button onClick={nextStep} disabled={!canProceed()} variant="gradient">
              המשך
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canProceed() || isSubmitting} variant="gradient">
              <Wand2 className="w-4 h-4 ml-2" />
              {isSubmitting ? 'מעבד...' : 'מתקדמים לפרסום'}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default FastTrackWizard;
