import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Lightbulb
} from 'lucide-react';

const CAMPAIGN_GOALS = [
  { id: 'sale', label: 'מבצע/סייל', description: 'מכירות מיידיות', icon: Target, gradient: 'from-emerald-500 to-teal-600' },
  { id: 'branding', label: 'מיתוג', description: 'חיזוק המותג', icon: Sparkles, gradient: 'from-violet-500 to-purple-600' },
  { id: 'launch', label: 'השקה', description: 'מוצר/שירות חדש', icon: Zap, gradient: 'from-orange-500 to-amber-600' },
  { id: 'event', label: 'אירוע', description: 'כנס/אירוע', icon: Heart, gradient: 'from-rose-500 to-pink-600' },
];

const FastTrackWizard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useClientProfile();
  const { isAgency, clients, selectedClient, selectedClientId, setSelectedClientId, loading: agencyLoading } = useAgencyClients();
  
  // Campaign Brief
  const [campaignName, setCampaignName] = useState('');
  const [campaignOffer, setCampaignOffer] = useState('');
  const [goal, setGoal] = useState<string | null>(null);

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

  const canProceed = () => {
    return campaignOffer.trim().length > 0 && goal !== null;
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
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Campaign Brief Step */}
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
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-8">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowRight className="w-4 h-4 ml-2" />
            ביטול
          </Button>
          
          <Button onClick={handleProceedToStudio} disabled={!canProceed()} variant="gradient">
            <Wand2 className="w-4 h-4 ml-2" />
            קדימה ליצירה!
            <ArrowLeft className="w-4 h-4 mr-2" />
          </Button>
        </div>
      </main>
    </div>
  );
};

export default FastTrackWizard;