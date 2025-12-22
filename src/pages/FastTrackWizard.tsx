import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useClientProfile } from '@/hooks/useClientProfile';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Rocket, 
  ArrowLeft, 
  ArrowRight, 
  Calendar as CalendarIcon, 
  Target, 
  Zap, 
  Sparkles, 
  Heart,
  Newspaper,
  Globe,
  Radio,
  Megaphone,
  Wand2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const CAMPAIGN_GOALS = [
  { id: 'sale', label: 'מבצע/סייל', description: 'מכירות מיידיות', icon: Target },
  { id: 'branding', label: 'מיתוג', description: 'חיזוק המותג', icon: Sparkles },
  { id: 'launch', label: 'השקה', description: 'מוצר/שירות חדש', icon: Zap },
  { id: 'event', label: 'אירוע', description: 'כנס/אירוע', icon: Heart },
];

const VIBES = [
  { id: 'aggressive', label: 'אגרסיבי', description: 'מסרים חזקים, צועקים' },
  { id: 'prestige', label: 'יוקרתי', description: 'אלגנטי, מינימליסטי' },
  { id: 'heimish', label: 'היימיש', description: 'חם, משפחתי, קרוב' },
];

const MEDIA_TYPES = [
  { id: 'newspaper', label: 'עיתונות', icon: Newspaper },
  { id: 'digital', label: 'דיגיטל', icon: Globe },
  { id: 'radio', label: 'רדיו', icon: Radio },
  { id: 'outdoor', label: 'חוצות', icon: Megaphone },
];

const FastTrackWizard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useClientProfile();
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Campaign data
  const [campaignName, setCampaignName] = useState('');
  const [goal, setGoal] = useState<string | null>(null);
  const [vibe, setVibe] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedMediaTypes, setSelectedMediaTypes] = useState<string[]>([]);

  const TOTAL_STEPS = 3;

  // Handle redirects in useEffect to avoid render-time navigation
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else if (profile && !profile.onboarding_completed) {
      navigate('/onboarding');
    }
  }, [user, profile, navigate]);

  if (!user || !profile?.onboarding_completed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">טוען...</div>
      </div>
    );
  }

  const toggleMediaType = (typeId: string) => {
    setSelectedMediaTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(t => t !== typeId)
        : [...prev, typeId]
    );
  };

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
    if (!profile) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('campaigns').insert({
        client_profile_id: profile.id,
        user_id: user.id,
        name: campaignName || `קמפיין ${format(new Date(), 'dd/MM/yyyy')}`,
        goal,
        vibe,
        start_date: startDate?.toISOString().split('T')[0],
        end_date: endDate?.toISOString().split('T')[0],
        selected_media: selectedMediaTypes,
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
        return goal !== null && vibe !== null;
      case 2:
        return startDate !== undefined;
      case 3:
        return selectedMediaTypes.length > 0;
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
              <span className="text-sm text-muted-foreground mr-2">| {profile?.business_name}</span>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            שלב {step} מתוך {TOTAL_STEPS}
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
        {/* Step 1: Goal & Vibe */}
        {step === 1 && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">מה המטרה הפעם?</h2>
              <p className="text-muted-foreground">בחר את סוג הקמפיין והאווירה הרצויה</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>מטרת הקמפיין</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ה-VIBE של הקמפיין</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {VIBES.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => setVibe(v.id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${
                        vibe === v.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <p className="font-medium text-foreground">{v.label}</p>
                      <p className="text-xs text-muted-foreground">{v.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Dates */}
        {step === 2 && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">מתי מתחילים?</h2>
              <p className="text-muted-foreground">קבע את תאריכי הקמפיין</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>שם הקמפיין (אופציונלי)</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="לדוגמה: מבצע פסח תשפ״ה"
                />
              </CardContent>
            </Card>

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

        {/* Step 3: Media Selection */}
        {step === 3 && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">איפה מפרסמים?</h2>
              <p className="text-muted-foreground">בחר את סוגי המדיה הרצויים</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>סוגי מדיה</CardTitle>
                <CardDescription>בחר את הערוצים בהם תרצה לפרסם</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {MEDIA_TYPES.map((media) => {
                    const isSelected = selectedMediaTypes.includes(media.id);
                    return (
                      <div
                        key={media.id}
                        onClick={() => toggleMediaType(media.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center ${
                          isSelected ? 'bg-primary/20' : 'bg-muted'
                        }`}>
                          <media.icon className={`w-6 h-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <p className="font-medium text-foreground">{media.label}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary">סיכום הקמפיין</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">עסק:</span> {profile?.business_name}</p>
                <p><span className="text-muted-foreground">מטרה:</span> {CAMPAIGN_GOALS.find(g => g.id === goal)?.label}</p>
                <p><span className="text-muted-foreground">אווירה:</span> {VIBES.find(v => v.id === vibe)?.label}</p>
                {startDate && <p><span className="text-muted-foreground">תאריכים:</span> {format(startDate, 'dd/MM/yyyy')} {endDate && `- ${format(endDate, 'dd/MM/yyyy')}`}</p>}
                <p><span className="text-muted-foreground">מדיה:</span> {selectedMediaTypes.map(t => MEDIA_TYPES.find(m => m.id === t)?.label).join(', ')}</p>
              </CardContent>
            </Card>
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
              {isSubmitting ? 'יוצר...' : 'צור קמפיין'}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default FastTrackWizard;
