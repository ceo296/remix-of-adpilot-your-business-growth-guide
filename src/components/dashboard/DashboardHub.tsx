import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Layers, 
  Activity, 
  ArrowLeft,
  Sparkles,
  FileUp,
  Calendar,
  Wallet,
  CheckCircle2,
  Clock,
  Image,
  Newspaper,
  Building2,
  Palette
} from 'lucide-react';
import { cn } from '@/lib/utils';
import CampaignHistory from './CampaignHistory';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useClientProfile } from '@/hooks/useClientProfile';
import { getGreeting, getWhatWouldYouLike, getYouWord } from '@/lib/honorific-utils';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

type HubView = 'main' | 'new-campaign' | 'history' | 'status';

interface CampaignStatus {
  id: string;
  name: string;
  status: string;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  selected_media: any[];
}

interface MediaProof {
  id: string;
  media_outlet_name: string;
  proof_type: string;
  image_url: string;
  publication_date: string | null;
  notes: string | null;
}

const DashboardHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, honorificPreference } = useClientProfile();
  const [currentView, setCurrentView] = useState<HubView>('main');
  const [activeCampaign, setActiveCampaign] = useState<CampaignStatus | null>(null);
  const [mediaProofs, setMediaProofs] = useState<MediaProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAnyCampaigns, setHasAnyCampaigns] = useState(false);
  
  const userName = profile?.business_name || 'שם';

  useEffect(() => {
    const fetchCampaignData = async () => {
      if (!user) return;

      // Check if user has any campaigns at all
      const { count } = await supabase
        .from('campaigns')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setHasAnyCampaigns((count || 0) > 0);

      // Fetch active campaign
      const { data } = await supabase
        .from('campaigns')
        .select('id, name, status, budget, start_date, end_date, selected_media')
        .eq('user_id', user.id)
        .in('status', ['active', 'pending_approval', 'draft'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setActiveCampaign({
          ...data,
          selected_media: Array.isArray(data.selected_media) ? data.selected_media : []
        });

        // Fetch media proofs for this campaign
        const { data: proofs } = await supabase
          .from('campaign_media_proofs')
          .select('*')
          .eq('campaign_id', data.id)
          .order('created_at', { ascending: false });

        if (proofs) {
          setMediaProofs(proofs);
        }
      }
      setLoading(false);
    };

    fetchCampaignData();
  }, [user]);

  const handleNewCampaign = (type: 'create' | 'upload' | 'internal' | 'media-only') => {
    if (type === 'create') {
      // First go to campaign goal/setup wizard, then to studio
      navigate('/new-campaign');
    } else if (type === 'internal') {
      navigate('/internal-studio');
    } else if (type === 'media-only') {
      navigate('/new-campaign?mode=media-only');
    } else {
      navigate('/studio?mode=upload');
    }
  };

  // New user view - no campaigns yet
  const renderNewUserView = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">{getGreeting(honorificPreference, userName)} 🎉</h2>
        <p className="text-muted-foreground">{getWhatWouldYouLike(honorificPreference)}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto px-4">
        {/* Create Campaign with AI */}
        <Card 
          className="cursor-pointer transition-all duration-300 hover:shadow-xl border-2 border-violet-400 bg-gradient-to-br from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100"
          onClick={() => handleNewCampaign('create')}
        >
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-violet-800 mb-2">קמפיין פרסומי</h3>
            <p className="text-violet-600 mb-3 text-sm">
              יצירה עם AI
            </p>
            <p className="text-xs text-muted-foreground">
              נבנה יחד את המסר הפרסומי, נבחר סגנון ונייצר קריאייטיבים
            </p>
          </CardContent>
        </Card>

        {/* Internal Materials */}
        <Card 
          className="cursor-pointer transition-all duration-300 hover:shadow-xl border-2 border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100"
          onClick={() => handleNewCampaign('internal')}
        >
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 flex items-center justify-center mb-4">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-emerald-800 mb-2">חומרים פנימיים</h3>
            <p className="text-emerald-600 mb-3 text-sm">
              לשימוש עסקי
            </p>
            <p className="text-xs text-muted-foreground">
              מצגות, פרוספקטים, ניוזלטרים וחומרי שיווק פנימיים
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Personal Area Note */}
      <div className="text-center mt-8 pt-6 border-t border-border max-w-2xl mx-auto">
        <p className="text-sm text-muted-foreground">
          💡 <span className="font-medium">טיפ:</span> לאחר יצירת הקמפיין הראשון שלך, האזור האישי יתעדכן עם היסטוריה וסטטוס קמפיינים
        </p>
      </div>
    </div>
  );

  // Returning user view - has campaigns
  const renderMainView = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">{getWhatWouldYouLike(honorificPreference)}</h2>
        <p className="text-muted-foreground">{getYouWord(honorificPreference, 'choose')} אפשרות להמשך</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto px-4">
        {/* New Campaign Card */}
        <Card 
          className="cursor-pointer transition-all duration-300 hover:shadow-xl group border-2 border-violet-400 bg-gradient-to-br from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100"
          onClick={() => setCurrentView('new-campaign')}
        >
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-violet-800 mb-2">קמפיין חדש</h3>
            <p className="text-sm text-violet-600">
              צור קמפיין חדש או העלה חומרים קיימים
            </p>
          </CardContent>
        </Card>

        {/* Campaign Status Card */}
        <Card 
          className={cn(
            "cursor-pointer transition-all duration-300 hover:shadow-xl group border-2",
            activeCampaign 
              ? "border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100" 
              : "border-slate-300 bg-gradient-to-br from-slate-50 to-gray-50 hover:from-slate-100 hover:to-gray-100"
          )}
          onClick={() => setCurrentView('status')}
        >
          <CardContent className="p-8 text-center">
            <div className={cn(
              "w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg",
              activeCampaign 
                ? "bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/30" 
                : "bg-gradient-to-br from-slate-500 to-gray-600 shadow-slate-500/30"
            )}>
              <Activity className="w-10 h-10 text-white" />
            </div>
            <h3 className={cn(
              "text-xl font-bold mb-2",
              activeCampaign ? "text-amber-800" : "text-slate-700"
            )}>סטטוס קמפיין</h3>
            <p className={cn(
              "text-sm",
              activeCampaign ? "text-amber-600" : "text-slate-500"
            )}>
              {activeCampaign ? "עקוב אחרי הקמפיין הפעיל" : "צפה בסטטוס ופרטי התקציב"}
            </p>
          </CardContent>
        </Card>

        {/* Campaign History Card */}
        <Card 
          className="cursor-pointer transition-all duration-300 hover:shadow-xl group border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100"
          onClick={() => setCurrentView('history')}
        >
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Layers className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-blue-800 mb-2">היסטוריית קמפיינים</h3>
            <p className="text-sm text-blue-600">
              צפה בקמפיינים קודמים
            </p>
          </CardContent>
        </Card>

        {/* Internal Materials Card */}
        <Card 
          className="cursor-pointer transition-all duration-300 hover:shadow-xl group border-2 border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100"
          onClick={() => handleNewCampaign('internal')}
        >
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-emerald-800 mb-2">חומרים פנימיים</h3>
            <p className="text-sm text-emerald-600">
              מצגות, פרוספקטים וחומרי שיווק
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderNewCampaignView = () => (
    <div className="space-y-6 animate-fade-in">
      <Button 
        variant="ghost" 
        onClick={() => setCurrentView('main')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 ml-2" />
        חזרה
      </Button>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">קמפיין חדש</h2>
        <p className="text-muted-foreground">איך תרצה להתחיל?</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
        {/* Create with AI */}
        <Card 
          className="cursor-pointer transition-all duration-300 hover:shadow-xl border-2 border-violet-400/30 bg-card hover:bg-card/80"
          onClick={() => handleNewCampaign('create')}
        >
          <CardContent className="p-5 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30 flex items-center justify-center mb-3">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">קמפיין חדש</h3>
            <p className="text-muted-foreground mb-2 text-xs">
              יצירה עם AI
            </p>
            <p className="text-[10px] text-muted-foreground">
              נבנה יחד את המסר הפרסומי
            </p>
          </CardContent>
        </Card>

        {/* Upload Existing */}
        <Card 
          className="cursor-pointer transition-all duration-300 hover:shadow-xl border-2 border-blue-400/30 bg-card hover:bg-card/80"
          onClick={() => handleNewCampaign('upload')}
        >
          <CardContent className="p-5 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30 flex items-center justify-center mb-3">
              <FileUp className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">העלאת קמפיין</h3>
            <p className="text-muted-foreground mb-2 text-xs">
              חומרים קיימים
            </p>
            <p className="text-[10px] text-muted-foreground">
              יש לי קריאייטיבים מוכנים
            </p>
          </CardContent>
        </Card>

        {/* Direct Media Purchase */}
        <Card 
          className="cursor-pointer transition-all duration-300 hover:shadow-xl border-2 border-amber-400/30 bg-card hover:bg-card/80"
          onClick={() => handleNewCampaign('media-only')}
        >
          <CardContent className="p-5 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30 flex items-center justify-center mb-3">
              <Newspaper className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">רכישת מדיה</h3>
            <p className="text-muted-foreground mb-2 text-xs">
              ללא קריאייטיב
            </p>
            <p className="text-[10px] text-muted-foreground">
              בחירת עיתונים ופלטפורמות
            </p>
          </CardContent>
        </Card>

        {/* Internal Materials */}
        <Card 
          className="cursor-pointer transition-all duration-300 hover:shadow-xl border-2 border-emerald-400/30 bg-card hover:bg-card/80"
          onClick={() => handleNewCampaign('internal')}
        >
          <CardContent className="p-5 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 flex items-center justify-center mb-3">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">חומרים פנימיים</h3>
            <p className="text-muted-foreground mb-2 text-xs">
              לשימוש עסקי
            </p>
            <p className="text-[10px] text-muted-foreground">
              מצגות, פרוספקטים, ניוזלטרים
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderHistoryView = () => (
    <div className="space-y-6 animate-fade-in">
      <Button 
        variant="ghost" 
        onClick={() => setCurrentView('main')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 ml-2" />
        חזרה
      </Button>

      <CampaignHistory />
    </div>
  );

  const renderStatusView = () => {
    if (!activeCampaign) return null;

    const mediaItems = activeCampaign.selected_media || [];
    const totalBudget = activeCampaign.budget || 0;
    const usedBudget = mediaItems.reduce((sum: number, item: any) => sum + (item.price || 0), 0);
    const budgetPercent = totalBudget > 0 ? Math.min((usedBudget / totalBudget) * 100, 100) : 0;

    const publishedItems = mediaItems.filter((item: any) => item.status === 'published');
    const pendingItems = mediaItems.filter((item: any) => item.status !== 'published');

    const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline'; color: string }> = {
      none: { label: 'אין קמפיין', variant: 'secondary', color: 'text-muted-foreground' },
      draft: { label: 'טיוטה', variant: 'secondary', color: 'text-muted-foreground' },
      pending_approval: { label: 'ממתין לאישור', variant: 'outline', color: 'text-amber-600' },
      active: { label: 'באוויר', variant: 'default', color: 'text-green-600' },
    };

    const statusInfo = STATUS_LABELS[activeCampaign.status] || STATUS_LABELS.draft;

    return (
      <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => setCurrentView('main')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 ml-2" />
          חזרה
        </Button>

        {/* Campaign Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-foreground">{activeCampaign.name}</h2>
                  <Badge variant={statusInfo.variant} className={`text-sm px-3 py-1 ${statusInfo.color}`}>
                    סטטוס: {statusInfo.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                  {activeCampaign.start_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(activeCampaign.start_date), 'd בMMM', { locale: he })}
                      {activeCampaign.end_date && ` - ${format(new Date(activeCampaign.end_date), 'd בMMM', { locale: he })}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget Card with Pie Chart */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-lg">ניצול תקציב</h3>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Pie Chart */}
              <div className="w-40 h-40 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'נוצל', value: usedBudget, color: 'hsl(var(--primary))' },
                        { name: 'נותר', value: Math.max(0, totalBudget - usedBudget), color: 'hsl(var(--muted))' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      <Cell fill="hsl(var(--primary))" />
                      <Cell fill="hsl(var(--muted))" />
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `₪${value.toLocaleString()}`}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        direction: 'rtl'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Stats */}
              <div className="flex-1 w-full space-y-4">
                <div className="text-center mb-4">
                  <span className="text-3xl font-bold text-primary">{Math.round(budgetPercent)}%</span>
                  <p className="text-sm text-muted-foreground mt-1">נוצלו מהתקציב</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-primary/10 text-center">
                    <p className="text-base font-bold text-primary">₪{usedBudget.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">נוצל</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted text-center">
                    <p className="text-base font-bold text-foreground">₪{Math.max(0, totalBudget - usedBudget).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">נותר</p>
                  </div>
                </div>
                
                <div className="text-center pt-2">
                  <p className="text-sm text-muted-foreground">
                    תקציב כולל: <span className="font-semibold text-foreground">₪{totalBudget.toLocaleString()}</span>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Media Status Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Published */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">פורסם</h3>
                  <p className="text-sm text-muted-foreground">{publishedItems.length} פריטים</p>
                </div>
              </div>
              {publishedItems.length > 0 ? (
                <div className="space-y-2">
                  {publishedItems.slice(0, 3).map((item: any, idx: number) => (
                    <div key={idx} className="p-2 bg-success/5 rounded-lg text-sm">
                      {item.name}
                    </div>
                  ))}
                  {publishedItems.length > 3 && (
                    <p className="text-xs text-muted-foreground">+ עוד {publishedItems.length - 3} פריטים</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">עדיין לא פורסם כלום</p>
              )}
            </CardContent>
          </Card>

          {/* Pending */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">עתיד להתפרסם</h3>
                  <p className="text-sm text-muted-foreground">{pendingItems.length} פריטים</p>
                </div>
              </div>
              {pendingItems.length > 0 ? (
                <div className="space-y-2">
                  {pendingItems.slice(0, 3).map((item: any, idx: number) => (
                    <div key={idx} className="p-2 bg-warning/5 rounded-lg text-sm">
                      {item.name}
                    </div>
                  ))}
                  {pendingItems.length > 3 && (
                    <p className="text-xs text-muted-foreground">+ עוד {pendingItems.length - 3} פריטים</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">אין פריטים ממתינים</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Media Proofs Gallery */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Newspaper className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">מבט על חומרים שפורסמו</h3>
                <p className="text-sm text-muted-foreground">{mediaProofs.length} תמונות</p>
              </div>
            </div>
            
            {mediaProofs.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {mediaProofs.map((proof) => (
                  <div 
                    key={proof.id} 
                    className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted group cursor-pointer"
                  >
                    <img 
                      src={proof.image_url} 
                      alt={proof.media_outlet_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-2 right-2 left-2 text-white">
                        <p className="text-xs font-medium truncate">{proof.media_outlet_name}</p>
                        {proof.publication_date && (
                          <p className="text-[10px] opacity-80">
                            {format(new Date(proof.publication_date), 'd בMMM yyyy', { locale: he })}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="absolute top-2 right-2 text-[10px] bg-white/90"
                    >
                      {proof.proof_type === 'clipping' ? 'גזיר עיתון' : 'צילום מסך'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">עדיין לא הועלו הוכחות פרסום</p>
                <p className="text-xs mt-1">הוכחות יופיעו כאן לאחר הפרסום</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">טוען...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[400px] flex flex-col justify-center">
      {currentView === 'main' && (hasAnyCampaigns ? renderMainView() : renderNewUserView())}
      {currentView === 'new-campaign' && renderNewCampaignView()}
      {currentView === 'history' && renderHistoryView()}
      {currentView === 'status' && renderStatusView()}
    </div>
  );
};

export default DashboardHub;
