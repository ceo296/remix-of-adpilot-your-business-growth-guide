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
  Newspaper
} from 'lucide-react';
import { cn } from '@/lib/utils';
import CampaignHistory from './CampaignHistory';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
  const [currentView, setCurrentView] = useState<HubView>('main');
  const [activeCampaign, setActiveCampaign] = useState<CampaignStatus | null>(null);
  const [mediaProofs, setMediaProofs] = useState<MediaProof[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveCampaign = async () => {
      if (!user) return;

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

    fetchActiveCampaign();
  }, [user]);

  const handleNewCampaign = (type: 'create' | 'upload') => {
    if (type === 'create') {
      navigate('/studio');
    } else {
      navigate('/studio?mode=upload');
    }
  };

  const renderMainView = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">מה תרצה לעשות?</h2>
        <p className="text-muted-foreground">בחר אפשרות להמשך</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto px-4">
        {/* Campaign History Card */}
        <Card 
          className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-primary/50 group border-2"
          onClick={() => setCurrentView('history')}
        >
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Layers className="w-8 h-8 text-secondary-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">היסטוריית קמפיינים</h3>
            <p className="text-sm text-muted-foreground">
              צפה בקמפיינים קודמים
            </p>
          </CardContent>
        </Card>

        {/* Campaign Status Card - CENTER */}
        <Card 
          className={cn(
            "cursor-pointer transition-all duration-300 hover:shadow-lg group border-2 md:order-none order-first",
            activeCampaign ? "hover:border-primary/50 border-primary" : "hover:border-muted-foreground/30"
          )}
          onClick={() => setCurrentView('status')}
        >
          <CardContent className="p-8 text-center">
            <div className={cn(
              "w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform",
              activeCampaign ? "bg-primary" : "bg-muted"
            )}>
              <Activity className={cn(
                "w-10 h-10",
                activeCampaign ? "text-primary-foreground" : "text-muted-foreground"
              )} />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">סטטוס קמפיין</h3>
            <p className="text-sm text-muted-foreground">
              {activeCampaign ? "עקוב אחרי הקמפיין הפעיל" : "צפה בסטטוס ופרטי התקציב"}
            </p>
          </CardContent>
        </Card>

        {/* New Campaign Card */}
        <Card 
          className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-primary/50 group border-2"
          onClick={() => setCurrentView('new-campaign')}
        >
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">קמפיין חדש</h3>
            <p className="text-sm text-muted-foreground">
              צור קמפיין חדש או העלה חומרים קיימים
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

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Create with AI */}
        <Card 
          className="cursor-pointer transition-all duration-300 hover:shadow-xl border-2 border-primary bg-primary/5 hover:bg-primary/10"
          onClick={() => handleNewCampaign('create')}
        >
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-primary flex items-center justify-center mb-4">
              <Sparkles className="w-10 h-10 text-primary-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">קמפיין חדש</h3>
            <p className="text-muted-foreground mb-4">
              יצירה עם AI
            </p>
            <p className="text-sm text-muted-foreground">
              נבנה יחד את המסר הפרסומי, נבחר סגנון ונייצר קריאייטיבים
            </p>
          </CardContent>
        </Card>

        {/* Upload Existing */}
        <Card 
          className="cursor-pointer transition-all duration-300 hover:shadow-xl border-2 hover:border-primary/50"
          onClick={() => handleNewCampaign('upload')}
        >
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-4">
              <FileUp className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">העלאת קמפיין</h3>
            <p className="text-muted-foreground mb-4">
              חומרים קיימים
            </p>
            <p className="text-sm text-muted-foreground">
              יש לי קריאייטיבים מוכנים ואני רוצה להפיץ אותם
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

    const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      draft: { label: 'טיוטה', variant: 'secondary' },
      pending_approval: { label: 'ממתין לאישור', variant: 'outline' },
      active: { label: 'פעיל', variant: 'default' },
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
                <h2 className="text-2xl font-bold text-foreground">{activeCampaign.name}</h2>
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
              <Badge variant={statusInfo.variant} className="text-sm px-3 py-1">
                {statusInfo.label}
              </Badge>
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
                <h3 className="font-semibold text-foreground">גזרי עיתונים והוכחות פרסום</h3>
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
      {currentView === 'main' && renderMainView()}
      {currentView === 'new-campaign' && renderNewCampaignView()}
      {currentView === 'history' && renderHistoryView()}
      {currentView === 'status' && renderStatusView()}
    </div>
  );
};

export default DashboardHub;
