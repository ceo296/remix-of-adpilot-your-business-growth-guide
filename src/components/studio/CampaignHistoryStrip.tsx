import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useClientProfile } from '@/hooks/useClientProfile';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Layers, Calendar, ChevronLeft, Plus, Image } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface Campaign {
  id: string;
  name: string;
  goal: string | null;
  status: string | null;
  created_at: string;
  vibe: string | null;
}

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'טיוטה', variant: 'secondary' },
  pending_review: { label: 'בבדיקה', variant: 'outline' },
  pending_approval: { label: 'ממתין לאישור', variant: 'outline' },
  active: { label: 'פעיל', variant: 'default' },
  completed: { label: 'הושלם', variant: 'outline' },
};

const CampaignHistoryStrip = () => {
  const { user } = useAuth();
  const { profile } = useClientProfile();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!user) return;

      let query = supabase
        .from('campaigns')
        .select('id, name, goal, status, created_at, vibe')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(6);

      if (profile?.id) {
        query = supabase
          .from('campaigns')
          .select('id, name, goal, status, created_at, vibe')
          .eq('client_profile_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(6);
      }

      const { data, error } = await query;
      if (!error && data) {
        setCampaigns(data);
      }
      setLoading(false);
    };

    fetchCampaigns();
  }, [user, profile?.id]);

  if (loading || campaigns.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          סטודיו יצירתי
        </h3>
        <Link to="/campaigns" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
          צפה בכל הפרויקטים
          <ChevronLeft className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Link to="/studio" className="group rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-card/50 flex flex-col items-center justify-center py-10 cursor-pointer transition-all hover:bg-accent/30">
          <Plus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
          <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">יצירת תבנית חדשה</span>
        </Link>

        {campaigns.slice(0, 5).map((campaign) => {
          const status = STATUS_LABELS[campaign.status || 'draft'] || STATUS_LABELS.draft;
          
          return (
            <Link
              key={campaign.id}
              to={`/studio?campaign=${campaign.id}`}
              className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all"
            >
              <div className="h-28 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                <Image className="w-10 h-10 text-muted-foreground/30" />
              </div>
              
              <div className="p-3 space-y-1">
                <h4 className="font-medium text-sm text-foreground truncate">{campaign.name}</h4>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(campaign.created_at), 'd.M.yy', { locale: he })}
                  </span>
                  <Badge variant={status.variant} className="text-[10px] px-1.5 py-0">
                    {status.label}
                  </Badge>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default CampaignHistoryStrip;
